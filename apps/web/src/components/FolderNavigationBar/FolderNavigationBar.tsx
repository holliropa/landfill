import styles from "./FolderNavigationBar.module.css";
import React, { useMemo, useRef } from "react";
import { useCreateFolder, useFolderPath, useUploadFiles } from "@/lib/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/ui/Button";
import { ArrowLeftIcon, PlusIcon, UploadIcon } from "lucide-react";
import { FolderBreadcrumbs, type BreadcrumbItem } from "./FolderBreadcrumbs";
import { IconButton } from "@/ui/IconButton";

export type NavigationBarProps = {
  folderId: string;
};

export function FolderNavigationBar({ folderId }: NavigationBarProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { mutateAsync: createFolder } = useCreateFolder();
  const { mutateAsync: uploadFiles } = useUploadFiles();

  const { data: folderPath } = useFolderPath(folderId);

  const handleCreateFolder = async () => {
    const name = window.prompt("Enter folder name:");

    if (!name?.trim()) return;

    await createFolder({
      name: name.trim(),
      parentFolderId: folderId,
    });
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selected = Array.from(e.target.files ?? []);

    if (selected.length > 0) {
      await uploadFiles({
        files: selected,
        parentFolderId: folderId,
      });
    }

    e.target.value = "";
  };

  const handleOpenFolder = (nextFolderId: string) => {
    navigate(`/folder/${nextFolderId}`);
  };

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    if (!folderPath) return [];

    return folderPath.path ?? [];
  }, [folderPath]);

  return (
    <div className={styles.bar}>
      <IconButton
        shape="rounded"
        icon={<ArrowLeftIcon />}
        disabled={!folderPath || folderPath.path.length === 1}
        onClick={() => {
          if (!folderPath || folderPath.path.length === 1) return;

          handleOpenFolder(folderPath.path[folderPath.path.length - 2].id);
        }}
      />

      <FolderBreadcrumbs
        items={breadcrumbs}
        currentFolderId={folderId}
        onClick={handleOpenFolder}
      />

      <div className={styles.actions}>
        <Button
          variant="outlined"
          size="medium"
          onClick={handleCreateFolder}
          startIcon={<PlusIcon />}
          className={styles.actionButton}
        >
          Create Folder
        </Button>
        <Button
          variant="outlined"
          size="medium"
          onClick={() => fileInputRef.current?.click()}
          startIcon={<UploadIcon />}
          className={styles.actionButton}
        >
          Add Files
        </Button>
      </div>

      <input
        ref={fileInputRef}
        hidden
        type="file"
        multiple
        onChange={handleFileInputChange}
      />
    </div>
  );
}
