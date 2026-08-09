import { Button } from "@/ui/Button";
import { SpinnerIcon } from "@/ui/SpinnerIcon";
import { FileIcon, FolderIcon, HardDriveIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  StorageDetailsPreview,
  StorageDetailsShell,
} from "./StorageDetailsShell";
import styles from "./StorageDetailsView.module.css";
import type { StorageDetailsModel } from "./storageDetailsModel";

type LoadingDetailsModel = Extract<StorageDetailsModel, { status: "loading" }>;
type ErrorDetailsModel = Extract<StorageDetailsModel, { status: "error" }>;

type DetailsStateProps = {
  onClose: () => void;
  titleId?: string;
  actions?: ReactNode;
};

export function StorageEmptyDetails({
  onClose,
  titleId,
}: Omit<DetailsStateProps, "actions">) {
  return (
    <StorageDetailsShell
      title="Nothing selected"
      onClose={onClose}
      titleId={titleId}
    >
      <StorageDetailsPreview>
        <HardDriveIcon className={styles.previewIcon} aria-hidden="true" />
      </StorageDetailsPreview>
      <p className={styles.emptyDescription}>
        Select a file or folder to see its details.
      </p>
    </StorageDetailsShell>
  );
}

export function StorageLoadingDetails({
  details,
  onClose,
  titleId,
  actions,
}: DetailsStateProps & { details: LoadingDetailsModel }) {
  return (
    <StorageDetailsShell
      title={details.title}
      onClose={onClose}
      titleId={titleId}
      actions={actions}
    >
      <div className={styles.status} role="status" aria-live="polite">
        <SpinnerIcon size={28} />
        <span>Loading details…</span>
      </div>
    </StorageDetailsShell>
  );
}

export function StorageErrorDetails({
  details,
  onClose,
  titleId,
  actions,
}: DetailsStateProps & { details: ErrorDetailsModel }) {
  return (
    <StorageDetailsShell
      title={details.title}
      onClose={onClose}
      titleId={titleId}
      actions={actions}
    >
      <div className={styles.status} role="alert">
        {details.kind === "file" ? (
          <FileIcon className={styles.statusIcon} aria-hidden="true" />
        ) : (
          <FolderIcon className={styles.statusIcon} aria-hidden="true" />
        )}
        <p>{details.message}</p>
        <Button variant="outlined" size="small" onClick={details.retry}>
          Try again
        </Button>
      </div>
    </StorageDetailsShell>
  );
}
