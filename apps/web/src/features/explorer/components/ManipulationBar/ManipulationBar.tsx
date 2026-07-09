import type { ExplorerActionAvailability } from "@/features/explorer/modes";
import type { ExplorerItem } from "@/features/explorer/types";
import { IconButton } from "@/ui/IconButton";
import { SpinnerIcon } from "@/ui/SpinnerIcon";
import {
  ArchiveRestoreIcon,
  DownloadIcon,
  FileEditIcon,
  InfoIcon,
  Trash2Icon,
  TrashIcon,
  XIcon,
} from "lucide-react";

export type ManipulationBarProps = {
  selectedItems: ExplorerItem[];
  actions: Pick<
    ExplorerActionAvailability,
    | "rename"
    | "download"
    | "delete"
    | "restore"
    | "permanentlyDelete"
    | "details"
  >;
  isDownloading: boolean;
  isRestoring: boolean;
  isPermanentlyDeleting: boolean;
  onClearSelection: () => void;
  onRenameItems: (items: ExplorerItem[]) => void;
  onDownloadItems: (items: ExplorerItem[]) => void;
  onDeleteItems: (items: ExplorerItem[]) => void;
  onRestoreItems: (items: ExplorerItem[]) => void;
  onPermanentlyDeleteItems: (items: ExplorerItem[]) => void;
  onShowDetails: () => void;
};

export function ManipulationBar({
  selectedItems,
  actions,
  isDownloading,
  isRestoring,
  isPermanentlyDeleting,
  onClearSelection,
  onRenameItems,
  onDownloadItems,
  onDeleteItems,
  onRestoreItems,
  onPermanentlyDeleteItems,
  onShowDetails,
}: ManipulationBarProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        gap: "8px",
      }}
    >
      {selectedItems.length > 0 && (
        <>
          <IconButton
            size="medium"
            variant="ghost"
            onClick={onClearSelection}
            icon={<XIcon />}
            aria-label="Clear selection"
            title="Clear selection"
          />
          <span>{selectedItems.length} selected</span>
        </>
      )}
      <div
        style={{
          display: "flex",
          marginLeft: "auto",
          gap: "8px",
        }}
      >
        {actions.rename && (
          <IconButton
            variant="ghost"
            icon={<FileEditIcon />}
            onClick={() => onRenameItems(selectedItems)}
            disabled={selectedItems.length === 0 || selectedItems.length > 1}
            aria-label="Rename selected item"
            title="Rename"
          />
        )}
        {actions.download && (
          <IconButton
            variant="ghost"
            onClick={() => onDownloadItems(selectedItems)}
            disabled={isDownloading || selectedItems.length === 0}
            icon={isDownloading ? <SpinnerIcon /> : <DownloadIcon />}
            aria-label="Download selected items"
            title="Download"
          />
        )}
        {actions.delete && (
          <IconButton
            variant="ghost"
            onClick={() => onDeleteItems(selectedItems)}
            icon={<TrashIcon color="#a2030d" />}
            disabled={selectedItems.length === 0}
            aria-label="Move selected items to trash"
            title="Move to trash"
          />
        )}
        {actions.restore && (
          <IconButton
            variant="ghost"
            onClick={() => onRestoreItems(selectedItems)}
            disabled={isRestoring || selectedItems.length === 0}
            icon={isRestoring ? <SpinnerIcon /> : <ArchiveRestoreIcon />}
            aria-label="Restore selected items"
            title="Restore"
          />
        )}
        {actions.permanentlyDelete && (
          <IconButton
            variant="ghost"
            onClick={() => onPermanentlyDeleteItems(selectedItems)}
            icon={
              isPermanentlyDeleting ? (
                <SpinnerIcon />
              ) : (
                <Trash2Icon color="#a2030d" />
              )
            }
            disabled={isPermanentlyDeleting || selectedItems.length === 0}
            aria-label="Permanently delete selected items"
            title="Delete permanently"
          />
        )}
        {actions.details && (
          <IconButton
            variant="ghost"
            icon={<InfoIcon />}
            onClick={onShowDetails}
            aria-label="Show details"
            title="Details"
          />
        )}
      </div>
    </div>
  );
}
