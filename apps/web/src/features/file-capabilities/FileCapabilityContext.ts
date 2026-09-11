import { createContext } from "react";
import type { ExplorerItem } from "@/features/explorer";

export type FileCapabilityContextValue = {
  openWorkspace: (capabilityId: string, file: ExplorerItem) => void;
  openFile: (file: ExplorerItem, fallback: () => void) => void;
  isWorkspaceOpen: boolean;
};

export const FileCapabilityContext =
  createContext<FileCapabilityContextValue | null>(null);
