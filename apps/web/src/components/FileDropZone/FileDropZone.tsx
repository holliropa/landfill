import styles from "./FileDropZone.module.css";
import React, { useRef, useState } from "react";
import { UploadCloudIcon } from "lucide-react";

export type FileDropZoneProps = {
  children: React.ReactNode;
  disabled?: boolean;
  overlayLabel?: string;
  onFilesDropped?: (files: File[]) => void;
};

function isFileDrag(event: React.DragEvent) {
  return Array.from(event.dataTransfer.types).includes("Files");
}

export function FileDropZone({
  children,
  disabled = false,
  overlayLabel = "Drop files here to upload",
  onFilesDropped,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragDepthRef = useRef(0);

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (disabled || !isFileDrag(event)) return;

    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (disabled || !isFileDrag(event)) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const handleDragLeave = () => {
    if (disabled) return;

    dragDepthRef.current -= 1;

    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (disabled || !isFileDrag(event)) return;

    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDragging(false);

    const droppedFiles = Array.from(event.dataTransfer.files);

    if (droppedFiles.length > 0 && onFilesDropped) {
      onFilesDropped(droppedFiles);
    }
  };

  return (
    <div
      className={styles.root}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}

      {isDragging && (
        <div className={styles.overlay} aria-hidden="true">
          <UploadCloudIcon size={40} />
          <strong>{overlayLabel}</strong>
        </div>
      )}
    </div>
  );
}
