import { useExplorerFileViewer } from "@/features/explorer/hooks";
import { useExplorerState } from "@/features/explorer/state";
import type { ExplorerItem } from "@/features/explorer/types";
import { type MouseEvent, useCallback } from "react";

export type ExplorerControllerParams = {
  items: ExplorerItem[];
};

export function useExplorerController({ items }: ExplorerControllerParams) {
  const explorer = useExplorerState({ items });
  const fileViewer = useExplorerFileViewer({ items });
  const { dispatch } = explorer;

  const clearSelection = useCallback(() => {
    dispatch({ type: "clear-selection" });
  }, [dispatch]);

  const closeContextMenu = useCallback(() => {
    dispatch({ type: "close-context-menu" });
  }, [dispatch]);

  const openDetails = useCallback(() => {
    dispatch({ type: "open-details" });
  }, [dispatch]);

  const closeDetails = useCallback(() => {
    dispatch({ type: "close-details" });
  }, [dispatch]);

  const toggleDetails = useCallback(() => {
    dispatch({ type: "toggle-details" });
  }, [dispatch]);

  const openContextMenu = useCallback(
    (index: number, event: MouseEvent) => {
      event.preventDefault();

      const item = items[index];
      if (!item) return;

      const isSelected = explorer.state.selectedKeys.has(item.key);
      const itemKeys = isSelected
        ? explorer.selectedItems.map((selectedItem) => selectedItem.key)
        : [item.key];

      dispatch({
        type: "open-context-menu",
        x: event.clientX,
        y: event.clientY,
        itemKeys,
        focusIndex: index,
        replaceSelection: !isSelected,
      });
    },
    [dispatch, explorer.selectedItems, explorer.state.selectedKeys, items],
  );

  return {
    items,
    state: explorer.state,
    selectedItems: explorer.selectedItems,
    selectedCount: explorer.selectedCount,
    contextMenuItems: explorer.contextMenuItems,
    dispatch,
    fileViewer,
    clearSelection,
    closeContextMenu,
    openContextMenu,
    openDetails,
    closeDetails,
    toggleDetails,
  };
}

export type ExplorerController = ReturnType<typeof useExplorerController>;
