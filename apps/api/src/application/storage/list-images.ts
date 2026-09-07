import db from "@/infrastructure/db";

export type MediaEntry = {
  id: string;
  name: string;
  createdAt: Date;
  size: number;
  mimeType: string;
  parent: { id: string; name: string } | null;
};

export type ImageEntry = MediaEntry;

export type ListMediaResult =
  | { success: true; data: MediaEntry[] }
  | { success: false; code: "DATABASE_ERROR" };

export type ListImagesResult = ListMediaResult;

export async function listMedia(
  type: "all" | "image" | "video" | "audio" = "all",
): Promise<ListMediaResult> {
  try {
    const entries = await db.query.storageEntries.findMany({
      with: { blob: { columns: { size: true, mimeType: true } } },
    });
    const entryById = new Map(entries.map((entry) => [entry.id, entry]));

    const media = entries.flatMap<MediaEntry>((entry) => {
      if (
        entry.kind !== "file" ||
        !entry.blob ||
        !isInActiveTree(entry, entryById)
      ) {
        return [];
      }

      const mime = entry.blob.mimeType.toLowerCase();
      const isImage = mime.startsWith("image/");
      const isVideo = mime.startsWith("video/");
      const isAudio = mime.startsWith("audio/");

      if (type === "image" && !isImage) return [];
      if (type === "video" && !isVideo) return [];
      if (type === "audio" && !isAudio) return [];
      if (type === "all" && !isImage && !isVideo && !isAudio) return [];

      const parent = entry.parentId ? entryById.get(entry.parentId) : null;

      return [
        {
          id: entry.id,
          name: entry.name,
          createdAt: entry.createdAt,
          size: entry.blob.size,
          mimeType: entry.blob.mimeType,
          parent:
            parent?.kind === "folder"
              ? { id: parent.id, name: parent.name }
              : null,
        },
      ];
    });

    return { success: true, data: media };
  } catch (error) {
    console.error("Error listing media:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}

export async function listImages(): Promise<ListImagesResult> {
  return listMedia("image");
}

function isInActiveTree(
  entry: { id: string; parentId: string | null; deletedAt: Date | null },
  entryById: Map<
    string,
    {
      id: string;
      kind: "file" | "folder";
      parentId: string | null;
      deletedAt: Date | null;
    }
  >,
) {
  let current: typeof entry | undefined = entry;
  const visitedIds = new Set<string>();

  while (current) {
    if (current.deletedAt !== null || visitedIds.has(current.id)) return false;
    visitedIds.add(current.id);

    if (current.parentId === null) return true;
    const parent = entryById.get(current.parentId);
    if (!parent || parent.kind !== "folder") return false;
    current = parent;
  }

  return false;
}
