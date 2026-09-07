import { FileThumbnail } from "@/components/FileThumbnail";
import type { ExplorerItem } from "@/features/explorer";
import type { StorageItem } from "@/lib/client";
import { FolderIcon } from "lucide-react";

export function toStorageExplorerItem(item: StorageItem): ExplorerItem {
  return {
    key: `${item.kind}:${item.id}`,
    id: item.id,
    kind: item.kind,
    name: item.name,
    createdAt: item.createdAt,
    size: item.size,
    mimeType: item.mimeType,
    location: item.location,
    ThumbnailComponent:
      item.kind === "folder" ? (
        <FolderIcon />
      ) : (
        <FileThumbnail
          fileId={item.id}
          alt={item.name}
          mimeType={item.mimeType}
        />
      ),
  };
}
