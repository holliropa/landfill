import type { ExplorerActionAvailability } from "@/features/explorer/modes";
import type { ExplorerItem } from "@/features/explorer/types";
import {
  ArchiveRestoreIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileEditIcon,
  InfoIcon,
  Trash2Icon,
  TrashIcon,
} from "lucide-react";
import styles from "./ContextMenu.module.css";

export type ExplorerContextMenuProps = {
  x: number;
  y: number;
  items: ExplorerItem[];
  actions: ExplorerActionAvailability;
  isDownloading: boolean;
  isRestoring: boolean;
  isPermanentlyDeleting: boolean;
  onOpen: () => void;
  onRenameItem: (item: ExplorerItem) => void;
  onDownloadItems: (items: ExplorerItem[]) => void;
  onDeleteItems: (items: ExplorerItem[]) => void;
  onRestoreItems: (items: ExplorerItem[]) => void;
  onPermanentlyDeleteItems: (items: ExplorerItem[]) => void;
  onDetails: () => void;
};

export function ContextMenu({
  x,
  y,
  items,
  actions,
  isDownloading,
  isRestoring,
  isPermanentlyDeleting,
  onOpen,
  onRenameItem,
  onDownloadItems,
  onDeleteItems,
  onRestoreItems,
  onPermanentlyDeleteItems,
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
      {actions.open && (
        <button type="button" role="menuitem" onClick={onOpen}>
          <ExternalLinkIcon size={16} />
          <span>Open</span>
        </button>
      )}
      {actions.rename && (
        <button
          type="button"
          role="menuitem"
          onClick={() => onRenameItem(items[0])}
          disabled={!canRename}
        >
          <FileEditIcon size={16} />
          <span>Rename</span>
        </button>
      )}
      {actions.download && (
        <button
          type="button"
          role="menuitem"
          onClick={() => onDownloadItems(items)}
          disabled={isDownloading}
        >
          <DownloadIcon size={16} />
          <span>Download</span>
        </button>
      )}
      {actions.restore && (
        <button
          type="button"
          role="menuitem"
          onClick={() => onRestoreItems(items)}
          disabled={isRestoring}
        >
          <ArchiveRestoreIcon size={16} />
          <span>Restore</span>
        </button>
      )}
      {actions.details && (
        <button type="button" role="menuitem" onClick={onDetails}>
          <InfoIcon size={16} />
          <span>Details</span>
        </button>
      )}
      {actions.delete && (
        <button
          type="button"
          role="menuitem"
          className={styles.dangerMenuItem}
          onClick={() => onDeleteItems(items)}
        >
          <TrashIcon size={16} />
          <span>Move to trash</span>
        </button>
      )}
      {actions.permanentlyDelete && (
        <button
          type="button"
          role="menuitem"
          className={styles.dangerMenuItem}
          onClick={() => onPermanentlyDeleteItems(items)}
          disabled={isPermanentlyDeleting}
        >
          <Trash2Icon size={16} />
          <span>Delete permanently</span>
        </button>
      )}
    </div>
  );
}
