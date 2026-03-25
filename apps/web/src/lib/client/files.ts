import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadFiles } from "@/lib/client/api.ts";
import { folderKeys } from "@/lib/client/keys.ts";

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
