import type { ExplorerRuntime } from "./Explorer.types";
import { useExplorerContext, useExplorerRuntime } from "./ExplorerContext";
import { IconButton } from "@/ui/IconButton";
import { XIcon } from "lucide-react";
import { type ReactNode, useEffect, useRef } from "react";
import styles from "./Explorer.module.css";

export function ExplorerShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { controller } = useExplorerContext();

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      onClick={controller.closeContextMenu}
    >
      {children}
    </div>
  );
}

export function ExplorerToolbar({ children }: { children: ReactNode }) {
  return <div className={styles.toolbar}>{children}</div>;
}

export function ExplorerWorkspace({ children }: { children: ReactNode }) {
  return <div className={styles.workspace}>{children}</div>;
}

export function ExplorerContent({ children }: { children: ReactNode }) {
  return <div className={styles.content}>{children}</div>;
}

export function ExplorerSelectionSummary() {
  const { controller } = useExplorerContext();

  if (controller.selectedCount === 0) {
    return null;
  }

  return (
    <div className={styles.selectionSummary}>
      <IconButton
        size="medium"
        variant="ghost"
        onClick={controller.clearSelection}
        icon={<XIcon />}
        aria-label="Clear selection"
        title="Clear selection"
      />
      <span>{controller.selectedCount} selected</span>
    </div>
  );
}

export function ExplorerDetailsPanel({
  children,
  enabled = true,
  ariaLabel = "Details",
  ariaLabelledBy,
  autoFocus = true,
}: {
  children: ReactNode | ((runtime: ExplorerRuntime) => ReactNode);
  enabled?: boolean;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  autoFocus?: boolean;
}) {
  const { controller } = useExplorerContext();
  const runtime = useExplorerRuntime("details");
  const panelRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isOpen = enabled && controller.state.isDetailsOpen;

  useEffect(() => {
    if (!isOpen || !autoFocus) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    panelRef.current?.focus({ preventScroll: true });

    return () => {
      const previousFocus = previousFocusRef.current;
      previousFocusRef.current = null;

      if (previousFocus?.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, [autoFocus, isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      ref={panelRef}
      className={styles.detailsPanel}
      aria-label={ariaLabelledBy ? undefined : ariaLabel}
      aria-labelledby={ariaLabelledBy}
      tabIndex={-1}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        controller.closeDetails();
      }}
    >
      {typeof children === "function" ? children(runtime) : children}
    </aside>
  );
}
