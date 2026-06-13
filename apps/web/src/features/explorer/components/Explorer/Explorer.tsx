import { FileDropZone } from "@/components/FileDropZone";
import { FileViewer } from "@/components/FileViewer";
import { getExplorerDetailsTarget } from "@/features/explorer/details";
import { useExplorerCommands } from "@/features/explorer/hooks";
import type { ExplorerMode } from "@/features/explorer/state";
import { useExplorerState } from "@/features/explorer/state";
import type { ExplorerItem } from "@/features/explorer/types";
import { useUploadFiles } from "@/lib/client";
import { type MouseEvent, type ReactNode, useCallback } from "react";
import { toast } from "sonner";
import { ContextMenu } from "../ContextMenu";
import { DetailsView } from "../DetailsView";
import { ExplorerList } from "../ExplorerList";
import { ManipulationBar } from "../ManipulationBar";
import { ExplorerKeyboardController } from "./ExplorerKeyboardController";
import styles from "./Explorer.module.css";

type ExplorerProps = {
  items: ExplorerItem[];
  mode: ExplorerMode;
  folderId?: string;
  isLoading?: boolean;
  isError?: boolean;
};

export function Explorer({
  items = [],
  mode,
  folderId,
  isLoading = false,
  isError = false,
}: ExplorerProps) {
  const explorer = useExplorerState({ items, mode, folderId });
  const commands = useExplorerCommands({
    items,
    selectedItems: explorer.selectedItems,
    folderId,
    dispatch: explorer.dispatch,
  });

  const detailsTarget = getExplorerDetailsTarget({
    mode,
    folderId,
    selectedItems: explorer.selectedItems,
  });

  const closeContextMenu = useCallback(() => {
    explorer.dispatch({ type: "close-context-menu" });
  }, [explorer]);

  const handleContextMenuItem = useCallback(
    (index: number, event: MouseEvent) => {
      event.preventDefault();

      const item = items[index];
      if (!item) return;

      const itemKeys = explorer.state.selectedKeys.has(item.key)
        ? explorer.selectedItems.map((selectedItem) => selectedItem.key)
        : [item.key];

      explorer.dispatch({
        type: "open-context-menu",
        x: event.clientX,
        y: event.clientY,
        itemKeys,
        focusIndex: index,
        replaceSelection: !explorer.state.selectedKeys.has(item.key),
      });
    },
    [explorer, items],
  );

  return (
    <>
      <ExplorerKeyboardController
        enabled={explorer.state.isKeyboardActive && !commands.fileViewer.isOpen}
        items={items}
        selectedItems={explorer.selectedItems}
        state={explorer.state}
        dispatch={explorer.dispatch}
        onOpenItem={commands.openItem}
        onRenameSelected={commands.renameSelected}
        onDeleteSelected={commands.deleteSelected}
        onDownloadSelected={commands.downloadSelected}
      />

      <div className={styles.root} onClick={closeContextMenu}>
        <div className={styles.toolbar}>
          <ManipulationBar
            selectedItems={explorer.selectedItems}
            isDownloading={commands.isDownloading}
            onClearSelection={() =>
              explorer.dispatch({ type: "clear-selection" })
            }
            onRenameItems={(selectedItems) => {
              void commands.renameItems(selectedItems);
            }}
            onDownloadItems={(selectedItems) => {
              void commands.downloadItems(selectedItems);
            }}
            onDeleteItems={(selectedItems) => {
              void commands.deleteItems(selectedItems);
            }}
            onShowDetails={() => explorer.dispatch({ type: "toggle-details" })}
          />
        </div>

        <div className={styles.workspace}>
          <div className={styles.content}>
            <ExplorerDropZone mode={mode} folderId={folderId}>
              <ExplorerList
                items={items}
                state={explorer.state}
                dispatch={explorer.dispatch}
                onItemOpen={commands.openItem}
                onItemContextMenu={handleContextMenuItem}
                isLoading={isLoading}
                isError={isError}
              />
            </ExplorerDropZone>
          </div>

          {explorer.state.isDetailsOpen && (
            <aside className={styles.detailsPanel} aria-label="Details">
              <DetailsView
                target={detailsTarget}
                onClose={() => explorer.dispatch({ type: "close-details" })}
              />
            </aside>
          )}
        </div>

        {explorer.state.contextMenu && (
          <ContextMenu
            x={explorer.state.contextMenu.x}
            y={explorer.state.contextMenu.y}
            items={explorer.contextMenuItems}
            isDownloading={commands.isDownloading}
            onOpen={() => {
              closeContextMenu();

              const item = explorer.contextMenuItems[0];
              const itemIndex = items.findIndex(
                (candidate) => candidate.key === item?.key,
              );

              if (itemIndex >= 0) {
                commands.openItem(itemIndex);
              }
            }}
            onRenameItem={(item) => {
              closeContextMenu();
              void commands.renameItems([item]);
            }}
            onDownloadItems={(itemsToDownload) => {
              closeContextMenu();
              void commands.downloadItems(itemsToDownload);
            }}
            onDeleteItems={(itemsToDelete) => {
              closeContextMenu();
              void commands.deleteItems(itemsToDelete);
            }}
            onDetails={() => {
              closeContextMenu();
              explorer.dispatch({ type: "open-details" });
            }}
          />
        )}
      </div>

      {commands.fileViewer.openedId !== null && (
        <FileViewer
          fileId={commands.fileViewer.openedId}
          name={commands.fileViewer.openedFile?.name}
          onClose={commands.fileViewer.closeFile}
          navigation={{
            hasNext: commands.fileViewer.hasNextFile,
            hasPrevious: commands.fileViewer.hasPreviousFile,
            onNext: commands.fileViewer.openNextFile,
            onPrevious: commands.fileViewer.openPreviousFile,
          }}
          onDownload={
            commands.fileViewer.openedFile
              ? () => {
                  void commands.downloadItems([commands.fileViewer.openedFile!]);
                }
              : undefined
          }
          onDelete={
            commands.fileViewer.openedFile
              ? () => {
                  const openedFile = commands.fileViewer.openedFile;
                  if (!openedFile) return;

                  commands.fileViewer.closeFile();
                  void commands.deleteItems([openedFile]);
                }
              : undefined
          }
        />
      )}
    </>
  );
}

function ExplorerDropZone({
  mode,
  folderId,
  children,
}: {
  mode: ExplorerMode;
  folderId?: string;
  children: ReactNode;
}) {
  const { mutateAsync: uploadFiles } = useUploadFiles();

  if (mode !== "folder" || !folderId) {
    return <>{children}</>;
  }

  return (
    <FileDropZone
      onFilesDropped={(files) => {
        if (files.length === 0) return;

        const fileLabel = files.length === 1 ? "file" : "files";

        toast.promise(
          uploadFiles({
            files,
            parentFolderId: folderId,
          }),
          {
            loading: `Uploading ${files.length} ${fileLabel}`,
            success: `Uploaded ${files.length} ${fileLabel}`,
            error: `Failed to upload ${files.length} ${fileLabel}`,
            duration: 1500,
          },
        );
      }}
    >
      {children}
    </FileDropZone>
  );
}
