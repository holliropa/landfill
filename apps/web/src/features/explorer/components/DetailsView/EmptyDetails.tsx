import styles from "./DetailsView.module.css";
import { DetailsShell } from "./DetailsShell";

import { HardDriveIcon } from "lucide-react";

export function EmptyDetails({ onClose }: { onClose: () => void }) {
  return (
    <DetailsShell title="Nothing selected" onClose={onClose}>
      <div className={styles.preview}>
        <HardDriveIcon
          style={{
            width: "30%",
            height: "30%",
          }}
        />
      </div>
    </DetailsShell>
  );
}
