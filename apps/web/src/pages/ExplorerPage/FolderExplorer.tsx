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
import { useEffect, useId, useMemo, useState } from "react";
import { ImageLabWorkspace } from "@/features/image-lab";
import styles from "./FolderExplorer.module.css";

const toolbarCommandIds = [
  "rename",
  "download",
  "move",
  "imageLab",
  "moveToTrash",
  "details",
] as const;
const contextMenuCommandIds = [
  "open",
  "rename",
  "download",
  "move",
  "imageLab",
  "details",
  "moveToTrash",
] as const;
const viewerCommandIds = ["download", "moveToTrash"] as const;
const detailsCommandIds = [
  "open",
  "rename",
  "download",
  "move",
  "imageLab",
  "moveToTrash",
] as const;

export function FolderExplorer({
  items,
  folderId,
  isLoading = false,
  isError = false,
}: {
  items: ExplorerItem[];
  folderId: string;
  isLoading?: boolean;
  isError?: boolean;
}) {
  const { sortedItems, sort, changeSort } = useExplorerSorting(items);
  const controller = useExplorerController({ items: sortedItems });
  const [imageLabFile, setImageLabFile] = useState<ExplorerItem | null>(null);
  const [pendingSelectionKey, setPendingSelectionKey] = useState<string | null>(
    null,
  );
  const storage = useStorageItemActions({
    onAfterItemsChanged: controller.clearSelection,
  });
  const openFolder = useFolderNavigation();
  const commands = useMemo(
    () =>
      createStorageExplorerCommands({
        openFolder,
        openImageLab: setImageLabFile,
        storage,
      }),
    [openFolder, storage],
  );
  const detailsTitleId = useId();

  useEffect(() => {
    if (!pendingSelectionKey) return;
    const outputIndex = sortedItems.findIndex(
      (item) => item.key === pendingSelectionKey,
    );
    if (outputIndex < 0) return;

    controller.dispatch({ type: "select-one", index: outputIndex });
    const timeoutId = window.setTimeout(() => setPendingSelectionKey(null), 0);
    return () => window.clearTimeout(timeoutId);
  }, [controller, pendingSelectionKey, sortedItems]);

  return (
    <div className={styles.root}>
      <div className={styles.explorer}>
        <Explorer controller={controller} commands={commands}>
          <Explorer.KeyboardController enabled={!imageLabFile} />

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

      {imageLabFile && (
        <ImageLabWorkspace
          key={imageLabFile.id}
          file={imageLabFile}
          onClose={() => setImageLabFile(null)}
          onExported={(output) => {
            setPendingSelectionKey(`file:${output.id}`);
          }}
        />
      )}
    </div>
  );
}
