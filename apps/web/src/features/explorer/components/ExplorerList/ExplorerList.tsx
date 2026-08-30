import styles from "./ExplorerList.module.css";
import React, {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ExplorerItem } from "@/features/explorer/types";
import {
  AlertCircleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  FolderOpenIcon,
} from "lucide-react";
import type { ExplorerSort, ExplorerSortKey } from "@/features/explorer/hooks";
import type {
  ExplorerAction,
  ExplorerSelectionMode,
} from "@/features/explorer/state";
import {
  createExplorerRuntime,
  isExplorerCommandDisabled,
  isExplorerCommandVisible,
  useExplorerContext,
} from "../Explorer/ExplorerContext";
import {
  defaultExplorerListColumns,
  type ExplorerListColumn,
} from "./ExplorerList.columns";

export type ExplorerMessageState = {
  icon?: ReactNode;
  title: string;
  description?: string;
};

export type ExplorerListProps = {
  columns?: ExplorerListColumn[];
  openActionId?: string;
  ariaLabel?: string;
  emptyState?: ExplorerMessageState | ReactNode;
  errorState?: ExplorerMessageState | ReactNode;
  loadingState?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  sort?: ExplorerSort;
  onSortChange?: (key: ExplorerSortKey) => void;
  onItemsDrop?: (items: ExplorerItem[], destination: ExplorerItem) => void;
};

const STORAGE_ITEMS_DRAG_TYPE = "application/x-landfill-storage-items";

export function ExplorerList({
  columns: initialColumns = defaultExplorerListColumns,
  openActionId = "open",
  ariaLabel = "Explorer items",
  emptyState = {
    icon: <FolderOpenIcon size={28} />,
    title: "No items",
  },
  errorState = {
    icon: <AlertCircleIcon size={24} />,
    title: "Could not load items",
  },
  loadingState,
  isLoading = false,
  isError = false,
  sort,
  onSortChange,
  onItemsDrop,
}: ExplorerListProps) {
  const { controller, commands } = useExplorerContext();
  const { items, state, dispatch } = controller;
  const [columns, setColumns] = useState(initialColumns);
  const [draggedKeys, setDraggedKeys] = useState<Set<string>>(new Set());
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null);
  const openCommand = commands.find(
    (command) =>
      command.id === openActionId && command.surfaces.includes("item"),
  );

  const dragStateRef = useRef<{
    columnIndex: number;
    startX: number;
    startWidth: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);

  const gridTemplateColumns = useMemo(() => {
    return columns.map((column) => `${column.width}px`).join(" ");
  }, [columns]);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  useEffect(() => {
    const focusedIndex = state.focusedIndex;
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
  }, [state.focusedIndex]);

  const handleRowClick = useCallback(
    (index: number, event: React.MouseEvent) => {
      bodyRef.current?.focus();
      dispatch(getSelectionAction(index, getSelectionMode(event)));
    },
    [dispatch],
  );

  const handleRowOpen = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item || !openCommand) return;

      const runtime = createExplorerRuntime({
        controller,
        source: "item",
        targetItems: [item],
      });

      if (
        !isExplorerCommandVisible(openCommand, runtime) ||
        isExplorerCommandDisabled(openCommand, runtime)
      ) {
        return;
      }

      void openCommand.run(runtime);
    },
    [controller, items, openCommand],
  );

  const handleRowContextMenu = useCallback(
    (index: number, event: React.MouseEvent) => {
      bodyRef.current?.focus();
      controller.openContextMenu(index, event);
    },
    [controller],
  );

  const handleRowDragStart = useCallback(
    (index: number, event: React.DragEvent) => {
      const item = items[index];
      if (!item || !onItemsDrop) return;

      const draggedItems = state.selectedKeys.has(item.key)
        ? controller.selectedItems
        : [item];
      const keys = new Set(draggedItems.map((draggedItem) => draggedItem.key));

      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData(
        STORAGE_ITEMS_DRAG_TYPE,
        JSON.stringify(
          draggedItems.map((draggedItem) => ({
            kind: draggedItem.kind,
            id: draggedItem.id,
          })),
        ),
      );
      event.dataTransfer.setData(
        "text/plain",
        draggedItems.map((draggedItem) => draggedItem.name).join(", "),
      );
      setDraggedKeys(keys);
    },
    [controller.selectedItems, items, onItemsDrop, state.selectedKeys],
  );

  const handleRowDragOver = useCallback(
    (item: ExplorerItem, event: React.DragEvent) => {
      if (
        !onItemsDrop ||
        item.kind !== "folder" ||
        draggedKeys.has(item.key) ||
        !Array.from(event.dataTransfer.types).includes(STORAGE_ITEMS_DRAG_TYPE)
      ) {
        return;
      }

      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      setDropTargetKey(item.key);
    },
    [draggedKeys, onItemsDrop],
  );

  const handleRowDragLeave = useCallback(
    (item: ExplorerItem, event: React.DragEvent<HTMLDivElement>) => {
      if (
        event.relatedTarget instanceof Node &&
        event.currentTarget.contains(event.relatedTarget)
      ) {
        return;
      }
      setDropTargetKey((current) => (current === item.key ? null : current));
    },
    [],
  );

  const handleRowDrop = useCallback(
    (destination: ExplorerItem, event: React.DragEvent) => {
      if (!onItemsDrop || destination.kind !== "folder") return;

      event.preventDefault();
      setDropTargetKey(null);

      try {
        const references = JSON.parse(
          event.dataTransfer.getData(STORAGE_ITEMS_DRAG_TYPE),
        ) as { kind: "file" | "folder"; id: string }[];
        const referenceKeys = new Set(
          references.map((reference) => `${reference.kind}:${reference.id}`),
        );
        if (referenceKeys.has(destination.key)) return;

        const draggedItems = items.filter((item) =>
          referenceKeys.has(item.key),
        );
        if (draggedItems.length > 0) onItemsDrop(draggedItems, destination);
      } catch {
        // Ignore malformed or unrelated drag data.
      }
    },
    [items, onItemsDrop],
  );

  function startResize(
    event: React.MouseEvent<HTMLDivElement>,
    columnIndex: number,
  ) {
    event.preventDefault();
    event.stopPropagation();

    if (columns[columnIndex].resizable === false) return;

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
            width: Math.max(
              column.minWidth ?? 80,
              dragState.startWidth + deltaX,
            ),
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
        role="row"
      >
        {columns.map((column, index) => (
          <div
            key={column.key}
            className={[styles.headerCell, column.headerClassName]
              .filter(Boolean)
              .join(" ")}
            role="columnheader"
            aria-sort={
              column.sortKey
                ? sort?.key === column.sortKey
                  ? sort.direction === "asc"
                    ? "ascending"
                    : "descending"
                  : "none"
                : undefined
            }
          >
            {column.sortKey && onSortChange ? (
              <button
                type="button"
                className={styles.sortButton}
                onClick={() => onSortChange(column.sortKey!)}
              >
                <span>{column.label}</span>
                {sort?.key === column.sortKey &&
                  (sort.direction === "asc" ? (
                    <ArrowUpIcon size={14} aria-hidden="true" />
                  ) : (
                    <ArrowDownIcon size={14} aria-hidden="true" />
                  ))}
              </button>
            ) : (
              <span>{column.label}</span>
            )}

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
        aria-label={ariaLabel}
        aria-activedescendant={
          state.focusedIndex === null
            ? undefined
            : `explorer-row-${state.focusedIndex}`
        }
        aria-busy={isLoading || undefined}
        onFocusCapture={() => {
          dispatch({ type: "keyboard-active", active: true });

          if (state.focusedIndex === null && items.length > 0) {
            dispatch({ type: "focus", index: 0 });
          }
        }}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            dispatch({ type: "keyboard-active", active: false });
          }
        }}
      >
        {isLoading ? (
          (loadingState ?? (
            <ExplorerLoadingRows
              columns={columns}
              gridTemplateColumns={gridTemplateColumns}
            />
          ))
        ) : isError ? (
          <ExplorerListMessage state={errorState} fallbackIcon="error" />
        ) : items.length === 0 ? (
          <ExplorerListMessage state={emptyState} fallbackIcon="empty" />
        ) : (
          items.map((item, index) => {
            const isSelected = state.selectedKeys.has(item.key);

            return (
              <ExplorerRow
                key={item.key}
                item={item}
                index={index}
                columns={columns}
                isSelected={isSelected}
                isFocused={index === state.focusedIndex}
                isDragging={draggedKeys.has(item.key)}
                isDropTarget={dropTargetKey === item.key}
                gridTemplateColumns={gridTemplateColumns}
                canOpen={Boolean(openCommand)}
                rowRef={(element) => {
                  rowRefs.current[index] = element;
                }}
                onItemClick={handleRowClick}
                onItemOpen={handleRowOpen}
                onItemContextMenu={handleRowContextMenu}
                canDrag={Boolean(onItemsDrop)}
                onDragStart={handleRowDragStart}
                onDragOver={handleRowDragOver}
                onDragLeave={handleRowDragLeave}
                onDrop={handleRowDrop}
                onDragEnd={() => {
                  setDraggedKeys(new Set());
                  setDropTargetKey(null);
                }}
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
  columns: ExplorerListColumn[];
  isSelected: boolean;
  isFocused: boolean;
  isDragging: boolean;
  isDropTarget: boolean;
  gridTemplateColumns: string;
  canOpen: boolean;
  rowRef: (element: HTMLDivElement | null) => void;
  onItemOpen: (index: number) => void;
  onItemClick: (index: number, event: React.MouseEvent) => void;
  onItemContextMenu: (index: number, event: React.MouseEvent) => void;
  canDrag: boolean;
  onDragStart: (index: number, event: React.DragEvent) => void;
  onDragOver: (item: ExplorerItem, event: React.DragEvent) => void;
  onDragLeave: (
    item: ExplorerItem,
    event: React.DragEvent<HTMLDivElement>,
  ) => void;
  onDrop: (item: ExplorerItem, event: React.DragEvent) => void;
  onDragEnd: () => void;
};

const ExplorerRow = React.memo(function ExplorerRow({
  item,
  index,
  columns,
  isSelected,
  isFocused,
  isDragging,
  isDropTarget,
  gridTemplateColumns,
  canOpen,
  rowRef,
  onItemOpen,
  onItemClick,
  onItemContextMenu,
  canDrag,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: ExplorerRowProps) {
  return (
    <div
      id={`explorer-row-${index}`}
      ref={rowRef}
      className={[
        styles.row,
        isSelected ? styles.selectedRow : "",
        isDragging ? styles.draggingRow : "",
        isDropTarget ? styles.dropTargetRow : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ gridTemplateColumns }}
      onClick={(event) => {
        onItemClick(index, event);
      }}
      onContextMenu={(event) => onItemContextMenu(index, event)}
      onDoubleClick={() => {
        if (canOpen) {
          onItemOpen(index);
        }
      }}
      aria-selected={isSelected}
      data-focused={isFocused || undefined}
      role="row"
      draggable={canDrag}
      onDragStart={(event) => onDragStart(index, event)}
      onDragOver={(event) => onDragOver(item, event)}
      onDragLeave={(event) => onDragLeave(item, event)}
      onDrop={(event) => onDrop(item, event)}
      onDragEnd={onDragEnd}
    >
      {columns.map((column) => (
        <div
          key={column.key}
          className={[styles.cell, column.cellClassName]
            .filter(Boolean)
            .join(" ")}
          role="gridcell"
        >
          {column.renderCell(item)}
        </div>
      ))}
    </div>
  );
});

function ExplorerLoadingRows({
  columns,
  gridTemplateColumns,
}: {
  columns: ExplorerListColumn[];
  gridTemplateColumns: string;
}) {
  return (
    <>
      {Array.from({ length: 8 }, (_, rowIndex) => (
        <div
          key={rowIndex}
          className={styles.loadingRow}
          style={{ gridTemplateColumns }}
          aria-hidden="true"
        >
          {columns.map((column, columnIndex) => (
            <div
              key={column.key}
              className={[styles.cell, column.cellClassName]
                .filter(Boolean)
                .join(" ")}
            >
              <span
                className={
                  columnIndex === 0
                    ? styles.loadingThumb
                    : columnIndex === columns.length - 1
                      ? styles.loadingLineShort
                      : styles.loadingLine
                }
              />
            </div>
          ))}
        </div>
      ))}
    </>
  );
}

function ExplorerListMessage({
  state,
  fallbackIcon,
}: {
  state: ExplorerMessageState | ReactNode;
  fallbackIcon: "empty" | "error";
}) {
  if (!isExplorerMessageState(state)) {
    return <>{state}</>;
  }

  return (
    <div className={styles.messageState}>
      {state.icon ??
        (fallbackIcon === "empty" ? (
          <FolderOpenIcon size={28} />
        ) : (
          <AlertCircleIcon size={24} />
        ))}
      <strong>{state.title}</strong>
      {state.description && <span>{state.description}</span>}
    </div>
  );
}

function isExplorerMessageState(
  state: ExplorerMessageState | ReactNode,
): state is ExplorerMessageState {
  return typeof state === "object" && state !== null && "title" in state;
}

function getSelectionMode(event: React.MouseEvent): ExplorerSelectionMode {
  if (event.shiftKey) return "range";
  if (event.ctrlKey || event.metaKey) return "toggle";
  return "replace";
}

function getSelectionAction(
  index: number,
  mode: ExplorerSelectionMode,
): ExplorerAction {
  if (mode === "range") {
    return { type: "select-range", index };
  }

  if (mode === "toggle") {
    return { type: "toggle-select", index };
  }

  return { type: "select-one", index };
}
