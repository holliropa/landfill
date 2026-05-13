import styles from "./DetailsView.module.css";
import React from "react";

export function DetailsRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.detailsRow}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
