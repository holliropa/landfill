import styles from "./Sidebar.module.css";
import { useState } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  HardDrive,
  LayoutGrid,
  LogOut,
  Trash,
} from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";
import { useLocation, useNavigate } from "react-router-dom";
import { paths } from "@/router";
import { useAuth } from "@/providers";
import { toast } from "sonner";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const openFolder = useFolderNavigation();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleGoToAllFiles = () => {
    openFolder();
  };

  const handleSignOut = async () => {
    try {
      await logout();
    } catch {
      toast.error("Could not sign out. Try again.");
    }
  };

  return (
    <aside
      className={`${styles.sidebarContainer} ${isOpen ? styles.open : styles.collapsed}`}
    >
      <div className={styles.brand} title="Landfill">
        <HardDrive size={22} aria-hidden="true" />
        <div
          className={`${styles.textWrapper} ${isOpen ? styles.textOpen : styles.textClosed}`}
        >
          <strong className={styles.brandName}>Landfill</strong>
        </div>
      </div>
      <div className={styles.navContent}>
        <SidebarItem
          onClick={handleGoToAllFiles}
          isOpen={isOpen}
          active={location.pathname.startsWith("/folder")}
          Icon={<LayoutGrid size={22} />}
          label="All Files"
        />
        <SidebarItem
          onClick={() => navigate(paths.trashPath())}
          isOpen={isOpen}
          active={location.pathname === paths.trashPath()}
          Icon={<Trash size={22} />}
          label="Trash"
        />
        <div className={styles.sidebarFooter}>
          <SidebarItem
            onClick={() => void handleSignOut()}
            isOpen={isOpen}
            Icon={<LogOut size={22} />}
            label="Sign out"
          />
          <SidebarItem
            onClick={toggleSidebar}
            isOpen={isOpen}
            Icon={
              isOpen ? <ChevronsLeft size={22} /> : <ChevronsRight size={22} />
            }
            label={isOpen ? "Collapse" : "Expand"}
          />
        </div>
      </div>
    </aside>
  );
}
