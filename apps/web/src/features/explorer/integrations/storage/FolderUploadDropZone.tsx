import { FileDropZone } from "@/components/FileDropZone";
import { useUploadFiles } from "@/lib/client";
import { useCallback, useEffect, type ReactNode } from "react";
import { toast } from "sonner";

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable ||
    target.getAttribute("role") === "textbox"
  );
}

function getTimestampString(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

export function FolderUploadDropZone({
  folderId,
  children,
  disabled = false,
}: {
  folderId: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  const { mutateAsync: uploadFiles } = useUploadFiles();

  const handleUpload = useCallback(
    (files: File[]) => {
      if (files.length === 0) return;

      const fileLabel = files.length === 1 ? "file" : "files";

      toast.promise(
        uploadFiles({
          files,
          parentFolderId: folderId,
        }),
        {
          loading: `Uploading ${files.length} ${fileLabel}`,
          success: `Uploaded ${files.length} ${fileLabel}`,
          error: `Failed to upload ${files.length} ${fileLabel}`,
          duration: 2000,
        },
      );
    },
    [folderId, uploadFiles],
  );

  useEffect(() => {
    if (disabled) return;

    const handlePaste = (event: ClipboardEvent) => {
      if (isEditableElement(event.target)) return;

      const clipboardFiles = Array.from(event.clipboardData?.files || []);

      if (clipboardFiles.length > 0) {
        event.preventDefault();
        const timestamp = getTimestampString();
        const processedFiles = clipboardFiles.map((file, idx) => {
          if (
            file.name === "image.png" ||
            file.name === "blob" ||
            !file.name ||
            file.name.startsWith("image.")
          ) {
            const ext =
              file.type === "image/jpeg"
                ? ".jpg"
                : file.type === "image/webp"
                  ? ".webp"
                  : ".png";
            const suffix = clipboardFiles.length > 1 ? `-${idx + 1}` : "";
            return new File([file], `screenshot-${timestamp}${suffix}${ext}`, {
              type: file.type || "image/png",
            });
          }
          return file;
        });

        handleUpload(processedFiles);
        return;
      }

      const text = event.clipboardData?.getData("text/plain");
      if (text && text.trim().length > 0) {
        event.preventDefault();
        const timestamp = getTimestampString();
        const isMarkdown =
          text.startsWith("# ") ||
          text.includes("\n# ") ||
          text.includes("```");
        const ext = isMarkdown ? ".md" : ".txt";
        const mimeType = isMarkdown ? "text/markdown" : "text/plain";
        const file = new File([text], `pasted-note-${timestamp}${ext}`, {
          type: mimeType,
        });

        handleUpload([file]);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [disabled, handleUpload]);

  return (
    <FileDropZone
      disabled={disabled}
      onFilesDropped={(files) => {
        handleUpload(files);
      }}
    >
      {children}
    </FileDropZone>
  );
}
