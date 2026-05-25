import type { ExplorerItem } from "@/components/Explorer";
import type { Dispatch, SetStateAction } from "react";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut.ts";

type ExplorerKeyboardNavigationParams = {
  items: ExplorerItem[];
  focusedIndex: number | null;
  selectedKeys: Set<string>;
  lastSelectedIndex: number | null;
  enabled?: boolean;

  setFocusedIndex: Dispatch<SetStateAction<number | null>>;
  setSelectedKeys: Dispatch<SetStateAction<Set<string>>>;
  setLastSelectedIndex: Dispatch<SetStateAction<number | null>>;

  resetSelection: () => void;
  openItem: (index: number) => void;
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

function selectRange(items: ExplorerItem[], from: number, to: number) {
  const selectedKeys = new Set<string>();
  const start = Math.min(from, to);
  const end = Math.max(from, to);

  for (let index = start; index <= end; index++) {
    selectedKeys.add(items[index].key);
  }

  return selectedKeys;
}

export function useExplorerKeyboardNavigation({
  items,
  focusedIndex,
  selectedKeys,
  lastSelectedIndex,
  enabled = true,
  setFocusedIndex,
  setSelectedKeys,
  setLastSelectedIndex,
  resetSelection,
  openItem,
}: ExplorerKeyboardNavigationParams) {
  const hasItems = items.length > 0;
  const singleItem = selectedKeys.size == 1;

  const moveFocus = (offset: number, extendSelection: boolean) => {
    const activeIndex = getActiveIndex(focusedIndex, items.length);
    if (activeIndex === null) return;

    const nextIndex = clampIndex(activeIndex + offset, items.length);
    setFocusedIndex(nextIndex);

    if (extendSelection) {
      const rangeStart = lastSelectedIndex ?? activeIndex;
      setSelectedKeys(selectRange(items, rangeStart, nextIndex));
      return;
    } else {
      setSelectedKeys(new Set([items[nextIndex].key]));
    }

    setLastSelectedIndex(nextIndex);
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
      const activeIndex = getActiveIndex(focusedIndex, items.length);
      if (activeIndex === null) return;

      setFocusedIndex(0);

      if (event.shiftKey) {
        setSelectedKeys(
          selectRange(items, lastSelectedIndex ?? activeIndex, 0),
        );
      } else {
        setLastSelectedIndex(0);
      }
    },
    {
      enabled: enabled && hasItems,
    },
  );

  useKeyboardShortcut(
    "End",
    (event) => {
      const activeIndex = getActiveIndex(focusedIndex, items.length);
      if (activeIndex === null) return;

      const lastIndex = items.length - 1;
      setFocusedIndex(lastIndex);

      if (event.shiftKey) {
        setSelectedKeys(
          selectRange(items, lastSelectedIndex ?? activeIndex, lastIndex),
        );
      } else {
        setLastSelectedIndex(lastIndex);
      }
    },
    { enabled: enabled && hasItems },
  );

  useKeyboardShortcut(
    "Enter",
    () => {
      const activeIndex = getActiveIndex(focusedIndex, items.length);
      console.log(`Opening item at index: ${activeIndex}`);
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

      const item = items[activeIndex];

      setSelectedKeys((previousSelectedKeys) => {
        const nextSelectedKeys = new Set(previousSelectedKeys);

        if (nextSelectedKeys.has(item.key)) {
          nextSelectedKeys.delete(item.key);
        } else {
          nextSelectedKeys.add(item.key);
        }

        return nextSelectedKeys;
      });

      setLastSelectedIndex(activeIndex);
    },
    {
      enabled: enabled && hasItems,
    },
  );

  useKeyboardShortcut(
    "a",
    () => {
      setSelectedKeys(new Set(items.map((item) => item.key)));
      setLastSelectedIndex(focusedIndex);
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
      enabled: enabled && selectedKeys.size > 0,
    },
  );
}
