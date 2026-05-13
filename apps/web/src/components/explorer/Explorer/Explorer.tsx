import styles from "./Explorer.module.css";
import { ExplorerList } from "../ExplorerList";
import React, { useMemo, useState } from "react";
import type { ExplorerItem } from "../types";
import { useNavigate } from "react-router-dom";
import { ManipulationBar } from "@/components/Explorer/ManipulationBar";
import {
  type DetailsTarget,
  DetailsView,
} from "@/components/Explorer/DetailsView";
import { isRootFolder } from "@/utils";
import { paths } from "@/router";

type ExplorerProps = {
  items: ExplorerItem[];
  location?: string;
};

export function Explorer({ items, location }: ExplorerProps) {
  const navigate = useNavigate();
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showDetails, setShowDetails] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null,
  );

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
      navigate(paths.folderPath(item.id));
      resetSelection();
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
  );
}
