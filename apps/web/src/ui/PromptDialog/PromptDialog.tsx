import styles from "./PromptDialog.module.css";
import { Dialog } from "@/ui/Dialog";
import { Button } from "@/ui/Button";
import { useEffect, useRef, useState } from "react";

export type PromptDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  confirmLabel: string;
  cancelLabel?: string;
  error?: string;
  onConfirm: (value: string) => void;
  onCancel?: () => void;
};

export function PromptDialog({
  open,
  title,
  description,
  label,
  defaultValue = "",
  placeholder,
  confirmLabel,
  cancelLabel = "Cancel",
  error,
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const focusTimer = window.setTimeout(() => {
      setValue(defaultValue);
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [defaultValue, open]);

  const trimmedValue = value.trim();
  const canConfirm = trimmedValue.length > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;

    onConfirm(trimmedValue);
  };

  return (
    <Dialog
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      footer={
        <>
          <Button variant="text" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirm}
            disabled={!canConfirm}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <label className={styles.field}>
        <span className={styles.label}>{label}</span>
        <input
          ref={inputRef}
          className={styles.input}
          value={value}
          placeholder={placeholder}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleConfirm();
            }

            if (event.key === "Escape") {
              event.preventDefault();
              onCancel?.();
            }
          }}
        />
      </label>
      {error && <div className={styles.error}>{error}</div>}
    </Dialog>
  );
}
