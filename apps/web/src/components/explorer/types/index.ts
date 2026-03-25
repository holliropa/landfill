import React from "react";

export type ExplorerItem = {
  key: string;
  kind: "file" | "folder";
  id: string;
  name: string;
  createdAt: Date;
  size: number | null;
  ThumbnailComponent: React.ReactNode;
};
