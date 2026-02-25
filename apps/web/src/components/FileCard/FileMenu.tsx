import styles from "./FileMenu.module.css";
import React from "react";

export interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface FileMenuProps {
  isOpen: boolean;
  items: MenuItem[];
}

export function FileMenu({ isOpen, items }: FileMenuProps) {
  if (!isOpen || items.length === 0) return null;

  return (
    <div className={styles.menu}>
      {items.map((item, index) => (
        <div key={index} className={styles.item}>
          <div className={styles.icon}>{item.icon}</div>
          <span className={styles.label}>{item.label}</span>
          <button className={styles.button} onClick={item.onClick} />
        </div>
      ))}
    </div>
  );
}
