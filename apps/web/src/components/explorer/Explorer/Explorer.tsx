import styles from "./Explorer.module.css";
import { ExplorerList } from "../ExplorerList";
import React, { useMemo, useState } from "react";
import type { ExplorerItem } from "../types";
import { ManipulationBar } from "@/components/Explorer/ManipulationBar";
import {
  type DetailsTarget,
  DetailsView,
} from "@/components/Explorer/DetailsView";
import { isRootFolder } from "@/utils";
import { FileViewer } from "@/components/FileViewer";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";
import { useExplorerKeyboardNavigation } from "./hooks/useExplorerKeyboardNavigation";
import { useExplorerSelection } from "./hooks/useExplorerSelection";
import { useExplorerFileViewer } from "./hooks/useExplorerFileViewer";

type ExplorerProps = {
  items: ExplorerItem[];
  location?: string;
};

export function Explorer({ items, location }: ExplorerProps) {
  const openFolder = useFolderNavigation();
  const selection = useExplorerSelection({ items });
  const fileViewer = useExplorerFileViewer({ items });
  const [showDetails, setShowDetails] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(
    items.length > 0 ? 0 : null,
  );
  const [isExplorerKeyboardActive, setIsExplorerKeyboardActive] =
    useState(false);

  const clampedFocusedIndex =
    focusedIndex === null || items.length === 0
      ? null
      : Math.min(focusedIndex, items.length - 1);

  const detailsTarget = useMemo<DetailsTarget>(() => {
    if (selection.selectedItems.length === 0) {
      if (location && !isRootFolder(location)) {
        return { type: "folder", id: location };
      }

      return { type: "none" };
    }
    if (selection.selectedItems.length === 1) {
      const item = selection.selectedItems[0];
      return item.kind === "folder"
        ? { type: "folder", id: item.id }
        : { type: "file", id: item.id };
    }
    return { type: "selection", items: selection.selectedItems };
  }, [location, selection.selectedItems]);

  const handleOpenItem = (index: number) => {
    const item = items[index];
    if (!item) return;

    if (item.kind === "folder") {
      openFolder(item);
      selection.resetSelection();
      return;
    }

    fileViewer.openFile(item.id);
  };

  const handleClickItem = (index: number, event: React.MouseEvent) => {
    const item = items[index];
    if (!item) return;

    setFocusedIndex(index);
    selection.handleClickItem(index, event);
  };

  const toggleDetails = () => {
    setShowDetails((prevState) => !prevState);
  };

  useExplorerKeyboardNavigation({
    items,
    focusedIndex: clampedFocusedIndex,
    selectedKeys: selection.selectedKeys,
    lastSelectedIndex: selection.lastSelectedIndex,
    enabled: !fileViewer.isOpen && isExplorerKeyboardActive,
    setFocusedIndex,
    setSelectedKeys: selection.setSelectedKeys,
    setLastSelectedIndex: selection.setLastSelectedIndex,
    resetSelection: selection.resetSelection,
    openItem: handleOpenItem,
  });

  return (
    <>
      <div className={styles.root}>
        <div className={styles.toolbar}>
          <ManipulationBar
            selectedItems={selection.selectedItems}
            onDeselectAll={selection.resetSelection}
            onShowDetails={toggleDetails}
          />
        </div>
        <div className={styles.workspace}>
          <div className={styles.content}>
            <ExplorerList
              items={items}
              selectedKeys={selection.selectedKeys}
              focusedIndex={clampedFocusedIndex}
              onFocusedIndex={setFocusedIndex}
              onKeyboardActiveChange={setIsExplorerKeyboardActive}
              onItemClick={handleClickItem}
              onItemOpen={handleOpenItem}
            />
          </div>
          {showDetails && (
            <aside className={styles.detailsPanel} aria-label="Details">
              <DetailsView
                target={detailsTarget}
                onClose={() => setShowDetails(false)}
              />
            </aside>
          )}
        </div>
      </div>
      {fileViewer.openedId !== null && (
        <FileViewer
          fileId={fileViewer.openedId}
          name={fileViewer.openedFile?.name}
          onClose={fileViewer.closeFile}
          navigation={{
            hasNext: fileViewer.hasNextFile,
            hasPrevious: fileViewer.hasPreviousFile,
            onNext: fileViewer.openNextFile,
            onPrevious: fileViewer.openPreviousFile,
          }}
        />
      )}
    </>
  );
}
