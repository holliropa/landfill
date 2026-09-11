import {
  isDriveExplorerItem,
  type ExplorerCommand,
  type ExplorerItem,
} from "@/features/explorer";
import { useCallback, useMemo } from "react";
import { fileCapabilities } from "./registry";
import { useFileCapabilityHost } from "./useFileCapabilityHost";

export function useFileCapabilityIntegration() {
  const host = useFileCapabilityHost();

  const commands = useMemo<ExplorerCommand[]>(
    () =>
      fileCapabilities.flatMap((capability) => {
        const definition = capability.workspaceCommand;
        if (!definition || !capability.Workspace) return [];

        return [
          {
            ...definition,
            isVisible: (runtime) => {
              const item = runtime.targetItems[0];
              return Boolean(
                runtime.targetItems.length === 1 &&
                item?.kind === "file" &&
                isDriveExplorerItem(item) &&
                (capability.workspaceMatches ?? capability.matches)(item),
              );
            },
            run: (runtime) => {
              const item = runtime.targetItems[0];
              if (!item || item.kind !== "file") return;
              if (runtime.source === "file-viewer") {
                runtime.fileViewer.closeFile();
              }
              host.openWorkspace(capability.id, item);
            },
          },
        ];
      }),
    [host],
  );

  const openFile = useCallback(
    (file: ExplorerItem, fallback: () => void) => host.openFile(file, fallback),
    [host],
  );

  return {
    commands,
    openFile,
    openWorkspace: host.openWorkspace,
    isWorkspaceOpen: host.isWorkspaceOpen,
  };
}
