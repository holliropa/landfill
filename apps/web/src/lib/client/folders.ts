import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFolder,
  getFolderContent,
  getFolderPath,
  renameFolder,
} from "./api.ts";
import { folderKeys } from "./keys";

export function useFolderContent(folderId: string) {
  return useQuery({
    queryKey: folderKeys.content(folderId),
    queryFn: () => getFolderContent(folderId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFolderPath(folderId: string) {
  return useQuery({
    queryKey: folderKeys.path(folderId),
    queryFn: () => getFolderPath(folderId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      parentFolderId,
    }: {
      name: string;
      parentFolderId: string;
    }) => createFolder(name, parentFolderId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: folderKeys.content(variables.parentFolderId),
      });
    },
  });
}

export function useRenameFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      folderId,
      newName,
    }: {
      folderId: string;
      newName: string;
    }) => {
      return renameFolder(folderId, newName);
    },
    onSuccess: async (_data) => {
      await queryClient.invalidateQueries({
        queryKey: folderKeys.content(_data.parentFolderId ?? "root"),
      });
    },
  });
}
