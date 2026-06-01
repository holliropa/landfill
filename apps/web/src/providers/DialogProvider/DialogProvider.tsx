import React, { useCallback, useMemo, useRef, useState } from "react";
import { DialogContext } from "./DialogContext";
import type {
  ConfirmDialogOptions,
  DialogContextValue,
  PromptDialogOptions,
} from "./types";
import { PromptDialog } from "@/ui/PromptDialog";
import { ConfirmDialog } from "@/ui/ConfirmDialog";

type ActiveDialog =
  | {
      type: "prompt";
      options: PromptDialogOptions;
      resolve: (value: string | null) => void;
      cancel: () => void;
    }
  | {
      type: "confirm";
      options: ConfirmDialogOptions;
      resolve: (value: boolean) => void;
      cancel: () => void;
    };

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog | null>(null);
  const activeDialogRef = useRef<ActiveDialog | null>(null);

  const clearActiveDialog = useCallback(() => {
    activeDialogRef.current = null;
    setActiveDialog(null);
  }, []);

  const openDialog = useCallback((dialog: ActiveDialog) => {
    activeDialogRef.current?.cancel();

    activeDialogRef.current = dialog;
    setActiveDialog(dialog);
  }, []);

  const prompt = useCallback(
    (options: PromptDialogOptions) => {
      return new Promise<string | null>((resolve) => {
        openDialog({
          type: "prompt",
          options,
          resolve,
          cancel: () => resolve(null),
        });
      });
    },
    [openDialog],
  );

  const confirm = useCallback(
    (options: ConfirmDialogOptions) => {
      return new Promise<boolean>((resolve) => {
        openDialog({
          type: "confirm",
          options,
          resolve,
          cancel: () => resolve(false),
        });
      });
    },
    [openDialog],
  );

  const contextValue = useMemo<DialogContextValue>(
    () => ({
      prompt,
      confirm,
    }),
    [prompt, confirm],
  );

  return (
    <DialogContext.Provider value={contextValue}>
      {children}

      {activeDialog?.type === "prompt" && (
        <PromptDialog
          open
          {...activeDialog.options}
          onConfirm={(value) => {
            activeDialog.resolve(value);
            clearActiveDialog();
          }}
          onCancel={() => {
            activeDialog.cancel();
            clearActiveDialog();
          }}
        />
      )}

      {activeDialog?.type === "confirm" && (
        <ConfirmDialog
          open
          {...activeDialog.options}
          onConfirm={() => {
            activeDialog.resolve(true);
            clearActiveDialog();
          }}
          onCancel={() => {
            activeDialog.cancel();
            clearActiveDialog();
          }}
        />
      )}
    </DialogContext.Provider>
  );
}
