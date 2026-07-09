import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createFolder,
  deleteFolder,
  getFolder,
  getFolderContent,
  getFolderPath,
  renameFolder,
} from "./api.ts";
import { folderKeys } from "./keys";
import { useInvalidateStorageQueries } from "./invalidation";

export function useFolderContent(folderId: string) {
  return useQuery({
    queryKey: folderKeys.content(folderId),
    queryFn: () => getFolderContent(folderId),
  });
}

export function useFolderPath(folderId: string) {
  return useQuery({
    queryKey: folderKeys.path(folderId),
    queryFn: () => getFolderPath(folderId),
    staleTime: Infinity,
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
  const invalidateStorageQueries = useInvalidateStorageQueries();

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
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: folderKeys.content(_data.parentFolderId ?? "root"),
        }),
        queryClient.invalidateQueries({ queryKey: folderKeys.byId(_data.id) }),
        invalidateStorageQueries(),
      ]);
    },
  });
}

export function useDeleteFolder() {
  return useMutation({
    mutationFn: ({ folderId }: { folderId: string }) => deleteFolder(folderId),
  });
}

export function useFolder(folderId: string) {
  return useQuery({
    queryKey: folderKeys.byId(folderId),
    queryFn: () => getFolder(folderId),
  });
}
