import styles from "./FolderNavigationBar.module.css";
import { Fragment } from "react";
import { HouseIcon } from "lucide-react";

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
    <div className={styles.breadcrumbs}>
      {items.map((breadcrumb, index) => {
        const isCurrent = breadcrumb.id === currentFolderId;

        const content =
          breadcrumb.id === "root" ? (
            <>
              <HouseIcon size={20} />
            </>
          ) : (
            breadcrumb.name
          );

        return (
          <Fragment key={breadcrumb.id}>
            {isCurrent ? (
              <span className={styles.breadcrumbCurrent}>{content}</span>
            ) : (
              <button
                type="button"
                className={styles.breadcrumbItem}
                onClick={() => onClick(breadcrumb.id)}
              >
                {content}
              </button>
            )}
            <span className={styles.separator}>/</span>
          </Fragment>
        );
      })}
    </div>
  );
}
