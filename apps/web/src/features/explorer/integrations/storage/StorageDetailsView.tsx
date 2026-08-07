import { FileThumbnail } from "@/components/FileThumbnail";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";
import { useFile, useFolder } from "@/lib/client";
import { Button } from "@/ui/Button";
import { IconButton } from "@/ui/IconButton";
import { formatSize } from "@/utils";
import { format } from "date-fns";
import { FileIcon, FolderIcon, HardDriveIcon, XIcon } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./StorageDetailsView.module.css";
import type {
  StorageDetailsTarget,
  StorageSelectionItem,
} from "./storageDetailsTarget";

export function StorageDetailsView({
  target,
  onClose,
}: {
  target: StorageDetailsTarget;
  onClose: () => void;
}) {
  switch (target.type) {
    case "none":
      return <EmptyDetails onClose={onClose} />;
    case "file":
      return <FileDetails id={target.id} onClose={onClose} />;
    case "folder":
      return <FolderDetails id={target.id} onClose={onClose} />;
    case "selection":
      return <SelectionDetails items={target.items} onClose={onClose} />;
  }
}

function DetailsShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children?: ReactNode;
}) {
  return (
    <div className={styles.root}>
      <div className={styles.headerContainer}>
        <div className={styles.titleContainer}>
          <span className={styles.title}>{title}</span>
        </div>
        <IconButton
          variant="ghost"
          aria-label="Close details"
          className={styles.closeButton}
          icon={<XIcon />}
          size="large"
          onClick={onClose}
        />
      </div>
      {children}
    </div>
  );
}

function EmptyDetails({ onClose }: { onClose: () => void }) {
  return (
    <DetailsShell title="Nothing selected" onClose={onClose}>
      <div className={styles.preview}>
        <HardDriveIcon className={styles.previewIcon} />
      </div>
    </DetailsShell>
  );
}

function FileDetails({ id, onClose }: { id: string; onClose: () => void }) {
  const openFolder = useFolderNavigation();
  const { data: fileData, isLoading, error } = useFile(id);

  if (isLoading) {
    return <DetailsShell title="Loading..." onClose={onClose} />;
  }

  if (error || !fileData) {
    return <DetailsShell title="Error unavailable" onClose={onClose} />;
  }

  return (
    <DetailsShell title={fileData.name} onClose={onClose}>
      <div className={styles.preview}>
        <FileThumbnail fileId={id} alt={fileData.name} />
      </div>
      <dl className={styles.detailsList}>
        <DetailsRow label="Type">Folder</DetailsRow>
        <DetailsRow label="Size">{formatSize(fileData.sizeBytes)}</DetailsRow>
        <DetailsRow label="Location">
          <Button
            size="small"
            variant="outlined"
            startIcon={<FolderIcon />}
            onClick={() => openFolder(fileData.folder)}
          >
            {fileData.folder.name}
          </Button>
        </DetailsRow>
        <DetailsRow label="Created">
          {format(fileData.createdAt, "dd/MM/yyyy")}
        </DetailsRow>
      </dl>
    </DetailsShell>
  );
}

function FolderDetails({ id, onClose }: { id: string; onClose: () => void }) {
  const openFolder = useFolderNavigation();
  const { data: folder, isLoading, error } = useFolder(id);

  if (isLoading) {
    return <DetailsShell title="Loading..." onClose={onClose} />;
  }

  if (error || !folder) {
    return <DetailsShell title="Folder unavailable" onClose={onClose} />;
  }

  return (
    <DetailsShell title={folder.name} onClose={onClose}>
      <div className={styles.preview}>
        <FolderIcon className={styles.previewIcon} />
      </div>
      <dl className={styles.detailsList}>
        <DetailsRow label="Type">Folder</DetailsRow>
        <DetailsRow label="Created">
          {format(folder.createdAt, "dd/MM/yyyy")}
        </DetailsRow>
        <DetailsRow label="Location">
          <Button
            size="small"
            variant="outlined"
            startIcon={<FolderIcon />}
            onClick={() => openFolder(folder.parentFolder)}
          >
            {folder.parentFolder.name}
          </Button>
        </DetailsRow>
      </dl>
    </DetailsShell>
  );
}

function SelectionDetails({
  items,
  onClose,
}: {
  items: StorageSelectionItem[];
  onClose: () => void;
}) {
  return (
    <DetailsShell title={`${items.length} selected`} onClose={onClose}>
      <div className={styles.preview}>
        <FileIcon className={styles.previewIcon} />
      </div>
      <dl className={styles.detailsList}>
        <DetailsRow label="Items">{items.length}</DetailsRow>
      </dl>
    </DetailsShell>
  );
}

function DetailsRow({
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
