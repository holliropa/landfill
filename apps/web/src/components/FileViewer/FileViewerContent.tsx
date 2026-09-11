import { findPreviewCapability } from "@/features/file-capabilities";
import type { FileResponse } from "@/lib/client/api";
import styles from "./FileViewer.module.css";

export function FileViewerContent({ file }: { file: FileResponse }) {
  const capability = findPreviewCapability(file);
  const Preview = capability?.Preview;
  if (Preview) return <Preview file={file} />;

  const extensionIndex = file.name.lastIndexOf(".");
  const extension =
    extensionIndex > 0 && extensionIndex < file.name.length - 1
      ? file.name.slice(extensionIndex)
      : null;

  return (
    <div className={styles.unsupportedStatus}>
      <strong>Preview unavailable</strong>
      <span>
        {extension
          ? `${extension} files are not supported in the viewer.`
          : "This file type is not supported in the viewer."}
      </span>
      <span className={styles.unsupportedMeta}>{file.mimeType}</span>
    </div>
  );
}
