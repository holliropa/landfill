import type { SelectionItem } from "@/features/explorer/state";
import { FileIcon } from "lucide-react";
import { DetailsRow } from "./DetailsRow";
import { DetailsShell } from "./DetailsShell";
import styles from "./DetailsView.module.css";

export function SelectionDetails({
  selectionItems,
  onClose,
}: {
  selectionItems: Array<SelectionItem>;
  onClose: () => void;
}) {
  return (
    <DetailsShell title={`${selectionItems.length} selected`} onClose={onClose}>
      <div className={styles.preview}>
        <FileIcon
          style={{
            width: "30%",
            height: "30%",
          }}
        />
      </div>
      <dl className={styles.detailsList}>
        <DetailsRow label="Items">{selectionItems.length}</DetailsRow>
      </dl>
    </DetailsShell>
  );
}
