import styles from "./Sidebar.module.css";
import type { ReactNode } from "react";

type SidebarItemProps = {
  isOpen: boolean;
  onClick: () => void;
  Icon: ReactNode;
  label: string;
};

export function SidebarItem({
  isOpen,
  onClick,
  Icon,
  label,
}: SidebarItemProps) {
  return (
    <div className={styles.navItem} style={{
      position: "relative",
    }}>
      <div className={styles.icon}>{Icon}</div>
      <div
        className={`${styles.textWrapper} ${isOpen ? styles.textOpen : styles.textClosed}`}
      >
        <span className={styles.textInner}>{label}</span>
      </div>

      <button
        style={{
          position: "absolute",
          background: "none",
          border: "none",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          cursor: "pointer",
        }}
        onClick={onClick}
      />
    </div>
  );
}
