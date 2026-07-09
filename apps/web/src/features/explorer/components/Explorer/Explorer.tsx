import { FileDropZone } from "@/components/FileDropZone";
import { FileViewer } from "@/components/FileViewer";
import { getExplorerDetailsTarget } from "@/features/explorer/details";
import { useExplorerCommands } from "@/features/explorer/hooks";
import { explorerModeConfigs } from "@/features/explorer/modes";
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
  const modeConfig = explorerModeConfigs[mode];
  const actions = modeConfig.actions;
  const explorer = useExplorerState({ items, mode, folderId });
  const commands = useExplorerCommands({
    items,
    selectedItems: explorer.selectedItems,
    dispatch: explorer.dispatch,
  });
  const {
    fileViewer,
    isDownloading,
    isRestoring,
    isPermanentlyDeleting,
    openItem,
    renameItems,
    deleteItems,
    restoreItems,
    permanentlyDeleteItems,
    downloadItems,
    renameSelected,
    deleteSelected,
    downloadSelected,
    permanentlyDeleteSelected,
  } = commands;

  const detailsTarget = getExplorerDetailsTarget({
    mode,
    folderId,
    selectedItems: explorer.selectedItems,
  });

  const closeContextMenu = useCallback(() => {
    explorer.dispatch({ type: "close-context-menu" });
  }, [explorer]);

  const handleOpenItem = useCallback(
    (index: number) => {
      if (!actions.open) return;

      openItem(index);
    },
    [actions.open, openItem],
  );

  const handleDeleteSelected = useCallback(() => {
    if (actions.delete) {
      deleteSelected();
      return;
    }

    if (actions.permanentlyDelete) {
      permanentlyDeleteSelected();
    }
  }, [
    actions.delete,
    actions.permanentlyDelete,
    deleteSelected,
    permanentlyDeleteSelected,
  ]);

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
        enabled={explorer.state.isKeyboardActive && !fileViewer.isOpen}
        items={items}
        selectedItems={explorer.selectedItems}
        state={explorer.state}
        dispatch={explorer.dispatch}
        canOpenItems={actions.open}
        canRename={actions.rename}
        canDelete={actions.delete || actions.permanentlyDelete}
        canDownload={actions.download}
        onOpenItem={handleOpenItem}
        onRenameSelected={renameSelected}
        onDeleteSelected={handleDeleteSelected}
        onDownloadSelected={downloadSelected}
      />

      <div className={styles.root} onClick={closeContextMenu}>
        <div className={styles.toolbar}>
          <ManipulationBar
            selectedItems={explorer.selectedItems}
            actions={actions}
            isDownloading={isDownloading}
            isRestoring={isRestoring}
            isPermanentlyDeleting={isPermanentlyDeleting}
            onClearSelection={() =>
              explorer.dispatch({ type: "clear-selection" })
            }
            onRenameItems={(selectedItems) => {
              void renameItems(selectedItems);
            }}
            onDownloadItems={(selectedItems) => {
              void downloadItems(selectedItems);
            }}
            onDeleteItems={(selectedItems) => {
              void deleteItems(selectedItems);
            }}
            onRestoreItems={(selectedItems) => {
              void restoreItems(selectedItems);
            }}
            onPermanentlyDeleteItems={(selectedItems) => {
              void permanentlyDeleteItems(selectedItems);
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
                onItemOpen={handleOpenItem}
                onItemContextMenu={handleContextMenuItem}
                canOpenItems={actions.open}
                ariaLabel={modeConfig.copy.ariaLabel}
                emptyState={{
                  title: modeConfig.copy.emptyTitle,
                  description: modeConfig.copy.emptyDescription,
                }}
                errorState={{
                  title: modeConfig.copy.errorTitle,
                  description: modeConfig.copy.errorDescription,
                }}
                isLoading={isLoading}
                isError={isError}
              />
            </ExplorerDropZone>
          </div>

          {actions.details && explorer.state.isDetailsOpen && (
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
            actions={actions}
            isDownloading={isDownloading}
            isRestoring={isRestoring}
            isPermanentlyDeleting={isPermanentlyDeleting}
            onOpen={() => {
              closeContextMenu();

              const item = explorer.contextMenuItems[0];
              const itemIndex = items.findIndex(
                (candidate) => candidate.key === item?.key,
              );

              if (itemIndex >= 0) {
                handleOpenItem(itemIndex);
              }
            }}
            onRenameItem={(item) => {
              closeContextMenu();
              void renameItems([item]);
            }}
            onDownloadItems={(itemsToDownload) => {
              closeContextMenu();
              void downloadItems(itemsToDownload);
            }}
            onDeleteItems={(itemsToDelete) => {
              closeContextMenu();
              void deleteItems(itemsToDelete);
            }}
            onRestoreItems={(itemsToRestore) => {
              closeContextMenu();
              void restoreItems(itemsToRestore);
            }}
            onPermanentlyDeleteItems={(itemsToDelete) => {
              closeContextMenu();
              void permanentlyDeleteItems(itemsToDelete);
            }}
            onDetails={() => {
              closeContextMenu();
              explorer.dispatch({ type: "open-details" });
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
            actions.download && fileViewer.openedFile
              ? () => {
                  void downloadItems([fileViewer.openedFile!]);
                }
              : undefined
          }
          onDelete={
            actions.delete && fileViewer.openedFile
              ? () => {
                  const openedFile = fileViewer.openedFile;
                  if (!openedFile) return;

                  fileViewer.closeFile();
                  void deleteItems([openedFile]);
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
