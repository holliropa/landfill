import styles from "./MainLayout.module.css";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar/Sidebar";
import { Topbar } from "@/components/Topbar/Topbar";
import { Toaster } from "sonner";

export function MainLayout() {
  return (
    <div className={styles.layout}>
      <main className={styles.mainContent}>
        <div className={styles.sidebar}>
          <Sidebar />
        </div>
        <div className={styles.pageLayout}>
          <div className={styles.topbar}>
            <Topbar />
          </div>
          <div className={styles.pageContent}>
            <Outlet />
          </div>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
