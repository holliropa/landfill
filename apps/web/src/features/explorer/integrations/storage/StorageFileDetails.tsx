import { FileThumbnail } from "@/components/FileThumbnail";
import { formatDateTime, formatSize } from "@/utils";
import { FileIcon } from "lucide-react";
import type { ReactNode } from "react";
import { DetailsPreviewBoundary } from "./DetailsPreviewBoundary";
import {
  StorageDetailsPreview,
  StorageDetailsRow,
  StorageDetailsSection,
  StorageDetailsShell,
  StorageLocationLink,
} from "./StorageDetailsShell";
import styles from "./StorageDetailsView.module.css";
import { formatStorageFileType } from "./storageDetailsFormatters";
import type { StorageFileDetailsModel } from "./storageDetailsModel";

export function StorageFileDetails({
  details,
  onClose,
  titleId,
  actions,
}: {
  details: StorageFileDetailsModel;
  onClose: () => void;
  titleId?: string;
  actions?: ReactNode;
}) {
  const fallback = (
    <FileIcon className={styles.previewIcon} aria-label="Preview unavailable" />
  );

  return (
    <StorageDetailsShell
      title={details.title}
      onClose={onClose}
      titleId={titleId}
      actions={actions}
    >
      <StorageDetailsPreview>
        <DetailsPreviewBoundary fallback={fallback}>
          <FileThumbnail fileId={details.id} alt={details.title} />
        </DetailsPreviewBoundary>
      </StorageDetailsPreview>

      <StorageDetailsSection title="General">
        <StorageDetailsRow label="Type">
          {formatStorageFileType(details.mimeType)}
        </StorageDetailsRow>
        {details.mimeType && (
          <StorageDetailsRow label="MIME type">
            {details.mimeType}
          </StorageDetailsRow>
        )}
        <StorageDetailsRow label="Size">
          {formatSize(details.sizeBytes)}
        </StorageDetailsRow>
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
