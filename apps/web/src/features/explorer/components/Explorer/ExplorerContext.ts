import type { ExplorerItem } from "@/features/explorer/types";
import {
  createContext,
  createElement,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { ExplorerController } from "./ExplorerController";
import type {
  ExplorerCommand,
  ExplorerRuntime,
  ExplorerSurface,
} from "./Explorer.types";

type ExplorerContextValue = {
  controller: ExplorerController;
  commands: readonly ExplorerCommand[];
};

const ExplorerContext = createContext<ExplorerContextValue | null>(null);

type ExplorerProviderProps = {
  controller: ExplorerController;
  commands?: readonly ExplorerCommand[];
  children: ReactNode;
};

export function ExplorerProvider({
  controller,
  commands = [],
  children,
}: ExplorerProviderProps) {
  const value = useMemo(
    () => ({ controller, commands }),
    [commands, controller],
  );

  return createElement(ExplorerContext.Provider, { value }, children);
}

export function useExplorerContext() {
  const context = useContext(ExplorerContext);

  if (!context) {
    throw new Error("Explorer components must be rendered inside Explorer.");
  }

  return context;
}

export function createExplorerRuntime({
  controller,
  source,
  targetItems,
}: {
  controller: ExplorerController;
  source: ExplorerSurface;
  targetItems?: ExplorerItem[];
}): ExplorerRuntime {
  const focusedItem =
    controller.state.focusedIndex === null
      ? undefined
      : controller.items[controller.state.focusedIndex];

  return {
    source,
    targetItems: targetItems ?? getDefaultTargetItems(controller, source),
    items: controller.items,
    selectedItems: controller.selectedItems,
    contextMenuItems: controller.contextMenuItems,
    focusedItem,
    state: controller.state,
    dispatch: controller.dispatch,
    fileViewer: controller.fileViewer,
    clearSelection: controller.clearSelection,
    closeContextMenu: controller.closeContextMenu,
    openDetails: controller.openDetails,
    closeDetails: controller.closeDetails,
    toggleDetails: controller.toggleDetails,
  };
}

export function useExplorerRuntime(
  source: ExplorerSurface,
  targetItems?: ExplorerItem[],
) {
  const { controller } = useExplorerContext();

  return createExplorerRuntime({
    controller,
    source,
    targetItems,
  });
}

export function useExplorerCommandList(
  surface: ExplorerSurface,
  ids?: readonly string[],
  targetItems?: ExplorerItem[],
) {
  const { commands } = useExplorerContext();
  const runtime = useExplorerRuntime(surface, targetItems);
  const idSet = ids ? new Set(ids) : null;

  const resolvedCommands = commands
    .filter((command) => command.surfaces.includes(surface))
    .filter((command) => !idSet || idSet.has(command.id))
    .filter((command) => isExplorerCommandVisible(command, runtime))
    .sort((first, second) => {
      if (ids) {
        return ids.indexOf(first.id) - ids.indexOf(second.id);
      }

      return (first.order ?? 0) - (second.order ?? 0);
    });

  return {
    commands: resolvedCommands,
    runtime,
  };
}

export function useExplorerCommand(
  id: string,
  surface: ExplorerSurface,
  targetItems?: ExplorerItem[],
) {
  const { commands, runtime } = useExplorerCommandList(
    surface,
    [id],
    targetItems,
  );

  return {
    command: commands[0],
    runtime,
  };
}

export function isExplorerCommandVisible(
  command: ExplorerCommand,
  runtime: ExplorerRuntime,
) {
  return command.isVisible?.(runtime) ?? true;
}

export function isExplorerCommandDisabled(
  command: ExplorerCommand,
  runtime: ExplorerRuntime,
) {
  return command.isDisabled?.(runtime) ?? false;
}

export function getExplorerCommandIcon(
  command: ExplorerCommand,
  runtime: ExplorerRuntime,
) {
  if (typeof command.icon === "function") {
    return command.icon(runtime);
  }

  return command.icon;
}

function getDefaultTargetItems(
  controller: ExplorerController,
  source: ExplorerSurface,
) {
  if (source === "context-menu") {
    return controller.contextMenuItems;
  }

  if (source === "file-viewer") {
    return controller.fileViewer.openedFile
      ? [controller.fileViewer.openedFile]
      : [];
  }

  return controller.selectedItems;
}
