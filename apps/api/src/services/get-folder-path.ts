import db, { folders } from "@/lib/db";
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

    let [current] = await db
      .select({
        id: folders.id,
        name: folders.name,
        parentFolderId: folders.parentFolderId,
      })
      .from(folders)
      .where(and(eq(folders.id, id), isNull(folders.deletedAt)))
      .limit(1);

    if (!current) {
      return { success: false, code: "FOLDER_NOT_FOUND" };
    }

    while (current) {
      path.push({ id: current.id, name: current.name });

      if (!current.parentFolderId) break;

      [current] = await db
        .select({
          id: folders.id,
          name: folders.name,
          parentFolderId: folders.parentFolderId,
        })
        .from(folders)
        .where(
          and(
            eq(folders.id, current.parentFolderId),
            isNull(folders.deletedAt),
          ),
        )
        .limit(1);

      if (!current) {
        return { success: false, code: "FOLDER_NOT_FOUND" };
      }
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
