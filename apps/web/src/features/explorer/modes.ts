import type { ExplorerMode } from "./state";

export type ExplorerActionAvailability = {
  open: boolean;
  rename: boolean;
  download: boolean;
  delete: boolean;
  restore: boolean;
  permanentlyDelete: boolean;
  details: boolean;
};

export type ExplorerModeConfig = {
  actions: ExplorerActionAvailability;
  copy: {
    ariaLabel: string;
    emptyTitle: string;
    emptyDescription: string;
    errorTitle: string;
    errorDescription: string;
  };
};

const enabledStorageActions: ExplorerActionAvailability = {
  open: true,
  rename: true,
  download: true,
  delete: true,
  restore: false,
  permanentlyDelete: false,
  details: true,
};

export const explorerModeConfigs = {
  folder: {
    actions: enabledStorageActions,
    copy: {
      ariaLabel: "Folder contents",
      emptyTitle: "This folder is empty",
      emptyDescription:
        "Use the toolbar above to upload files or create a folder.",
      errorTitle: "Could not load this folder",
      errorDescription: "Check that the API is running, then try again.",
    },
  },
  search: {
    actions: enabledStorageActions,
    copy: {
      ariaLabel: "Search results",
      emptyTitle: "No results found",
      emptyDescription: "Try another search term.",
      errorTitle: "Could not load search results",
      errorDescription: "Check that the API is running, then try again.",
    },
  },
  trash: {
    actions: {
      open: false,
      rename: false,
      download: false,
      delete: false,
      restore: true,
      permanentlyDelete: true,
      details: false,
    },
    copy: {
      ariaLabel: "Trash contents",
      emptyTitle: "Trash is empty",
      emptyDescription: "Deleted files and folders will appear here.",
      errorTitle: "Could not load trash",
      errorDescription: "Check that the API is running, then try again.",
    },
  },
} satisfies Record<ExplorerMode, ExplorerModeConfig>;
