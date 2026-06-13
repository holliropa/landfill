import type { ExplorerItem } from "@/features/explorer/types";

export type ExplorerMode = "folder" | "search";

export type ExplorerSelectionMode = "replace" | "toggle" | "range";

export type SelectionItem = {
  id: string;
  kind: "file" | "folder";
};

export type ExplorerContextMenuState = {
  x: number;
  y: number;
  itemKeys: string[];
} | null;

export type ExplorerState = {
  mode: ExplorerMode;
  folderId?: string;
  selectedKeys: Set<string>;
  anchorIndex: number | null;
  focusedIndex: number | null;
  isKeyboardActive: boolean;
  isDetailsOpen: boolean;
  contextMenu: ExplorerContextMenuState;
};

export type ExplorerAction =
  | { type: "props-changed"; mode: ExplorerMode; folderId?: string }
  | { type: "items-changed"; items: ExplorerItem[] }
  | { type: "focus"; index: number | null }
  | { type: "keyboard-active"; active: boolean }
  | { type: "select-one"; index: number }
  | { type: "toggle-select"; index: number }
  | { type: "select-range"; index: number }
  | { type: "select-all" }
  | { type: "clear-selection" }
  | { type: "open-details" }
  | { type: "close-details" }
  | { type: "toggle-details" }
  | {
      type: "open-context-menu";
      x: number;
      y: number;
      itemKeys: string[];
      focusIndex: number;
      replaceSelection: boolean;
    }
  | { type: "close-context-menu" };
