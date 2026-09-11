import styles from "./ExplorerPage.module.css";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useFolderContent } from "@/lib/client";
import { useEffect, useMemo } from "react";
import { FolderIcon } from "lucide-react";
import { FileThumbnail } from "@/components/FileThumbnail";
import { FolderNavigationBar } from "@/components/FolderNavigationBar";
import type { ExplorerItem } from "@/features/explorer";
import { FolderExplorer } from "./FolderExplorer";

export function ExplorerPage() {
  const { folderId } = useParams<{ folderId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const navigationRequest = location.state as {
    revealItemKey?: string;
    openFileId?: string;
  } | null;
  const normalizedFolderId = folderId ?? "root";
  const {
    data: folderContent,
    isLoading,
    isError,
  } = useFolderContent(normalizedFolderId);

  useEffect(() => {
    if (!location.state) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  const items = useMemo<ExplorerItem[]>(() => {
    const folderItems = (folderContent?.folders ?? []).map((folder) => ({
      key: `folder:${folder.id}`,
      id: folder.id,
      kind: "folder" as const,
      name: folder.name,
      createdAt: folder.createdAt,
      size: null,
      mimeType: null,
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
      mimeType: file.mimeType,
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
          requestedItemKey={navigationRequest?.revealItemKey}
          requestedFileId={navigationRequest?.openFileId}
        />
      </div>
    </div>
  );
}
