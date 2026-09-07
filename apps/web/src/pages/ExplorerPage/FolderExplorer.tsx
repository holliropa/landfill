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
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ImageLabWorkspace } from "@/features/image-lab";
import { TextLabWorkspace } from "@/features/text-lab";
import styles from "./FolderExplorer.module.css";

const toolbarCommandIds = [
  "rename",
  "download",
  "move",
  "imageLab",
  "textLab",
  "moveToTrash",
  "details",
] as const;
const contextMenuCommandIds = [
  "open",
  "rename",
  "download",
  "move",
  "imageLab",
  "textLab",
  "details",
  "moveToTrash",
] as const;
const viewerCommandIds = [
  "imageLab",
  "textLab",
  "download",
  "moveToTrash",
] as const;
const detailsCommandIds = [
  "open",
  "rename",
  "download",
  "move",
  "imageLab",
  "textLab",
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
  const [imageLabFile, setImageLabFile] = useState<ExplorerItem | null>(null);
  const [textLabFile, setTextLabFile] = useState<ExplorerItem | null>(null);
  const [pendingSelectionKey, setPendingSelectionKey] = useState<string | null>(
    null,
  );
  const handledRequestRef = useRef<string | null>(null);
  const storage = useStorageItemActions({
    onAfterItemsChanged: controller.clearSelection,
  });
  const openFolder = useFolderNavigation();
  const commands = useMemo(
    () =>
      createStorageExplorerCommands({
        openFolder,
        openImageLab: setImageLabFile,
        openTextLab: setTextLabFile,
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
          onShowExported={(output) => {
            setPendingSelectionKey(`file:${output.id}`);
          }}
          onOpenExported={(output) => {
            controller.fileViewer.openFile(output.id);
          }}
        />
      )}

      {textLabFile && (
        <TextLabWorkspace
          key={textLabFile.id}
          file={textLabFile}
          onClose={() => setTextLabFile(null)}
          onSaved={() => {
            setPendingSelectionKey(`file:${textLabFile.id}`);
          }}
        />
      )}
    </div>
  );
}
