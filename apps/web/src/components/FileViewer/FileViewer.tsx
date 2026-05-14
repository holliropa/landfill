import styles from "./FileViewer.module.css";
import { getFileRawUrl, useFile } from "@/lib/client";
import { IconButton } from "@/ui/IconButton";
import { SpinnerIcon } from "@/ui/SpinnerIcon";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  TrashIcon,
  XIcon,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

const FILE_NAME_DISPLAY_LIMIT = 38;

export type FileViewerProps = {
  fileId: string;
  name?: string;
  onClose: () => void;

  navigation?: {
    hasPrevious?: boolean;
    hasNext?: boolean;
    onPrevious: () => void;
    onNext: () => void;
  };
};

function formatFileName(name: string) {
  if (name.length <= FILE_NAME_DISPLAY_LIMIT) {
    return name;
  }

  const startLength = Math.ceil((FILE_NAME_DISPLAY_LIMIT - 3) / 2);
  const endLength = Math.floor((FILE_NAME_DISPLAY_LIMIT - 3) / 2);

  return `${name.slice(0, startLength)}...${name.slice(-endLength)}`;
}

function CopyFileNameButton({ fileName }: { fileName: string }) {
  const [copiedName, setCopiedName] = useState(false);
  const copiedNameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  useEffect(() => {
    return () => {
      if (copiedNameTimeoutRef.current) {
        clearTimeout(copiedNameTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyName = async () => {
    await navigator.clipboard.writeText(fileName);
    setCopiedName(true);

    if (copiedNameTimeoutRef.current) {
      clearTimeout(copiedNameTimeoutRef.current);
    }

    copiedNameTimeoutRef.current = setTimeout(() => {
      setCopiedName(false);
      copiedNameTimeoutRef.current = null;
    }, 1200);
  };

  return (
    <IconButton
      icon={copiedName ? <CheckIcon /> : <CopyIcon />}
      onClick={handleCopyName}
      size="small"
      variant="outlined"
      aria-label="Copy file name"
      title="Copy file name"
    />
  );
}

export function FileViewer({
  fileId,
  name,
  onClose,
  navigation,
}: FileViewerProps) {
  const { data: fileData, isLoading, error } = useFile(fileId);
  const fileName = fileData?.name ?? name ?? "Loading...";
  const displayedFileName = formatFileName(fileName);

  return createPortal(
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.navigationContainer}>
          <IconButton
            icon={<XIcon />}
            variant="ghost"
            size="large"
            onClick={onClose}
          />
          {navigation && (
            <>
              <span className={styles.navigationSeparator} />
              <div className={styles.navigation}>
                <IconButton
                  icon={<ArrowLeftIcon />}
                  variant="ghost"
                  size="large"
                  disabled={!navigation.hasPrevious}
                  onClick={navigation.onPrevious}
                />
                <IconButton
                  icon={<ArrowRightIcon />}
                  variant="ghost"
                  size="large"
                  disabled={!navigation.hasNext}
                  onClick={navigation.onNext}
                />
              </div>
            </>
          )}
        </div>
        <div className={styles.fileNameContainer}>
          <span className={styles.fileName} title={fileName}>
            {displayedFileName}
          </span>
          <CopyFileNameButton
            key={`${fileId}:${fileName}`}
            fileName={fileName}
          />
        </div>
        <div className={styles.actionContainer}>
          <IconButton
            icon={<DownloadIcon />}
            variant="ghost"
            size="large"
            onClick={onClose}
          />
          <IconButton
            icon={<TrashIcon color="#a2030d" />}
            variant="ghost"
            size="large"
            onClick={onClose}
          />
        </div>
      </div>
      <div className={styles.mediaContainer}>
        {isLoading && (
          <div className={styles.loadingStatus}>
            <SpinnerIcon size={28} />
            <span>Loading...</span>
          </div>
        )}
        {error && (
          <div className={styles.status}>
            Error: {error.message || "File not found"}
          </div>
        )}
        {!isLoading && !error && !fileData && (
          <div className={styles.status}>File not found</div>
        )}
        {fileData?.mimeType.startsWith("image/") && (
          <img
            className={styles.media}
            src={getFileRawUrl(fileData.id)}
            alt={fileData.name}
          />
        )}
        {fileData?.mimeType.startsWith("video/") && (
          <video
            className={styles.media}
            controls
            src={getFileRawUrl(fileData.id)}
          />
        )}
      </div>
    </div>,
    document.body,
  );
}
