import type { Dispatch } from "react";
import { useExplorerKeyboardNavigation } from "@/features/explorer/hooks";
import type { ExplorerAction, ExplorerState } from "@/features/explorer/state";
import type { ExplorerItem } from "@/features/explorer/types";

type ExplorerKeyboardControllerProps = {
  enabled: boolean;
  items: ExplorerItem[];
  selectedItems: ExplorerItem[];
  state: ExplorerState;
  dispatch: Dispatch<ExplorerAction>;
  canOpenItems: boolean;
  canRename: boolean;
  canDelete: boolean;
  canDownload: boolean;
  onOpenItem: (index: number) => void;
  onRenameSelected: () => void;
  onDeleteSelected: () => void;
  onDownloadSelected: () => void;
};

export function ExplorerKeyboardController({
  enabled,
  items,
  selectedItems,
  state,
  dispatch,
  canOpenItems,
  canRename,
  canDelete,
  canDownload,
  onOpenItem,
  onRenameSelected,
  onDeleteSelected,
  onDownloadSelected,
}: ExplorerKeyboardControllerProps) {
  useExplorerKeyboardNavigation({
    enabled,
    canOpenItems,
    canRename,
    canDelete,
    canDownload,
    items,
    selectedItems,
    selectedCount: selectedItems.length,
    focusedIndex: state.focusedIndex,
    lastSelectedIndex: state.anchorIndex,
    focusItem: (index) => dispatch({ type: "focus", index }),
    selectItem: (index, mode = "replace") => {
      if (mode === "range") {
        dispatch({ type: "select-range", index });
        return;
      }

      dispatch({
        type: mode === "toggle" ? "toggle-select" : "select-one",
        index,
      });
    },
    selectAll: () => dispatch({ type: "select-all" }),
    resetSelection: () => dispatch({ type: "clear-selection" }),
    openItem: onOpenItem,
    renameSelected: onRenameSelected,
    deleteSelected: onDeleteSelected,
    downloadSelected: onDownloadSelected,
  });

  return null;
}
