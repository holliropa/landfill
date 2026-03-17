import { type ExplorerItem, ExplorerView } from "@/components/explorer";
import { useExplorer } from "@/hooks/useExplorer.ts";
import { useMemo } from "react";
import { FolderIcon } from "lucide-react";
import { FileThumbnail } from "@/components/FileThumbnail";

export function ExplorerPage() {
  const {
    folderId,
    path,
    folders,
    files,
    uploadFiles,
    createFolder,
    openFolder,
  } = useExplorer();

  const items = useMemo((): ExplorerItem[] => {
    const folderItems = folders.map((folder) => ({
      id: folder.id,
      type: "folder" as const,
      name: folder.name,
      createdAt: folder.createdAt,
      size: null,
      ThumbnailComponent: <FolderIcon size={18} />,
    }));

    const fileItems = files.map((file) => ({
      id: file.id,
      type: "file" as const,
      name: file.originalName,
      createdAt: file.createdAt,
      size: file.size,
      ThumbnailComponent: (
        <FileThumbnail fileId={file.id} alt={file.originalName} />
      ),
    }));

    return [...folderItems, ...fileItems];
  }, [folders, files]);

  const breadcrumbs =
    path.length > 0
      ? path.map((item) => ({ key: item.id, name: item.name }))
      : [];

  const handleFilesSelected = (files: File[]) => {
    uploadFiles(files);
  };

  const handleOpenItem = (item: ExplorerItem) => {
    if (item.type === "folder") {
      openFolder(item.id);
    }
  };

  return (
    <ExplorerView
      folderId={folderId}
      breadcrumbs={breadcrumbs}
      items={items}
      onItemOpen={handleOpenItem}
      onOpenFolder={openFolder}
      onFilesSelected={handleFilesSelected}
      onCreateFolder={createFolder}
    />
  );
}
