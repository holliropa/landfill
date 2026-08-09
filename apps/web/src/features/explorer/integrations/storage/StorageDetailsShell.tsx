import { paths } from "@/router";
import { IconButton } from "@/ui/IconButton";
import { FolderIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./StorageDetailsView.module.css";
import type { StorageDetailsLocation } from "./storageDetailsModel";

export function StorageDetailsShell({
  title,
  titleId,
  onClose,
  actions,
  children,
}: {
  title: string;
  titleId?: string;
  onClose: () => void;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={styles.root}>
      <div className={styles.headerContainer}>
        <div className={styles.titleContainer}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
        </div>
        <IconButton
          variant="ghost"
          aria-label="Close details"
          title="Close details"
          className={styles.closeButton}
          icon={<XIcon />}
          size="large"
          onClick={onClose}
        />
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
      {children}
    </div>
  );
}

export function StorageDetailsPreview({ children }: { children: ReactNode }) {
  return <div className={styles.preview}>{children}</div>;
}

export function StorageDetailsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <h3>{title}</h3>
      <dl className={styles.detailsList}>{children}</dl>
    </section>
  );
}

export function StorageDetailsRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className={styles.detailsRow}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

export function StorageLocationLink({
  location,
}: {
  location: StorageDetailsLocation;
}) {
  return (
    <Link className={styles.locationLink} to={paths.folderPath(location.id)}>
      <FolderIcon size={16} aria-hidden="true" />
      <span>{location.name}</span>
    </Link>
  );
}
