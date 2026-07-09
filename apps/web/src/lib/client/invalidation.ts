import { useQueryClient } from "@tanstack/react-query";
import { fileKeys, folderKeys, trashKeys } from "./keys";

export function useInvalidateStorageQueries() {
  const queryClient = useQueryClient();

  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trashKeys.all }),
      queryClient.invalidateQueries({ queryKey: folderKeys.all }),
      queryClient.invalidateQueries({ queryKey: fileKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["search"] }),
    ]);
  };
}
