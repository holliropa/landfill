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

interface ExplorerListProps {
  items: ExplorerItem[];
  onItemOpen: (item: ExplorerItem) => void;
}

export function ExplorerList({ items, onItemOpen }: ExplorerListProps) {
  const [columns, setColumns] = useState<Column[]>([
    { key: "thumbnail", label: "", width: 40, minWidth: 40, resizable: false },
    { key: "name", label: "Name", width: 300, minWidth: 100, resizable: true },
    { key: "date", label: "Date", width: 150, minWidth: 100, resizable: true },
    { key: "size", label: "Size", width: 100, minWidth: 100, resizable: true },
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
      <div
        className={styles.header}
        style={{
          gridTemplateColumns,
        }}
      >
        {columns.map((column, index) => (
          <div key={index} className={styles.headerCell}>
            <span>{column.label}</span>

            {index < columns.length - 1 && (
              <div
                className={styles.resizeHandle}
                onMouseDown={(event) => startResize(event, index)}
              />
            )}
          </div>
        ))}
      </div>

      <div className={styles.body}>
        {items.map((item) => {
          return (
            <div
              key={`${item.type}-${item.id}`}
              className={styles.row}
              style={{
                gridTemplateColumns,
              }}
              onDoubleClick={() => onItemOpen(item)}
            >
              <div className={styles.cell}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "20px",
                    height: "20px",
                    flex: "0 0 20px",
                  }}
                >
                  {item.ThumbnailComponent}
                </div>
              </div>
              <div className={styles.cell}>{item.name}</div>
              <div className={styles.cell}>{formatDate(item.createdAt)}</div>
              <div className={styles.cell}>
                {item.size ? formatSize(item.size) : ""}
              </div>
            </div>
          );
        })}
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
