import styles from "./FileViewer.module.css";
import { getFileRawUrl } from "@/lib/client";
import type { FileResponse } from "@/lib/client/api";

export function AudioViewer({ file }: { file: FileResponse }) {
  return (
    <audio
      src={getFileRawUrl(file.id)}
      className={styles.audioMedia}
      controls
      autoPlay
    />
  );
}
