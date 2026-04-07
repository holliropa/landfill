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
import { useState } from "react";
import { Button } from "@/ui/Button";
import { XIcon } from "lucide-react";
import { IconButton } from "@/ui/IconButton";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type ManipulationBarProps = {
  selectedItems: ExplorerItem[];
  onDeselectAll: () => void;
};

export function ManipulationBar({
  selectedItems,
  onDeselectAll,
}: ManipulationBarProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);
  const { mutateAsync: renameFile } = useRenameFile();
  const { mutateAsync: renameFolder } = useRenameFolder();

  const handleDelete = async () => {
    if (selectedItems.length === 0) return;

    const confirmDelete = window.confirm(
      selectedItems.length === 1
        ? `Are you sure you want to delete ${selectedItems[0].name}?`
        : `Are you sure you want to delete ${selectedItems.length} items?`,
    );

    if (!confirmDelete) return;

    try {
      await Promise.all(
        selectedItems.map(async (item) => {
          if (item.kind === "file") {
            await deleteFile(item.id);
          } else if (item.kind === "folder") {
            await deleteFolder(item.id);
          }
        }),
      );
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  const handleRename = async () => {
    if (selectedItems.length !== 1) return;

    const newName = window.prompt("Enter new name:", selectedItems[0].name);

    if (!newName?.trim()) return;

    if (selectedItems[0].kind === "file") {
      await renameFile({ fileId: selectedItems[0].id, newName });
    } else if (selectedItems[0].kind === "folder") {
      await renameFolder({ folderId: selectedItems[0].id, newName });
    }
  };

  const handleDownload = async () => {
    if (selectedItems.length === 0 || isDownloading) return;

    try {
      setIsDownloading(true);

      if (selectedItems.length === 1 && selectedItems[0].kind === "file") {
        window.open(getFileDownloadUrl(selectedItems[0].id), "_blank");
        return;
      }

      setDownloadStatus("Preparing archive...");

      const result = await createDownload(
        selectedItems.map((item) => ({
          kind: item.kind,
          id: item.id,
        })),
      );

      while (true) {
        const job = await getDownloadJob(result.jobId);

        if (job.status === "ready") {
          window.open(getArchiveDownloadUrl(result.jobId), "_blank");
          break;
        }

        if (job.status === "failed") {
          throw new Error(job.errorMessage || "Archive creation failed");
        }

        if (job.status === "expired") {
          throw new Error("Archive expired");
        }

        setDownloadStatus(
          job.progress > 0
            ? `Preparing archive... ${job.progress}%`
            : "Preparing archive...",
        );

        await sleep(1000);
      }

      setDownloadStatus(null);
    } catch (error) {
      console.error(error);
      setDownloadStatus(
        error instanceof Error ? error.message : "Download failed",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        gap: "8px",
      }}
    >
      <IconButton size="small" onClick={onDeselectAll} icon={<XIcon />} />
      <span>{selectedItems.length} selected</span>
      {downloadStatus ? <span>{downloadStatus}</span> : null}
      <div
        style={{
          display: "flex",
          marginLeft: "auto",
          gap: "8px",
        }}
      >
        {selectedItems.length === 1 && (
          <Button variant="outlined" size="small" onClick={handleRename}>
            <span>Rename</span>
          </Button>
        )}
        <Button
          variant="outlined"
          size="small"
          onClick={handleDownload}
          disabled={isDownloading}
        >
          {isDownloading ? "Preparing..." : "Download"}
        </Button>
        <Button variant="outlined" size="small" onClick={handleDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}
