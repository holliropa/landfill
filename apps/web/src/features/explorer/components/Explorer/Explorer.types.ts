import type { ExplorerAction, ExplorerState } from "@/features/explorer/state";
import type { ExplorerItem } from "@/features/explorer/types";
import type { Dispatch, ReactNode } from "react";
import type { ExplorerFileViewerApi } from "@/features/explorer/hooks";

export type ExplorerSurface =
  | "toolbar"
  | "context-menu"
  | "keyboard"
  | "file-viewer"
  | "item"
  | "details";

export type ExplorerCommandShortcut = {
  key: string;
  primaryKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
};

export type ExplorerRuntime = {
  source: ExplorerSurface;
  targetItems: ExplorerItem[];
  items: ExplorerItem[];
  selectedItems: ExplorerItem[];
  contextMenuItems: ExplorerItem[];
  focusedItem?: ExplorerItem;
  state: ExplorerState;
  dispatch: Dispatch<ExplorerAction>;
  fileViewer: ExplorerFileViewerApi;
  clearSelection: () => void;
  closeContextMenu: () => void;
  openDetails: () => void;
  closeDetails: () => void;
  toggleDetails: () => void;
};

export type ExplorerCommand = {
  id: string;
  label: string;
  surfaces: readonly ExplorerSurface[];
  icon?: ReactNode | ((runtime: ExplorerRuntime) => ReactNode);
  order?: number;
  intent?: "default" | "danger";
  shortcut?: ExplorerCommandShortcut;
  isVisible?: (runtime: ExplorerRuntime) => boolean;
  isDisabled?: (runtime: ExplorerRuntime) => boolean;
  run: (runtime: ExplorerRuntime) => void | Promise<void>;
};
