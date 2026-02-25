import styles from "./MainLayout.module.css";
import { Outlet } from "react-router-dom";
import { NavBar } from "@/components/NavBar";

export function MainLayout() {
  return (
    <div className={styles.layout}>
      <div className={styles.navbarContainer}>
        <NavBar />
      </div>
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  );
}
