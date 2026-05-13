import styles from "./FolderNavigationBar.module.css";
import { Fragment } from "react";
import { ChevronRightIcon, HardDriveIcon } from "lucide-react";
import { isRootFolder } from "@/utils";

export type BreadcrumbItem = {
  id: string;
  name: string;
};

export type FolderBreadcrumbsProps = {
  items: BreadcrumbItem[];
  currentFolderId: string;
  onClick: (folderId: string) => void;
};

export function FolderBreadcrumbs({
  items,
  currentFolderId,
  onClick,
}: FolderBreadcrumbsProps) {
  return (
    <ol className={styles.breadcrumbs} aria-label="Breadcrumb">
      {items.map((breadcrumb, index) => {
        const isCurrent = breadcrumb.id === currentFolderId;
        const label = isRootFolder(breadcrumb.id)
          ? "All files"
          : breadcrumb.name;

        return (
          <Fragment key={breadcrumb.id}>
            <li className={styles.breadcrumbItem}>
              <button
                type="button"
                className={
                  isCurrent ? styles.breadcrumbCurrent : styles.breadcrumbButton
                }
                disabled={isCurrent}
                onClick={() => onClick(breadcrumb.id)}
                aria-current={isCurrent ? "page" : undefined}
                title={label}
              >
                {isRootFolder(breadcrumb.id) ? (
                  <HardDriveIcon size={20} aria-hidden="true" />
                ) : (
                  <span className={styles.breadcrumbLabel}>
                    {breadcrumb.name}
                  </span>
                )}
              </button>
            </li>
            {index < items.length - 1 && (
              <li className={styles.separator} aria-hidden="true">
                <ChevronRightIcon size={14} />
              </li>
            )}
          </Fragment>
        );
      })}
    </ol>
  );
}
