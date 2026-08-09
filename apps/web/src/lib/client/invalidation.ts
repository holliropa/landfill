import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { fileKeys, folderKeys, trashKeys } from "./keys";

export function useInvalidateStorageQueries() {
  const queryClient = useQueryClient();

  return useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trashKeys.all }),
      queryClient.invalidateQueries({ queryKey: folderKeys.all }),
      queryClient.invalidateQueries({ queryKey: fileKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["search"] }),
    ]);
  }, [queryClient]);
}
