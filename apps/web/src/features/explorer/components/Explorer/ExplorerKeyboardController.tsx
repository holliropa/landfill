import { useEffect } from "react";
import { useExplorerKeyboardNavigation } from "@/features/explorer/hooks";
import type { ExplorerCommand } from "./Explorer.types";
import {
  createExplorerRuntime,
  isExplorerCommandDisabled,
  useExplorerCommandList,
  useExplorerContext,
} from "./ExplorerContext";

type ExplorerKeyboardControllerProps = {
  enabled?: boolean;
  ids?: readonly string[];
};

export function ExplorerKeyboardController({
  enabled = true,
  ids,
}: ExplorerKeyboardControllerProps) {
  const { controller } = useExplorerContext();
  const keyboardEnabled =
    enabled &&
    controller.state.isKeyboardActive &&
    !controller.fileViewer.isOpen;
  const { commands } = useExplorerCommandList("keyboard", ids);

  useExplorerKeyboardNavigation({
    enabled: keyboardEnabled,
    items: controller.items,
    selectedCount: controller.selectedCount,
    focusedIndex: controller.state.focusedIndex,
    lastSelectedIndex: controller.state.anchorIndex,
    focusItem: (index) => controller.dispatch({ type: "focus", index }),
    selectItem: (index, mode = "replace") => {
      if (mode === "range") {
        controller.dispatch({ type: "select-range", index });
        return;
      }

      controller.dispatch({
        type: mode === "toggle" ? "toggle-select" : "select-one",
        index,
      });
    },
    selectAll: () => controller.dispatch({ type: "select-all" }),
    resetSelection: controller.clearSelection,
  });

  useEffect(() => {
    if (!keyboardEnabled || commands.length === 0) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      const command = commands.find((candidate) =>
        matchesCommandShortcut(candidate, event),
      );

      if (!command) {
        return;
      }

      const runtime = createExplorerRuntime({
        controller,
        source: "keyboard",
      });

      if (isExplorerCommandDisabled(command, runtime)) {
        return;
      }

      event.preventDefault();
      void command.run(runtime);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [commands, controller, keyboardEnabled]);

  return null;
}

function matchesCommandShortcut(
  command: ExplorerCommand,
  event: KeyboardEvent,
) {
  const shortcut = command.shortcut;
  if (!shortcut || event.key !== shortcut.key) {
    return false;
  }

  return (
    matchesModifier(shortcut.ctrlKey, event.ctrlKey) &&
    matchesModifier(shortcut.metaKey, event.metaKey) &&
    matchesModifier(shortcut.shiftKey, event.shiftKey) &&
    matchesModifier(shortcut.altKey, event.altKey)
  );
}

function matchesModifier(expected: boolean | undefined, actual: boolean) {
  return expected === undefined || expected === actual;
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}
