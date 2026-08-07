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
import { useCallback, useState } from "react";
import { toast } from "sonner";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type StorageItemActionsParams = {
  onAfterItemsChanged?: () => void;
};

export function useStorageItemActions({
  onAfterItemsChanged,
}: StorageItemActionsParams = {}) {
  const dialog = useDialog();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isPermanentlyDeleting, setIsPermanentlyDeleting] = useState(false);
  const invalidateStorageQueries = useInvalidateStorageQueries();
  const { mutateAsync: renameFile } = useRenameFile();
  const { mutateAsync: renameFolder } = useRenameFolder();

  const renameItems = useCallback(
    async (items: ExplorerItem[]) => {
      if (items.length !== 1) return;

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
        toast.promise(renameFile({ fileId: item.id, newName }), {
          success: "Renamed successfully",
          error: "Failed to rename",
          duration: 1500,
        });
        return;
      }

      toast.promise(renameFolder({ folderId: item.id, newName }), {
        success: "Renamed successfully",
        error: "Failed to rename",
        duration: 1500,
      });
    },
    [dialog, renameFile, renameFolder],
  );

  const deleteItems = useCallback(
    async (items: ExplorerItem[]) => {
      if (items.length === 0) return;

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

      const deletePromise = Promise.all(
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

      await deletePromise;
      onAfterItemsChanged?.();
      await invalidateStorageQueries();
    },
    [dialog, invalidateStorageQueries, onAfterItemsChanged],
  );

  const restoreItems = useCallback(
    async (items: ExplorerItem[]) => {
      if (items.length === 0 || isRestoring) return;

      setIsRestoring(true);

      const restorePromise = Promise.all(
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
        await invalidateStorageQueries();
        onAfterItemsChanged?.();
      } finally {
        setIsRestoring(false);
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

      const deletePromise = Promise.all(
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
        await invalidateStorageQueries();
        onAfterItemsChanged?.();
      } finally {
        setIsPermanentlyDeleting(false);
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
      if (items.length === 0 || isDownloading) return;

      setIsDownloading(true);

      try {
        if (items.length === 1 && items[0].kind === "file") {
          triggerDownload(getFileDownloadUrl(items[0].id));
          toast.success("Download started");
          return;
        }

        const toastId = toast.loading("Preparing download...");
        const result = await createDownload(
          items.map((item) => ({
            kind: item.kind,
            id: item.id,
          })),
        );

        while (true) {
          const job = await getDownloadJob(result.jobId);

          if (job.status === "ready") {
            toast.success("Download ready", { id: toastId });
            triggerDownload(getArchiveDownloadUrl(result.jobId));
            return;
          }

          if (job.status === "failed" || job.status === "expired") {
            toast.error(
              job.status === "failed" ? "Download failed" : "Download expired",
              { id: toastId },
            );
            return;
          }

          toast.loading(
            `Preparing download... ${job.progress > 0 ? `${job.progress}%` : ""}`,
            { id: toastId },
          );

          await sleep(1000);
        }
      } finally {
        setIsDownloading(false);
      }
    },
    [isDownloading],
  );

  return {
    isDownloading,
    isRestoring,
    isPermanentlyDeleting,
    renameItems,
    deleteItems,
    restoreItems,
    permanentlyDeleteItems,
    downloadItems,
  };
}

export type StorageItemActions = ReturnType<typeof useStorageItemActions>;
