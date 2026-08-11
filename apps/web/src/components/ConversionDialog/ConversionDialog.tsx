import { FileThumbnail } from "@/components/FileThumbnail";
import styles from "./ConversionDialog.module.css";
import type { ExplorerItem } from "@/features/explorer";
import {
  type CreateConversion,
  useCreateConversion,
  useConversionTargets,
} from "@/lib/client";
import { Button } from "@/ui/Button";
import { Dialog } from "@/ui/Dialog";
import { SpinnerIcon } from "@/ui/SpinnerIcon";
import { useState } from "react";
import { toast } from "sonner";

type ConversionFormat = CreateConversion["target"]["format"];
type FormatSelection = {
  fileId: string;
  format: ConversionFormat;
};

export type ConversionDialogProps = {
  file: ExplorerItem | null;
  open: boolean;
  onClose: () => void;
};

export function ConversionDialog({
  file,
  open,
  onClose,
}: ConversionDialogProps) {
  const [formatSelection, setFormatSelection] =
    useState<FormatSelection | null>(null);
  const {
    data: conversionTargets,
    isError: isTargetsError,
    isLoading,
  } = useConversionTargets(open ? (file?.id ?? null) : null);
  const {
    mutateAsync: createConversion,
    error: conversionError,
    isPending,
    reset: resetConversion,
  } = useCreateConversion();

  const selectedFormat =
    file && formatSelection?.fileId === file.id ? formatSelection.format : "";

  const handleClose = () => {
    setFormatSelection(null);
    resetConversion();
    onClose();
  };

  const handleConversion = async () => {
    if (!file || !selectedFormat || isPending) return;

    try {
      await createConversion({
        source: { kind: "file", id: file.id },
        target: { format: selectedFormat },
      });
      toast.success(`Conversion of "${file.name}" started`);
      handleClose();
    } catch {
      // The mutation error is displayed in the dialog.
    }
  };

  if (!file || !open) return null;

  const targets = conversionTargets?.targets ?? [];

  return (
    <Dialog
      open={open}
      title="Convert"
      onClose={handleClose}
      footer={
        <>
          <Button variant="text" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={isPending ? <SpinnerIcon size={16} /> : undefined}
            onClick={() => void handleConversion()}
            disabled={
              isLoading ||
              isTargetsError ||
              isPending ||
              targets.length === 0 ||
              !selectedFormat
            }
          >
            {isPending ? "Starting..." : "Convert"}
          </Button>
        </>
      }
    >
      <div className={styles.container}>
        <div className={styles.fileInfo}>
          <div className={styles.thumbnail}>
            <FileThumbnail fileId={file.id} alt={file.name} />
          </div>
          <div className={styles.fileDetails}>
            <strong className={styles.fileName} title={file.name}>
              {file.name}
            </strong>
            <span className={styles.fileLocation}>
              {file.location ? file.location.name : "Current folder"}
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.status}>
            <SpinnerIcon size={17} />
            <span>Loading available formats...</span>
          </div>
        ) : isTargetsError ? (
          <div className={`${styles.status} ${styles.error}`} role="alert">
            Could not load conversion formats.
          </div>
        ) : targets.length === 0 ? (
          <div className={styles.status}>
            This file does not have any supported conversion formats.
          </div>
        ) : (
          <label className={styles.conversionTargets}>
            <span className={styles.fieldLabel}>Convert to</span>
            <select
              className={styles.select}
              value={selectedFormat}
              disabled={isPending}
              onChange={(event) => {
                const format = event.currentTarget.value as
                  | ConversionFormat
                  | "";
                setFormatSelection(format ? { fileId: file.id, format } : null);
              }}
            >
              <option value="">Select a format</option>
              {targets.map((target) => (
                <option key={target.format} value={target.format}>
                  {target.label} (.{target.extension})
                </option>
              ))}
            </select>
          </label>
        )}

        {conversionError && (
          <div className={`${styles.status} ${styles.error}`} role="alert">
            {conversionError instanceof Error
              ? conversionError.message
              : "Could not start the conversion."}
          </div>
        )}
      </div>
    </Dialog>
  );
}
