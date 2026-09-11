import React from "react";

export type ExplorerItem = {
  key: string;
  kind: "file" | "folder";
  id: string;
  name: string;
  createdAt: Date;
  size: number | null;
  mimeType?: string | null;
  contentUrl?: string;
  downloadUrl?: string;
  origin?:
    | { kind: "drive" }
    | {
        kind: "archive";
        archiveFileId: string;
        contentRevisionId: string;
        path: string;
        entryIndex: number | null;
      };
  readOnly?: boolean;
  location?: {
    id: string;
    name: string;
    path?: { id: string; name: string }[];
  };
  ThumbnailComponent: React.ReactNode;
};

export function isDriveExplorerItem(item: ExplorerItem) {
  return item.origin?.kind !== "archive";
}
