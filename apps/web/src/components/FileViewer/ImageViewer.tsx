import styles from "./FileViewer.module.css";
import { getFileRawUrl } from "@/lib/client";
import type { FileResponse } from "@/lib/client/api";

export function ImageViewer({ file }: { file: FileResponse }) {
  return (
    <img
      className={styles.media}
      src={getFileRawUrl(file.id)}
      alt={file.name}
    />
  );
}
