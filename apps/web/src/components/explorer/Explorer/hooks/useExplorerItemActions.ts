import type { ExplorerItem } from "@/components/Explorer";
import {
  createDownload,
  deleteFile,
  deleteFolder,
  getArchiveDownloadUrl,
  getDownloadJob,
  getFileDownloadUrl,
  useRenameFile,
  useRenameFolder,
} from "@/lib/client";
import { folderKeys } from "@/lib/client/keys";
import { triggerDownload } from "@/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { toast } from "sonner";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ExplorerItemActionsParams = {
  folderId: string;
  onAfterDelete?: () => void;
};

export function useExplorerItemActions({
  folderId,
  onAfterDelete,
}: ExplorerItemActionsParams) {
  const [isDownloading, setIsDownloading] = useState(false);
  const queryClient = useQueryClient();
  const { mutateAsync: renameFile } = useRenameFile();
  const { mutateAsync: renameFolder } = useRenameFolder();

  const renameItems = useCallback(
    async (items: ExplorerItem[]) => {
      if (items.length !== 1) return;

      const item = items[0];
      const newName = window.prompt("Enter new name:", item.name);
      const trimmedName = newName?.trim();

      if (!trimmedName || trimmedName === item.name) return;

      if (item.kind === "file") {
        toast.promise(renameFile({ fileId: item.id, newName: trimmedName }), {
          success: "Renamed successfully",
          error: "Failed to rename",
          duration: 1500,
        });
        return;
      }

      toast.promise(renameFolder({ folderId: item.id, newName: trimmedName }), {
        success: "Renamed successfully",
        error: "Failed to rename",
        duration: 1500,
      });
    },
    [renameFile, renameFolder],
  );

  const deleteItems = useCallback(
    async (items: ExplorerItem[]) => {
      if (items.length === 0) return;

      const confirmDelete = window.confirm(
        items.length === 1
          ? `Delete "${items[0].name}"?`
          : `Delete ${items.length} selected items?`,
      );

      if (!confirmDelete) return;

      toast.promise(
        Promise.all(
          items.map(async (item) => {
            if (item.kind === "file") {
              await deleteFile(item.id);
              return;
            }

            await deleteFolder(item.id);
          }),
        ),
        {
          success:
            items.length === 1 ? "Deleted item" : `Deleted ${items.length} items`,
          error: "Failed to delete",
          duration: 1500,
        },
      );

      onAfterDelete?.();
      await queryClient.invalidateQueries({
        queryKey: folderKeys.content(folderId),
      });
    },
    [folderId, onAfterDelete, queryClient],
  );

  const downloadItems = useCallback(async (items: ExplorerItem[]) => {
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
  }, [isDownloading]);

  return {
    isDownloading,
    renameItems,
    deleteItems,
    downloadItems,
  };
}
