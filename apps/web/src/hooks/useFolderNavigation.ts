import { paths } from "@/router";
import { useNavigate } from "react-router-dom";

export type FolderNavigationTarget = {
  id: string;
  name?: string;
};

export function useFolderNavigation() {
  const navigate = useNavigate();

  return (target?: string | FolderNavigationTarget) => {
    const folderId = typeof target === "string" ? target : target?.id;

    navigate(paths.folderPath(folderId));
  };
}
