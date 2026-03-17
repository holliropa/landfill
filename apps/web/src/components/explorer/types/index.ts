import React from "react";

export type ExplorerItem = {
  id: string;
  type: "file" | "folder";
  name: string;
  createdAt: Date;
  size: number | null;
  ThumbnailComponent: React.ReactNode;
};
