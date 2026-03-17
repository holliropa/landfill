import { useMemo, useState } from "react";
import {
  createFolder,
  getFolderContent,
  getFolderPath,
  uploadFiles,
} from "@/services/api.ts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useExplorer(initialFolderId: string = "root") {
  const queryClient = useQueryClient();

  const [folderId, setFolderId] = useState(initialFolderId);

  const folderContentQuery = useQuery({
    queryKey: ["folderContent", folderId],
    queryFn: () => getFolderContent(folderId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const folderPathQuery = useQuery({
    queryKey: ["folderPath", folderId],
    queryFn: () => getFolderPath(folderId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const uploadFilesMutation = useMutation({
    mutationFn: (files: File[]) => uploadFiles(files, folderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["folderContent", folderId],
      });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: (name: string) => createFolder(name, folderId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["folderContent", folderId],
      });
    },
  });

  const data = folderContentQuery.data;
  const folders = useMemo(() => {
    return data?.folders ?? [];
  }, [data]);
  const files = useMemo(() => {
    return data?.files ?? [];
  }, [data]);
  const path = folderPathQuery.data?.path ?? [];

  return {
    folderId,
    path,
    folders,
    files,
    openFolder: (id: string) => setFolderId(id),
    uploadFiles: (files: File[]) => uploadFilesMutation.mutateAsync(files),
    createFolder: (name: string) => createFolderMutation.mutateAsync(name),
  };
}
