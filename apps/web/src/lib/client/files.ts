import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteFile,
  getFileById,
  HttpError,
  renameFile,
  uploadFiles,
} from "@/lib/client/api.ts";
import { fileKeys, folderKeys } from "@/lib/client/keys.ts";
import { useInvalidateStorageQueries } from "./invalidation";

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
  const invalidateStorageQueries = useInvalidateStorageQueries();

  return useMutation({
    mutationFn: ({ fileId, newName }: { fileId: string; newName: string }) =>
      renameFile(fileId, newName),
    onSuccess: async (_data) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: folderKeys.content(_data.folderId ?? "root"),
        }),
        queryClient.invalidateQueries({ queryKey: fileKeys.byId(_data.id) }),
        invalidateStorageQueries(),
      ]);
    },
  });
}

export function useDeleteFile() {
  return useMutation({
    mutationFn: ({ fileId }: { fileId: string }) => deleteFile(fileId),
  });
}

export function useFile(id: string, { enabled = true } = {}) {
  return useQuery({
    queryKey: fileKeys.byId(id),
    queryFn: ({ signal }) => getFileById(id, signal),
    enabled: enabled && id.length > 0,
    retry: shouldRetryDetailsQuery,
  });
}

function shouldRetryDetailsQuery(failureCount: number, error: Error) {
  return (
    (!(error instanceof HttpError) || error.status !== 404) && failureCount < 2
  );
}
