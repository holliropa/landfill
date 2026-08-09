import type { ExplorerItem } from "@/features/explorer";
import {
  createDownload,
  deleteFile,
  deleteFolder,
  getArchiveDownloadUrl,
  getDownloadJob,
  getFileDownloadUrl,
  permanentlyDeleteTrashItem,
  restoreTrashItem,
  useInvalidateStorageQueries,
  useRenameFile,
  useRenameFolder,
} from "@/lib/client";
import { useDialog } from "@/providers";
import { triggerDownload } from "@/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const DOWNLOAD_POLL_INTERVAL_MS = 1000;
const DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Download cancelled", "AbortError"));
      return;
    }

    const timeoutId = window.setTimeout(() => {
      signal.removeEventListener("abort", handleAbort);
      resolve();
    }, ms);

    function handleAbort() {
      window.clearTimeout(timeoutId);
      reject(new DOMException("Download cancelled", "AbortError"));
    }

    signal.addEventListener("abort", handleAbort, { once: true });
  });
}

type StorageItemActionsParams = {
  onAfterItemsChanged?: () => void;
};

export function useStorageItemActions({
  onAfterItemsChanged,
}: StorageItemActionsParams = {}) {
  const dialog = useDialog();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isPermanentlyDeleting, setIsPermanentlyDeleting] = useState(false);
  const downloadAbortRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const invalidateStorageQueries = useInvalidateStorageQueries();
  const { mutateAsync: renameFile, isPending: isRenamingFile } =
    useRenameFile();
  const { mutateAsync: renameFolder, isPending: isRenamingFolder } =
    useRenameFolder();
  const isRenaming = isRenamingFile || isRenamingFolder;

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      downloadAbortRef.current?.abort();
    };
  }, []);

  const renameItems = useCallback(
    async (items: ExplorerItem[]) => {
      if (items.length !== 1 || isRenaming) return;

      const item = items[0];
      const newNameResult = await dialog.prompt({
        title: `Rename ${item.kind}:`,
        label: "New name:",
        placeholder: item.name,
        confirmLabel: "Rename",
      });
      const newName = newNameResult?.trim();

      if (!newName || newName === item.name) return;

      if (item.kind === "file") {
        const renamePromise = renameFile({ fileId: item.id, newName });
        toast.promise(renamePromise, {
          success: "Renamed successfully",
          error: "Failed to rename",
          duration: 1500,
        });
        try {
          await renamePromise;
        } catch {
          // The toast owns user-facing error reporting.
        }
        return;
      }

      const renamePromise = renameFolder({ folderId: item.id, newName });
      toast.promise(renamePromise, {
        success: "Renamed successfully",
        error: "Failed to rename",
        duration: 1500,
      });
      try {
        await renamePromise;
      } catch {
        // The toast owns user-facing error reporting.
      }
    },
    [dialog, isRenaming, renameFile, renameFolder],
  );

  const deleteItems = useCallback(
    async (items: ExplorerItem[]) => {
      if (items.length === 0 || isDeleting) return;

      const confirmResult = await dialog.confirm({
        title: "Move to trash?",
        destructive: true,
        description:
          items.length === 1
            ? `Move "${items[0].name}" to trash?`
            : `Move ${items.length} selected items to trash?`,
        confirmLabel: "Move to trash",
      });

      if (!confirmResult) return;

      setIsDeleting(true);
      const deletePromise = settleOperations(
        items.map(async (item) => {
          if (item.kind === "file") {
            await deleteFile(item.id);
            return;
          }

          await deleteFolder(item.id);
        }),
      );

      toast.promise(deletePromise, {
        success:
          items.length === 1
            ? "Moved item to trash"
            : `Moved ${items.length} items to trash`,
        error: "Failed to move to trash",
        duration: 1500,
      });

      try {
        await deletePromise;
      } catch {
        // The toast owns user-facing error reporting.
      } finally {
        onAfterItemsChanged?.();
        await refreshStorageQueries(invalidateStorageQueries);
        if (isMountedRef.current) setIsDeleting(false);
      }
    },
    [dialog, invalidateStorageQueries, isDeleting, onAfterItemsChanged],
  );

  const restoreItems = useCallback(
    async (items: ExplorerItem[]) => {
      if (items.length === 0 || isRestoring) return;

      setIsRestoring(true);

      const restorePromise = settleOperations(
        items.map((item) => restoreTrashItem(item.kind, item.id)),
      );

      try {
        toast.promise(restorePromise, {
          loading:
            items.length === 1
              ? `Restoring "${items[0].name}"`
              : `Restoring ${items.length} items`,
          success:
            items.length === 1
              ? "Restored item"
              : `Restored ${items.length} items`,
          error: "Failed to restore",
          duration: 1500,
        });

        await restorePromise;
      } catch {
        // The toast owns user-facing error reporting.
      } finally {
        await refreshStorageQueries(invalidateStorageQueries);
        onAfterItemsChanged?.();
        if (isMountedRef.current) setIsRestoring(false);
      }
    },
    [invalidateStorageQueries, isRestoring, onAfterItemsChanged],
  );

  const permanentlyDeleteItems = useCallback(
    async (items: ExplorerItem[]) => {
      if (items.length === 0 || isPermanentlyDeleting) return;

      const confirmResult = await dialog.confirm({
        title: "Delete permanently?",
        destructive: true,
        description:
          items.length === 1
            ? `Permanently delete "${items[0].name}"? This cannot be undone.`
            : `Permanently delete ${items.length} selected items? This cannot be undone.`,
        confirmLabel: "Delete permanently",
      });

      if (!confirmResult) return;

      setIsPermanentlyDeleting(true);

      const deletePromise = settleOperations(
        items.map((item) => permanentlyDeleteTrashItem(item.kind, item.id)),
      );

      try {
        toast.promise(deletePromise, {
          loading:
            items.length === 1
              ? `Deleting "${items[0].name}"`
              : `Deleting ${items.length} items`,
          success:
            items.length === 1
              ? "Permanently deleted item"
              : `Permanently deleted ${items.length} items`,
          error: "Failed to permanently delete",
          duration: 1500,
        });

        await deletePromise;
      } catch {
        // The toast owns user-facing error reporting.
      } finally {
        await refreshStorageQueries(invalidateStorageQueries);
        onAfterItemsChanged?.();
        if (isMountedRef.current) setIsPermanentlyDeleting(false);
      }
    },
    [
      dialog,
      invalidateStorageQueries,
      isPermanentlyDeleting,
      onAfterItemsChanged,
    ],
  );

  const downloadItems = useCallback(
    async (items: ExplorerItem[]) => {
      if (items.length === 0 || isDownloading || downloadAbortRef.current) {
        return;
      }

      const abortController = new AbortController();
      downloadAbortRef.current = abortController;
      setIsDownloading(true);
      let loadingToastId: string | number | undefined;

      try {
        if (items.length === 1 && items[0].kind === "file") {
          triggerDownload(getFileDownloadUrl(items[0].id));
          toast.success("Download started");
          return;
        }

        loadingToastId = toast.loading("Preparing download...");
        const result = await createDownload(
          items.map((item) => ({
            kind: item.kind,
            id: item.id,
          })),
        );
        const timeoutAt = Date.now() + DOWNLOAD_TIMEOUT_MS;

        while (!abortController.signal.aborted) {
          if (Date.now() >= timeoutAt) {
            toast.error("Download preparation timed out. Please try again.", {
              id: loadingToastId,
            });
            return;
          }

          const job = await getDownloadJob(
            result.jobId,
            abortController.signal,
          );

          if (job.status === "ready") {
            toast.success("Download ready", { id: loadingToastId });
            triggerDownload(getArchiveDownloadUrl(result.jobId));
            return;
          }

          if (job.status === "failed" || job.status === "expired") {
            toast.error(
              job.status === "failed" ? "Download failed" : "Download expired",
              { id: loadingToastId },
            );
            return;
          }

          toast.loading(
            `Preparing download... ${job.progress > 0 ? `${job.progress}%` : ""}`,
            { id: loadingToastId },
          );

          await sleep(DOWNLOAD_POLL_INTERVAL_MS, abortController.signal);
        }

        if (loadingToastId !== undefined) {
          toast.dismiss(loadingToastId);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          if (loadingToastId !== undefined) toast.dismiss(loadingToastId);
          return;
        }

        toast.error("Download failed", { id: loadingToastId });
      } finally {
        if (downloadAbortRef.current === abortController) {
          downloadAbortRef.current = null;
        }

        if (isMountedRef.current) {
          setIsDownloading(false);
        }
      }
    },
    [isDownloading],
  );

  return useMemo(
    () => ({
      isDownloading,
      isDeleting,
      isRenaming,
      isRestoring,
      isPermanentlyDeleting,
      renameItems,
      deleteItems,
      restoreItems,
      permanentlyDeleteItems,
      downloadItems,
    }),
    [
      deleteItems,
      downloadItems,
      isDeleting,
      isDownloading,
      isPermanentlyDeleting,
      isRenaming,
      isRestoring,
      permanentlyDeleteItems,
      renameItems,
      restoreItems,
    ],
  );
}

async function settleOperations(operations: Promise<unknown>[]) {
  const results = await Promise.allSettled(operations);
  const failures = results.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );

  if (failures.length > 0) {
    throw new AggregateError(
      failures.map((failure) => failure.reason),
      `${failures.length} storage operation(s) failed`,
    );
  }
}

async function refreshStorageQueries(
  invalidateStorageQueries: () => Promise<void>,
) {
  try {
    await invalidateStorageQueries();
  } catch {
    toast.error(
      "The operation finished, but the storage view could not refresh.",
    );
  }
}

export type StorageItemActions = ReturnType<typeof useStorageItemActions>;
