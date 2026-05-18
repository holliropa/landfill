import type { ExplorerItem } from "@/components/Explorer";
import { useMemo, useState } from "react";

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

  const openFile = (fileId: string) => {
    setOpenedId(fileId);
  };

  const closeFile = () => {
    setOpenedId(null);
  };

  const openPreviousFile = () => {
    if (!hasPreviousFile) {
      return;
    }

    setOpenedId(files[openedFileIndex - 1].id);
  };

  const openNextFile = () => {
    if (!hasNextFile) {
      return;
    }

    setOpenedId(files[openedFileIndex + 1].id);
  };
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
