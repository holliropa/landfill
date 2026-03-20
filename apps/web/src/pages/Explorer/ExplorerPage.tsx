import { type ExplorerItem, ExplorerView } from "@/components/explorer";
import { useExplorer } from "@/hooks/useExplorer.ts";
import React, { useMemo, useState } from "react";
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

  const items = useMemo<ExplorerItem[]>(() => {
    const folderItems = folders.map((folder) => ({
      key: toKey(folder.id, "folder"),
      kind: "folder" as const,
      name: folder.name,
      createdAt: folder.createdAt,
      size: null,
      ThumbnailComponent: <FolderIcon size={18} />,
    }));

    const fileItems = files.map((file) => ({
      key: toKey(file.id, "file"),
      kind: "file" as const,
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

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null,
  );

  const resetSelection = () => {
    setSelectedKeys(new Set());
    setLastSelectedIndex(null);
  };

  const handleFilesSelected = (files: File[]) => {
    uploadFiles(files);
  };

  const handleOpenItem = (index: number) => {
    const item = items[index];
    if (!item) return;

    if (item.kind === "folder") {
      openFolder(toId(item.key));
      resetSelection();
    }
  };

  const handleSelectRange = (from: number, to: number) => {
    const newSelected = new Set<string>();
    for (let i = from; i <= to; i++) {
      newSelected.add(items[i].key);
    }
    setSelectedKeys(newSelected);
    if (from === to) setLastSelectedIndex(from);
  };

  const handleToggleSingle = (index: number, deselectRest: boolean) => {
    setSelectedKeys((prev) => {
      const newSelected = new Set(prev);
      const item = items[index];
      if (!item) return prev;

      if (deselectRest) {
        newSelected.clear();
        newSelected.add(item.key);
      } else if (newSelected.has(item.key)) {
        newSelected.delete(item.key);
      } else {
        newSelected.add(item.key);
      }
      return newSelected;
    });

    setLastSelectedIndex(index);
  };

  const handleClickItem = (index: number, event: React.MouseEvent) => {
    const item = items[index];
    if (!item) return;

    if (event.shiftKey) {
      const startIndex = lastSelectedIndex ?? index;
      const from = Math.min(startIndex, index);
      const to = Math.max(startIndex, index);
      handleSelectRange(from, to);
      return;
    }

    handleToggleSingle(index, !event.ctrlKey && !event.metaKey);
  };

  return (
    <ExplorerView
      folderId={folderId}
      breadcrumbs={breadcrumbs}
      items={items}
      selectedKeys={selectedKeys}
      onItemOpen={handleOpenItem}
      onItemClick={handleClickItem}
      onOpenFolder={(folderId) => {
        openFolder(folderId);
        resetSelection();
      }}
      onFilesSelected={handleFilesSelected}
      onCreateFolder={createFolder}
    />
  );
}

function toKey(id: string, kind: ExplorerItem["kind"]) {
  return `${kind}:${id}`;
}

function toId(key: ExplorerItem["key"]) {
  return key.split(":")[1];
}
