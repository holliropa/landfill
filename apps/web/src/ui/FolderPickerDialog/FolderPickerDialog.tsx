import { useFolderContent, useFolderPath } from "@/lib/client";
import { Button } from "@/ui/Button";
import { Dialog } from "@/ui/Dialog";
import { ChevronRightIcon, FolderIcon } from "lucide-react";
import { useMemo, useState } from "react";
import styles from "./FolderPickerDialog.module.css";

export type FolderPickerDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  initialFolderId?: string;
  excludedFolderIds?: string[];
  onConfirm: (folder: { id: string; name: string }) => void;
  onCancel: () => void;
};

export function FolderPickerDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  initialFolderId = "root",
  excludedFolderIds = [],
  onConfirm,
  onCancel,
}: FolderPickerDialogProps) {
  const [currentFolderId, setCurrentFolderId] = useState(initialFolderId);
  const {
    data: content,
    isLoading,
    isError,
  } = useFolderContent(currentFolderId);
  const { data: pathResult } = useFolderPath(currentFolderId);
  const excludedIds = useMemo(
    () => new Set(excludedFolderIds),
    [excludedFolderIds],
  );
  const path = pathResult?.path ?? [{ id: "root", name: "root" }];
  const currentFolder = path.at(-1) ?? { id: "root", name: "root" };

  return (
    <Dialog
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      footer={
        <>
          <Button variant="text" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant="contained"
            disabled={isLoading || isError || excludedIds.has(currentFolderId)}
            onClick={() =>
              onConfirm({
                id: currentFolderId,
                name:
                  currentFolder.id === "root"
                    ? "All files"
                    : currentFolder.name,
              })
            }
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <nav className={styles.breadcrumbs} aria-label="Destination path">
        {path.map((folder, index) => (
          <span className={styles.breadcrumbPart} key={folder.id}>
            {index > 0 && <ChevronRightIcon size={14} aria-hidden="true" />}
            <button
              type="button"
              className={styles.breadcrumb}
              onClick={() => setCurrentFolderId(folder.id)}
              aria-current={
                folder.id === currentFolderId ? "location" : undefined
              }
            >
              {folder.id === "root" ? "All files" : folder.name}
            </button>
          </span>
        ))}
      </nav>

      <div className={styles.folderList} aria-live="polite">
        {isLoading ? (
          <p className={styles.state}>Loading folders…</p>
        ) : isError ? (
          <p className={styles.error}>Could not load this folder.</p>
        ) : content?.folders.length ? (
          content.folders.map((folder) => {
            const disabled = excludedIds.has(folder.id);

            return (
              <button
                type="button"
                className={styles.folder}
                key={folder.id}
                disabled={disabled}
                title={
                  disabled ? "A folder cannot be moved into itself" : undefined
                }
                onClick={() => setCurrentFolderId(folder.id)}
              >
                <FolderIcon size={18} aria-hidden="true" />
                <span>{folder.name}</span>
                <ChevronRightIcon size={16} aria-hidden="true" />
              </button>
            );
          })
        ) : (
          <p className={styles.state}>No folders here.</p>
        )}
      </div>
    </Dialog>
  );
}
