import type { ExplorerItem } from "@/features/explorer";
import { paths } from "@/router";
import { useCallback, useMemo, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fileCapabilities } from "./registry";
import { FileCapabilityContext } from "./FileCapabilityContext";

export function FileCapabilityProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  const openWorkspace = useCallback(
    (capabilityId: string, file: ExplorerItem) => {
      navigate(paths.labPath(capabilityId, file.id), {
        state: {
          capabilityFile: {
            key: file.key,
            id: file.id,
            name: file.name,
            createdAt: file.createdAt.toISOString(),
            size: file.size,
            mimeType: file.mimeType,
            location: file.location,
          },
          returnTo: `${location.pathname}${location.search}`,
        },
      });
    },
    [location.pathname, location.search, navigate],
  );
  const openFile = useCallback(
    (file: ExplorerItem, fallback: () => void) => {
      const capability = fileCapabilities.find(
        (candidate) => candidate.defaultOpen && candidate.matches(file),
      );
      if (capability?.defaultOpen === "archive-browser") {
        navigate(paths.archivePath(file.id));
        return;
      }
      fallback();
    },
    [navigate],
  );

  const value = useMemo(
    () => ({
      openWorkspace,
      openFile,
      isWorkspaceOpen: location.pathname.startsWith("/labs/"),
    }),
    [location.pathname, openFile, openWorkspace],
  );

  return (
    <FileCapabilityContext.Provider value={value}>
      {children}
    </FileCapabilityContext.Provider>
  );
}
