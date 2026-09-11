import styles from "./FileViewer.module.css";
import { getFileContentUrl } from "@/lib/client";
import type { FileResponse } from "@/lib/client/api";

export function PdfViewer({ file }: { file: FileResponse }) {
  return (
    <iframe
      className={styles.media}
      src={getFileContentUrl(file)}
      title={file.name}
    />
  );
}
