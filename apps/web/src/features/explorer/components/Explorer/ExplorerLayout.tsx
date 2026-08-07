import type { ExplorerRuntime } from "./Explorer.types";
import { useExplorerContext, useExplorerRuntime } from "./ExplorerContext";
import { IconButton } from "@/ui/IconButton";
import { XIcon } from "lucide-react";
import type { ReactNode } from "react";
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
}: {
  children: ReactNode | ((runtime: ExplorerRuntime) => ReactNode);
  enabled?: boolean;
  ariaLabel?: string;
}) {
  const { controller } = useExplorerContext();
  const runtime = useExplorerRuntime("details");

  if (!enabled || !controller.state.isDetailsOpen) {
    return null;
  }

  return (
    <aside className={styles.detailsPanel} aria-label={ariaLabel}>
      {typeof children === "function" ? children(runtime) : children}
    </aside>
  );
}
