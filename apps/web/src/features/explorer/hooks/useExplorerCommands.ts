import { useCallback, type Dispatch } from "react";
import type { ExplorerAction } from "@/features/explorer/state";
import type { ExplorerItem } from "@/features/explorer/types";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";
import { useExplorerFileViewer } from "./useExplorerFileViewer";
import { useExplorerItemActions } from "./useExplorerItemActions";

type ExplorerCommandsParams = {
  items: ExplorerItem[];
  selectedItems: ExplorerItem[];
  dispatch: Dispatch<ExplorerAction>;
};

export function useExplorerCommands({
  items,
  selectedItems,
  dispatch,
}: ExplorerCommandsParams) {
  const openFolder = useFolderNavigation();
  const fileViewer = useExplorerFileViewer({ items });
  const itemActions = useExplorerItemActions({
    onAfterItemsChanged: () => dispatch({ type: "clear-selection" }),
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

  const restoreSelected = useCallback(() => {
    void itemActions.restoreItems(selectedItems);
  }, [itemActions, selectedItems]);

  const permanentlyDeleteSelected = useCallback(() => {
    void itemActions.permanentlyDeleteItems(selectedItems);
  }, [itemActions, selectedItems]);

  return {
    fileViewer,
    isDownloading: itemActions.isDownloading,
    isRestoring: itemActions.isRestoring,
    isPermanentlyDeleting: itemActions.isPermanentlyDeleting,
    openItem,
    renameItems: itemActions.renameItems,
    deleteItems: itemActions.deleteItems,
    restoreItems: itemActions.restoreItems,
    permanentlyDeleteItems: itemActions.permanentlyDeleteItems,
    downloadItems: itemActions.downloadItems,
    renameSelected,
    deleteSelected,
    downloadSelected,
    restoreSelected,
    permanentlyDeleteSelected,
  };
}
