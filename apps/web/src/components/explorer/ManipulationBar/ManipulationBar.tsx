import type { ExplorerItem } from "@/components/Explorer";

export type ManipulationBarProps = {
  folderId: string;
  selectedItems: ExplorerItem[];
  onDeselectAll: () => void;
};

export function ManipulationBar({
  folderId,
  selectedItems,
  onDeselectAll,
}: ManipulationBarProps) {

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        width: "100%",
        gap: "8px",
      }}
    >
      <button onClick={onDeselectAll}>x</button>
      <span>{selectedItems.length} selected</span>
    </div>
  );
}
