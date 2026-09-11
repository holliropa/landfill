import { FileIcon } from "lucide-react";
import { Suspense } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import type { ExplorerItem } from "@/features/explorer";
import { useFile } from "@/lib/client";
import { paths } from "@/router";
import { SpinnerIcon } from "@/ui/SpinnerIcon";
import { fileCapabilities } from "./registry";
import type { CapabilityWorkspaceResult } from "./types";
import styles from "./CapabilityWorkspacePage.module.css";

type WorkspaceLocationState = {
  capabilityFile?: {
    key: string;
    id: string;
    name: string;
    createdAt: string;
    size: number | null;
    mimeType?: string | null;
    location?: ExplorerItem["location"];
  };
  returnTo?: string;
} | null;

export function CapabilityWorkspacePage() {
  const { capabilityId = "", fileId = "" } = useParams<{
    capabilityId: string;
    fileId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as WorkspaceLocationState;
  const suppliedFileState =
    state?.capabilityFile?.id === fileId ? state.capabilityFile : undefined;
  const suppliedFile: ExplorerItem | undefined = suppliedFileState
    ? {
        ...suppliedFileState,
        kind: "file",
        createdAt: new Date(suppliedFileState.createdAt),
        origin: { kind: "drive" },
        ThumbnailComponent: <FileIcon size={18} />,
      }
    : undefined;
  const fileQuery = useFile(fileId, { enabled: !suppliedFile });
  const storedFile = fileQuery.data;
  const file: ExplorerItem | undefined =
    suppliedFile ??
    (storedFile
      ? {
          key: `file:${storedFile.id}`,
          id: storedFile.id,
          kind: "file",
          name: storedFile.name,
          createdAt: storedFile.createdAt,
          size: storedFile.sizeBytes,
          mimeType: storedFile.mimeType,
          origin: { kind: "drive" },
          location: storedFile.folder,
          ThumbnailComponent: <FileIcon size={18} />,
        }
      : undefined);
  const capability = fileCapabilities.find(
    (candidate) => candidate.id === capabilityId,
  );
  const Workspace = capability?.Workspace;

  const close = () => {
    if (state?.returnTo?.startsWith("/")) {
      navigate(state.returnTo);
      return;
    }
    navigate(paths.folderPath(file?.location?.id ?? "root"));
  };
  const handleResult = (result: CapabilityWorkspaceResult) => {
    if (result.type === "open-folder") {
      navigate(paths.folderPath(result.folderId));
      return;
    }
    navigate(paths.folderPath(result.folderId), {
      state:
        result.type === "open-file"
          ? { openFileId: result.fileId }
          : { revealItemKey: `file:${result.fileId}` },
    });
  };

  if (!capability || !Workspace) {
    return (
      <WorkspaceStatus>That file capability is not installed.</WorkspaceStatus>
    );
  }
  if (fileQuery.isError) {
    return <WorkspaceStatus>Could not load this file.</WorkspaceStatus>;
  }
  if (!file) {
    return (
      <WorkspaceStatus>
        <SpinnerIcon size={22} /> Loading workspace…
      </WorkspaceStatus>
    );
  }
  if (!(capability.workspaceMatches ?? capability.matches)(file)) {
    return (
      <WorkspaceStatus>This workspace cannot open that file.</WorkspaceStatus>
    );
  }

  return (
    <Suspense
      fallback={
        <WorkspaceStatus>
          <SpinnerIcon size={22} /> Loading workspace…
        </WorkspaceStatus>
      }
    >
      <Workspace
        key={`${capability.id}:${file.key}`}
        file={file}
        onClose={close}
        onResult={handleResult}
      />
    </Suspense>
  );
}

function WorkspaceStatus({ children }: { children: React.ReactNode }) {
  return <div className={styles.status}>{children}</div>;
}
