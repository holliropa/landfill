import styles from "./FileViewer.module.css";
import { getFileRawUrl } from "@/lib/client";
import type { FileResponse } from "@/lib/client/api";

export function PdfViewer({ file }: { file: FileResponse }) {
  return (
    <iframe
      className={styles.media}
      src={getFileRawUrl(file.id)}
      title={file.name}
    />
  );
}
