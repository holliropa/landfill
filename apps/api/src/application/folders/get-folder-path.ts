import db, { storageEntries } from "@/infrastructure/db";
import { and, eq, isNull } from "drizzle-orm";

export type GetFolderPathResult =
  | { success: true; path: { id: string; name: string }[] }
  | { success: false; code: "FOLDER_NOT_FOUND" | "DATABASE_ERROR" };

export async function getFolderPath(
  id: string | null,
): Promise<GetFolderPathResult> {
  if (id === null) {
    return { success: true, path: [{ id: "root", name: "root" }] };
  }

  try {
    const path: Array<{ id: string; name: string }> = [];
    let currentId: string | null = id;

    while (currentId !== null) {
      const [current] = await db
        .select({
          id: storageEntries.id,
          name: storageEntries.name,
          parentId: storageEntries.parentId,
        })
        .from(storageEntries)
        .where(
          and(
            eq(storageEntries.id, currentId),
            eq(storageEntries.kind, "folder"),
            isNull(storageEntries.deletedAt),
          ),
        )
        .limit(1);

      if (!current) {
        return { success: false, code: "FOLDER_NOT_FOUND" };
      }

      path.push({ id: current.id, name: current.name });
      currentId = current.parentId;
    }

    return {
      success: true,
      path: [{ id: "root", name: "root" }, ...path.reverse()],
    };
  } catch (error) {
    console.error("Error fetching folder path:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
