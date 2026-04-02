import { Explorer, type ExplorerItem } from "@/components/Explorer";
import { useParams } from "react-router-dom";
import { useFolderContent } from "@/lib/client";
import { useMemo } from "react";
import { FolderIcon } from "lucide-react";
import { FileThumbnail } from "@/components/FileThumbnail";
import { FolderNavigationBar } from "@/components/FolderNavigationBar";

export function ExplorerPage() {
  const { folderId } = useParams<{ folderId?: string }>();
  const normalizedFolderId = folderId ?? "root";
  const { data: folderContent } = useFolderContent(normalizedFolderId);

  const items = useMemo<ExplorerItem[]>(() => {
    const folderItems = (folderContent?.folders ?? []).map((folder) => ({
      key: `folder:${folder.id}`,
      id: folder.id,
      kind: "folder" as const,
      name: folder.name,
      createdAt: folder.createdAt,
      size: null,
      ThumbnailComponent: <FolderIcon size={18} />,
    }));

    const fileItems = (folderContent?.files ?? []).map((file) => ({
      key: `file:${file.id}`,
      id: file.id,
      kind: "file" as const,
      name: file.name,
      createdAt: file.createdAt,
      size: file.size,
      ThumbnailComponent: <FileThumbnail fileId={file.id} alt={file.name} />,
    }));

    return [...folderItems, ...fileItems];
  }, [folderContent]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        flex: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flex: "0 0 auto",
          padding: "8px 12px",
          borderBottom: "1px solid #d0d0d0",
          userSelect: "none",
        }}
      >
        <FolderNavigationBar folderId={normalizedFolderId} />
      </div>
      <div
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          minWidth: 0,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Explorer items={items} />
      </div>
    </div>
  );
}
