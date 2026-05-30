import styles from "./ExploreList.module.css";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ExplorerItem } from "../types";
import { AlertCircleIcon, FolderOpenIcon } from "lucide-react";

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
  focusedIndex: number | null;
  onFocusedIndex: (index: number | null) => void;
  onKeyboardActiveChange: (isActive: boolean) => void;
  onItemOpen: (index: number) => void;
  onItemClick: (index: number, event: React.MouseEvent) => void;
  onItemContextMenu: (index: number, event: React.MouseEvent) => void;
  isLoading?: boolean;
  isError?: boolean;
};

export function ExplorerList({
  items,
  selectedKeys,
  focusedIndex,
  onFocusedIndex,
  onKeyboardActiveChange,
  onItemOpen,
  onItemClick,
  onItemContextMenu,
  isLoading = false,
  isError = false,
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const onItemClickRef = useRef(onItemClick);
  const onItemOpenRef = useRef(onItemOpen);
  const onItemContextMenuRef = useRef(onItemContextMenu);

  const gridTemplateColumns = useMemo(() => {
    return columns.map((column) => `${column.width}px`).join(" ");
  }, [columns]);

  useEffect(() => {
    onItemClickRef.current = onItemClick;
    onItemOpenRef.current = onItemOpen;
    onItemContextMenuRef.current = onItemContextMenu;
  }, [onItemClick, onItemOpen, onItemContextMenu]);

  useEffect(() => {
    if (focusedIndex === null) return;
    if (!bodyRef.current?.contains(document.activeElement)) return;

    const container = containerRef.current;
    if (!container) return;

    const row = rowRefs.current[focusedIndex];
    const headerHeight = headerRef.current?.offsetHeight ?? 0;
    if (!row) return;

    const containerRect = container.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const visibleTop = containerRect.top + headerHeight;
    const visibleBottom = containerRect.bottom;

    if (rowRect.top < visibleTop) {
      container.scrollTop -= visibleTop - rowRect.top;
      return;
    }

    if (rowRect.bottom > visibleBottom) {
      container.scrollTop += rowRect.bottom - visibleBottom;
    }
  }, [focusedIndex]);

  const handleRowClick = useCallback(
    (index: number, event: React.MouseEvent) => {
      bodyRef.current?.focus();
      onItemClickRef.current(index, event);
    },
    [],
  );

  const handleRowOpen = useCallback((index: number) => {
    onItemOpenRef.current(index);
  }, []);

  const handleRowContextMenu = useCallback(
    (index: number, event: React.MouseEvent) => {
      bodyRef.current?.focus();
      onItemContextMenuRef.current(index, event);
    },
    [],
  );

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
    <div className={styles.container} ref={containerRef}>
      <div
        className={styles.header}
        ref={headerRef}
        style={{ gridTemplateColumns }}
      >
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

      <div
        ref={bodyRef}
        className={styles.body}
        role="grid"
        tabIndex={0}
        aria-label="Folder contents"
        aria-activedescendant={
          focusedIndex === null ? undefined : `explorer-row-${focusedIndex}`
        }
        aria-busy={isLoading || undefined}
        onFocusCapture={() => {
          onKeyboardActiveChange(true);

          if (focusedIndex === null && items.length > 0) {
            onFocusedIndex(0);
          }
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            onKeyboardActiveChange(false);
          }
        }}
      >
        {isLoading ? (
          <ExplorerLoadingRows gridTemplateColumns={gridTemplateColumns} />
        ) : isError ? (
          <div className={styles.messageState}>
            <AlertCircleIcon size={24} />
            <strong>Could not load this folder</strong>
            <span>Check that the API is running, then try again.</span>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.messageState}>
            <FolderOpenIcon size={28} />
            <strong>This folder is empty</strong>
            <span>Use the toolbar above to upload files or create a folder.</span>
          </div>
        ) : (
          items.map((item, index) => {
            const isSelected = selectedKeys.has(item.key);

            return (
              <ExplorerRow
                key={item.key}
                item={item}
                index={index}
                isSelected={isSelected}
                isFocused={index === focusedIndex}
                gridTemplateColumns={gridTemplateColumns}
                rowRef={(element) => {
                  rowRefs.current[index] = element;
                }}
                onItemClick={handleRowClick}
                onItemOpen={handleRowOpen}
                onItemContextMenu={handleRowContextMenu}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

type ExplorerRowProps = {
  item: ExplorerItem;
  index: number;
  isSelected: boolean;
  isFocused: boolean;
  gridTemplateColumns: string;
  rowRef: (element: HTMLDivElement | null) => void;
  onItemOpen: (index: number) => void;
  onItemClick: (index: number, event: React.MouseEvent) => void;
  onItemContextMenu: (index: number, event: React.MouseEvent) => void;
};

const ExplorerRow = React.memo(function ExplorerRow({
  item,
  index,
  isSelected,
  isFocused,
  gridTemplateColumns,
  rowRef,
  onItemOpen,
  onItemClick,
  onItemContextMenu,
}: ExplorerRowProps) {
  const formattedDate = useMemo(
    () => formatDate(item.createdAt),
    [item.createdAt],
  );
  const formattedSize = useMemo(
    () => (item.size ? formatSize(item.size) : ""),
    [item.size],
  );

  return (
    <div
      id={`explorer-row-${index}`}
      ref={rowRef}
      className={[styles.row, isSelected ? styles.selectedRow : ""]
        .filter(Boolean)
        .join(" ")}
      style={{ gridTemplateColumns }}
      onClick={(event) => {
        onItemClick(index, event);
      }}
      onContextMenu={(event) => onItemContextMenu(index, event)}
      onDoubleClick={() => onItemOpen(index)}
      aria-selected={isSelected}
      data-focused={isFocused || undefined}
      role="row"
    >
      <div className={`${styles.cell} ${styles.thumbnailCell}`} role="gridcell">
        <div className={styles.thumbnailBox}>{item.ThumbnailComponent}</div>
      </div>

      <div className={`${styles.cell} ${styles.nameCell}`} role="gridcell">
        {item.name}
      </div>

      <div className={`${styles.cell} ${styles.metaCell}`} role="gridcell">
        {formattedDate}
      </div>

      <div className={`${styles.cell} ${styles.metaCell}`} role="gridcell">
        {formattedSize}
      </div>
    </div>
  );
});

function ExplorerLoadingRows({
  gridTemplateColumns,
}: {
  gridTemplateColumns: string;
}) {
  return (
    <>
      {Array.from({ length: 8 }, (_, index) => (
        <div
          key={index}
          className={styles.loadingRow}
          style={{ gridTemplateColumns }}
          aria-hidden="true"
        >
          <div className={`${styles.cell} ${styles.thumbnailCell}`}>
            <span className={styles.loadingThumb} />
          </div>
          <div className={styles.cell}>
            <span className={styles.loadingLine} />
          </div>
          <div className={styles.cell}>
            <span className={styles.loadingLine} />
          </div>
          <div className={styles.cell}>
            <span className={styles.loadingLineShort} />
          </div>
        </div>
      ))}
    </>
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
