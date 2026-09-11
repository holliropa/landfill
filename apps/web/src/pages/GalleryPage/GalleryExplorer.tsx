import {
  Explorer,
  createExplorerRuntime,
  isExplorerCommandDisabled,
  isExplorerCommandVisible,
  type ExplorerItem,
  type ExplorerSort,
  useExplorerContext,
  useExplorerController,
  useExplorerSorting,
} from "@/features/explorer";
import {
  createStorageExplorerCommands,
  getStorageDetailsTarget,
  StorageDetailsView,
  useStorageItemActions,
} from "@/features/explorer/integrations/storage";
import { useFileCapabilityIntegration } from "@/features/file-capabilities";
import {
  type FolderNavigationTarget,
  useFolderNavigation,
} from "@/hooks/useFolderNavigation";
import { IconButton } from "@/ui/IconButton";
import { formatDate, formatSize } from "@/utils";
import {
  AlertCircleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  FilmIcon,
  ImageIcon,
  ImagesIcon,
  LayersIcon,
  MusicIcon,
  PlayCircleIcon,
} from "lucide-react";
import {
  type MouseEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./GalleryExplorer.module.css";

const toolbarCommandIds = [
  "rename",
  "download",
  "move",
  "createArchive",
  "imageLab",
  "textLab",
  "archiveLab",
  "moveToTrash",
  "details",
] as const;
const contextMenuCommandIds = [
  "open",
  "rename",
  "download",
  "move",
  "createArchive",
  "imageLab",
  "textLab",
  "archiveLab",
  "details",
  "moveToTrash",
] as const;
const viewerCommandIds = [
  "imageLab",
  "textLab",
  "archiveLab",
  "download",
  "moveToTrash",
] as const;
const detailsCommandIds = [
  "open",
  "rename",
  "download",
  "move",
  "createArchive",
  "imageLab",
  "textLab",
  "archiveLab",
  "moveToTrash",
] as const;
const galleryPageSize = 60;

export function GalleryExplorer({
  items,
  isLoading,
  isError,
  mediaType = "all",
  onMediaTypeChange,
}: {
  items: ExplorerItem[];
  isLoading: boolean;
  isError: boolean;
  mediaType?: "all" | "image" | "video" | "audio";
  onMediaTypeChange?: (type: "all" | "image" | "video" | "audio") => void;
}) {
  const { sortedItems, sort, changeSort } = useExplorerSorting(
    items,
    "landfill:gallery-sort",
  );
  const controller = useExplorerController({ items: sortedItems });
  const [isSlideshowRunning, setIsSlideshowRunning] = useState(false);
  const openFolder = useFolderNavigation();
  const capabilities = useFileCapabilityIntegration();
  const storage = useStorageItemActions({
    onAfterItemsChanged: controller.clearSelection,
  });
  const commands = useMemo(
    () => [
      ...createStorageExplorerCommands({
        openFolder,
        openFile: capabilities.openFile,
        storage,
      }),
      ...capabilities.commands,
    ],
    [capabilities.commands, capabilities.openFile, openFolder, storage],
  );
  const detailsTitleId = useId();

  // Slideshow auto-advance timer
  useEffect(() => {
    if (!isSlideshowRunning || !controller.fileViewer.isOpen) {
      return;
    }

    const interval = setInterval(() => {
      if (controller.fileViewer.hasNextFile) {
        controller.fileViewer.openNextFile();
      } else {
        // loop back to first item
        const first = sortedItems[0];
        if (first) controller.fileViewer.openFile(first.id);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [controller.fileViewer, isSlideshowRunning, sortedItems]);

  const handleStartSlideshow = () => {
    if (sortedItems.length === 0) return;
    const startIndex = controller.selectedItems[0]
      ? sortedItems.findIndex((it) => it.id === controller.selectedItems[0].id)
      : 0;
    const targetItem = sortedItems[startIndex >= 0 ? startIndex : 0];
    if (targetItem) {
      controller.fileViewer.openFile(targetItem.id);
      setIsSlideshowRunning(true);
    }
  };

  return (
    <Explorer controller={controller} commands={commands}>
      <Explorer.KeyboardController enabled={!capabilities.isWorkspaceOpen} />

      <Explorer.Shell>
        <GalleryHeader
          count={items.length}
          sort={sort}
          onSortChange={changeSort}
          mediaType={mediaType}
          onMediaTypeChange={onMediaTypeChange}
          onStartSlideshow={handleStartSlideshow}
        />

        <Explorer.Toolbar>
          <Explorer.SelectionSummary />
          <GallerySelectionHint />
          <Explorer.ActionGroup surface="toolbar" ids={toolbarCommandIds} />
        </Explorer.Toolbar>

        <Explorer.Workspace>
          <Explorer.Content>
            <GalleryGrid
              isLoading={isLoading}
              isError={isError}
              onOpenFolder={openFolder}
            />
          </Explorer.Content>

          <Explorer.DetailsPanel ariaLabelledBy={detailsTitleId}>
            {(runtime) => (
              <StorageDetailsView
                target={getStorageDetailsTarget({
                  selectedItems: runtime.selectedItems,
                })}
                onClose={runtime.closeDetails}
                titleId={detailsTitleId}
                actions={
                  runtime.targetItems.length > 0 ? (
                    <Explorer.ActionGroup
                      surface="details"
                      ids={detailsCommandIds}
                      targetItems={runtime.targetItems}
                      size="small"
                    />
                  ) : undefined
                }
              />
            )}
          </Explorer.DetailsPanel>
        </Explorer.Workspace>

        <Explorer.ContextMenu ids={contextMenuCommandIds} />
      </Explorer.Shell>

      <Explorer.FileViewer actionIds={viewerCommandIds} />
    </Explorer>
  );
}

function GallerySelectionHint() {
  const { controller } = useExplorerContext();
  if (controller.selectedCount > 0) return null;

  return (
    <span className={styles.selectionHint}>Select an item to act on it</span>
  );
}

function GalleryHeader({
  count,
  sort,
  onSortChange,
  mediaType,
  onMediaTypeChange,
  onStartSlideshow,
}: {
  count: number;
  sort: ExplorerSort;
  onSortChange: (key: ExplorerSort["key"]) => void;
  mediaType: "all" | "image" | "video" | "audio";
  onMediaTypeChange?: (type: "all" | "image" | "video" | "audio") => void;
  onStartSlideshow: () => void;
}) {
  const getHeaderInfo = () => {
    switch (mediaType) {
      case "image":
        return {
          title: "Images",
          icon: <ImageIcon size={20} aria-hidden="true" />,
          label: count === 1 ? "image" : "images",
        };
      case "video":
        return {
          title: "Videos",
          icon: <FilmIcon size={20} aria-hidden="true" />,
          label: count === 1 ? "video" : "videos",
        };
      case "audio":
        return {
          title: "Audio",
          icon: <MusicIcon size={20} aria-hidden="true" />,
          label: count === 1 ? "track" : "tracks",
        };
      case "all":
      default:
        return {
          title: "Media Gallery",
          icon: <ImagesIcon size={20} aria-hidden="true" />,
          label: count === 1 ? "media item" : "media items",
        };
    }
  };

  const info = getHeaderInfo();

  return (
    <header className={styles.header}>
      <div className={styles.heading}>
        <span className={styles.headingIcon}>{info.icon}</span>
        <div>
          <h1>{info.title}</h1>
          <p>
            {count} {info.label} across all folders
          </p>
        </div>
      </div>

      {onMediaTypeChange && (
        <div className={styles.mediaFilterTabs}>
          <button
            type="button"
            className={`${styles.filterTab} ${mediaType === "all" ? styles.filterTabActive : ""}`}
            onClick={() => onMediaTypeChange("all")}
          >
            <LayersIcon size={14} />
            <span>All</span>
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${mediaType === "image" ? styles.filterTabActive : ""}`}
            onClick={() => onMediaTypeChange("image")}
          >
            <ImageIcon size={14} />
            <span>Photos</span>
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${mediaType === "video" ? styles.filterTabActive : ""}`}
            onClick={() => onMediaTypeChange("video")}
          >
            <FilmIcon size={14} />
            <span>Videos</span>
          </button>
          <button
            type="button"
            className={`${styles.filterTab} ${mediaType === "audio" ? styles.filterTabActive : ""}`}
            onClick={() => onMediaTypeChange("audio")}
          >
            <MusicIcon size={14} />
            <span>Audio</span>
          </button>
        </div>
      )}

      <div className={styles.sortControls}>
        <button
          type="button"
          className={styles.slideshowButton}
          onClick={onStartSlideshow}
          disabled={count === 0}
          title="Play Slideshow"
        >
          <PlayCircleIcon size={16} />
          <span>Slideshow</span>
        </button>

        <label htmlFor="gallery-sort">Sort by</label>
        <select
          id="gallery-sort"
          value={sort.key}
          onChange={(event) =>
            onSortChange(event.currentTarget.value as ExplorerSort["key"])
          }
        >
          <option value="name">Name</option>
          <option value="date">Date</option>
          <option value="size">Size</option>
        </select>
        <IconButton
          variant="ghost"
          size="medium"
          icon={sort.direction === "asc" ? <ArrowUpIcon /> : <ArrowDownIcon />}
          aria-label={`Sort ${sort.direction === "asc" ? "descending" : "ascending"}`}
          title={`Sort ${sort.direction === "asc" ? "descending" : "ascending"}`}
          onClick={() => onSortChange(sort.key)}
        />
      </div>
    </header>
  );
}

function GalleryGrid({
  isLoading,
  isError,
  onOpenFolder,
}: {
  isLoading: boolean;
  isError: boolean;
  onOpenFolder: (target: FolderNavigationTarget) => void;
}) {
  const { controller, commands } = useExplorerContext();
  const { items, state, dispatch } = controller;
  const gridRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [visibleCount, setVisibleCount] = useState(galleryPageSize);
  const renderedCount = Math.min(
    items.length,
    Math.max(
      visibleCount,
      state.focusedIndex === null
        ? 0
        : Math.ceil((state.focusedIndex + 1) / galleryPageSize) *
            galleryPageSize,
    ),
  );
  const openCommand = commands.find(
    (command) => command.id === "open" && command.surfaces.includes("item"),
  );

  useEffect(() => {
    if (state.focusedIndex === null) return;
    cardRefs.current[state.focusedIndex]?.scrollIntoView({ block: "nearest" });
  }, [state.focusedIndex]);

  const openItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (!item || !openCommand) return;

      const runtime = createExplorerRuntime({
        controller,
        source: "item",
        targetItems: [item],
      });

      if (
        !isExplorerCommandVisible(openCommand, runtime) ||
        isExplorerCommandDisabled(openCommand, runtime)
      ) {
        return;
      }

      void openCommand.run(runtime);
    },
    [controller, items, openCommand],
  );

  if (isLoading) {
    return (
      <div className={styles.grid} aria-label="Loading images" aria-busy="true">
        {Array.from({ length: 10 }, (_, index) => (
          <div key={index} className={styles.skeleton} aria-hidden="true">
            <span />
            <i />
            <i />
          </div>
        ))}
      </div>
    );
  }

  if (isError || items.length === 0) {
    return (
      <div className={styles.message} role={isError ? "alert" : undefined}>
        {isError ? (
          <AlertCircleIcon size={28} aria-hidden="true" />
        ) : (
          <ImageIcon size={30} aria-hidden="true" />
        )}
        <strong>{isError ? "Could not load images" : "No images yet"}</strong>
        <span>
          {isError
            ? "Check that the API is running, then try again."
            : "Upload an image in All Files and it will appear here."}
        </span>
      </div>
    );
  }

  const handleClick = (index: number, event: MouseEvent) => {
    gridRef.current?.focus();
    if (event.shiftKey) dispatch({ type: "select-range", index });
    else if (event.ctrlKey || event.metaKey)
      dispatch({ type: "toggle-select", index });
    else dispatch({ type: "select-one", index });
  };

  const renderedItems = items.slice(0, renderedCount);
  const hasMore = renderedItems.length < items.length;
  const showMore = () => {
    setVisibleCount((current) =>
      Math.min(items.length, current + galleryPageSize),
    );
  };

  return (
    <div
      ref={gridRef}
      className={styles.grid}
      role="grid"
      tabIndex={0}
      aria-label="Image gallery"
      aria-rowcount={items.length}
      aria-multiselectable="true"
      aria-activedescendant={
        state.focusedIndex === null
          ? undefined
          : `gallery-image-${state.focusedIndex}`
      }
      onFocusCapture={() => {
        dispatch({ type: "keyboard-active", active: true });
        if (state.focusedIndex === null) dispatch({ type: "focus", index: 0 });
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          dispatch({ type: "keyboard-active", active: false });
        }
      }}
      onScroll={(event) => {
        if (!hasMore) return;

        const { clientHeight, scrollHeight, scrollTop } = event.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 640) showMore();
      }}
    >
      {renderedItems.map((item, index) => {
        const selected = state.selectedKeys.has(item.key);
        const location = item.location;
        const locationLabel =
          location?.path?.map((part) => part.name).join(" / ") ??
          location?.name ??
          "root";

        return (
          <div
            key={item.key}
            id={`gallery-image-${index}`}
            ref={(element) => {
              cardRefs.current[index] = element;
            }}
            className={`${styles.card} ${selected ? styles.selectedCard : ""}`}
            role="row"
            aria-rowindex={index + 1}
            aria-selected={selected}
            data-focused={index === state.focusedIndex || undefined}
            onClick={(event) => handleClick(index, event)}
            onDoubleClick={() => openItem(index)}
            onContextMenu={(event) => {
              gridRef.current?.focus();
              controller.openContextMenu(index, event);
            }}
          >
            <div className={styles.thumbnail} role="gridcell">
              {item.ThumbnailComponent}
            </div>
            <div className={styles.cardBody} role="gridcell">
              <strong title={item.name}>{item.name}</strong>
              <button
                type="button"
                className={styles.location}
                title={`Open ${locationLabel}`}
                onClick={(event) => {
                  event.stopPropagation();
                  if (location) onOpenFolder(location);
                }}
                onDoubleClick={(event) => event.stopPropagation()}
              >
                {locationLabel}
              </button>
              <span className={styles.meta}>
                {formatSize(item.size)} · {formatDate(item.createdAt)}
              </span>
            </div>
          </div>
        );
      })}
      {hasMore && (
        <div className={styles.loadMoreRow} role="row">
          <div role="gridcell">
            <button type="button" onClick={showMore}>
              Show more images
              <span>
                {renderedItems.length} of {items.length}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
