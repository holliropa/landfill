import {
  Explorer,
  type ExplorerItem,
  useExplorerController,
  useExplorerSorting,
} from "@/features/explorer";
import {
  createStorageExplorerCommands,
  FolderUploadDropZone,
  getStorageDetailsTarget,
  StorageDetailsView,
  useStorageItemActions,
} from "@/features/explorer/integrations/storage";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";
import { useEffect, useId, useMemo, useRef } from "react";
import { useFileCapabilityIntegration } from "@/features/file-capabilities";
import styles from "./FolderExplorer.module.css";

const toolbarCommandIds = [
  "rename",
  "download",
  "move",
  "createArchive",
  "imageLab",
  "textLab",
  "archiveLab",
  "moveToTrash",
  "details",
] as const;
const contextMenuCommandIds = [
  "open",
  "rename",
  "download",
  "move",
  "createArchive",
  "imageLab",
  "textLab",
  "archiveLab",
  "details",
  "moveToTrash",
] as const;
const viewerCommandIds = [
  "imageLab",
  "textLab",
  "archiveLab",
  "download",
  "moveToTrash",
] as const;
const detailsCommandIds = [
  "open",
  "rename",
  "download",
  "move",
  "createArchive",
  "imageLab",
  "textLab",
  "archiveLab",
  "moveToTrash",
] as const;

export function FolderExplorer({
  items,
  folderId,
  isLoading = false,
  isError = false,
  requestedItemKey,
  requestedFileId,
}: {
  items: ExplorerItem[];
  folderId: string;
  isLoading?: boolean;
  isError?: boolean;
  requestedItemKey?: string;
  requestedFileId?: string;
}) {
  const { sortedItems, sort, changeSort } = useExplorerSorting(items);
  const controller = useExplorerController({ items: sortedItems });
  const handledRequestRef = useRef<string | null>(null);
  const storage = useStorageItemActions({
    onAfterItemsChanged: controller.clearSelection,
  });
  const openFolder = useFolderNavigation();
  const capabilities = useFileCapabilityIntegration();
  const commands = useMemo(
    () => [
      ...createStorageExplorerCommands({
        openFolder,
        openFile: capabilities.openFile,
        storage,
      }),
      ...capabilities.commands,
    ],
    [capabilities.commands, capabilities.openFile, openFolder, storage],
  );
  const detailsTitleId = useId();

  useEffect(() => {
    const requestedKey =
      requestedItemKey ??
      (requestedFileId ? `file:${requestedFileId}` : undefined);
    if (!requestedKey) return;
    const requestToken = `${requestedKey}:${requestedFileId ?? "reveal"}`;
    if (handledRequestRef.current === requestToken) return;

    const requestedIndex = sortedItems.findIndex(
      (item) => item.key === requestedKey,
    );
    if (requestedIndex < 0) return;

    handledRequestRef.current = requestToken;
    controller.dispatch({ type: "select-one", index: requestedIndex });
    if (requestedFileId) controller.fileViewer.openFile(requestedFileId);
  }, [controller, requestedFileId, requestedItemKey, sortedItems]);

  return (
    <div className={styles.root}>
      <div className={styles.explorer}>
        <Explorer controller={controller} commands={commands}>
          <Explorer.KeyboardController
            enabled={!capabilities.isWorkspaceOpen}
          />

          <Explorer.Shell>
            <Explorer.Toolbar>
              <Explorer.SelectionSummary />
              <Explorer.ActionGroup surface="toolbar" ids={toolbarCommandIds} />
            </Explorer.Toolbar>

            <Explorer.Workspace>
              <Explorer.Content>
                <FolderUploadDropZone folderId={folderId}>
                  <Explorer.List
                    ariaLabel="Folder contents"
                    emptyState={{
                      title: "This folder is empty",
                      description:
                        "Drop files here, or use the folder controls to upload files or create a folder.",
                    }}
                    errorState={{
                      title: "Could not load this folder",
                      description:
                        "Check that the API is running, then try again.",
                    }}
                    isLoading={isLoading}
                    isError={isError}
                    sort={sort}
                    onSortChange={changeSort}
                    onItemsDrop={(draggedItems, destination) => {
                      void storage.moveItemsToFolder(
                        draggedItems,
                        destination.id,
                      );
                    }}
                  />
                </FolderUploadDropZone>
              </Explorer.Content>

              <Explorer.DetailsPanel ariaLabelledBy={detailsTitleId}>
                {(runtime) => (
                  <StorageDetailsView
                    target={getStorageDetailsTarget({
                      folderId,
                      selectedItems: runtime.selectedItems,
                    })}
                    onClose={runtime.closeDetails}
                    titleId={detailsTitleId}
                    actions={
                      runtime.targetItems.length > 0 ? (
                        <Explorer.ActionGroup
                          surface="details"
                          ids={detailsCommandIds}
                          targetItems={runtime.targetItems}
                          size="small"
                        />
                      ) : undefined
                    }
                  />
                )}
              </Explorer.DetailsPanel>
            </Explorer.Workspace>

            <Explorer.ContextMenu ids={contextMenuCommandIds} />
          </Explorer.Shell>

          <Explorer.FileViewer actionIds={viewerCommandIds} />
        </Explorer>
      </div>
    </div>
  );
}
