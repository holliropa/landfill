import type { ExplorerMode, SelectionItem } from "@/features/explorer/state";
import type { ExplorerItem } from "@/features/explorer/types";
import { isRootFolder } from "@/utils";

export type DetailsTarget =
  | { type: "none" }
  | { type: "folder"; id: string }
  | { type: "file"; id: string }
  | {
      type: "selection";
      items: SelectionItem[];
    };

export function getExplorerDetailsTarget({
  mode,
  folderId,
  selectedItems,
}: {
  mode: ExplorerMode;
  folderId?: string;
  selectedItems: ExplorerItem[];
}): DetailsTarget {
  if (selectedItems.length === 1) {
    const item = selectedItems[0];
    return { type: item.kind, id: item.id };
  }

  if (selectedItems.length > 1) {
    return {
      type: "selection",
      items: selectedItems.map((item) => ({
        id: item.id,
        kind: item.kind,
      })),
    };
  }

  if (mode === "folder" && folderId && !isRootFolder(folderId)) {
    return { type: "folder", id: folderId };
  }

  return { type: "none" };
}

