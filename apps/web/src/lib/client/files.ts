import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteFile,
  getFileById,
  renameFile,
  uploadFiles,
} from "@/lib/client/api.ts";
import { fileKeys, folderKeys } from "@/lib/client/keys.ts";

export function useUploadFiles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      files,
      parentFolderId,
    }: {
      files: File[];
      parentFolderId: string;
    }) => uploadFiles(files, parentFolderId),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: folderKeys.content(variables.parentFolderId),
      });
    },
  });
}

export function useRenameFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fileId, newName }: { fileId: string; newName: string }) =>
      renameFile(fileId, newName),
    onSuccess: async (_data) => {
      await queryClient.invalidateQueries({
        queryKey: folderKeys.content(_data.folderId ?? "root"),
      });
    },
  });
}

export function useDeleteFile() {
  return useMutation({
    mutationFn: ({ fileId }: { fileId: string }) => deleteFile(fileId),
  });
}

export function useFile(id: string) {
  return useQuery({
    queryKey: fileKeys.byId(id),
    queryFn: () => getFileById(id),
  });
}
