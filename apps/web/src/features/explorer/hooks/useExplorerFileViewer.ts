import { useCallback, useMemo, useState } from "react";
import type { ExplorerItem } from "@/features/explorer/types";

type ExplorerFileViewerParams = {
  items: ExplorerItem[];
};

export function useExplorerFileViewer({ items }: ExplorerFileViewerParams) {
  const [openedId, setOpenedId] = useState<string | null>(null);

  const files = useMemo(
    () => items.filter((item) => item.kind === "file"),
    [items],
  );

  const openedFileIndex = useMemo(
    () => files.findIndex((item) => item.id === openedId),
    [files, openedId],
  );

  const openedFile = openedFileIndex >= 0 ? files[openedFileIndex] : undefined;

  const hasPreviousFile = openedFileIndex > 0;
  const hasNextFile =
    openedFileIndex >= 0 && openedFileIndex < files.length - 1;

  const openFile = useCallback((fileId: string) => {
    setOpenedId(fileId);
  }, []);

  const closeFile = useCallback(() => {
    setOpenedId(null);
  }, []);

  const openPreviousFile = useCallback(() => {
    if (!hasPreviousFile) {
      return;
    }

    setOpenedId(files[openedFileIndex - 1].id);
  }, [files, hasPreviousFile, openedFileIndex]);

  const openNextFile = useCallback(() => {
    if (!hasNextFile) {
      return;
    }

    setOpenedId(files[openedFileIndex + 1].id);
  }, [files, hasNextFile, openedFileIndex]);
  return {
    openedId,
    openedFile,
    openedFileIndex,
    isOpen: openedId !== null,

    openFile,
    closeFile,
    openPreviousFile,
    openNextFile,

    hasPreviousFile,
    hasNextFile,
  };
}

export type ExplorerFileViewerApi = ReturnType<typeof useExplorerFileViewer>;
