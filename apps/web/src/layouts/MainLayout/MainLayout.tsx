import styles from "./MainLayout.module.css";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar/Sidebar.tsx";
import { Topbar } from "@/components/Topbar/Topbar.tsx";

export function MainLayout() {
  return (
    <div className={styles.layout}>
      <main className={styles.mainContent}>
        <Sidebar />
        <div className={styles.sidebarBorder} />
        <div className={styles.pageLayout}>
          <Topbar />
          <div className={styles.pageBorder} />
          <div className={styles.pageContent}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
