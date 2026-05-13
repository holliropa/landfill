import styles from "./ExploreList.module.css";
import React, { useMemo, useRef, useState } from "react";
import type { ExplorerItem } from "../types";

type Column = {
  key: "thumbnail" | "name" | "date" | "size";
  label: string;
  width: number;
  minWidth: number;
  resizable: boolean;
};

export type ExplorerListProps = {
  items: ExplorerItem[];
  selectedKeys: Set<string>;
  onItemOpen: (index: number) => void;
  onItemClick: (index: number, event: React.MouseEvent) => void;
};

export function ExplorerList({
  items,
  selectedKeys,
  onItemOpen,
  onItemClick,
}: ExplorerListProps) {
  const [columns, setColumns] = useState<Column[]>([
    { key: "thumbnail", label: "", width: 48, minWidth: 48, resizable: false },
    { key: "name", label: "Name", width: 320, minWidth: 140, resizable: true },
    { key: "date", label: "Date", width: 170, minWidth: 120, resizable: true },
    { key: "size", label: "Size", width: 110, minWidth: 100, resizable: true },
  ]);

  const dragStateRef = useRef<{
    columnIndex: number;
    startX: number;
    startWidth: number;
  } | null>(null);

  const gridTemplateColumns = useMemo(() => {
    return columns.map((column) => `${column.width}px`).join(" ");
  }, [columns]);

  function startResize(
    event: React.MouseEvent<HTMLDivElement>,
    columnIndex: number,
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (!columns[columnIndex].resizable) return;

    dragStateRef.current = {
      columnIndex,
      startX: event.clientX,
      startWidth: columns[columnIndex].width,
    };

    function handleMouseMove(moveEvent: MouseEvent) {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      const deltaX = moveEvent.clientX - dragState.startX;

      setColumns((prev) =>
        prev.map((column, index) => {
          if (index !== dragState.columnIndex) return column;

          return {
            ...column,
            width: Math.max(column.minWidth, dragState.startWidth + deltaX),
          };
        }),
      );
    }

    function handleMouseUp() {
      dragStateRef.current = null;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header} style={{ gridTemplateColumns }}>
        {columns.map((column, index) => (
          <div key={column.key} className={styles.headerCell}>
            <span>{column.label}</span>

            <div
              className={styles.resizeHandle}
              onMouseDown={(event) => startResize(event, index)}
            />
          </div>
        ))}
      </div>

      <div className={styles.body}>
        {items.length === 0 ? (
          <div className={styles.emptyState}>This folder is empty.</div>
        ) : (
          items.map((item, index) => {
            const isSelected = selectedKeys.has(item.key);

            return (
              <div
                key={item.key}
                className={`${styles.row} ${isSelected ? styles.selectedRow : ""}`}
                style={{ gridTemplateColumns }}
                onClick={(event) => onItemClick(index, event)}
                onDoubleClick={() => onItemOpen(index)}
              >
                <div className={`${styles.cell} ${styles.thumbnailCell}`}>
                  <div className={styles.thumbnailBox}>
                    {item.ThumbnailComponent}
                  </div>
                </div>

                <div className={`${styles.cell} ${styles.nameCell}`}>
                  {item.name}
                </div>

                <div className={`${styles.cell} ${styles.metaCell}`}>
                  {formatDate(item.createdAt)}
                </div>

                <div className={`${styles.cell} ${styles.metaCell}`}>
                  {item.size ? formatSize(item.size) : ""}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
