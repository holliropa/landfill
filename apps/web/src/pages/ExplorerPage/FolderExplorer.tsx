import {
  Explorer,
  type ExplorerItem,
  useExplorerController,
} from "@/features/explorer";
import {
  createStorageExplorerCommands,
  FolderUploadDropZone,
  getStorageDetailsTarget,
  StorageDetailsView,
  useStorageItemActions,
} from "@/features/explorer/integrations/storage";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";

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
  const controller = useExplorerController({ items });
  const storage = useStorageItemActions({
    onAfterItemsChanged: controller.clearSelection,
  });
  const openFolder = useFolderNavigation();
  const commands = createStorageExplorerCommands({ openFolder, storage });

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
            <FolderUploadDropZone folderId={folderId}>
              <Explorer.List
                ariaLabel="Folder contents"
                emptyState={{
                  title: "This folder is empty",
                  description:
                    "Use the toolbar above to upload files or create a folder.",
                }}
                errorState={{
                  title: "Could not load this folder",
                  description: "Check that the API is running, then try again.",
                }}
                isLoading={isLoading}
                isError={isError}
              />
            </FolderUploadDropZone>
          </Explorer.Content>

          <Explorer.DetailsPanel>
            {(runtime) => (
              <StorageDetailsView
                target={getStorageDetailsTarget({
                  folderId,
                  selectedItems: runtime.selectedItems,
                })}
                onClose={runtime.closeDetails}
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
