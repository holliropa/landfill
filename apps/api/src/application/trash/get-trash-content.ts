import db from "@/infrastructure/db";

export type TrashItem = {
  id: string;
  kind: "file" | "folder";
  name: string;
  createdAt: Date;
  deletedAt: Date;
  size: number | null;
  mimeType: string | null;
  location: { id: string; name: string };
};

export type GetTrashContentResult =
  | { success: true; data: { items: TrashItem[] } }
  | { success: false; code: "DATABASE_ERROR" };

export async function getTrashContent(): Promise<GetTrashContentResult> {
  try {
    const entries = await db.query.storageEntries.findMany({
      with: { blob: { columns: { size: true, mimeType: true } } },
    });
    const entryById = new Map(entries.map((entry) => [entry.id, entry]));

    const getDeletedAncestorAt = (parentId: string | null) => {
      let currentId = parentId;
      while (currentId !== null) {
        const parent = entryById.get(currentId);
        if (!parent || parent.kind !== "folder") return new Date(0);
        if (parent.deletedAt !== null) return parent.deletedAt;
        currentId = parent.parentId;
      }
      return null;
    };

    const items = entries.flatMap<TrashItem>((entry) => {
      if (entry.deletedAt === null) return [];

      const ancestorDeletedAt = getDeletedAncestorAt(entry.parentId);
      if (
        ancestorDeletedAt !== null &&
        entry.deletedAt.getTime() > ancestorDeletedAt.getTime()
      ) {
        return [];
      }

      const parent = entry.parentId ? entryById.get(entry.parentId) : null;
      return [
        {
          id: entry.id,
          kind: entry.kind,
          name: entry.name,
          createdAt: entry.createdAt,
          deletedAt: entry.deletedAt,
          size: entry.blob?.size ?? null,
          mimeType: entry.blob?.mimeType ?? null,
          location: parent
            ? { id: parent.id, name: parent.name }
            : { id: "root", name: "root" },
        },
      ];
    });

    return {
      success: true,
      data: {
        items: items.sort(
          (a, b) => b.deletedAt.getTime() - a.deletedAt.getTime(),
        ),
      },
    };
  } catch (error) {
    console.error("Error getting trash content:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
