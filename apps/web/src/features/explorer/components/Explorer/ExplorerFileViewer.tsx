import { FileViewer } from "@/components/FileViewer";
import { ExplorerActionGroup } from "./ExplorerActions";
import type { ExplorerRuntime } from "./Explorer.types";
import { useExplorerContext, useExplorerRuntime } from "./ExplorerContext";
import type { ReactNode } from "react";

export function ExplorerFileViewer({
  actionIds,
  children,
}: {
  actionIds?: readonly string[];
  children?: (runtime: ExplorerRuntime) => ReactNode;
}) {
  const { controller } = useExplorerContext();
  const { fileViewer } = controller;
  const targetItems = fileViewer.openedFile ? [fileViewer.openedFile] : [];
  const runtime = useExplorerRuntime("file-viewer", targetItems);

  if (fileViewer.openedId === null) {
    return null;
  }

  return (
    <FileViewer
      fileId={fileViewer.openedId}
      name={fileViewer.openedFile?.name}
      onClose={fileViewer.closeFile}
      navigation={{
        hasNext: fileViewer.hasNextFile,
        hasPrevious: fileViewer.hasPreviousFile,
        onNext: fileViewer.openNextFile,
        onPrevious: fileViewer.openPreviousFile,
      }}
      actions={
        children ? (
          children(runtime)
        ) : (
          <ExplorerActionGroup
            surface="file-viewer"
            ids={actionIds}
            targetItems={targetItems}
            size="large"
          />
        )
      }
    />
  );
}
