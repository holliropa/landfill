import { FileIcon, FolderIcon } from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Explorer,
  type ExplorerCommand,
  type ExplorerItem,
  useExplorerController,
  useExplorerSorting,
} from "@/features/explorer";
import { useFileCapabilityIntegration } from "@/features/file-capabilities";
import {
  getArchiveEntryContentUrl,
  getArchiveEntryDownloadUrl,
  useArchiveDirectory,
} from "@/lib/client";
import { paths } from "@/router";
import { triggerDownload } from "@/utils";
import { ArchiveNavigationBar } from "./ArchiveNavigationBar";
import styles from "./ArchiveExplorerPage.module.css";

const toolbarCommandIds = ["download"] as const;
const contextMenuCommandIds = ["open", "download"] as const;
const viewerCommandIds = ["download"] as const;

export function ArchiveExplorerPage() {
  const params = useParams<"fileId" | "*">();
  const fileId = params.fileId ?? "";
  const archivePath = params["*"] ?? "";
  const navigate = useNavigate();
  const capabilities = useFileCapabilityIntegration();
  const directoryQuery = useArchiveDirectory(fileId, archivePath);
  const directory = directoryQuery.data;

  const items = useMemo<ExplorerItem[]>(() => {
    if (!directory) return [];
    return directory.items.map((item) => ({
      key: `archive:${directory.archive.contentRevisionId}:${item.id}`,
      id: item.id,
      kind: item.kind,
      name: item.name,
      createdAt: item.modifiedAt ?? directory.archive.createdAt,
      size: item.size,
      mimeType: item.mimeType,
      contentUrl:
        item.kind === "file" && item.entryIndex !== null && item.supported
          ? getArchiveEntryContentUrl(
              directory.archive.id,
              item.entryIndex,
              directory.archive.contentRevisionId,
            )
          : undefined,
      downloadUrl:
        item.kind === "file" && item.entryIndex !== null && item.supported
          ? getArchiveEntryDownloadUrl(
              directory.archive.id,
              item.entryIndex,
              directory.archive.contentRevisionId,
            )
          : undefined,
      origin: {
        kind: "archive",
        archiveFileId: directory.archive.id,
        contentRevisionId: directory.archive.contentRevisionId,
        path: item.path,
        entryIndex: item.entryIndex,
      },
      readOnly: true,
      location: {
        id: `archive:${directory.archive.id}`,
        name: directory.archive.name,
      },
      ThumbnailComponent:
        item.kind === "folder" ? (
          <FolderIcon size={18} />
        ) : (
          <FileIcon size={18} />
        ),
    }));
  }, [directory]);

  const { sortedItems, sort, changeSort } = useExplorerSorting(items);
  const controller = useExplorerController({ items: sortedItems });
  const commands = useMemo<ExplorerCommand[]>(
    () => [
      {
        id: "open",
        label: "Open",
        surfaces: ["item", "context-menu", "keyboard"],
        shortcut: { key: "Enter" },
        order: 10,
        isVisible: (runtime) => {
          const item = getPrimaryItem(runtime);
          return Boolean(
            runtime.targetItems.length === 1 &&
            item &&
            (item.kind === "folder" || item.contentUrl),
          );
        },
        run: (runtime) => {
          const item = getPrimaryItem(runtime);
          if (!item) return;
          if (item.kind === "folder" && item.origin?.kind === "archive") {
            navigate(paths.archivePath(fileId, item.origin.path));
            runtime.clearSelection();
            return;
          }
          if (item.contentUrl) runtime.fileViewer.openFile(item.id);
        },
      },
      {
        id: "download",
        label: "Download entry",
        surfaces: ["toolbar", "context-menu", "file-viewer", "keyboard"],
        shortcut: { key: "d", primaryKey: true },
        order: 20,
        isVisible: (runtime) =>
          runtime.targetItems.length === 1 &&
          Boolean(runtime.targetItems[0]?.downloadUrl),
        run: (runtime) => {
          const item = runtime.targetItems[0];
          if (item?.downloadUrl) triggerDownload(item.downloadUrl, item.name);
        },
      },
    ],
    [fileId, navigate],
  );

  const archiveFile = useMemo<ExplorerItem | null>(() => {
    if (!directory) return null;
    return {
      key: `file:${directory.archive.id}`,
      id: directory.archive.id,
      kind: "file",
      name: directory.archive.name,
      createdAt: directory.archive.createdAt,
      size: directory.archive.size,
      mimeType: directory.archive.mimeType,
      origin: { kind: "drive" },
      location: {
        id: directory.archive.folderId ?? "root",
        name: directory.archive.folderId ?? "root",
      },
      ThumbnailComponent: <FileIcon size={18} />,
    };
  }, [directory]);

  return (
    <div className={styles.root}>
      <ArchiveNavigationBar
        directory={directory}
        path={archivePath}
        onOpenPath={(path) => navigate(paths.archivePath(fileId, path))}
        onLeaveArchive={() => {
          if (!directory) return;
          navigate(paths.folderPath(directory.archive.folderId ?? "root"), {
            state: { revealItemKey: `file:${directory.archive.id}` },
          });
        }}
        onOpenLab={() => {
          if (archiveFile) capabilities.openWorkspace("archive", archiveFile);
        }}
      />

      <div className={styles.readOnlyNotice}>
        Archive contents are read-only. Extract entries to edit or move them.
      </div>

      <div className={styles.content}>
        <Explorer controller={controller} commands={commands}>
          <Explorer.KeyboardController
            enabled={!capabilities.isWorkspaceOpen}
          />
          <Explorer.Shell>
            <Explorer.Toolbar>
              <Explorer.SelectionSummary />
              <Explorer.ActionGroup surface="toolbar" ids={toolbarCommandIds} />
            </Explorer.Toolbar>
            <Explorer.Workspace>
              <Explorer.Content>
                <Explorer.List
                  ariaLabel={`Contents of ${directory?.archive.name ?? "archive"}`}
                  emptyState={{
                    title: "This archive folder is empty",
                    description: "There are no entries at this path.",
                  }}
                  errorState={{
                    title: "Could not open this archive",
                    description:
                      directoryQuery.error instanceof Error
                        ? directoryQuery.error.message
                        : "The ZIP file may be unavailable or invalid.",
                  }}
                  isLoading={directoryQuery.isLoading}
                  isError={directoryQuery.isError}
                  sort={sort}
                  onSortChange={changeSort}
                />
              </Explorer.Content>
            </Explorer.Workspace>
            <Explorer.ContextMenu ids={contextMenuCommandIds} />
          </Explorer.Shell>
          <Explorer.FileViewer actionIds={viewerCommandIds} />
        </Explorer>
      </div>
    </div>
  );
}

function getPrimaryItem(runtime: {
  source: string;
  focusedItem?: ExplorerItem;
  targetItems: ExplorerItem[];
}) {
  return runtime.source === "keyboard"
    ? runtime.focusedItem
    : runtime.targetItems[0];
}
