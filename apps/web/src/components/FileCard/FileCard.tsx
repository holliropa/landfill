import styles from "./FileCard.module.css";
import {
  DownloadIcon,
  EllipsisVerticalIcon,
  InfoIcon,
  TrashIcon,
} from "lucide-react";
import { FileMenu, type MenuItem } from "./FileMenu";
import type { StoredFile } from "@/types";
import { FileThumbnail } from "@/components/FileThumbnail";

interface FileCardProps {
  file: StoredFile;
  onDetails?: (file: StoredFile) => void;
  onDelete?: (file: StoredFile) => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
}

export function FileCard({
  file,
  onDelete,
  onDetails,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
}: FileCardProps) {
  const menuItems: MenuItem[] = [
    {
      label: "Details",
      icon: <InfoIcon />,
      onClick: () => {
        onCloseMenu();
        onDetails?.(file);
      },
    },
    {
      label: "Download",
      icon: <DownloadIcon />,
      onClick: () => {
        onCloseMenu();
        window.open(
          `http://localhost:3000/api/files/${file.id}/download`,
          "_blank",
        );
      },
    },
    {
      label: "Delete",
      icon: <TrashIcon />,
      onClick: () => {
        onCloseMenu();
        onDelete?.(file);
      },
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.fileName}>{file.originalName}</span>
        <div className={styles.settingsButtonWrap}>
          <button
            className={styles.settingsButton}
            type="button"
            onClick={() => {
              onToggleMenu();
            }}
          >
            <EllipsisVerticalIcon className={styles.settingsIcon} />
          </button>

          <FileMenu isOpen={menuOpen} items={menuItems} />
        </div>
      </div>

      <FileThumbnail file={file} />
    </div>
  );
}
