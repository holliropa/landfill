import styles from "./FileThumbnail.module.css";
import { FileIcon } from "lucide-react";
import { useState } from "react";
import { getFileThumbnailUrl } from "@/lib/client";

interface FileThumbnailProps {
  fileId: string;
  alt: string;
  mimeType: string | null;
}

export function FileThumbnail({ fileId, alt, mimeType }: FileThumbnailProps) {
  const [failedFileId, setFailedFileId] = useState<string | null>(null);

  const canShowThumbnail = mimeType?.startsWith("image/") ?? false;
  const hasError = !canShowThumbnail || failedFileId === fileId;

  const thumbnailUrl = getFileThumbnailUrl(fileId);

  return (
    <div className={styles.container}>
      {!hasError ? (
        <img
          src={thumbnailUrl}
          alt={alt}
          onError={() => setFailedFileId(fileId)}
          className={styles.thumbnail}
        />
      ) : (
        <FileIcon className={styles.defaultIcon} aria-hidden="true" />
      )}
    </div>
  );
}
