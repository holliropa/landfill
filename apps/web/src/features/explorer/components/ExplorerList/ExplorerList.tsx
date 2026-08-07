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
import { AlertCircleIcon, FolderOpenIcon } from "lucide-react";
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
};

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
}: ExplorerListProps) {
  const { controller, commands } = useExplorerContext();
  const { items, state, dispatch } = controller;
  const [columns, setColumns] = useState(initialColumns);
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
      >
        {columns.map((column, index) => (
          <div
            key={column.key}
            className={[styles.headerCell, column.headerClassName]
              .filter(Boolean)
              .join(" ")}
          >
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
                gridTemplateColumns={gridTemplateColumns}
                canOpen={Boolean(openCommand)}
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
  columns: ExplorerListColumn[];
  isSelected: boolean;
  isFocused: boolean;
  gridTemplateColumns: string;
  canOpen: boolean;
  rowRef: (element: HTMLDivElement | null) => void;
  onItemOpen: (index: number) => void;
  onItemClick: (index: number, event: React.MouseEvent) => void;
  onItemContextMenu: (index: number, event: React.MouseEvent) => void;
};

const ExplorerRow = React.memo(function ExplorerRow({
  item,
  index,
  columns,
  isSelected,
  isFocused,
  gridTemplateColumns,
  canOpen,
  rowRef,
  onItemOpen,
  onItemClick,
  onItemContextMenu,
}: ExplorerRowProps) {
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
      onDoubleClick={() => {
        if (canOpen) {
          onItemOpen(index);
        }
      }}
      aria-selected={isSelected}
      data-focused={isFocused || undefined}
      role="row"
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
