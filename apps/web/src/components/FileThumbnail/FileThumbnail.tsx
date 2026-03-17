import styles from "./FileThumbnail.module.css";
import { FileIcon } from "lucide-react";
import { useState } from "react";

interface FileThumbnailProps {
  fileId: string;
  alt: string;
}

export function FileThumbnail({ fileId, alt }: FileThumbnailProps) {
  const [failedFileId, setFailedFileId] = useState<string | null>(null);

  const hasError = failedFileId === fileId;

  const thumbnailUrl = `http://localhost:3000/api/files/${fileId}/thumbnail`;

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
        <FileIcon className={styles.defaultIcon} />
      )}
    </div>
  );
}
