import type { ExplorerItem } from "@/components/Explorer";
import {
  DownloadIcon,
  FileEditIcon,
  InfoIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { IconButton } from "@/ui/IconButton";
import { SpinnerIcon } from "@/ui/SpinnerIcon";

export type ManipulationBarProps = {
  selectedItems: ExplorerItem[];
  isDownloading: boolean;
  onDeselectAll: () => void;
  onShowDetails: () => void;
  onRename: (items: ExplorerItem[]) => void;
  onDownload: (items: ExplorerItem[]) => void;
  onDelete: (items: ExplorerItem[]) => void;
};

export function ManipulationBar({
  selectedItems,
  isDownloading,
  onDeselectAll,
  onShowDetails,
  onRename,
  onDownload,
  onDelete,
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
            onClick={onDeselectAll}
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
        <IconButton
          variant="ghost"
          icon={<FileEditIcon />}
          onClick={() => onRename(selectedItems)}
          disabled={selectedItems.length === 0 || selectedItems.length > 1}
          aria-label="Rename selected item"
          title="Rename"
        />
        <IconButton
          variant="ghost"
          onClick={() => onDownload(selectedItems)}
          disabled={isDownloading || selectedItems.length === 0}
          icon={isDownloading ? <SpinnerIcon /> : <DownloadIcon />}
          aria-label="Download selected items"
          title="Download"
        />
        <IconButton
          variant="ghost"
          onClick={() => onDelete(selectedItems)}
          icon={<TrashIcon color="#a2030d" />}
          disabled={selectedItems.length === 0}
          aria-label="Delete selected items"
          title="Delete"
        />
        <IconButton
          variant="ghost"
          icon={<InfoIcon />}
          onClick={onShowDetails}
          aria-label="Show details"
          title="Details"
        />
      </div>
    </div>
  );
}
