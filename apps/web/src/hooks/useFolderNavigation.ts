import { paths } from "@/router";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export type FolderNavigationTarget = {
  id: string;
  name?: string;
  revealItemKey?: string;
  openFileId?: string;
};

export function useFolderNavigation() {
  const navigate = useNavigate();

  return useCallback(
    (target?: string | FolderNavigationTarget) => {
      const folderId = typeof target === "string" ? target : target?.id;

      navigate(paths.folderPath(folderId), {
        state:
          typeof target === "object"
            ? {
                revealItemKey: target.revealItemKey,
                openFileId: target.openFileId,
              }
            : undefined,
      });
    },
    [navigate],
  );
}
