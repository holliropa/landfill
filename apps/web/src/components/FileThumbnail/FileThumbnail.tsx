import styles from "./FileThumbnail.module.css";
import { FileIcon } from "lucide-react";
import { useState } from "react";
import type { StoredFile } from "@/types";

interface FileThumbnailProps {
  file: StoredFile;
}

export function FileThumbnail({ file }: FileThumbnailProps) {
  const [failedFileId, setFailedFileId] = useState<string | null>(null);

  const hasError = failedFileId === file.id;

  const thumbnailUrl = `http://localhost:3000/api/files/${file.id}/thumbnail`;

  return (
    <div className={styles.container}>
      {!hasError ? (
        <img
          src={thumbnailUrl}
          alt={file.originalName}
          onError={() => setFailedFileId(file.id)}
          className={styles.thumbnail}
        />
      ) : (
        <FileIcon className={styles.defaultIcon} />
      )}
    </div>
  );
}
