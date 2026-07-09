import { useMutation, useQuery } from "@tanstack/react-query";
import {
  emptyTrash,
  getTrashContent,
  permanentlyDeleteTrashItem,
  restoreTrashItem,
} from "./api";
import { trashKeys } from "./keys";
import { useInvalidateStorageQueries } from "./invalidation";

export function useTrashContent() {
  return useQuery({
    queryKey: trashKeys.all,
    queryFn: getTrashContent,
  });
}

export function useRestoreTrashItem() {
  const invalidateStorageQueries = useInvalidateStorageQueries();

  return useMutation({
    mutationFn: ({ kind, id }: { kind: "file" | "folder"; id: string }) =>
      restoreTrashItem(kind, id),
    onSuccess: invalidateStorageQueries,
  });
}

export function usePermanentlyDeleteTrashItem() {
  const invalidateStorageQueries = useInvalidateStorageQueries();

  return useMutation({
    mutationFn: ({ kind, id }: { kind: "file" | "folder"; id: string }) =>
      permanentlyDeleteTrashItem(kind, id),
    onSuccess: invalidateStorageQueries,
  });
}

export function useEmptyTrash() {
  const invalidateStorageQueries = useInvalidateStorageQueries();

  return useMutation({
    mutationFn: emptyTrash,
    onSuccess: invalidateStorageQueries,
  });
}
