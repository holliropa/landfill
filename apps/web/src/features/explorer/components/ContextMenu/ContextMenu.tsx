import type { ExplorerItem } from "@/features/explorer/types";
import {
  DownloadIcon,
  ExternalLinkIcon,
  FileEditIcon,
  InfoIcon,
  TrashIcon,
} from "lucide-react";
import styles from "./ContextMenu.module.css";

export type ExplorerContextMenuProps = {
  x: number;
  y: number;
  items: ExplorerItem[];
  isDownloading: boolean;
  onOpen: () => void;
  onRenameItem: (item: ExplorerItem) => void;
  onDownloadItems: (items: ExplorerItem[]) => void;
  onDeleteItems: (items: ExplorerItem[]) => void;
  onDetails: () => void;
};

export function ContextMenu({
  x,
  y,
  items,
  isDownloading,
  onOpen,
  onRenameItem,
  onDownloadItems,
  onDeleteItems,
  onDetails,
}: ExplorerContextMenuProps) {
  const canRename = items.length === 1;

  return (
    <div
      className={styles.contextMenu}
      style={{ left: x, top: y }}
      role="menu"
      onClick={(event) => event.stopPropagation()}
    >
      <button type="button" role="menuitem" onClick={onOpen}>
        <ExternalLinkIcon size={16} />
        <span>Open</span>
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => onRenameItem(items[0])}
        disabled={!canRename}
      >
        <FileEditIcon size={16} />
        <span>Rename</span>
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => onDownloadItems(items)}
        disabled={isDownloading}
      >
        <DownloadIcon size={16} />
        <span>Download</span>
      </button>
      <button type="button" role="menuitem" onClick={onDetails}>
        <InfoIcon size={16} />
        <span>Details</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className={styles.dangerMenuItem}
        onClick={() => onDeleteItems(items)}
      >
        <TrashIcon size={16} />
        <span>Delete</span>
      </button>
    </div>
  );
}

