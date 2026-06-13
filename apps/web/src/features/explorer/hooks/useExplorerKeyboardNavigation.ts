import type { ExplorerSelectionMode } from "@/features/explorer/state";
import type { ExplorerItem } from "@/features/explorer/types";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut.ts";

type ExplorerKeyboardNavigationParams = {
  items: ExplorerItem[];
  selectedItems: ExplorerItem[];
  selectedCount: number;
  focusedIndex: number | null;
  lastSelectedIndex: number | null;
  enabled?: boolean;

  focusItem: (index: number | null) => void;
  selectItem: (index: number, mode?: ExplorerSelectionMode) => void;
  selectAll: () => void;
  resetSelection: () => void;
  openItem: (index: number) => void;
  renameSelected: () => void;
  deleteSelected: () => void;
  downloadSelected: () => void;
};

function clampIndex(index: number, itemsLength: number) {
  return Math.max(0, Math.min(index, itemsLength - 1));
}

function getActiveIndex(focusedIndex: number | null, itemsLength: number) {
  if (itemsLength === 0) {
    return null;
  }

  return focusedIndex === null ? 0 : clampIndex(focusedIndex, itemsLength);
}

export function useExplorerKeyboardNavigation({
  items,
  selectedItems,
  selectedCount,
  focusedIndex,
  lastSelectedIndex,
  enabled = true,
  focusItem,
  selectItem,
  selectAll,
  resetSelection,
  openItem,
  renameSelected,
  deleteSelected,
  downloadSelected,
}: ExplorerKeyboardNavigationParams) {
  const hasItems = items.length > 0;
  const singleItem = selectedCount === 1;

  const moveFocus = (offset: number, extendSelection: boolean) => {
    const activeIndex = getActiveIndex(focusedIndex, items.length);
    if (activeIndex === null) return;

    const nextIndex = clampIndex(activeIndex + offset, items.length);
    focusItem(nextIndex);

    if (extendSelection) {
      if (lastSelectedIndex === null) {
        selectItem(activeIndex);
      }

      selectItem(nextIndex, "range");
      return;
    }

    selectItem(nextIndex);
  };

  const moveToEdge = (index: number, extendSelection: boolean) => {
    const activeIndex = getActiveIndex(focusedIndex, items.length);
    if (activeIndex === null) return;

    focusItem(index);

    if (extendSelection) {
      if (lastSelectedIndex === null) {
        selectItem(activeIndex);
      }

      selectItem(index, "range");
      return;
    }

    selectItem(index);
  };

  useKeyboardShortcut(
    "ArrowUp",
    (event) => {
      moveFocus(-1, event.shiftKey);
    },
    {
      enabled: enabled && hasItems,
    },
  );

  useKeyboardShortcut(
    "ArrowDown",
    (event) => {
      moveFocus(1, event.shiftKey);
    },
    {
      enabled: enabled && hasItems,
    },
  );

  useKeyboardShortcut(
    "Home",
    (event) => {
      moveToEdge(0, event.shiftKey);
    },
    {
      enabled: enabled && hasItems,
    },
  );

  useKeyboardShortcut(
    "End",
    (event) => {
      moveToEdge(items.length - 1, event.shiftKey);
    },
    { enabled: enabled && hasItems },
  );

  useKeyboardShortcut(
    "Enter",
    () => {
      const activeIndex = getActiveIndex(focusedIndex, items.length);
      if (activeIndex === null) return;

      openItem(activeIndex);
    },
    { enabled: enabled && singleItem },
  );

  useKeyboardShortcut(
    " ",
    () => {
      const activeIndex = getActiveIndex(focusedIndex, items.length);
      if (activeIndex === null) return;

      selectItem(activeIndex, "toggle");
    },
    {
      enabled: enabled && hasItems,
    },
  );

  useKeyboardShortcut(
    "a",
    () => {
      selectAll();
    },
    {
      ctrlKey: true,
      enabled: enabled && hasItems,
    },
  );

  useKeyboardShortcut(
    "Escape",
    () => {
      resetSelection();
    },
    {
      enabled: enabled && selectedCount > 0,
    },
  );

  useKeyboardShortcut(
    "F2",
    () => {
      renameSelected();
    },
    {
      enabled: enabled && selectedItems.length === 1,
    },
  );

  useKeyboardShortcut(
    "Delete",
    () => {
      deleteSelected();
    },
    {
      enabled: enabled && selectedItems.length > 0,
    },
  );

  useKeyboardShortcut(
    "d",
    () => {
      downloadSelected();
    },
    {
      ctrlKey: true,
      enabled: enabled && selectedItems.length > 0,
    },
  );
}
