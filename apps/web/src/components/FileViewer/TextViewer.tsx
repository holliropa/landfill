import { getFileContentUrl } from "@/lib/client";
import type { FileResponse } from "@/lib/client/api";
import { SpinnerIcon } from "@/ui/SpinnerIcon";
import { useEffect, useState } from "react";
import styles from "./FileViewer.module.css";

const maximumPreviewCharacters = 500_000;

export function TextViewer({ file }: { file: FileResponse }) {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(getFileContentUrl(file), { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then((text) => {
        setContent(
          text.length > maximumPreviewCharacters
            ? `${text.slice(0, maximumPreviewCharacters)}\n\n[Preview truncated]`
            : text,
        );
      })
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") {
          return;
        }
        setError(
          reason instanceof Error ? reason.message : "Could not read file",
        );
      });
    return () => controller.abort();
  }, [file]);

  if (error) return <div className={styles.status}>{error}</div>;
  if (content === null) {
    return (
      <div className={styles.loadingStatus}>
        <SpinnerIcon size={24} /> Reading text…
      </div>
    );
  }

  return <pre className={styles.textPreview}>{content}</pre>;
}
