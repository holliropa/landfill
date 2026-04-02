import { useQuery } from "@tanstack/react-query";
import { searchItems } from "./api";

export function useStorageSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchItems(query),
    enabled: !!query,
  });
}
