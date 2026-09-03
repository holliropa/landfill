import db from "@/infrastructure/db";
import { isEntryInActiveTree } from "@/application/storage/trash-visibility";

export type SearchEntry = {
  id: string;
  kind: "file" | "folder";
  name: string;
  createdAt: Date;
  size: number | null;
  mimeType: string | null;
  parent: { id: string; name: string } | null;
};

export type FindEntriesByNameResult =
  | { success: true; data: SearchEntry[] }
  | { success: false; code: "DATABASE_ERROR" };

export async function findEntriesByName(
  name: string,
): Promise<FindEntriesByNameResult> {
  try {
    const matches = await db.query.storageEntries.findMany({
      where: { name: { like: `%${name}%` } },
      with: {
        blob: { columns: { size: true, mimeType: true } },
        parent: { columns: { id: true, name: true } },
      },
    });

    const activeMatches: SearchEntry[] = [];
    for (const entry of matches) {
      if (!(await isEntryInActiveTree(entry))) continue;

      activeMatches.push({
        id: entry.id,
        kind: entry.kind,
        name: entry.name,
        createdAt: entry.createdAt,
        size: entry.blob?.size ?? null,
        mimeType: entry.blob?.mimeType ?? null,
        parent: entry.parent
          ? { id: entry.parent.id, name: entry.parent.name }
          : null,
      });
    }

    return { success: true, data: activeMatches };
  } catch (error) {
    console.error("Error finding entries by name:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
