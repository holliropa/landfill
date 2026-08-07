import type { ReactNode } from "react";
import { ExplorerContextMenu } from "../ContextMenu/ContextMenu";
import { ExplorerList } from "../ExplorerList/ExplorerList";
import { ExplorerActionGroup } from "./ExplorerActions";
import { ExplorerProvider } from "./ExplorerContext";
import type { ExplorerController } from "./ExplorerController";
import { ExplorerFileViewer } from "./ExplorerFileViewer";
import { ExplorerKeyboardController } from "./ExplorerKeyboardController";
import {
  ExplorerContent,
  ExplorerDetailsPanel,
  ExplorerSelectionSummary,
  ExplorerShell,
  ExplorerToolbar,
  ExplorerWorkspace,
} from "./ExplorerLayout";
import type { ExplorerCommand } from "./Explorer.types";

export type ExplorerProps = {
  controller: ExplorerController;
  commands?: readonly ExplorerCommand[];
  children: ReactNode;
};

function ExplorerRoot({ controller, commands, children }: ExplorerProps) {
  return (
    <ExplorerProvider controller={controller} commands={commands}>
      {children}
    </ExplorerProvider>
  );
}

/**
 * Provides Explorer state and commands to the discoverable `Explorer.*`
 * building blocks. Composition remains consumer-owned so layouts, states,
 * commands, and product integrations can be selected per use case.
 *
 * @example
 * <Explorer controller={controller} commands={commands}>
 *   <Explorer.KeyboardController />
 *   <Explorer.Shell>
 *     <Explorer.Toolbar>
 *       <Explorer.SelectionSummary />
 *       <Explorer.ActionGroup surface="toolbar" />
 *     </Explorer.Toolbar>
 *     <Explorer.Workspace>
 *       <Explorer.Content><Explorer.List /></Explorer.Content>
 *       <Explorer.DetailsPanel>{renderDetails}</Explorer.DetailsPanel>
 *     </Explorer.Workspace>
 *     <Explorer.ContextMenu />
 *   </Explorer.Shell>
 *   <Explorer.FileViewer />
 * </Explorer>
 */
export const Explorer = Object.assign(ExplorerRoot, {
  KeyboardController: ExplorerKeyboardController,
  Shell: ExplorerShell,
  Toolbar: ExplorerToolbar,
  SelectionSummary: ExplorerSelectionSummary,
  ActionGroup: ExplorerActionGroup,
  Workspace: ExplorerWorkspace,
  Content: ExplorerContent,
  List: ExplorerList,
  DetailsPanel: ExplorerDetailsPanel,
  ContextMenu: ExplorerContextMenu,
  FileViewer: ExplorerFileViewer,
});
