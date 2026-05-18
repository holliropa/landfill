import type { ExplorerItem } from "@/components/Explorer";
import React, { useMemo, useState } from "react";

type ExplorerSelectionParams = {
  items: ExplorerItem[];
};

export function useExplorerSelection({ items }: ExplorerSelectionParams) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null,
  );

  const selectedItems = useMemo(
    () => items.filter((item) => selectedKeys.has(item.key)),
    [items, selectedKeys],
  );

  const resetSelection = () => {
    setSelectedKeys(new Set());
    setLastSelectedIndex(null);
  };

  const selectRange = (from: number, to: number) => {
    const start = Math.min(from, to);
    const end = Math.max(from, to);
    const nextSelectedKeys = new Set<string>();

    for (let index = start; index <= end; index++) {
      const item = items[index];

      if (item) {
        nextSelectedKeys.add(item.key);
      }
    }

    setSelectedKeys(nextSelectedKeys);

    if (from === to) {
      setLastSelectedIndex(from);
    }
  };

  const toggleSingle = (index: number, deselectRest: boolean) => {
    setSelectedKeys((previousSelectedKeys) => {
      const item = items[index];

      if (!item) {
        return previousSelectedKeys;
      }

      const nextSelectedKeys = new Set(previousSelectedKeys);

      if (deselectRest) {
        nextSelectedKeys.clear();
        nextSelectedKeys.add(item.key);
      } else if (nextSelectedKeys.has(item.key)) {
        nextSelectedKeys.delete(item.key);
      } else {
        nextSelectedKeys.add(item.key);
      }

      return nextSelectedKeys;
    });

    setLastSelectedIndex(index);
  };

  const handleClickItem = (index: number, event: React.MouseEvent) => {
    const item = items[index];

    if (!item) {
      return;
    }

    if (event.shiftKey) {
      const startIndex = lastSelectedIndex ?? index;
      selectRange(startIndex, index);
      return;
    }

    toggleSingle(index, !event.ctrlKey && !event.metaKey);
  };

  const selectAll = () => {
    setSelectedKeys(new Set(items.map((item) => item.key)));
    setLastSelectedIndex(null);
  };

  const toggleSelectionAtIndex = (index: number) => {
    toggleSingle(index, false);
  };

  return {
    selectedKeys,
    selectedItems,
    lastSelectedIndex,

    setSelectedKeys,
    setLastSelectedIndex,

    resetSelection,
    selectRange,
    selectAll,
    toggleSingle,
    toggleSelectionAtIndex,
    handleClickItem,
  };
}
