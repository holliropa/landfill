import styles from "./Explorer.module.css";
import { ExplorerList } from "../ExplorerList";
import React, { useMemo, useState } from "react";
import type { ExplorerItem } from "../types";
import { ManipulationBar } from "@/components/Explorer/ManipulationBar";
import {
  type DetailsTarget,
  DetailsView,
} from "@/components/Explorer/DetailsView";
import { isRootFolder } from "@/utils";
import { FileViewer } from "@/components/FileViewer";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";
import { useExplorerKeyboardNavigation } from "./hooks/useExplorerKeyboardNavigation";
import { useExplorerSelection } from "./hooks/useExplorerSelection";
import { useExplorerFileViewer } from "./hooks/useExplorerFileViewer";
import { useExplorerItemActions } from "./hooks/useExplorerItemActions";
import {
  DownloadIcon,
  ExternalLinkIcon,
  FileEditIcon,
  InfoIcon,
  TrashIcon,
} from "lucide-react";
import { FileDropZone } from "@/components/FileDropZone";
import { useUploadFiles } from "@/lib/client";
import { toast } from "sonner";

type ExplorerProps = {
  items: ExplorerItem[];
  location?: string;
  isLoading?: boolean;
  isError?: boolean;
};

type ContextMenuState = {
  x: number;
  y: number;
  items: ExplorerItem[];
} | null;

export function Explorer({
  items,
  location = "root",
  isLoading = false,
  isError = false,
}: ExplorerProps) {
  const openFolder = useFolderNavigation();
  const { mutateAsync: uploadFiles } = useUploadFiles();
  const selection = useExplorerSelection({ items });
  const fileViewer = useExplorerFileViewer({ items });
  const [showDetails, setShowDetails] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>(null);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(
    items.length > 0 ? 0 : null,
  );
  const [isExplorerKeyboardActive, setIsExplorerKeyboardActive] =
    useState(false);

  const actions = useExplorerItemActions({
    folderId: location,
    onAfterDelete: selection.resetSelection,
  });

  const clampedFocusedIndex =
    focusedIndex === null || items.length === 0
      ? null
      : Math.min(focusedIndex, items.length - 1);

  const detailsTarget = useMemo<DetailsTarget>(() => {
    if (selection.selectedItems.length === 0) {
      if (location && !isRootFolder(location)) {
        return { type: "folder", id: location };
      }

      return { type: "none" };
    }
    if (selection.selectedItems.length === 1) {
      const item = selection.selectedItems[0];
      return item.kind === "folder"
        ? { type: "folder", id: item.id }
        : { type: "file", id: item.id };
    }
    return { type: "selection", items: selection.selectedItems };
  }, [location, selection.selectedItems]);

  const handleOpenItem = (index: number) => {
    const item = items[index];
    if (!item) return;

    if (item.kind === "folder") {
      openFolder(item);
      selection.resetSelection();
      return;
    }

    fileViewer.openFile(item.id);
  };

  const handleClickItem = (index: number, event: React.MouseEvent) => {
    const item = items[index];
    if (!item) return;

    setFocusedIndex(index);
    selection.handleClickItem(index, event);
  };

  const handleContextMenuItem = (index: number, event: React.MouseEvent) => {
    event.preventDefault();

    const item = items[index];
    if (!item) return;

    setFocusedIndex(index);

    const targetItems = selection.selectedKeys.has(item.key)
      ? selection.selectedItems
      : [item];

    if (!selection.selectedKeys.has(item.key)) {
      selection.toggleSingle(index, true);
    }

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      items: targetItems,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  const toggleDetails = () => {
    setShowDetails((prevState) => !prevState);
  };

  const handleFilesDropped = (files: File[]) => {
    if (files.length === 0) return;

    const fileLabel = files.length === 1 ? "file" : "files";

    toast.promise(
      uploadFiles({
        files,
        parentFolderId: location,
      }),
      {
        loading: `Uploading ${files.length} ${fileLabel}`,
        success: `Uploaded ${files.length} ${fileLabel}`,
        error: `Failed to upload ${files.length} ${fileLabel}`,
        duration: 1500,
      },
    );
  };

  useExplorerKeyboardNavigation({
    items,
    focusedIndex: clampedFocusedIndex,
    selectedKeys: selection.selectedKeys,
    selectedItems: selection.selectedItems,
    lastSelectedIndex: selection.lastSelectedIndex,
    enabled: !fileViewer.isOpen && isExplorerKeyboardActive,
    setFocusedIndex,
    setSelectedKeys: selection.setSelectedKeys,
    setLastSelectedIndex: selection.setLastSelectedIndex,
    resetSelection: selection.resetSelection,
    openItem: handleOpenItem,
    renameItems: actions.renameItems,
    deleteItems: actions.deleteItems,
    downloadItems: actions.downloadItems,
  });

  return (
    <>
      <div className={styles.root} onClick={closeContextMenu}>
        <div className={styles.toolbar}>
          <ManipulationBar
            selectedItems={selection.selectedItems}
            isDownloading={actions.isDownloading}
            onDeselectAll={selection.resetSelection}
            onShowDetails={toggleDetails}
            onRename={actions.renameItems}
            onDownload={actions.downloadItems}
            onDelete={actions.deleteItems}
          />
        </div>
        <div className={styles.workspace}>
          <div className={styles.content}>
            <FileDropZone onFilesDropped={handleFilesDropped}>
              <ExplorerList
                items={items}
                selectedKeys={selection.selectedKeys}
                focusedIndex={clampedFocusedIndex}
                onFocusedIndex={setFocusedIndex}
                onKeyboardActiveChange={setIsExplorerKeyboardActive}
                onItemClick={handleClickItem}
                onItemOpen={handleOpenItem}
                onItemContextMenu={handleContextMenuItem}
                isLoading={isLoading}
                isError={isError}
              />
            </FileDropZone>
          </div>
          {showDetails && (
            <aside className={styles.detailsPanel} aria-label="Details">
              <DetailsView
                target={detailsTarget}
                onClose={() => setShowDetails(false)}
              />
            </aside>
          )}
        </div>
        {contextMenu && (
          <ExplorerContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            items={contextMenu.items}
            isDownloading={actions.isDownloading}
            onOpen={() => {
              closeContextMenu();
              const item = contextMenu.items[0];
              const itemIndex = items.findIndex(
                (candidate) => candidate.key === item?.key,
              );

              if (itemIndex >= 0) {
                handleOpenItem(itemIndex);
              }
            }}
            onRename={() => {
              closeContextMenu();
              void actions.renameItems(contextMenu.items);
            }}
            onDownload={() => {
              closeContextMenu();
              void actions.downloadItems(contextMenu.items);
            }}
            onDelete={() => {
              closeContextMenu();
              void actions.deleteItems(contextMenu.items);
            }}
            onDetails={() => {
              closeContextMenu();
              setShowDetails(true);
            }}
          />
        )}
      </div>
      {fileViewer.openedId !== null && (
        <FileViewer
          fileId={fileViewer.openedId}
          name={fileViewer.openedFile?.name}
          onClose={fileViewer.closeFile}
          navigation={{
            hasNext: fileViewer.hasNextFile,
            hasPrevious: fileViewer.hasPreviousFile,
            onNext: fileViewer.openNextFile,
            onPrevious: fileViewer.openPreviousFile,
          }}
          onDownload={
            fileViewer.openedFile
              ? () => {
                  void actions.downloadItems([fileViewer.openedFile!]);
                }
              : undefined
          }
          onDelete={
            fileViewer.openedFile
              ? () => {
                  const openedFile = fileViewer.openedFile;
                  if (!openedFile) return;

                  fileViewer.closeFile();
                  void actions.deleteItems([openedFile]);
                }
              : undefined
          }
        />
      )}
    </>
  );
}

type ExplorerContextMenuProps = {
  x: number;
  y: number;
  items: ExplorerItem[];
  isDownloading: boolean;
  onOpen: () => void;
  onRename: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onDetails: () => void;
};

function ExplorerContextMenu({
  x,
  y,
  items,
  isDownloading,
  onOpen,
  onRename,
  onDownload,
  onDelete,
  onDetails,
}: ExplorerContextMenuProps) {
  const canRename = items.length === 1;

  return (
    <div
      className={styles.contextMenu}
      style={{ left: x, top: y }}
      role="menu"
      onClick={(event) => event.stopPropagation()}
    >
      <button type="button" role="menuitem" onClick={onOpen}>
        <ExternalLinkIcon size={16} />
        <span>Open</span>
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={onRename}
        disabled={!canRename}
      >
        <FileEditIcon size={16} />
        <span>Rename</span>
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={onDownload}
        disabled={isDownloading}
      >
        <DownloadIcon size={16} />
        <span>Download</span>
      </button>
      <button type="button" role="menuitem" onClick={onDetails}>
        <InfoIcon size={16} />
        <span>Details</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className={styles.dangerMenuItem}
        onClick={onDelete}
      >
        <TrashIcon size={16} />
        <span>Delete</span>
      </button>
    </div>
  );
}
