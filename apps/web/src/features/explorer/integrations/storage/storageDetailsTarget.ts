import type { ExplorerItem } from "@/features/explorer";
import { isRootFolder } from "@/utils";

export type StorageSelectionItem = Pick<ExplorerItem, "id" | "kind">;

export type StorageDetailsTarget =
  | { type: "none" }
  | { type: "folder"; id: string }
  | { type: "file"; id: string }
  | { type: "selection"; items: StorageSelectionItem[] };

export function getStorageDetailsTarget({
  folderId,
  selectedItems,
}: {
  folderId?: string;
  selectedItems: ExplorerItem[];
}): StorageDetailsTarget {
  if (selectedItems.length === 1) {
    const item = selectedItems[0];
    return { type: item.kind, id: item.id };
  }

  if (selectedItems.length > 1) {
    return {
      type: "selection",
      items: selectedItems.map(({ id, kind }) => ({ id, kind })),
    };
  }

  if (folderId && !isRootFolder(folderId)) {
    return { type: "folder", id: folderId };
  }

  return { type: "none" };
}
