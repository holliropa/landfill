import styles from "./FolderNavigationBar.module.css";
import React, { useMemo, useRef } from "react";
import { useCreateFolder, useFolderPath, useUploadFiles } from "@/lib/client";
import { ArrowUpIcon, FolderPlusIcon, UploadIcon } from "lucide-react";
import { FolderBreadcrumbs, type BreadcrumbItem } from "./FolderBreadcrumbs";
import { IconButton } from "@/ui/IconButton";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";

export type NavigationBarProps = {
  folderId: string;
};

export function FolderNavigationBar({ folderId }: NavigationBarProps) {
  const openFolder = useFolderNavigation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { mutateAsync: createFolder } = useCreateFolder();
  const { mutateAsync: uploadFiles } = useUploadFiles();

  const { data: folderPath } = useFolderPath(folderId);

  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
    return folderPath?.path ?? [];
  }, [folderPath]);

  const canGoBack = Boolean(folderPath && folderPath.path.length > 1);

  const handleCreateFolder = async () => {
    const name = window.prompt("Enter folder name:");
    const trimmedName = name?.trim();

    if (!trimmedName) return;

    await createFolder({
      name: trimmedName,
      parentFolderId: folderId,
    });
  };

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length > 0) {
      await uploadFiles({
        files: selectedFiles,
        parentFolderId: folderId,
      });
    }

    event.target.value = "";
  };

  const handleOpenFolder = (nextFolderId: string) => {
    openFolder(nextFolderId);
  };

  const handleGoBack = () => {
    if (!canGoBack) return;

    const parentFolder = breadcrumbs[breadcrumbs.length - 2];
    handleOpenFolder(parentFolder.id);
  };

  return (
    <nav className={styles.bar} aria-label="Folder navigation">
      <div className={styles.pathGroup}>
        <IconButton
          shape="rounded"
          variant="ghost"
          icon={<ArrowUpIcon />}
          disabled={!canGoBack}
          onClick={handleGoBack}
          aria-label="Go to parent folder"
        />

        <FolderBreadcrumbs
          items={breadcrumbs}
          currentFolderId={folderId}
          onClick={handleOpenFolder}
        />
      </div>

      <div className={styles.actions}>
        <IconButton
          variant="ghost"
          onClick={handleCreateFolder}
          icon={<FolderPlusIcon />}
        />
        <IconButton
          variant="ghost"
          onClick={() => fileInputRef.current?.click()}
          icon={<UploadIcon />}
        />
      </div>

      <input
        ref={fileInputRef}
        className={styles.fileInput}
        type="file"
        multiple
        onChange={handleFileInputChange}
      />
    </nav>
  );
}
