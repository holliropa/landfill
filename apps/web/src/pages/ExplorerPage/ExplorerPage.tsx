import styles from "./ExplorerPage.module.css";
import { useParams } from "react-router-dom";
import { useFolderContent } from "@/lib/client";
import { useMemo } from "react";
import { FolderIcon } from "lucide-react";
import { FileThumbnail } from "@/components/FileThumbnail";
import { FolderNavigationBar } from "@/components/FolderNavigationBar";
import type { ExplorerItem } from "@/features/explorer";
import { FolderExplorer } from "./FolderExplorer";

export function ExplorerPage() {
  const { folderId } = useParams<{ folderId?: string }>();
  const normalizedFolderId = folderId ?? "root";
  const {
    data: folderContent,
    isLoading,
    isError,
  } = useFolderContent(normalizedFolderId);

  const items = useMemo<ExplorerItem[]>(() => {
    const folderItems = (folderContent?.folders ?? []).map((folder) => ({
      key: `folder:${folder.id}`,
      id: folder.id,
      kind: "folder" as const,
      name: folder.name,
      createdAt: folder.createdAt,
      size: null,
      location: { id: normalizedFolderId, name: normalizedFolderId },
      ThumbnailComponent: <FolderIcon size={18} />,
    }));

    const fileItems = (folderContent?.files ?? []).map((file) => ({
      key: `file:${file.id}`,
      id: file.id,
      kind: "file" as const,
      name: file.name,
      createdAt: file.createdAt,
      size: file.size,
      location: { id: normalizedFolderId, name: normalizedFolderId },
      ThumbnailComponent: (
        <FileThumbnail
          fileId={file.id}
          alt={file.name}
          mimeType={file.mimeType}
        />
      ),
    }));

    return [...folderItems, ...fileItems];
  }, [folderContent, normalizedFolderId]);

  return (
    <div className={styles.root}>
      <div className={styles.navigation}>
        <FolderNavigationBar folderId={normalizedFolderId} />
      </div>
      <div className={styles.content}>
        <FolderExplorer
          items={items}
          folderId={normalizedFolderId}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </div>
  );
}
