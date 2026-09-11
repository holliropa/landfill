import styles from "./FileViewer.module.css";
import { getFileContentUrl } from "@/lib/client";
import type { FileResponse } from "@/lib/client/api";

export function VideoViewer({ file }: { file: FileResponse }) {
  return (
    <video className={styles.media} controls src={getFileContentUrl(file)} />
  );
}
