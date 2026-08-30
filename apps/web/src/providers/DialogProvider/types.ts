export type PromptDialogOptions = {
  title: string;
  description?: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel: string;
  cancelLabel?: string;
};

export type ConfirmDialogOptions = {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export type FolderPickerDialogOptions = {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  initialFolderId?: string;
  excludedFolderIds?: string[];
};

export type FolderPickerResult = {
  id: string;
  name: string;
};

export type DialogContextValue = {
  prompt: (options: PromptDialogOptions) => Promise<string | null>;
  confirm: (options: ConfirmDialogOptions) => Promise<boolean>;
  selectFolder: (
    options: FolderPickerDialogOptions,
  ) => Promise<FolderPickerResult | null>;
};
