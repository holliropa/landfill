import { useCallback, type Dispatch } from "react";
import type { ExplorerAction } from "@/features/explorer/state";
import type { ExplorerItem } from "@/features/explorer/types";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";
import { useExplorerFileViewer } from "./useExplorerFileViewer";
import { useExplorerItemActions } from "./useExplorerItemActions";

type ExplorerCommandsParams = {
  items: ExplorerItem[];
  selectedItems: ExplorerItem[];
  folderId?: string;
  dispatch: Dispatch<ExplorerAction>;
};

export function useExplorerCommands({
  items,
  selectedItems,
  folderId,
  dispatch,
}: ExplorerCommandsParams) {
  const openFolder = useFolderNavigation();
  const fileViewer = useExplorerFileViewer({ items });
  const itemActions = useExplorerItemActions({
    folderId,
    onAfterDelete: () => dispatch({ type: "clear-selection" }),
  });

  const openItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item) return;

      if (item.kind === "folder") {
        openFolder(item);
        dispatch({ type: "clear-selection" });
        return;
      }

      fileViewer.openFile(item.id);
    },
    [dispatch, fileViewer, items, openFolder],
  );

  const renameSelected = useCallback(() => {
    void itemActions.renameItems(selectedItems);
  }, [itemActions, selectedItems]);

  const deleteSelected = useCallback(() => {
    void itemActions.deleteItems(selectedItems);
  }, [itemActions, selectedItems]);

  const downloadSelected = useCallback(() => {
    void itemActions.downloadItems(selectedItems);
  }, [itemActions, selectedItems]);

  return {
    fileViewer,
    isDownloading: itemActions.isDownloading,
    openItem,
    renameItems: itemActions.renameItems,
    deleteItems: itemActions.deleteItems,
    downloadItems: itemActions.downloadItems,
    renameSelected,
    deleteSelected,
    downloadSelected,
  };
}
