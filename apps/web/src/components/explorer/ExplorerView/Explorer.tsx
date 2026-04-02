import { ExplorerList } from "../ExplorerList";
import React, { useState } from "react";
import type { ExplorerItem } from "../types";
import { useNavigate } from "react-router-dom";
import { ManipulationBar } from "@/components/Explorer/ManipulationBar";

type ExplorerViewProps = {
  items: ExplorerItem[];
};

export function Explorer({ items }: ExplorerViewProps) {
  const navigate = useNavigate();
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null,
  );

  const handleOpenItem = (index: number) => {
    const item = items[index];
    if (!item) return;

    if (item.kind === "folder") {
      navigate(`/folder/${item.id}`);
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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        flex: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flex: "0 0 auto",
          padding: "8px 12px",
          borderBottom: "1px solid #d0d0d0",
          userSelect: "none",
          minHeight: "40px",
        }}
      >
        {selectedKeys.size > 0 && (
          <ManipulationBar
            selectedItems={items.filter((item) => selectedKeys.has(item.key))}
            onDeselectAll={resetSelection}
          />
        )}
      </div>
      <div
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          minWidth: 0,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ExplorerList
          items={items}
          selectedKeys={selectedKeys}
          onItemClick={handleClickItem}
          onItemOpen={handleOpenItem}
        />
      </div>
    </div>
  );
}
