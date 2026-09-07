import { useQuery } from "@tanstack/react-query";
import { getGalleryImages, searchItems } from "./api";
import { galleryKeys } from "./keys";

export function useStorageSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () => searchItems(query),
    enabled: !!query,
  });
}

export function useGalleryImages(
  type: "all" | "image" | "video" | "audio" = "all",
) {
  return useQuery({
    queryKey: [...galleryKeys.images(), type],
    queryFn: () => getGalleryImages(type),
  });
}
