import styles from "./Sidebar.module.css";
import { useState } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  LayoutGrid,
  SettingsIcon,
  Trash,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { SidebarItem } from "./SidebarItem";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsOpen(!isOpen);

  const handleGoToAllFiles = () => {
    navigate("/folder");
  };

  return (
    // 2. The Sidebar wrapper handles its own open/collapsed classes
    <aside
      className={`${styles.sidebarContainer} ${isOpen ? styles.open : styles.collapsed}`}
    >
      <div className={styles.navContent}>
        <SidebarItem
          onClick={handleGoToAllFiles}
          isOpen={isOpen}
          Icon={<LayoutGrid size={22} />}
          label="All Files"
        />
        <SidebarItem
          onClick={() => {}}
          isOpen={isOpen}
          Icon={<Trash size={22} />}
          label="Trash"
        />
        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <SidebarItem
            onClick={toggleSidebar}
            isOpen={isOpen}
            Icon={
              isOpen ? <ChevronsLeft size={22} /> : <ChevronsRight size={22} />
            }
            label="Collapse"
          />
          <SidebarItem
            onClick={() => {}}
            isOpen={isOpen}
            Icon={<SettingsIcon size={22} />}
            label="Settings"
          />
        </div>
      </div>
    </aside>
  );
}
