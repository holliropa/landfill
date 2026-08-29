import type { PropsWithChildren } from "react";
import { HardDrive } from "lucide-react";
import styles from "./AuthPage.module.css";

export function AuthShell({ children }: PropsWithChildren) {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.brand}>
          <HardDrive size={24} aria-hidden="true" />
          <strong className={styles.brandName}>Landfill</strong>
        </div>
        {children}
      </section>
    </main>
  );
}
