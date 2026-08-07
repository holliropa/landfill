import {
  getExplorerCommandIcon,
  isExplorerCommandDisabled,
  useExplorerCommandList,
  useExplorerContext,
} from "../Explorer/ExplorerContext";
import styles from "./ContextMenu.module.css";

export type ExplorerContextMenuProps = {
  ids?: readonly string[];
};

export function ExplorerContextMenu({ ids }: ExplorerContextMenuProps) {
  const { controller } = useExplorerContext();
  const targetItems = controller.contextMenuItems;
  const { commands, runtime } = useExplorerCommandList(
    "context-menu",
    ids,
    targetItems,
  );
  const contextMenu = controller.state.contextMenu;

  if (!contextMenu || commands.length === 0) {
    return null;
  }

  return (
    <div
      className={styles.contextMenu}
      style={{ left: contextMenu.x, top: contextMenu.y }}
      role="menu"
      onClick={(event) => event.stopPropagation()}
    >
      {commands.map((command) => (
        <button
          key={command.id}
          type="button"
          role="menuitem"
          className={
            command.intent === "danger" ? styles.dangerMenuItem : undefined
          }
          onClick={() => {
            controller.closeContextMenu();
            void command.run(runtime);
          }}
          disabled={isExplorerCommandDisabled(command, runtime)}
        >
          {getExplorerCommandIcon(command, runtime)}
          <span>{command.label}</span>
        </button>
      ))}
    </div>
  );
}
