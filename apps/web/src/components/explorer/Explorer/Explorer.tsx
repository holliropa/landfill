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

type ExplorerProps = {
  items: ExplorerItem[];
  location?: string;
};

export function Explorer({ items, location }: ExplorerProps) {
  const openFolder = useFolderNavigation();
  const [openedId, setOpenedId] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null,
  );

  const files = useMemo(
    () => items.filter((item) => item.kind === "file"),
    [items],
  );

  const openedFileIndex = useMemo(
    () => files.findIndex((item) => item.id === openedId),
    [openedId, files],
  );

  const openedFile = openedFileIndex >= 0 ? files[openedFileIndex] : undefined;
  const hasPreviousFile = openedFileIndex > 0;
  const hasNextFile =
    openedFileIndex >= 0 && openedFileIndex < files.length - 1;

  const openPreviousFile = () => {
    if (hasPreviousFile) {
      setOpenedId(files[openedFileIndex - 1].id);
    }
  };

  const openNextFile = () => {
    if (hasNextFile) {
      setOpenedId(files[openedFileIndex + 1].id);
    }
  };

  const selectedItems = useMemo(
    () => items.filter((item) => selectedKeys.has(item.key)),
    [items, selectedKeys],
  );

  const detailsTarget = useMemo<DetailsTarget>(() => {
    if (selectedItems.length === 0) {
      if (location && !isRootFolder(location)) {
        return { type: "folder", id: location };
      }

      return { type: "none" };
    }
    if (selectedItems.length === 1) {
      const item = selectedItems[0];
      return item.kind === "folder"
        ? { type: "folder", id: item.id }
        : { type: "file", id: item.id };
    }
    return { type: "selection", items: selectedItems };
  }, [location, selectedItems]);

  const handleOpenItem = (index: number) => {
    const item = items[index];
    if (!item) return;

    if (item.kind === "folder") {
      openFolder(item);
      resetSelection();
    } else if (item.kind === "file") {
      setOpenedId(item.id);
    }
  };

  const resetSelection = () => {
    setSelectedKeys(new Set());
    setLastSelectedIndex(null);
  };
  const handleSelectRange = (from: number, to: number) => {
    const newSelected = new Set<string>();
    for (let i = from; i <= to; i++) {
      newSelected.add(items[i].key);
    }
    setSelectedKeys(newSelected);
    if (from === to) setLastSelectedIndex(from);
  };

  const handleToggleSingle = (index: number, deselectRest: boolean) => {
    setSelectedKeys((prev) => {
      const newSelected = new Set(prev);
      const item = items[index];
      if (!item) return prev;

      if (deselectRest) {
        newSelected.clear();
        newSelected.add(item.key);
      } else if (newSelected.has(item.key)) {
        newSelected.delete(item.key);
      } else {
        newSelected.add(item.key);
      }
      return newSelected;
    });

    setLastSelectedIndex(index);
  };

  const handleClickItem = (index: number, event: React.MouseEvent) => {
    const item = items[index];
    if (!item) return;

    if (event.shiftKey) {
      const startIndex = lastSelectedIndex ?? index;
      const from = Math.min(startIndex, index);
      const to = Math.max(startIndex, index);
      handleSelectRange(from, to);
      return;
    }

    handleToggleSingle(index, !event.ctrlKey && !event.metaKey);
  };

  const toggleDetails = () => {
    setShowDetails((prevState) => !prevState);
  };

  return (
    <>
      <div className={styles.root}>
        <div className={styles.toolbar}>
          <ManipulationBar
            selectedItems={selectedItems}
            onDeselectAll={resetSelection}
            onShowDetails={toggleDetails}
          />
        </div>
        <div className={styles.workspace}>
          <div className={styles.content}>
            <ExplorerList
              items={items}
              selectedKeys={selectedKeys}
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
      {openedId !== null && (
        <FileViewer
          fileId={openedId}
          name={openedFile?.name}
          onClose={() => setOpenedId(null)}
          navigation={{
            hasPrevious: hasPreviousFile,
            hasNext: hasNextFile,
            onPrevious: openPreviousFile,
            onNext: openNextFile,
          }}
        />
      )}
    </>
  );
}
