import type {
  ExplorerCommand,
  ExplorerItem,
  ExplorerRuntime,
} from "@/features/explorer";
import { SpinnerIcon } from "@/ui/SpinnerIcon";
import {
  ArchiveRestoreIcon,
  ArrowLeftRight,
  DownloadIcon,
  ExternalLinkIcon,
  FileEditIcon,
  InfoIcon,
  Trash2Icon,
  TrashIcon,
} from "lucide-react";
import type { StorageItemActions } from "./useStorageItemActions";

type StorageExplorerCommandParams = {
  openFolder: (item: ExplorerItem) => void;
  openConversion: (item: ExplorerItem) => void;
  storage: StorageItemActions;
};

export function createStorageExplorerCommands({
  openFolder,
  openConversion,
  storage,
}: StorageExplorerCommandParams): ExplorerCommand[] {
  return [
    {
      id: "open",
      label: "Open",
      icon: <ExternalLinkIcon size={16} />,
      surfaces: ["item", "context-menu", "keyboard", "details"],
      shortcut: { key: "Enter" },
      order: 10,
      isVisible: (runtime) =>
        getPrimaryCommandItem(runtime) !== undefined &&
        runtime.targetItems.length === 1,
      run: (runtime) => {
        const item = getPrimaryCommandItem(runtime);
        if (!item) return;

        if (item.kind === "folder") {
          openFolder(item);
          runtime.clearSelection();
          return;
        }

        runtime.fileViewer.openFile(item.id);
      },
    },
    {
      id: "rename",
      label: "Rename",
      icon: () =>
        storage.isRenaming ? (
          <SpinnerIcon size={16} />
        ) : (
          <FileEditIcon size={16} />
        ),
      surfaces: ["toolbar", "context-menu", "keyboard", "details"],
      shortcut: { key: "F2" },
      order: 20,
      isDisabled: (runtime) =>
        storage.isRenaming || runtime.targetItems.length !== 1,
      run: (runtime) => {
        void storage.renameItems(runtime.targetItems);
      },
    },
    {
      id: "download",
      label: "Download",
      icon: () =>
        storage.isDownloading ? (
          <SpinnerIcon size={16} />
        ) : (
          <DownloadIcon size={16} />
        ),
      surfaces: [
        "toolbar",
        "context-menu",
        "file-viewer",
        "keyboard",
        "details",
      ],
      shortcut: { key: "d", primaryKey: true },
      order: 30,
      isDisabled: (runtime) =>
        storage.isDownloading || runtime.targetItems.length === 0,
      run: (runtime) => {
        void storage.downloadItems(runtime.targetItems);
      },
    },
    {
      id: "details",
      label: "Details",
      icon: <InfoIcon size={16} />,
      surfaces: ["toolbar", "context-menu"],
      order: 40,
      run: (runtime) => {
        if (runtime.source === "toolbar") {
          runtime.toggleDetails();
          return;
        }

        runtime.openDetails();
      },
    },
    {
      id: "convert",
      label: "Convert",
      icon: <ArrowLeftRight size={16} />,
      surfaces: ["toolbar", "context-menu"],
      order: 50,
      isDisabled: (runtime) => {
        return runtime.targetItems.length > 1;
      },
      isVisible: (runtime) => {
        return runtime.targetItems.every((item) => item.kind === "file");
      },
      run: (runtime) => {
        const item = runtime.targetItems[0];

        if (!item || item.kind !== "file") return;

        openConversion(item);
      },
    },
    {
      id: "moveToTrash",
      label: "Move to trash",
      icon: () =>
        storage.isDeleting ? (
          <SpinnerIcon size={16} />
        ) : (
          <TrashIcon color="#a2030d" size={16} />
        ),
      surfaces: [
        "toolbar",
        "context-menu",
        "file-viewer",
        "keyboard",
        "details",
      ],
      shortcut: { key: "Delete" },
      order: 50,
      intent: "danger",
      isDisabled: (runtime) =>
        storage.isDeleting || runtime.targetItems.length === 0,
      run: (runtime) => {
        if (runtime.source === "file-viewer") {
          runtime.fileViewer.closeFile();
        }

        void storage.deleteItems(runtime.targetItems);
      },
    },
  ];
}

export function createTrashExplorerCommands(
  storage: StorageItemActions,
): ExplorerCommand[] {
  return [
    {
      id: "restore",
      label: "Restore",
      icon: () =>
        storage.isRestoring ? (
          <SpinnerIcon size={16} />
        ) : (
          <ArchiveRestoreIcon size={16} />
        ),
      surfaces: ["toolbar", "context-menu", "keyboard"],
      shortcut: { key: "r", primaryKey: true },
      order: 10,
      isDisabled: (runtime) =>
        storage.isRestoring || runtime.targetItems.length === 0,
      run: (runtime) => {
        void storage.restoreItems(runtime.targetItems);
      },
    },
    {
      id: "deleteForever",
      label: "Delete permanently",
      icon: () =>
        storage.isPermanentlyDeleting ? (
          <SpinnerIcon size={16} />
        ) : (
          <Trash2Icon color="#a2030d" size={16} />
        ),
      surfaces: ["toolbar", "context-menu", "keyboard"],
      shortcut: { key: "Delete" },
      order: 20,
      intent: "danger",
      isDisabled: (runtime) =>
        storage.isPermanentlyDeleting || runtime.targetItems.length === 0,
      run: (runtime) => {
        void storage.permanentlyDeleteItems(runtime.targetItems);
      },
    },
  ];
}

function getPrimaryCommandItem(runtime: ExplorerRuntime) {
  if (runtime.source === "keyboard") {
    return runtime.focusedItem;
  }

  return runtime.targetItems[0];
}
