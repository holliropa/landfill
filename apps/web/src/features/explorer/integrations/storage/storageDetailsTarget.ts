import type { ExplorerItem } from "@/features/explorer";
import { isRootFolder } from "@/utils";

export type StorageSelectionItem = Pick<
  ExplorerItem,
  "key" | "id" | "kind" | "name" | "size"
>;

export type StorageDetailsTarget =
  | { type: "none"; key: "none" }
  | {
      type: "folder";
      key: string;
      id: string;
      snapshot?: StorageSelectionItem;
    }
  | {
      type: "file";
      key: string;
      id: string;
      snapshot: StorageSelectionItem;
    }
  | {
      type: "selection";
      key: string;
      items: StorageSelectionItem[];
    };

export function getStorageDetailsTarget({
  folderId,
  selectedItems,
}: {
  folderId?: string;
  selectedItems: ExplorerItem[];
}): StorageDetailsTarget {
  if (selectedItems.length === 1) {
    const item = selectedItems[0];
    const snapshot = toStorageSelectionItem(item);

    return {
      type: item.kind,
      key: item.key,
      id: item.id,
      snapshot,
    };
  }

  if (selectedItems.length > 1) {
    const items = selectedItems.map(toStorageSelectionItem);

    return {
      type: "selection",
      key: `selection:${items.map((item) => item.key).join("|")}`,
      items,
    };
  }

  if (folderId && !isRootFolder(folderId)) {
    return { type: "folder", key: `folder:${folderId}`, id: folderId };
  }

  return { type: "none", key: "none" };
}

function toStorageSelectionItem({
  key,
  id,
  kind,
  name,
  size,
}: ExplorerItem): StorageSelectionItem {
  return { key, id, kind, name, size };
}
