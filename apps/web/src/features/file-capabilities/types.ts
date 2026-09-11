import type { ExplorerItem, ExplorerSurface } from "@/features/explorer";
import type { FileResponse } from "@/lib/client/api";
import type { ComponentType, LazyExoticComponent, ReactNode } from "react";

export type CapabilityFile = Pick<ExplorerItem, "name" | "mimeType">;

export type CapabilityWorkspaceResult =
  | { type: "reveal-file"; fileId: string; folderId: string }
  | { type: "open-file"; fileId: string; folderId: string }
  | { type: "open-folder"; folderId: string };

export type CapabilityWorkspaceProps = {
  file: ExplorerItem;
  onClose: () => void;
  onResult: (result: CapabilityWorkspaceResult) => void;
};

export type FileCapability = {
  id: string;
  matches: (file: CapabilityFile) => boolean;
  Preview?: ComponentType<{ file: FileResponse }>;
  Workspace?: LazyExoticComponent<ComponentType<CapabilityWorkspaceProps>>;
  workspaceMatches?: (file: CapabilityFile) => boolean;
  workspaceCommand?: {
    id: string;
    label: string;
    icon: ReactNode;
    surfaces: readonly ExplorerSurface[];
    order: number;
  };
  defaultOpen?: "archive-browser";
};
