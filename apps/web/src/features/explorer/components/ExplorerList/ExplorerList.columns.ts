import type { ExplorerItem } from "@/features/explorer/types";
import { createElement, type ReactNode } from "react";
import styles from "./ExplorerList.module.css";

export type ExplorerListColumn = {
  key: string;
  label: ReactNode;
  width: number;
  minWidth?: number;
  resizable?: boolean;
  headerClassName?: string;
  cellClassName?: string;
  renderCell: (item: ExplorerItem) => ReactNode;
};

export const defaultExplorerListColumns: ExplorerListColumn[] = [
  {
    key: "thumbnail",
    label: "",
    width: 48,
    minWidth: 48,
    resizable: false,
    cellClassName: styles.thumbnailCell,
    renderCell: (item) =>
      createElement(
        "div",
        { className: styles.thumbnailBox },
        item.ThumbnailComponent,
      ),
  },
  {
    key: "name",
    label: "Name",
    width: 320,
    minWidth: 140,
    cellClassName: styles.nameCell,
    renderCell: (item) => item.name,
  },
  {
    key: "date",
    label: "Date",
    width: 170,
    minWidth: 120,
    cellClassName: styles.metaCell,
    renderCell: (item) => formatExplorerDate(item.createdAt),
  },
  {
    key: "size",
    label: "Size",
    width: 110,
    minWidth: 100,
    cellClassName: styles.metaCell,
    renderCell: (item) => (item.size ? formatExplorerSize(item.size) : ""),
  },
];

export function formatExplorerDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatExplorerSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
