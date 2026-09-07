import type { ExplorerItem } from "@/features/explorer";
import { toStorageExplorerItem } from "@/features/explorer/integrations/storage";
import { useGalleryImages } from "@/lib/client";
import { useMemo, useState } from "react";
import { GalleryExplorer } from "./GalleryExplorer";
import styles from "./GalleryPage.module.css";

export function GalleryPage() {
  const [mediaType, setMediaType] = useState<
    "all" | "image" | "video" | "audio"
  >("all");
  const { data, isLoading, isError } = useGalleryImages(mediaType);
  const items = useMemo<ExplorerItem[]>(
    () => data?.items.map(toStorageExplorerItem) ?? [],
    [data],
  );

  return (
    <div className={styles.root}>
      <GalleryExplorer
        items={items}
        isLoading={isLoading}
        isError={isError}
        mediaType={mediaType}
        onMediaTypeChange={setMediaType}
      />
    </div>
  );
}
