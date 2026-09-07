import { Button } from "@/ui/Button";
import { IconButton } from "@/ui/IconButton";
import { SpinnerIcon } from "@/ui/SpinnerIcon";
import type { ExplorerItem } from "@/features/explorer";
import {
  createImageLabPreview,
  getFileRawUrl,
  type ImageLabExport,
  type ImageLabFormat,
  type ImageLabPreview,
  type ImageLabSource,
  type ImageLabTransformRequest,
  useExportImageLab,
  useImageLabSource,
} from "@/lib/client";
import { formatSize } from "@/utils";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  ExternalLinkIcon,
  FolderOpenIcon,
  ImageIcon,
  XIcon,
} from "lucide-react";
import {
  type ChangeEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import styles from "./ImageLabWorkspace.module.css";

type PreviewMode = "before" | "after" | "split";
type ResizeMode = "original" | "percentage" | "dimensions";
type ZoomMode = "fit" | "actual";

export type ImageLabWorkspaceProps = {
  file: ExplorerItem;
  onClose: () => void;
  onExported?: (file: ImageLabExport) => void;
  onShowExported?: (file: ImageLabExport) => void;
  onOpenExported?: (file: ImageLabExport) => void;
};

export function ImageLabWorkspace({
  file,
  onClose,
  onExported,
  onShowExported,
  onOpenExported,
}: ImageLabWorkspaceProps) {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [format, setFormat] = useState<ImageLabFormat>(() =>
    getInitialFormat(file.mimeType),
  );
  const [outputBaseName, setOutputBaseName] = useState(() =>
    removeExtension(file.name),
  );
  const [resizeMode, setResizeMode] = useState<ResizeMode>("original");
  const [percentage, setPercentage] = useState("100");
  const [width, setWidth] = useState<string | null>(null);
  const [height, setHeight] = useState<string | null>(null);
  const [preserveRatio, setPreserveRatio] = useState(true);
  const [withoutEnlargement, setWithoutEnlargement] = useState(true);
  const [quality, setQuality] = useState(82);
  const [background, setBackground] = useState("#ffffff");
  const [previewMode, setPreviewMode] = useState<PreviewMode>("after");
  const [zoomMode, setZoomMode] = useState<ZoomMode>("fit");
  const [splitPosition, setSplitPosition] = useState(50);
  const [preview, setPreview] = useState<
    (ImageLabPreview & { url: string; signature: string }) | null
  >(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [exportState, setExportState] = useState<{
    signature: string;
    file?: ImageLabExport;
    error?: string;
  } | null>(null);

  const sourceQuery = useImageLabSource(file.id);
  const exportMutation = useExportImageLab();
  const source = sourceQuery.data;
  const widthValue = width ?? (source ? String(source.width) : "");
  const heightValue = height ?? (source ? String(source.height) : "");
  const extension = getFormatExtension(format);
  const normalizedBaseName = outputBaseName.trim();
  const outputName = `${normalizedBaseName}.${extension}`;
  const outputNameValid =
    normalizedBaseName.length > 0 &&
    outputName.length <= 255 &&
    !hasInvalidFileNameCharacters(normalizedBaseName);

  useEffect(() => {
    const backdrop = backdropRef.current;
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const backgroundElements = Array.from(document.body.children)
      .filter(
        (element): element is HTMLElement =>
          element instanceof HTMLElement &&
          element !== backdrop &&
          !["SCRIPT", "STYLE", "LINK"].includes(element.tagName),
      )
      .map((element) => ({
        element,
        inert: element.inert,
        ariaHidden: element.getAttribute("aria-hidden"),
      }));

    for (const { element } of backgroundElements) {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    }

    workspaceRef.current?.focus({ preventScroll: true });

    return () => {
      for (const { element, inert, ariaHidden } of backgroundElements) {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      }

      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus({ preventScroll: true });
      }
    };
  }, []);

  const resize = useMemo(
    () =>
      getResizeSettings({
        source,
        mode: resizeMode,
        percentage,
        width: widthValue,
        height: heightValue,
        preserveRatio,
        withoutEnlargement,
      }),
    [
      heightValue,
      percentage,
      preserveRatio,
      resizeMode,
      source,
      widthValue,
      withoutEnlargement,
    ],
  );

  const transformRequest = useMemo<ImageLabTransformRequest | null>(() => {
    if (!source || !resize.valid || !outputNameValid) return null;

    return {
      sourceFileId: source.id,
      output: { format, name: outputName },
      resize: resize.value,
      quality,
      background,
    };
  }, [
    background,
    format,
    outputName,
    outputNameValid,
    quality,
    resize,
    source,
  ]);
  const requestSignature = transformRequest
    ? JSON.stringify(transformRequest)
    : null;
  const exportedFile =
    requestSignature && exportState?.signature === requestSignature
      ? (exportState.file ?? null)
      : null;
  const exportError =
    requestSignature && exportState?.signature === requestSignature
      ? (exportState.error ?? null)
      : null;

  useEffect(() => {
    if (!transformRequest) return;

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      setPreviewLoading(true);
      setPreviewError(null);

      void createImageLabPreview(transformRequest, abortController.signal)
        .then((result) => {
          if (abortController.signal.aborted) return;

          const nextUrl = URL.createObjectURL(result.blob);
          const previousUrl = previewUrlRef.current;
          previewUrlRef.current = nextUrl;
          setPreview({
            ...result,
            url: nextUrl,
            signature: JSON.stringify(transformRequest),
          });
          if (previousUrl) URL.revokeObjectURL(previousUrl);
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setPreviewError(
            error instanceof Error ? error.message : "Could not update preview",
          );
        })
        .finally(() => {
          if (!abortController.signal.aborted) setPreviewLoading(false);
        });
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [transformRequest]);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const handleClose = () => {
    if (!exportMutation.isPending) onClose();
  };

  const currentPreview =
    requestSignature && preview?.signature === requestSignature
      ? preview
      : null;
  const actualPreviewWidth = currentPreview?.width ?? source?.width ?? 1;
  const actualPreviewHeight = currentPreview?.height ?? source?.height ?? 1;

  const handleExport = async () => {
    if (!transformRequest || !requestSignature || exportMutation.isPending) {
      return;
    }

    try {
      const result = await exportMutation.mutateAsync(transformRequest);
      setExportState({ signature: requestSignature, file: result });
      onExported?.(result);
    } catch (error) {
      setExportState({
        signature: requestSignature,
        error:
          error instanceof Error ? error.message : "Could not export image",
      });
    }
  };

  const handleWidthChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextWidth = event.currentTarget.value;
    setWidth(nextWidth);
    if (!source || !preserveRatio) return;

    const numericWidth = Number(nextWidth);
    if (isValidDimension(numericWidth)) {
      setHeight(
        String(
          Math.max(
            1,
            Math.round((numericWidth / source.width) * source.height),
          ),
        ),
      );
    }
  };

  const handleHeightChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextHeight = event.currentTarget.value;
    setHeight(nextHeight);
    if (!source || !preserveRatio) return;

    const numericHeight = Number(nextHeight);
    if (isValidDimension(numericHeight)) {
      setWidth(
        String(
          Math.max(
            1,
            Math.round((numericHeight / source.height) * source.width),
          ),
        ),
      );
    }
  };

  return createPortal(
    <div ref={backdropRef} className={styles.backdrop}>
      <section
        ref={workspaceRef}
        className={styles.workspace}
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-lab-title"
        tabIndex={-1}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Tab") {
            keepFocusInsideWorkspace(event, workspaceRef.current);
            return;
          }
          if (event.key !== "Escape" || exportMutation.isPending) return;
          event.preventDefault();
          onClose();
        }}
      >
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <ImageIcon size={20} aria-hidden="true" />
            <h1 id="image-lab-title">Image Lab</h1>
            <span className={styles.fileName} title={file.name}>
              {file.name}
            </span>
          </div>
          <IconButton
            variant="ghost"
            icon={<XIcon />}
            aria-label="Close Image Lab"
            title="Close"
            disabled={exportMutation.isPending}
            onClick={handleClose}
          />
        </header>

        {sourceQuery.isLoading ? (
          <WorkspaceStatus icon={<SpinnerIcon size={24} />}>
            Reading image…
          </WorkspaceStatus>
        ) : sourceQuery.isError || !source ? (
          <WorkspaceStatus icon={<AlertCircleIcon size={24} />} intent="error">
            {sourceQuery.error instanceof Error
              ? sourceQuery.error.message
              : "Could not open this image"}
          </WorkspaceStatus>
        ) : (
          <div className={styles.body}>
            <main className={styles.previewPane}>
              <div className={styles.previewToolbar}>
                <div className={styles.segmented} aria-label="Preview mode">
                  {(["before", "after", "split"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      className={
                        previewMode === mode ? styles.active : undefined
                      }
                      onClick={() => setPreviewMode(mode)}
                    >
                      {capitalize(mode)}
                    </button>
                  ))}
                </div>
                <div className={styles.segmented} aria-label="Preview zoom">
                  <button
                    type="button"
                    className={zoomMode === "fit" ? styles.active : undefined}
                    onClick={() => setZoomMode("fit")}
                  >
                    Fit
                  </button>
                  <button
                    type="button"
                    className={
                      zoomMode === "actual" ? styles.active : undefined
                    }
                    onClick={() => setZoomMode("actual")}
                  >
                    100%
                  </button>
                </div>
              </div>

              <div
                className={`${styles.previewStage} ${zoomMode === "actual" ? styles.actualStage : ""}`}
              >
                <div
                  className={`${styles.previewCanvas} ${zoomMode === "actual" ? styles.actualCanvas : ""}`}
                  style={
                    zoomMode === "actual"
                      ? {
                          width: actualPreviewWidth,
                          height: actualPreviewHeight,
                        }
                      : undefined
                  }
                >
                  <img
                    className={styles.previewImage}
                    src={getFileRawUrl(source.id)}
                    alt={`Original ${source.name}`}
                    hidden={previewMode === "after"}
                  />
                  {currentPreview && (
                    <img
                      className={`${styles.previewImage} ${previewMode === "split" ? styles.splitImage : ""}`}
                      src={currentPreview.url}
                      alt={`Preview of ${outputName}`}
                      hidden={previewMode === "before"}
                      style={
                        previewMode === "split"
                          ? {
                              clipPath: `inset(0 ${100 - splitPosition}% 0 0)`,
                            }
                          : undefined
                      }
                    />
                  )}
                  {previewMode === "split" && currentPreview && (
                    <div
                      className={styles.splitDivider}
                      style={{ left: `${splitPosition}%` }}
                      aria-hidden="true"
                    />
                  )}
                </div>
                {previewLoading && (
                  <div className={styles.previewLoading}>
                    <SpinnerIcon size={22} />
                    Updating preview…
                  </div>
                )}
                {previewError && (
                  <div className={styles.previewError} role="alert">
                    <AlertCircleIcon size={20} />
                    {previewError}
                  </div>
                )}
              </div>

              {previewMode === "split" && currentPreview && (
                <label className={styles.splitControl}>
                  <span>Before</span>
                  <input
                    type="range"
                    min="5"
                    max="95"
                    value={splitPosition}
                    onChange={(event) =>
                      setSplitPosition(Number(event.currentTarget.value))
                    }
                    aria-label="Split position"
                  />
                  <span>After</span>
                </label>
              )}

              <div className={styles.previewFacts}>
                <span>
                  Source {source.width}×{source.height} ·{" "}
                  {formatSize(source.size)}
                </span>
                <span>
                  Output {currentPreview?.outputWidth ?? "—"}×
                  {currentPreview?.outputHeight ?? "—"}
                  {currentPreview
                    ? ` · preview ${formatSize(currentPreview.size)}`
                    : ""}
                </span>
              </div>
            </main>

            <aside className={styles.settings} aria-label="Image settings">
              <SettingsSection title="Output">
                <label className={styles.field}>
                  <span>Format</span>
                  <select
                    value={format}
                    onChange={(event) =>
                      setFormat(event.currentTarget.value as ImageLabFormat)
                    }
                  >
                    {source.supportedOutputs.map((outputFormat) => (
                      <option key={outputFormat} value={outputFormat}>
                        {getFormatLabel(outputFormat)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.field}>
                  <span>Name</span>
                  <div
                    className={`${styles.nameInput} ${!outputNameValid ? styles.invalid : ""}`}
                  >
                    <input
                      value={outputBaseName}
                      onChange={(event) =>
                        setOutputBaseName(event.currentTarget.value)
                      }
                      aria-invalid={!outputNameValid}
                    />
                    <span>.{extension}</span>
                  </div>
                </label>
                <p className={styles.hint}>
                  Saved beside the source as a new file.
                </p>
              </SettingsSection>

              <SettingsSection title="Resize">
                <label className={styles.field}>
                  <span>Mode</span>
                  <select
                    value={resizeMode}
                    onChange={(event) =>
                      setResizeMode(event.currentTarget.value as ResizeMode)
                    }
                  >
                    <option value="original">Original dimensions</option>
                    <option value="percentage">Percentage</option>
                    <option value="dimensions">Dimensions</option>
                  </select>
                </label>

                {resizeMode === "percentage" && (
                  <label className={styles.field}>
                    <span>Scale</span>
                    <div className={styles.inputSuffix}>
                      <input
                        type="number"
                        min="1"
                        max="400"
                        value={percentage}
                        onChange={(event) =>
                          setPercentage(event.currentTarget.value)
                        }
                      />
                      <span>%</span>
                    </div>
                  </label>
                )}

                {resizeMode === "dimensions" && (
                  <>
                    <div className={styles.dimensionGrid}>
                      <label className={styles.field}>
                        <span>Width</span>
                        <input
                          type="number"
                          min="1"
                          max="32768"
                          value={widthValue}
                          onChange={handleWidthChange}
                        />
                      </label>
                      <label className={styles.field}>
                        <span>Height</span>
                        <input
                          type="number"
                          min="1"
                          max="32768"
                          value={heightValue}
                          onChange={handleHeightChange}
                        />
                      </label>
                    </div>
                    <CheckField
                      checked={preserveRatio}
                      onChange={setPreserveRatio}
                    >
                      Preserve aspect ratio
                    </CheckField>
                  </>
                )}

                {resizeMode !== "original" && (
                  <CheckField
                    checked={withoutEnlargement}
                    onChange={setWithoutEnlargement}
                  >
                    Do not enlarge
                  </CheckField>
                )}

                {!resize.valid && (
                  <p className={styles.validation} role="alert">
                    Enter valid dimensions between 1 and 32768 pixels.
                  </p>
                )}
              </SettingsSection>

              {(format === "jpeg" || format === "webp") && (
                <SettingsSection title="Quality">
                  <label className={styles.rangeField}>
                    <span>Quality</span>
                    <output>{quality}</output>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={quality}
                      onChange={(event) =>
                        setQuality(Number(event.currentTarget.value))
                      }
                    />
                  </label>
                </SettingsSection>
              )}

              {format === "jpeg" && source.hasAlpha && (
                <SettingsSection title="Transparency">
                  <label className={styles.colorField}>
                    <span>JPEG background</span>
                    <input
                      type="color"
                      value={background}
                      onChange={(event) =>
                        setBackground(event.currentTarget.value)
                      }
                    />
                    <code>{background.toUpperCase()}</code>
                  </label>
                </SettingsSection>
              )}
            </aside>
          </div>
        )}

        <footer className={styles.footer}>
          <div className={styles.resultArea} aria-live="polite">
            {exportedFile ? (
              <span className={styles.success}>
                <CheckCircle2Icon size={17} />
                {exportedFile.name} · {formatSize(exportedFile.size)} saved
              </span>
            ) : exportError ? (
              <span className={styles.failure} role="alert">
                <AlertCircleIcon size={17} />
                {exportError}
              </span>
            ) : (
              <span>Source remains unchanged.</span>
            )}
          </div>
          <Button
            variant="text"
            disabled={exportMutation.isPending}
            onClick={handleClose}
          >
            {exportedFile ? "Done" : "Cancel"}
          </Button>
          {exportedFile && onShowExported && (
            <Button
              variant="outlined"
              startIcon={<FolderOpenIcon size={16} />}
              onClick={() => {
                onShowExported(exportedFile);
                onClose();
              }}
            >
              Show in folder
            </Button>
          )}
          {exportedFile && onOpenExported && (
            <Button
              variant="outlined"
              startIcon={<ExternalLinkIcon size={16} />}
              onClick={() => {
                onOpenExported(exportedFile);
                onClose();
              }}
            >
              Open image
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={
              exportMutation.isPending ? <SpinnerIcon size={16} /> : undefined
            }
            disabled={
              !transformRequest ||
              !currentPreview ||
              previewLoading ||
              Boolean(previewError) ||
              exportMutation.isPending ||
              sourceQuery.isError
            }
            onClick={() => void handleExport()}
          >
            {exportMutation.isPending ? "Exporting…" : "Export new file"}
          </Button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.settingsSection}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function CheckField({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label className={styles.checkField}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      <span>{children}</span>
    </label>
  );
}

function WorkspaceStatus({
  icon,
  intent,
  children,
}: {
  icon: ReactNode;
  intent?: "error";
  children: ReactNode;
}) {
  return (
    <div
      className={`${styles.workspaceStatus} ${intent === "error" ? styles.statusError : ""}`}
      role={intent === "error" ? "alert" : undefined}
    >
      {icon}
      <span>{children}</span>
    </div>
  );
}

function getResizeSettings({
  source,
  mode,
  percentage,
  width,
  height,
  preserveRatio,
  withoutEnlargement,
}: {
  source: ImageLabSource | undefined;
  mode: ResizeMode;
  percentage: string;
  width: string;
  height: string;
  preserveRatio: boolean;
  withoutEnlargement: boolean;
}): {
  valid: boolean;
  value?: ImageLabTransformRequest["resize"];
} {
  if (!source || mode === "original") return { valid: Boolean(source) };

  if (mode === "percentage") {
    const numericPercentage = Number(percentage);
    if (
      !Number.isFinite(numericPercentage) ||
      numericPercentage < 1 ||
      numericPercentage > 400
    ) {
      return { valid: false };
    }

    const targetWidth = Math.max(
      1,
      Math.round(source.width * (numericPercentage / 100)),
    );
    const targetHeight = Math.max(
      1,
      Math.round(source.height * (numericPercentage / 100)),
    );
    if (!isValidDimension(targetWidth) || !isValidDimension(targetHeight)) {
      return { valid: false };
    }

    return {
      valid: true,
      value: {
        width: targetWidth,
        height: targetHeight,
        fit: "inside",
        withoutEnlargement,
      },
    };
  }

  const numericWidth = Number(width);
  const numericHeight = Number(height);
  if (!isValidDimension(numericWidth) || !isValidDimension(numericHeight)) {
    return { valid: false };
  }

  return {
    valid: true,
    value: {
      width: numericWidth,
      height: numericHeight,
      fit: preserveRatio ? "inside" : "fill",
      withoutEnlargement,
    },
  };
}

function isValidDimension(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= 32_768;
}

function getInitialFormat(mimeType: string | null | undefined): ImageLabFormat {
  if (mimeType === "image/jpeg") return "jpeg";
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/webp") return "webp";
  return "webp";
}

function getFormatExtension(format: ImageLabFormat) {
  return format === "jpeg" ? "jpg" : format;
}

function getFormatLabel(format: ImageLabFormat) {
  return format === "jpeg" ? "JPEG" : format.toUpperCase();
}

function removeExtension(fileName: string) {
  const finalDot = fileName.lastIndexOf(".");
  return finalDot > 0 ? fileName.slice(0, finalDot) : fileName;
}

function capitalize(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function keepFocusInsideWorkspace(
  event: ReactKeyboardEvent<HTMLElement>,
  workspace: HTMLElement | null,
) {
  if (!workspace) return;

  const focusableElements = Array.from(
    workspace.querySelectorAll<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (element) =>
      element.offsetParent !== null &&
      element.getAttribute("aria-hidden") !== "true",
  );
  if (focusableElements.length === 0) {
    event.preventDefault();
    workspace.focus({ preventScroll: true });
    return;
  }

  const first = focusableElements[0];
  const last = focusableElements.at(-1);
  const activeElement = document.activeElement;

  if (
    event.shiftKey &&
    (activeElement === workspace ||
      activeElement === first ||
      !workspace.contains(activeElement))
  ) {
    event.preventDefault();
    last?.focus();
  } else if (
    !event.shiftKey &&
    (activeElement === workspace ||
      activeElement === last ||
      !workspace.contains(activeElement))
  ) {
    event.preventDefault();
    first?.focus();
  }
}

function hasInvalidFileNameCharacters(value: string) {
  if (value.includes("/") || value.includes("\\")) return true;

  for (const character of value) {
    if (character.charCodeAt(0) <= 31) return true;
  }
  return false;
}
