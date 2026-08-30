import type { ExplorerItem } from "@/features/explorer/types";
import { useCallback, useEffect, useMemo, useState } from "react";

export type ExplorerSortKey = "name" | "date" | "size";
export type ExplorerSortDirection = "asc" | "desc";
export type ExplorerSort = {
  key: ExplorerSortKey;
  direction: ExplorerSortDirection;
};

const DEFAULT_SORT: ExplorerSort = { key: "name", direction: "asc" };
const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

export function useExplorerSorting(
  items: ExplorerItem[],
  storageKey = "landfill:explorer-sort",
) {
  const [sort, setSort] = useState<ExplorerSort>(() =>
    readStoredSort(storageKey),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(sort));
    } catch {
      // Sorting still works when browser storage is unavailable.
    }
  }, [sort, storageKey]);

  const changeSort = useCallback((key: ExplorerSortKey) => {
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const sortedItems = useMemo(() => {
    const direction = sort.direction === "asc" ? 1 : -1;

    return [...items].sort((left, right) => {
      // Keep folders grouped before files, as expected in a file browser.
      if (left.kind !== right.kind) return left.kind === "folder" ? -1 : 1;

      let comparison = 0;
      if (sort.key === "name") {
        comparison = collator.compare(left.name, right.name);
      } else if (sort.key === "date") {
        comparison = left.createdAt.getTime() - right.createdAt.getTime();
      } else {
        comparison = (left.size ?? 0) - (right.size ?? 0);
      }

      if (comparison !== 0) return comparison * direction;
      return collator.compare(left.name, right.name);
    });
  }, [items, sort]);

  return { sortedItems, sort, changeSort };
}

function readStoredSort(storageKey: string): ExplorerSort {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(storageKey) ?? "null",
    ) as Partial<ExplorerSort> | null;

    if (
      parsed &&
      (parsed.key === "name" ||
        parsed.key === "date" ||
        parsed.key === "size") &&
      (parsed.direction === "asc" || parsed.direction === "desc")
    ) {
      return { key: parsed.key, direction: parsed.direction };
    }
  } catch {
    // Ignore unavailable or malformed browser storage.
  }

  return DEFAULT_SORT;
}
