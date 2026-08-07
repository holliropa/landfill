import {
  Explorer,
  type ExplorerItem,
  useExplorerController,
} from "@/features/explorer";
import {
  createTrashExplorerCommands,
  useStorageItemActions,
} from "@/features/explorer/integrations/storage";

const trashCommandIds = ["restore", "deleteForever"] as const;

export function TrashExplorer({
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
  const commands = createTrashExplorerCommands(storage);

  return (
    <Explorer controller={controller} commands={commands}>
      <Explorer.KeyboardController />

      <Explorer.Shell>
        <Explorer.Toolbar>
          <Explorer.SelectionSummary />
          <Explorer.ActionGroup surface="toolbar" ids={trashCommandIds} />
        </Explorer.Toolbar>

        <Explorer.Workspace>
          <Explorer.Content>
            <Explorer.List
              ariaLabel="Trash contents"
              emptyState={{
                title: "Trash is empty",
                description: "Deleted files and folders will appear here.",
              }}
              errorState={{
                title: "Could not load trash",
                description: "Check that the API is running, then try again.",
              }}
              isLoading={isLoading}
              isError={isError}
            />
          </Explorer.Content>
        </Explorer.Workspace>

        <Explorer.ContextMenu ids={trashCommandIds} />
      </Explorer.Shell>
    </Explorer>
  );
}
