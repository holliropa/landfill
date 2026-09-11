import { Fragment } from "react";
import {
  ArchiveIcon,
  ArrowUpIcon,
  ChevronRightIcon,
  FlaskConicalIcon,
} from "lucide-react";
import type { ArchiveDirectory } from "@/lib/client";
import { Button } from "@/ui/Button";
import { IconButton } from "@/ui/IconButton";
import styles from "./ArchiveExplorerPage.module.css";

export function ArchiveNavigationBar({
  directory,
  path,
  onOpenPath,
  onLeaveArchive,
  onOpenLab,
}: {
  directory?: ArchiveDirectory;
  path: string;
  onOpenPath: (path: string) => void;
  onLeaveArchive: () => void;
  onOpenLab: () => void;
}) {
  const parentPath = path.includes("/")
    ? path.slice(0, path.lastIndexOf("/"))
    : "";

  return (
    <nav className={styles.navigation} aria-label="Archive navigation">
      <div className={styles.pathGroup}>
        <IconButton
          shape="rounded"
          variant="ghost"
          icon={<ArrowUpIcon />}
          disabled={!directory}
          onClick={() => (path ? onOpenPath(parentPath) : onLeaveArchive())}
          aria-label={path ? "Go to parent archive folder" : "Leave archive"}
        />
        <ol className={styles.breadcrumbs}>
          <li>
            <button
              type="button"
              disabled={Boolean(directory && !path)}
              onClick={() => onOpenPath("")}
              aria-current={directory && !path ? "page" : undefined}
            >
              <ArchiveIcon size={18} />
              <span>{directory?.archive.name ?? "Archive"}</span>
            </button>
          </li>
          {directory?.breadcrumbs.map((breadcrumb, index) => {
            const isCurrent = index === directory.breadcrumbs.length - 1;
            return (
              <Fragment key={breadcrumb.path}>
                <li className={styles.separator} aria-hidden="true">
                  <ChevronRightIcon size={14} />
                </li>
                <li>
                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => onOpenPath(breadcrumb.path)}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    {breadcrumb.name}
                  </button>
                </li>
              </Fragment>
            );
          })}
        </ol>
      </div>
      <Button
        variant="outlined"
        size="small"
        startIcon={<FlaskConicalIcon size={15} />}
        disabled={!directory}
        onClick={onOpenLab}
      >
        Archive Lab
      </Button>
    </nav>
  );
}
