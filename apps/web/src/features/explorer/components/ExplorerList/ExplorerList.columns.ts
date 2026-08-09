import type { ExplorerItem } from "@/features/explorer/types";
import { formatDateTime, formatSize } from "@/utils";
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
    renderCell: (item) =>
      item.size !== null ? formatExplorerSize(item.size) : "",
  },
];

export function formatExplorerDate(date: Date) {
  return formatDateTime(date);
}

export function formatExplorerSize(bytes: number) {
  return formatSize(bytes);
}
