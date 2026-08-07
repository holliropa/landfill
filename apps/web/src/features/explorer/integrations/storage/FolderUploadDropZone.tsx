import { FileDropZone } from "@/components/FileDropZone";
import { useUploadFiles } from "@/lib/client";
import type { ReactNode } from "react";
import { toast } from "sonner";

export function FolderUploadDropZone({
  folderId,
  children,
}: {
  folderId: string;
  children: ReactNode;
}) {
  const { mutateAsync: uploadFiles } = useUploadFiles();

  return (
    <FileDropZone
      onFilesDropped={(files) => {
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
            duration: 1500,
          },
        );
      }}
    >
      {children}
    </FileDropZone>
  );
}
