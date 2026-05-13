import styles from "./DetailsView.module.css";
import React from "react";
import { IconButton } from "@/ui/IconButton";
import { XIcon } from "lucide-react";

export type DetailsShellProps = {
  title: string;
  onClose: () => void;
  children?: React.ReactNode;
};

export function DetailsShell({ title, onClose, children }: DetailsShellProps) {
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
