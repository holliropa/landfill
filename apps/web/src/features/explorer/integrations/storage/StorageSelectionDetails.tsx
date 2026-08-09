import { formatSize } from "@/utils";
import { FilesIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  StorageDetailsPreview,
  StorageDetailsRow,
  StorageDetailsSection,
  StorageDetailsShell,
} from "./StorageDetailsShell";
import styles from "./StorageDetailsView.module.css";
import type { StorageSelectionDetailsModel } from "./storageDetailsModel";

export function StorageSelectionDetails({
  details,
  onClose,
  titleId,
  actions,
}: {
  details: StorageSelectionDetailsModel;
  onClose: () => void;
  titleId?: string;
  actions?: ReactNode;
}) {
  return (
    <StorageDetailsShell
      title={details.title}
      onClose={onClose}
      titleId={titleId}
      actions={actions}
    >
      <StorageDetailsPreview>
        <FilesIcon className={styles.previewIcon} aria-hidden="true" />
      </StorageDetailsPreview>
      <StorageDetailsSection title="Selection summary">
        <StorageDetailsRow label="Items">{details.itemCount}</StorageDetailsRow>
        <StorageDetailsRow label="Files">{details.fileCount}</StorageDetailsRow>
        <StorageDetailsRow label="Folders">
          {details.folderCount}
        </StorageDetailsRow>
        {details.knownFileSizeCount > 0 && (
          <StorageDetailsRow
            label={
              details.unknownFileSizeCount > 0 ? "Known file size" : "File size"
            }
          >
            {formatSize(details.knownFileSizeBytes)}
          </StorageDetailsRow>
        )}
        {details.unknownFileSizeCount > 0 && (
          <StorageDetailsRow label="Unknown sizes">
            {details.unknownFileSizeCount}
          </StorageDetailsRow>
        )}
      </StorageDetailsSection>
    </StorageDetailsShell>
  );
}
