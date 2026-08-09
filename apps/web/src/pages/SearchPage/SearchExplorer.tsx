import {
  Explorer,
  type ExplorerItem,
  useExplorerController,
} from "@/features/explorer";
import {
  createStorageExplorerCommands,
  getStorageDetailsTarget,
  StorageDetailsView,
  useStorageItemActions,
} from "@/features/explorer/integrations/storage";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";
import { useId, useMemo } from "react";

const toolbarCommandIds = [
  "rename",
  "download",
  "moveToTrash",
  "details",
] as const;
const contextMenuCommandIds = [
  "open",
  "rename",
  "download",
  "details",
  "moveToTrash",
] as const;
const viewerCommandIds = ["download", "moveToTrash"] as const;
const detailsCommandIds = [
  "open",
  "rename",
  "download",
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
  const controller = useExplorerController({ items });
  const storage = useStorageItemActions({
    onAfterItemsChanged: controller.clearSelection,
  });
  const openFolder = useFolderNavigation();
  const commands = useMemo(
    () => createStorageExplorerCommands({ openFolder, storage }),
    [openFolder, storage],
  );
  const detailsTitleId = useId();

  return (
    <Explorer controller={controller} commands={commands}>
      <Explorer.KeyboardController />

      <Explorer.Shell>
        <Explorer.Toolbar>
          <Explorer.SelectionSummary />
          <Explorer.ActionGroup surface="toolbar" ids={toolbarCommandIds} />
        </Explorer.Toolbar>

        <Explorer.Workspace>
          <Explorer.Content>
            <Explorer.List
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
  );
}
