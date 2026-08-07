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

  const clearSelection = useCallback(() => {
    explorer.dispatch({ type: "clear-selection" });
  }, [explorer]);

  const closeContextMenu = useCallback(() => {
    explorer.dispatch({ type: "close-context-menu" });
  }, [explorer]);

  const openDetails = useCallback(() => {
    explorer.dispatch({ type: "open-details" });
  }, [explorer]);

  const closeDetails = useCallback(() => {
    explorer.dispatch({ type: "close-details" });
  }, [explorer]);

  const toggleDetails = useCallback(() => {
    explorer.dispatch({ type: "toggle-details" });
  }, [explorer]);

  const openContextMenu = useCallback(
    (index: number, event: MouseEvent) => {
      event.preventDefault();

      const item = items[index];
      if (!item) return;

      const isSelected = explorer.state.selectedKeys.has(item.key);
      const itemKeys = isSelected
        ? explorer.selectedItems.map((selectedItem) => selectedItem.key)
        : [item.key];

      explorer.dispatch({
        type: "open-context-menu",
        x: event.clientX,
        y: event.clientY,
        itemKeys,
        focusIndex: index,
        replaceSelection: !isSelected,
      });
    },
    [explorer, items],
  );

  return {
    items,
    state: explorer.state,
    selectedItems: explorer.selectedItems,
    selectedCount: explorer.selectedCount,
    contextMenuItems: explorer.contextMenuItems,
    dispatch: explorer.dispatch,
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
