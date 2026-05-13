import styles from "./DetailsView.module.css";
import type { SelectionItem } from "./types.ts";
import { DetailsShell } from "./DetailsShell";
import { FileIcon } from "lucide-react";
import { DetailsRow } from "./DetailsRow";

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
