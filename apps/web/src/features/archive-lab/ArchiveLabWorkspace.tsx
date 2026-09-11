import type { ExplorerItem } from "@/features/explorer";
import {
  getArchiveEntryDownloadUrl,
  useArchiveLabSource,
  useExtractArchiveLab,
  type ArchiveLabEntry,
  type ArchiveLabExtraction,
} from "@/lib/client";
import { useDialog } from "@/providers";
import { Button } from "@/ui/Button";
import { IconButton } from "@/ui/IconButton";
import { SpinnerIcon } from "@/ui/SpinnerIcon";
import { formatSize, triggerDownload } from "@/utils";
import {
  AlertCircleIcon,
  ArchiveIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
  LockIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import styles from "./ArchiveLabWorkspace.module.css";

export type ArchiveLabWorkspaceProps = {
  file: ExplorerItem;
  onClose: () => void;
  onShowExtracted?: (extraction: ArchiveLabExtraction) => void;
};

type ArchiveTreeNode = {
  key: string;
  name: string;
  path: string;
  kind: "file" | "directory";
  entry?: ArchiveLabEntry;
  children: ArchiveTreeNode[];
  supportedIndexes: number[];
  totalSize: number;
};

export function ArchiveLabWorkspace({
  file,
  onClose,
  onShowExtracted,
}: ArchiveLabWorkspaceProps) {
  const dialog = useDialog();
  const workspaceRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const sourceQuery = useArchiveLabSource(file.id);
  const extractMutation = useExtractArchiveLab();
  const [selectedIndexes, setSelectedIndexes] = useState<Set<number>>(
    () => new Set(),
  );
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    () => new Set(),
  );
  const [extraction, setExtraction] = useState<ArchiveLabExtraction | null>(
    null,
  );
  const source = sourceQuery.data;
  const tree = useMemo(
    () => buildArchiveTree(source?.entries ?? []),
    [source?.entries],
  );
  const supportedIndexes = useMemo(
    () =>
      source?.entries
        .filter((entry) => entry.supported)
        .map((entry) => entry.index) ?? [],
    [source?.entries],
  );
  const selectedFileCount = useMemo(
    () =>
      source?.entries.filter(
        (entry) => entry.kind === "file" && selectedIndexes.has(entry.index),
      ).length ?? 0,
    [selectedIndexes, source?.entries],
  );

  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    workspaceRef.current?.focus({ preventScroll: true });

    return () => previousFocusRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || extractMutation.isPending) return;
      event.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [extractMutation.isPending, onClose]);

  const handleExtract = async (mode: "selected" | "all") => {
    if (!source || extractMutation.isPending) return;

    const destination = await dialog.selectFolder({
      title: mode === "all" ? "Extract archive" : "Extract selected entries",
      description: `A new "${removeZipExtension(source.name)}" folder will be created in the destination.`,
      confirmLabel: "Extract here",
      initialFolderId: file.location?.id ?? source.folderId ?? "root",
    });
    if (!destination) return;

    const entryIndexes =
      mode === "selected"
        ? [...selectedIndexes]
        : source.unsupportedEntryCount > 0
          ? supportedIndexes
          : undefined;

    try {
      const result = await extractMutation.mutateAsync({
        sourceFileId: source.id,
        destinationFolderId: destination.id,
        entryIndexes,
      });
      setExtraction(result);
      toast.success(
        `Extracted ${result.fileCount} ${result.fileCount === 1 ? "file" : "files"} to ${result.folderName}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not extract archive",
      );
    }
  };

  return createPortal(
    <div className={styles.backdrop}>
      <section
        className={styles.workspace}
        ref={workspaceRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="archive-lab-title"
        tabIndex={-1}
      >
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <ArchiveIcon size={22} aria-hidden="true" />
            <div>
              <h1 id="archive-lab-title">Archive Lab</h1>
              <p title={file.name}>{file.name}</p>
            </div>
          </div>
          <IconButton
            icon={<XIcon />}
            variant="ghost"
            size="large"
            disabled={extractMutation.isPending}
            onClick={onClose}
            aria-label="Close Archive Lab"
            title="Close"
          />
        </header>

        {sourceQuery.isLoading ? (
          <WorkspaceStatus icon={<SpinnerIcon size={24} />}>
            Reading ZIP directory…
          </WorkspaceStatus>
        ) : sourceQuery.isError || !source ? (
          <WorkspaceStatus icon={<AlertCircleIcon size={24} />} error>
            {sourceQuery.error instanceof Error
              ? sourceQuery.error.message
              : "Could not open this ZIP archive"}
          </WorkspaceStatus>
        ) : (
          <div className={styles.body}>
            <div className={styles.summary}>
              <SummaryFact
                label="Archive size"
                value={formatSize(source.size)}
              />
              <SummaryFact label="Files" value={String(source.fileCount)} />
              <SummaryFact
                label="Expanded size"
                value={formatSize(source.totalUncompressedSize)}
              />
              <SummaryFact
                label="Selected"
                value={`${selectedFileCount} ${selectedFileCount === 1 ? "file" : "files"}`}
              />
            </div>

            {source.unsupportedEntryCount > 0 && (
              <div className={styles.warning} role="status">
                <LockIcon size={17} aria-hidden="true" />
                {source.unsupportedEntryCount} encrypted or unsupported
                {source.unsupportedEntryCount === 1
                  ? " entry is"
                  : " entries are"}{" "}
                available for inspection but will be skipped by “Extract all”.
              </div>
            )}

            <div className={styles.treeToolbar}>
              <label className={styles.selectAll}>
                <SelectionCheckbox
                  checked={
                    supportedIndexes.length > 0 &&
                    supportedIndexes.every((index) =>
                      selectedIndexes.has(index),
                    )
                  }
                  mixed={
                    supportedIndexes.some((index) =>
                      selectedIndexes.has(index),
                    ) &&
                    !supportedIndexes.every((index) =>
                      selectedIndexes.has(index),
                    )
                  }
                  disabled={supportedIndexes.length === 0}
                  onChange={(event) =>
                    setSelectedIndexes(
                      event.currentTarget.checked
                        ? new Set(supportedIndexes)
                        : new Set(),
                    )
                  }
                />
                Select all supported entries
              </label>
              <span>{source.entryCount} ZIP entries</span>
            </div>

            <div className={styles.tree} role="tree" aria-label="ZIP contents">
              {tree.length === 0 ? (
                <div className={styles.empty}>This ZIP archive is empty.</div>
              ) : (
                tree.map((node) => (
                  <ArchiveTreeRow
                    key={node.key}
                    node={node}
                    depth={0}
                    sourceFileId={source.id}
                    selectedIndexes={selectedIndexes}
                    expandedPaths={expandedPaths}
                    onToggleExpanded={(path) =>
                      setExpandedPaths((current) =>
                        toggleSetValue(current, path),
                      )
                    }
                    onToggleSelection={(indexes, checked) =>
                      setSelectedIndexes((current) =>
                        updateSelection(current, indexes, checked),
                      )
                    }
                  />
                ))
              )}
            </div>
          </div>
        )}

        <footer className={styles.footer}>
          <div className={styles.result} aria-live="polite">
            {extractMutation.isPending ? (
              <>
                <SpinnerIcon size={17} /> Extracting files…
              </>
            ) : extraction ? (
              <>
                <FolderOpenIcon size={17} /> {extraction.folderName} ·{" "}
                {formatSize(extraction.totalSize)}
              </>
            ) : (
              <span>ZIP files are extracted into a new folder.</span>
            )}
          </div>
          {extraction && onShowExtracted && (
            <Button
              variant="outlined"
              startIcon={<FolderOpenIcon size={16} />}
              onClick={() => {
                onShowExtracted(extraction);
                onClose();
              }}
            >
              Show folder
            </Button>
          )}
          <Button
            variant="outlined"
            disabled={
              !source || selectedIndexes.size === 0 || extractMutation.isPending
            }
            onClick={() => void handleExtract("selected")}
          >
            Extract selected
          </Button>
          <Button
            variant="contained"
            disabled={
              !source ||
              extractMutation.isPending ||
              (source.entryCount > 0 && supportedIndexes.length === 0)
            }
            onClick={() => void handleExtract("all")}
          >
            Extract all
          </Button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

function ArchiveTreeRow({
  node,
  depth,
  sourceFileId,
  selectedIndexes,
  expandedPaths,
  onToggleExpanded,
  onToggleSelection,
}: {
  node: ArchiveTreeNode;
  depth: number;
  sourceFileId: string;
  selectedIndexes: Set<number>;
  expandedPaths: Set<string>;
  onToggleExpanded: (path: string) => void;
  onToggleSelection: (indexes: number[], checked: boolean) => void;
}) {
  const isDirectory = node.kind === "directory";
  const isExpanded = isDirectory && expandedPaths.has(node.path);
  const checked =
    node.supportedIndexes.length > 0 &&
    node.supportedIndexes.every((index) => selectedIndexes.has(index));
  const mixed =
    node.supportedIndexes.some((index) => selectedIndexes.has(index)) &&
    !checked;

  return (
    <>
      <div
        className={`${styles.treeRow} ${node.entry && !node.entry.supported ? styles.unsupported : ""}`}
        style={{ "--archive-depth": depth } as React.CSSProperties}
        role="treeitem"
        aria-expanded={isDirectory ? isExpanded : undefined}
      >
        <button
          type="button"
          className={styles.expandButton}
          disabled={!isDirectory || node.children.length === 0}
          onClick={() => onToggleExpanded(node.path)}
          aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.name}`}
        >
          {isDirectory && node.children.length > 0 ? (
            isExpanded ? (
              <ChevronDownIcon size={16} />
            ) : (
              <ChevronRightIcon size={16} />
            )
          ) : null}
        </button>
        <SelectionCheckbox
          checked={checked}
          mixed={mixed}
          disabled={node.supportedIndexes.length === 0}
          onChange={(event) =>
            onToggleSelection(
              node.supportedIndexes,
              event.currentTarget.checked,
            )
          }
          aria-label={`Select ${node.name}`}
        />
        <span className={styles.entryIcon} aria-hidden="true">
          {isDirectory ? <FolderIcon size={17} /> : <FileIcon size={17} />}
        </span>
        <span className={styles.entryName} title={node.path}>
          {node.name}
        </span>
        {node.entry && !node.entry.supported && (
          <span
            className={styles.entryWarning}
            title={
              node.entry.encrypted ? "Encrypted entry" : "Unsupported entry"
            }
          >
            {node.entry.encrypted ? (
              <LockIcon size={14} />
            ) : (
              <AlertCircleIcon size={14} />
            )}
            {node.entry.encrypted ? "Encrypted" : "Unsupported"}
          </span>
        )}
        <span className={styles.entrySize}>{formatSize(node.totalSize)}</span>
        {!isDirectory && node.entry?.supported && (
          <IconButton
            icon={<DownloadIcon />}
            variant="ghost"
            size="small"
            onClick={() =>
              triggerDownload(
                getArchiveEntryDownloadUrl(sourceFileId, node.entry!.index),
                node.name,
              )
            }
            aria-label={`Download ${node.name}`}
            title="Download entry"
          />
        )}
      </div>
      {isDirectory &&
        isExpanded &&
        node.children.map((child) => (
          <ArchiveTreeRow
            key={child.key}
            node={child}
            depth={depth + 1}
            sourceFileId={sourceFileId}
            selectedIndexes={selectedIndexes}
            expandedPaths={expandedPaths}
            onToggleExpanded={onToggleExpanded}
            onToggleSelection={onToggleSelection}
          />
        ))}
    </>
  );
}

function SelectionCheckbox({
  mixed,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { mixed?: boolean }) {
  const ref = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(mixed);
  }, [mixed]);

  return <input ref={ref} type="checkbox" {...props} />;
}

function SummaryFact({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.summaryFact}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function WorkspaceStatus({
  icon,
  error = false,
  children,
}: {
  icon: React.ReactNode;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`${styles.status} ${error ? styles.statusError : ""}`}>
      {icon}
      <span>{children}</span>
    </div>
  );
}

function buildArchiveTree(entries: ArchiveLabEntry[]) {
  const roots: ArchiveTreeNode[] = [];
  const directoryByPath = new Map<string, ArchiveTreeNode>();

  for (const entry of entries) {
    const segments = entry.path.split("/");
    const directorySegmentCount =
      entry.kind === "directory" ? segments.length : segments.length - 1;
    let parentChildren = roots;

    for (let index = 0; index < directorySegmentCount; index += 1) {
      const directoryPath = segments.slice(0, index + 1).join("/");
      let directory = directoryByPath.get(directoryPath);
      if (!directory) {
        directory = {
          key: `directory:${directoryPath}`,
          name: segments[index],
          path: directoryPath,
          kind: "directory",
          children: [],
          supportedIndexes: [],
          totalSize: 0,
        };
        directoryByPath.set(directoryPath, directory);
        parentChildren.push(directory);
      }
      if (entry.kind === "directory" && index === segments.length - 1) {
        directory.entry = entry;
      }
      parentChildren = directory.children;
    }

    if (entry.kind === "file") {
      parentChildren.push({
        key: `entry:${entry.index}`,
        name: entry.name,
        path: entry.path,
        kind: "file",
        entry,
        children: [],
        supportedIndexes: entry.supported ? [entry.index] : [],
        totalSize: entry.size,
      });
    }
  }

  const finalize = (nodes: ArchiveTreeNode[]) => {
    nodes.sort(
      (left, right) =>
        Number(right.kind === "directory") -
          Number(left.kind === "directory") ||
        left.name.localeCompare(right.name),
    );
    for (const node of nodes) {
      if (node.kind !== "directory") continue;
      finalize(node.children);
      node.supportedIndexes = [
        ...(node.entry?.supported ? [node.entry.index] : []),
        ...node.children.flatMap((child) => child.supportedIndexes),
      ];
      node.totalSize = node.children.reduce(
        (total, child) => total + child.totalSize,
        0,
      );
    }
  };
  finalize(roots);
  return roots;
}

function updateSelection(
  current: Set<number>,
  indexes: number[],
  selected: boolean,
) {
  const next = new Set(current);
  for (const index of indexes) {
    if (selected) next.add(index);
    else next.delete(index);
  }
  return next;
}

function toggleSetValue(current: Set<string>, value: string) {
  const next = new Set(current);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function removeZipExtension(fileName: string) {
  return fileName.replace(/\.zip$/i, "") || "Extracted archive";
}
