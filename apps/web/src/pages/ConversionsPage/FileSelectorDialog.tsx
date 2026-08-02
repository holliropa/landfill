import { formatSize } from "@/utils";
import styles from "./ConversionsPage.module.css";
import { useFolderContent, useFolderPath } from "@/lib/client";
import { Button } from "@/ui/Button";
import { Dialog } from "@/ui/Dialog";
import { FileIcon, FolderIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type FileSelectorDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: (files: { id: string; name: string }[]) => void;
};

export function FileSelectorDialog({
  open,
  onClose,
  onConfirm,
}: FileSelectorDialogProps) {
  const [currentFolderId, setCurrentFolderId] = useState("root");
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(
    () => new Set(),
  );

  const {
    data: folderContent,
    isLoading,
    isError,
  } = useFolderContent(currentFolderId);
  const { data: folderPath } = useFolderPath(currentFolderId);

  useEffect(() => {
    if (!open) {
      setCurrentFolderId("root");
      setSelectedFileIds(new Set());
    }
  }, [open]);

  const files = folderContent?.files ?? [];
  const folders = folderContent?.folders ?? [];

  const selectedFiles = useMemo(
    () =>
      files
        .filter((file) => selectedFileIds.has(file.id))
        .map((file) => ({
          id: file.id,
          name: file.name,
        })),
    [files, selectedFileIds],
  );

  const openFolder = (folderId: string) => {
    setCurrentFolderId(folderId);
    setSelectedFileIds(new Set());
  };

  const toggleFile = (fileId: string) => {
    setSelectedFileIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(fileId)) {
        nextIds.delete(fileId);
      } else {
        nextIds.add(fileId);
      }

      return nextIds;
    });
  };

  return (
    <Dialog
      open={open}
      title="Select files"
      description="Browse folders and choose files from one folder."
      onClose={onClose}
      footer={
        <>
          <Button variant="text" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={selectedFiles.length === 0}
            onClick={() => onConfirm(selectedFiles)}
          >
            Add {selectedFiles.length > 0 ? selectedFiles.length : ""} files
          </Button>
        </>
      }
    >
      <div className={styles.selector}>
        <div className={styles.selectorPath}>
          {(folderPath?.path ?? [{ id: "root", name: "root" }]).map(
            (folder, index, pathItems) => {
              const isCurrent = folder.id === currentFolderId;

              return (
                <span key={folder.id} className={styles.pathItem}>
                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => openFolder(folder.id)}
                  >
                    {folder.id === "root" ? "All files" : folder.name}
                  </button>
                  {index < pathItems.length - 1 && <span>/</span>}
                </span>
              );
            },
          )}
        </div>

        <div className={styles.selectorList}>
          {isLoading ? (
            <div className={styles.selectorStatus}>Loading folder...</div>
          ) : isError ? (
            <div className={styles.selectorStatus}>Could not load folder.</div>
          ) : folders.length === 0 && files.length === 0 ? (
            <div className={styles.selectorStatus}>This folder is empty.</div>
          ) : (
            <>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  className={styles.folderRow}
                  onClick={() => openFolder(folder.id)}
                >
                  <FolderIcon size={18} />
                  <span>{folder.name}</span>
                </button>
              ))}

              {files.map((file) => (
                <label key={file.id} className={styles.fileRow}>
                  <input
                    type="checkbox"
                    checked={selectedFileIds.has(file.id)}
                    onChange={() => toggleFile(file.id)}
                  />
                  <FileIcon size={18} />
                  <span title={file.name}>{file.name}</span>
                  <small>{formatSize(file.size)}</small>
                </label>
              ))}
            </>
          )}
        </div>
      </div>
    </Dialog>
  );
}
