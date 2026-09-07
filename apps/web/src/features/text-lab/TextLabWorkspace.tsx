import { Button } from "@/ui/Button";
import { IconButton } from "@/ui/IconButton";
import { SpinnerIcon } from "@/ui/SpinnerIcon";
import type { ExplorerItem } from "@/features/explorer";
import {
  getFileDownloadUrl,
  getFileRawUrl,
  useUpdateFileContent,
  useUploadFiles,
} from "@/lib/client";
import { formatSize } from "@/utils";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ColumnsIcon,
  DownloadIcon,
  EyeIcon,
  FileCodeIcon,
  FileEditIcon,
  FileTextIcon,
  RotateCcwIcon,
  SaveIcon,
  Wand2Icon,
  WrapTextIcon,
  XIcon,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { MarkdownPreview } from "./MarkdownPreview";
import styles from "./TextLabWorkspace.module.css";

export interface TextLabWorkspaceProps {
  file: ExplorerItem;
  folderId?: string;
  onClose: () => void;
  onSaved?: () => void;
}

type ViewMode = "edit" | "split" | "preview";

function isMarkdownFile(name: string): boolean {
  const ext = name.toLowerCase().slice(name.lastIndexOf("."));
  return [".md", ".markdown", ".mdown", ".mkdn", ".mdx"].includes(ext);
}

function isJsonFile(name: string): boolean {
  const ext = name.toLowerCase().slice(name.lastIndexOf("."));
  return [".json", ".geojson"].includes(ext);
}

export function TextLabWorkspace({
  file,
  folderId,
  onClose,
  onSaved,
}: TextLabWorkspaceProps) {
  const [content, setContent] = useState<string>("");
  const [originalContent, setOriginalContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [saveAsName, setSaveAsName] = useState<string>("");
  const [isSavingAs, setIsSavingAs] = useState<boolean>(false);
  const [wordWrap, setWordWrap] = useState<boolean>(true);

  const isMarkdown = isMarkdownFile(file.name);
  const [viewMode, setViewMode] = useState<ViewMode>(
    isMarkdown ? "split" : "edit",
  );

  const updateContentMutation = useUpdateFileContent();
  const uploadFilesMutation = useUploadFiles();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const isDirty = content !== originalContent;

  useEffect(() => {
    let cancelled = false;

    fetch(getFileRawUrl(file.id))
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (!cancelled) {
          setContent(text);
          setOriginalContent(text);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load file text:", err);
          setLoadError(err.message || "Failed to load file content");
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [file.id]);

  // Statistics
  const stats = useMemo(() => {
    const lines = content.length === 0 ? 0 : content.split(/\r?\n/).length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const characters = content.length;
    const bytes = new Blob([content]).size;
    return { lines, words, characters, bytes };
  }, [content]);

  // Handle Save (overwrite)
  const handleSave = useCallback(async () => {
    if (updateContentMutation.isPending) return;

    try {
      await updateContentMutation.mutateAsync({
        fileId: file.id,
        content,
        mimeType: file.mimeType || "text/plain",
      });
      setOriginalContent(content);
      toast.success("File saved successfully");
      onSaved?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save file");
    }
  }, [content, file.id, file.mimeType, onSaved, updateContentMutation]);

  // Handle Save As New File
  const handleSaveAs = async () => {
    if (!saveAsName.trim()) {
      toast.error("Please enter a valid filename");
      return;
    }

    try {
      const newFile = new File([content], saveAsName.trim(), {
        type: file.mimeType || "text/plain",
      });
      const targetFolderId = folderId || file.location?.id || "root";
      await uploadFilesMutation.mutateAsync({
        files: [newFile],
        parentFolderId: targetFolderId,
      });
      setIsSavingAs(false);
      setSaveAsName("");
      toast.success(`Created new file "${saveAsName.trim()}"`);
      onSaved?.();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create file");
    }
  };

  // Text utilities
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      setContent(formatted);
      toast.success("JSON formatted");
    } catch {
      toast.error("Invalid JSON syntax");
    }
  };

  const handleUpperCase = () => {
    setContent((prev) => prev.toUpperCase());
  };

  const handleLowerCase = () => {
    setContent((prev) => prev.toLowerCase());
  };

  const handleTrimWhitespace = () => {
    const trimmed = content
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n")
      .trim();
    setContent(trimmed);
    toast.success("Whitespace trimmed");
  };

  const handleSortLines = () => {
    const sorted = content
      .split("\n")
      .sort((a, b) => a.localeCompare(b))
      .join("\n");
    setContent(sorted);
    toast.success("Lines sorted");
  };

  const handleRevert = () => {
    if (confirm("Revert all changes back to the original file content?")) {
      setContent(originalContent);
      toast.info("Reverted changes");
    }
  };

  // Handle Tab key in editor
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      const newContent =
        content.substring(0, start) + "  " + content.substring(end);
      setContent(newContent);

      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Global shortcuts (Ctrl+S / Cmd+S, Escape)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape" && !isSavingAs) {
        if (isDirty) {
          if (
            confirm("You have unsaved changes. Do you want to close anyway?")
          ) {
            onClose();
          }
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleSave, isDirty, isSavingAs, onClose]);

  return createPortal(
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <div className={styles.workspace} ref={workspaceRef} tabIndex={-1}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.titleGroup}>
            <FileTextIcon size={20} className={styles.titleIcon} />
            <h1>Text Lab</h1>
            <span className={styles.fileName} title={file.name}>
              {file.name}
            </span>
            {isDirty && <span className={styles.dirtyBadge}>Unsaved</span>}
          </div>

          <div className={styles.headerActions}>
            {isMarkdown && (
              <div className={styles.viewModeGroup}>
                <button
                  type="button"
                  className={
                    viewMode === "edit"
                      ? styles.viewModeActive
                      : styles.viewModeBtn
                  }
                  onClick={() => setViewMode("edit")}
                  title="Editor only"
                >
                  <FileEditIcon size={16} />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  className={
                    viewMode === "split"
                      ? styles.viewModeActive
                      : styles.viewModeBtn
                  }
                  onClick={() => setViewMode("split")}
                  title="Split view"
                >
                  <ColumnsIcon size={16} />
                  <span>Split</span>
                </button>
                <button
                  type="button"
                  className={
                    viewMode === "preview"
                      ? styles.viewModeActive
                      : styles.viewModeBtn
                  }
                  onClick={() => setViewMode("preview")}
                  title="Markdown preview"
                >
                  <EyeIcon size={16} />
                  <span>Preview</span>
                </button>
              </div>
            )}

            <IconButton
              icon={<XIcon />}
              variant="ghost"
              size="medium"
              onClick={() => {
                if (isDirty) {
                  if (confirm("You have unsaved changes. Close anyway?")) {
                    onClose();
                  }
                } else {
                  onClose();
                }
              }}
              aria-label="Close Text Lab"
              title="Close (Esc)"
            />
          </div>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {/* Main Editing / Preview Area */}
          <div className={styles.editorPane}>
            {isLoading && (
              <div className={styles.stateCenter}>
                <SpinnerIcon size={32} />
                <span>Loading document...</span>
              </div>
            )}

            {loadError && (
              <div className={styles.stateCenter}>
                <AlertCircleIcon size={32} color="#dc2626" />
                <span>Error: {loadError}</span>
              </div>
            )}

            {!isLoading && !loadError && (
              <div
                className={`${styles.editorGrid} ${
                  viewMode === "split"
                    ? styles.splitView
                    : viewMode === "preview"
                      ? styles.previewOnly
                      : styles.editOnly
                }`}
              >
                {(viewMode === "edit" || viewMode === "split") && (
                  <div className={styles.textareaWrapper}>
                    <textarea
                      ref={textareaRef}
                      className={`${styles.textarea} ${wordWrap ? styles.wrap : styles.noWrap}`}
                      value={content}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                        setContent(e.target.value)
                      }
                      onKeyDown={handleKeyDown}
                      placeholder="Type or paste text here..."
                      spellCheck={false}
                    />
                  </div>
                )}

                {(viewMode === "preview" || viewMode === "split") && (
                  <div className={styles.previewWrapper}>
                    <div className={styles.previewHeader}>
                      Live Markdown Preview
                    </div>
                    <div className={styles.previewScroll}>
                      <MarkdownPreview content={content} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Tools & Stats */}
          <div className={styles.sidebar}>
            <div className={styles.sidebarSection}>
              <h3>Document Stats</h3>
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Lines</span>
                  <strong className={styles.statValue}>{stats.lines}</strong>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Words</span>
                  <strong className={styles.statValue}>{stats.words}</strong>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Characters</span>
                  <strong className={styles.statValue}>
                    {stats.characters}
                  </strong>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Size</span>
                  <strong className={styles.statValue}>
                    {formatSize(stats.bytes)}
                  </strong>
                </div>
              </div>
            </div>

            <div className={styles.sidebarSection}>
              <h3>Text Tools</h3>
              <div className={styles.toolsList}>
                <button
                  type="button"
                  className={styles.toolButton}
                  onClick={() => setWordWrap(!wordWrap)}
                >
                  <WrapTextIcon size={16} />
                  <span>Word Wrap: {wordWrap ? "ON" : "OFF"}</span>
                </button>

                {(isJsonFile(file.name) ||
                  content.trim().startsWith("{") ||
                  content.trim().startsWith("[")) && (
                  <button
                    type="button"
                    className={styles.toolButton}
                    onClick={handleFormatJson}
                  >
                    <FileCodeIcon size={16} />
                    <span>Format JSON</span>
                  </button>
                )}

                <button
                  type="button"
                  className={styles.toolButton}
                  onClick={handleTrimWhitespace}
                >
                  <Wand2Icon size={16} />
                  <span>Trim Whitespace</span>
                </button>

                <button
                  type="button"
                  className={styles.toolButton}
                  onClick={handleUpperCase}
                >
                  <span>A → UPPERCASE</span>
                </button>

                <button
                  type="button"
                  className={styles.toolButton}
                  onClick={handleLowerCase}
                >
                  <span>a → lowercase</span>
                </button>

                <button
                  type="button"
                  className={styles.toolButton}
                  onClick={handleSortLines}
                >
                  <span>Sort Lines (A-Z)</span>
                </button>
              </div>
            </div>

            {isDirty && (
              <div className={styles.sidebarSection}>
                <button
                  type="button"
                  className={styles.revertButton}
                  onClick={handleRevert}
                >
                  <RotateCcwIcon size={15} />
                  <span>Revert to original</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            {isDirty ? (
              <span className={styles.statusModified}>
                Modified · Press Ctrl+S to save
              </span>
            ) : (
              <span className={styles.statusClean}>
                <CheckCircle2Icon size={15} color="#16a34a" /> All changes saved
              </span>
            )}
          </div>

          <div className={styles.footerRight}>
            {isSavingAs ? (
              <div className={styles.saveAsForm}>
                <input
                  type="text"
                  className={styles.saveAsInput}
                  placeholder="New file name..."
                  value={saveAsName}
                  onChange={(e) => setSaveAsName(e.target.value)}
                  autoFocus
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSaveAs}
                  disabled={uploadFilesMutation.isPending}
                >
                  {uploadFilesMutation.isPending ? "Creating..." : "Create"}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setIsSavingAs(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <Button
                  variant="outlined"
                  size="medium"
                  onClick={() => {
                    setSaveAsName(`copy-${file.name}`);
                    setIsSavingAs(true);
                  }}
                >
                  Save As Copy...
                </Button>

                <a
                  href={getFileDownloadUrl(file.id)}
                  download={file.name}
                  className={styles.downloadLink}
                >
                  <Button variant="outlined" size="medium">
                    <DownloadIcon size={16} />
                    <span>Download</span>
                  </Button>
                </a>

                <Button
                  variant="contained"
                  size="medium"
                  onClick={handleSave}
                  disabled={!isDirty || updateContentMutation.isPending}
                >
                  <SaveIcon size={16} />
                  <span>
                    {updateContentMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
