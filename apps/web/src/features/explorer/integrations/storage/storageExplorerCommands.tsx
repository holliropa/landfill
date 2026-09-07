import type {
  ExplorerCommand,
  ExplorerItem,
  ExplorerRuntime,
} from "@/features/explorer";
import { SpinnerIcon } from "@/ui/SpinnerIcon";
import {
  ArchiveRestoreIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileEditIcon,
  FolderInputIcon,
  InfoIcon,
  ImageIcon,
  Trash2Icon,
  TrashIcon,
} from "lucide-react";
import type { StorageItemActions } from "./useStorageItemActions";

type StorageExplorerCommandParams = {
  openFolder: (item: ExplorerItem) => void;
  openImageLab?: (item: ExplorerItem) => void;
  openTextLab?: (item: ExplorerItem) => void;
  storage: StorageItemActions;
};

export function createStorageExplorerCommands({
  openFolder,
  openImageLab,
  openTextLab,
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
      isVisible: (runtime) => runtime.targetItems.length > 0,
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
      isVisible: (runtime) => runtime.targetItems.length > 0,
      isDisabled: (runtime) =>
        storage.isDownloading || runtime.targetItems.length === 0,
      run: (runtime) => {
        void storage.downloadItems(runtime.targetItems);
      },
    },
    {
      id: "move",
      label: "Move",
      icon: () =>
        storage.isMoving ? (
          <SpinnerIcon size={16} />
        ) : (
          <FolderInputIcon size={16} />
        ),
      surfaces: ["toolbar", "context-menu", "details"],
      order: 35,
      isVisible: (runtime) => runtime.targetItems.length > 0,
      isDisabled: (runtime) =>
        storage.isMoving || runtime.targetItems.length === 0,
      run: (runtime) => {
        void storage.moveItems(runtime.targetItems);
      },
    },
    {
      id: "imageLab",
      label: "Image Lab",
      icon: <ImageIcon size={16} />,
      surfaces: ["toolbar", "context-menu", "file-viewer", "details"],
      order: 40,
      isVisible: (runtime) => {
        const item = runtime.targetItems[0];
        return (
          Boolean(openImageLab) &&
          runtime.targetItems.length === 1 &&
          item?.kind === "file" &&
          isImageLabCandidate(item)
        );
      },
      run: (runtime) => {
        const item = runtime.targetItems[0];
        if (!openImageLab || !item || item.kind !== "file") return;
        if (runtime.source === "file-viewer") {
          runtime.fileViewer.closeFile();
        }
        openImageLab(item);
      },
    },
    {
      id: "textLab",
      label: "Text Lab",
      icon: <FileEditIcon size={16} />,
      surfaces: ["toolbar", "context-menu", "file-viewer", "details"],
      order: 41,
      isVisible: (runtime) => {
        const item = runtime.targetItems[0];
        return (
          Boolean(openTextLab) &&
          runtime.targetItems.length === 1 &&
          item?.kind === "file" &&
          isTextLabCandidate(item)
        );
      },
      run: (runtime) => {
        const item = runtime.targetItems[0];
        if (!openTextLab || !item || item.kind !== "file") return;
        if (runtime.source === "file-viewer") {
          runtime.fileViewer.closeFile();
        }
        openTextLab(item);
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
      isVisible: (runtime) => runtime.targetItems.length > 0,
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

function isImageLabCandidate(item: ExplorerItem) {
  if (
    item.mimeType === "image/jpeg" ||
    item.mimeType === "image/png" ||
    item.mimeType === "image/webp"
  ) {
    return true;
  }

  return /\.(jpe?g|png|webp)$/i.test(item.name);
}

export function isTextLabCandidate(item: ExplorerItem) {
  if (
    item.mimeType?.startsWith("text/") ||
    item.mimeType === "application/json" ||
    item.mimeType === "application/javascript" ||
    item.mimeType === "application/typescript" ||
    item.mimeType === "application/xml" ||
    item.mimeType === "application/x-yaml" ||
    item.mimeType === "application/x-sh"
  ) {
    return true;
  }

  return /\.(txt|md|markdown|json|js|jsx|ts|tsx|html|css|scss|yaml|yml|xml|csv|tsv|log|sql|sh|bash|env|ini|conf|toml|py|rs|go|java|c|cpp|h)$/i.test(
    item.name,
  );
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
