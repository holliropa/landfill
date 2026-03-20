import React from "react";

export type ExplorerItem = {
  key: string;
  kind: "file" | "folder";
  name: string;
  createdAt: Date;
  size: number | null;
  ThumbnailComponent: React.ReactNode;
};
