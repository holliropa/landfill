import { formatDateTime } from "@/utils";
import { FolderIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  StorageDetailsPreview,
  StorageDetailsRow,
  StorageDetailsSection,
  StorageDetailsShell,
  StorageLocationLink,
} from "./StorageDetailsShell";
import styles from "./StorageDetailsView.module.css";
import type { StorageFolderDetailsModel } from "./storageDetailsModel";

export function StorageFolderDetails({
  details,
  onClose,
  titleId,
  actions,
}: {
  details: StorageFolderDetailsModel;
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
        <FolderIcon className={styles.previewIcon} aria-hidden="true" />
      </StorageDetailsPreview>

      <StorageDetailsSection title="General">
        <StorageDetailsRow label="Type">Folder</StorageDetailsRow>
      </StorageDetailsSection>

      <StorageDetailsSection title="Location and dates">
        <StorageDetailsRow label="Location">
          <StorageLocationLink location={details.location} />
        </StorageDetailsRow>
        <StorageDetailsRow label="Created">
          {formatDateTime(details.createdAt)}
        </StorageDetailsRow>
      </StorageDetailsSection>
    </StorageDetailsShell>
  );
}
