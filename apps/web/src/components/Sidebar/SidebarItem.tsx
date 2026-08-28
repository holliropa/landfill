import styles from "./Sidebar.module.css";
import type { ReactNode } from "react";

type SidebarItemProps = {
  isOpen: boolean;
  onClick: () => void;
  Icon: ReactNode;
  label: string;
  active?: boolean;
};

export function SidebarItem({
  isOpen,
  onClick,
  Icon,
  label,
  active = false,
}: SidebarItemProps) {
  return (
    <button
      type="button"
      className={`${styles.navItem} ${active ? styles.active : ""}`}
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={isOpen ? undefined : label}
      title={isOpen ? undefined : label}
    >
      <span className={styles.icon}>{Icon}</span>
      <div
        className={`${styles.textWrapper} ${isOpen ? styles.textOpen : styles.textClosed}`}
      >
        <span className={styles.textInner}>{label}</span>
      </div>
    </button>
  );
}
