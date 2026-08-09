import {
  getExplorerCommandIcon,
  isExplorerCommandDisabled,
  useExplorerCommandList,
  useExplorerContext,
} from "../Explorer/ExplorerContext";
import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import styles from "./ContextMenu.module.css";

export type ExplorerContextMenuProps = {
  ids?: readonly string[];
};

export function ExplorerContextMenu({ ids }: ExplorerContextMenuProps) {
  const { controller } = useExplorerContext();
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const targetItems = controller.contextMenuItems;
  const { commands, runtime } = useExplorerCommandList(
    "context-menu",
    ids,
    targetItems,
  );
  const contextMenu = controller.state.contextMenu;
  const firstEnabledIndex = commands.findIndex(
    (command) => !isExplorerCommandDisabled(command, runtime),
  );

  useEffect(() => {
    if (!contextMenu || firstEnabledIndex < 0) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    itemRefs.current[firstEnabledIndex]?.focus({ preventScroll: true });

    return () => {
      const previousFocus = previousFocusRef.current;
      previousFocusRef.current = null;

      if (previousFocus?.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [contextMenu, firstEnabledIndex]);

  if (!contextMenu || commands.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.contextMenu}
      style={getContextMenuPosition(contextMenu.x, contextMenu.y)}
      role="menu"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        const enabledIndexes = commands.flatMap((command, index) =>
          isExplorerCommandDisabled(command, runtime) ? [] : [index],
        );
        const currentIndex = itemRefs.current.findIndex(
          (item) => item === document.activeElement,
        );
        const enabledPosition = enabledIndexes.indexOf(currentIndex);

        if (event.key === "Escape") {
          event.preventDefault();
          controller.closeContextMenu();
          return;
        }

        if (event.key === "Tab") {
          controller.closeContextMenu();
          return;
        }

        let nextIndex: number | undefined;

        if (event.key === "ArrowDown") {
          nextIndex =
            enabledIndexes[(enabledPosition + 1) % enabledIndexes.length];
        } else if (event.key === "ArrowUp") {
          nextIndex =
            enabledIndexes[
              (enabledPosition - 1 + enabledIndexes.length) %
                enabledIndexes.length
            ];
        } else if (event.key === "Home") {
          nextIndex = enabledIndexes[0];
        } else if (event.key === "End") {
          nextIndex = enabledIndexes.at(-1);
        }

        if (nextIndex === undefined) return;
        event.preventDefault();
        itemRefs.current[nextIndex]?.focus();
      }}
    >
      {commands.map((command, index) => (
        <button
          key={command.id}
          ref={(element) => {
            itemRefs.current[index] = element;
          }}
          type="button"
          role="menuitem"
          tabIndex={-1}
          className={
            command.intent === "danger" ? styles.dangerMenuItem : undefined
          }
          onClick={() => {
            controller.closeContextMenu();
            void command.run(runtime);
          }}
          disabled={isExplorerCommandDisabled(command, runtime)}
        >
          {getExplorerCommandIcon(command, runtime)}
          <span>{command.label}</span>
        </button>
      ))}
    </div>
  );
}

function getContextMenuPosition(x: number, y: number): CSSProperties {
  const viewportPadding = 8;
  const openTowardLeft = x > window.innerWidth / 2;
  const openTowardTop = y > window.innerHeight / 2;

  return {
    left: openTowardLeft ? "auto" : Math.max(viewportPadding, x),
    right: openTowardLeft
      ? Math.max(viewportPadding, window.innerWidth - x)
      : "auto",
    top: openTowardTop ? "auto" : Math.max(viewportPadding, y),
    bottom: openTowardTop
      ? Math.max(viewportPadding, window.innerHeight - y)
      : "auto",
  };
}
