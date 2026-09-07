import {
  Explorer,
  searchExplorerListColumns,
  type ExplorerItem,
  useExplorerController,
  useExplorerSorting,
} from "@/features/explorer";
import {
  createStorageExplorerCommands,
  getStorageDetailsTarget,
  StorageDetailsView,
  useStorageItemActions,
} from "@/features/explorer/integrations/storage";
import { ImageLabWorkspace } from "@/features/image-lab";
import { TextLabWorkspace } from "@/features/text-lab";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";
import { useId, useMemo, useState } from "react";

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

export function SearchExplorer({
  items,
  isLoading = false,
  isError = false,
}: {
  items: ExplorerItem[];
  isLoading?: boolean;
  isError?: boolean;
}) {
  const { sortedItems, sort, changeSort } = useExplorerSorting(items);
  const controller = useExplorerController({ items: sortedItems });
  const [imageLabFile, setImageLabFile] = useState<ExplorerItem | null>(null);
  const [textLabFile, setTextLabFile] = useState<ExplorerItem | null>(null);
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

  return (
    <>
      <Explorer controller={controller} commands={commands}>
        <Explorer.KeyboardController enabled={!imageLabFile} />

        <Explorer.Shell>
          <Explorer.Toolbar>
            <Explorer.SelectionSummary />
            <Explorer.ActionGroup surface="toolbar" ids={toolbarCommandIds} />
          </Explorer.Toolbar>

          <Explorer.Workspace>
            <Explorer.Content>
              <Explorer.List
                columns={searchExplorerListColumns}
                ariaLabel="Search results"
                emptyState={{
                  title: "No results found",
                  description: "Try another search term.",
                }}
                errorState={{
                  title: "Could not load search results",
                  description: "Check that the API is running, then try again.",
                }}
                isLoading={isLoading}
                isError={isError}
                sort={sort}
                onSortChange={changeSort}
                onItemsDrop={(draggedItems, destination) => {
                  void storage.moveItemsToFolder(draggedItems, destination.id);
                }}
              />
            </Explorer.Content>

            <Explorer.DetailsPanel ariaLabelledBy={detailsTitleId}>
              {(runtime) => (
                <StorageDetailsView
                  target={getStorageDetailsTarget({
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

      {imageLabFile && (
        <ImageLabWorkspace
          key={imageLabFile.id}
          file={imageLabFile}
          onClose={() => setImageLabFile(null)}
          onShowExported={(output) => {
            openFolder({
              id: output.folderId ?? "root",
              revealItemKey: `file:${output.id}`,
            });
          }}
          onOpenExported={(output) => {
            openFolder({
              id: output.folderId ?? "root",
              openFileId: output.id,
            });
          }}
        />
      )}

      {textLabFile && (
        <TextLabWorkspace
          key={textLabFile.id}
          file={textLabFile}
          onClose={() => setTextLabFile(null)}
          onSaved={() => {
            openFolder({
              id: textLabFile.location?.id ?? "root",
              revealItemKey: `file:${textLabFile.id}`,
            });
          }}
        />
      )}
    </>
  );
}
