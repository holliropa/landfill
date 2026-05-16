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
import {
  DownloadIcon,
  FileEditIcon,
  InfoIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { IconButton } from "@/ui/IconButton";
import { SpinnerIcon } from "@/ui/SpinnerIcon";
import { toast } from "sonner";
import { triggerDownload } from "@/utils";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type ManipulationBarProps = {
  selectedItems: ExplorerItem[];
  onDeselectAll: () => void;
  onShowDetails: () => void;
};

export function ManipulationBar({
  selectedItems,
  onDeselectAll,
  onShowDetails,
}: ManipulationBarProps) {
  const [isDownloading, setIsDownloading] = useState(false);
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

    toast.promise(
      Promise.all(
        selectedItems.map(async (item) => {
          if (item.kind === "file") {
            await deleteFile(item.id);
          } else if (item.kind === "folder") {
            await deleteFolder(item.id);
          }
        }),
      ),
      {
        success: `Deleted ${selectedItems.length} items`,
        error: "Failed to delete",
        duration: 1500,
      },
    );
  };

  const handleRename = async () => {
    if (selectedItems.length !== 1) return;

    const newName = window.prompt("Enter new name:", selectedItems[0].name);

    if (!newName?.trim()) return;

    if (selectedItems[0].kind === "file") {
      toast.promise(renameFile({ fileId: selectedItems[0].id, newName }), {
        success: "Renamed successfully",
        error: "Failed to rename",
        duration: 1500,
      });
    } else if (selectedItems[0].kind === "folder") {
      toast.promise(renameFolder({ folderId: selectedItems[0].id, newName }), {
        success: "Renamed successfully",
        error: "Failed to rename",
        duration: 1500,
      });
    }
  };

  const handleDownload = async () => {
    if (selectedItems.length === 0 || isDownloading) return;

    setIsDownloading(true);

    if (selectedItems.length === 1 && selectedItems[0].kind === "file") {
      triggerDownload(getFileDownloadUrl(selectedItems[0].id));
      toast.success("Download started");
      return;
    }

    const toastId = toast.loading("Preparing download...");

    const result = await createDownload(
      selectedItems.map((item) => ({
        kind: item.kind,
        id: item.id,
      })),
    );

    while (true) {
      const job = await getDownloadJob(result.jobId);

      if (job.status === "ready") {
        toast.success("Download ready", {
          id: toastId,
        });
        triggerDownload(getArchiveDownloadUrl(result.jobId));
        break;
      }

      if (job.status === "failed") {
        toast.error("Download failed", {
          id: toastId,
        });
      }

      if (job.status === "expired") {
        toast.error("Download expired", {
          id: toastId,
        });
      }

      toast.loading(
        `Preparing download... ${job.progress > 0 ? job.progress : ""}`,
        { id: toastId },
      );

      await sleep(1000);
    }

    setIsDownloading(false);
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
      {selectedItems.length > 0 && (
        <>
          <IconButton
            size="medium"
            variant="ghost"
            onClick={onDeselectAll}
            icon={<XIcon />}
          />
          <span>{selectedItems.length} selected</span>
        </>
      )}
      <div
        style={{
          display: "flex",
          marginLeft: "auto",
          gap: "8px",
        }}
      >
        <IconButton
          variant="ghost"
          icon={<FileEditIcon />}
          onClick={handleRename}
          disabled={selectedItems.length === 0 || selectedItems.length > 1}
        />
        <IconButton
          variant="ghost"
          onClick={handleDownload}
          disabled={isDownloading || selectedItems.length === 0}
          icon={isDownloading ? <SpinnerIcon /> : <DownloadIcon />}
        />
        <IconButton
          variant="ghost"
          onClick={handleDelete}
          icon={<TrashIcon color="#a2030d" />}
          disabled={selectedItems.length === 0}
        />
        <IconButton
          variant="ghost"
          icon={<InfoIcon />}
          onClick={onShowDetails}
        />
      </div>
    </div>
  );
}
