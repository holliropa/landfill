import { IconButton } from "@/ui/IconButton";
import type { ExplorerItem } from "@/features/explorer/types";
import type { ExplorerSurface } from "./Explorer.types";
import {
  getExplorerCommandIcon,
  isExplorerCommandDisabled,
  useExplorerCommandList,
} from "./ExplorerContext";
import styles from "./Explorer.module.css";

export type ExplorerActionGroupProps = {
  surface: ExplorerSurface;
  ids?: readonly string[];
  targetItems?: ExplorerItem[];
  size?: "small" | "medium" | "large";
};

export function ExplorerActionGroup({
  surface,
  ids,
  targetItems,
  size = "medium",
}: ExplorerActionGroupProps) {
  const { commands, runtime } = useExplorerCommandList(
    surface,
    ids,
    targetItems,
  );

  if (commands.length === 0) {
    return null;
  }

  return (
    <div className={styles.actionGroup}>
      {commands.map((command) => (
        <IconButton
          key={command.id}
          variant="ghost"
          size={size}
          icon={getExplorerCommandIcon(command, runtime)}
          onClick={() => {
            void command.run(runtime);
          }}
          disabled={isExplorerCommandDisabled(command, runtime)}
          aria-label={command.label}
          title={command.label}
        />
      ))}
    </div>
  );
}
