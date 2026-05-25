import db, { folders } from "@/lib/db";
import { and, eq, isNull } from "drizzle-orm";

export type Folder = {
  id: string;
  name: string;
  parentFolderId: string | null;
};

export type CreateFolderResult =

  | { success: true; data: Folder }
  | { success: false; code: "INVALID_NAME" | "PARENT_NOT_FOUND" | "DUPLICATE_NAME" | "DATABASE_ERROR" };

export async function createFolder(
  name: string,
  parentFolderId: string | null
): Promise<CreateFolderResult> {
  // 1. Validation Logic
  if (!name.trim()) {
    return { success: false, code: "INVALID_NAME" };
  }

  try {
    // 2. Parent Existence Logic
    if (parentFolderId !== null) {
      const [parentExists] = await db
        .select({ id: folders.id })
        .from(folders)
        .where(eq(folders.id, parentFolderId))
        .limit(1);

      if (!parentExists) {
        return { success: false, code: "PARENT_NOT_FOUND" };
      }
    }

    // 3. Duplicate Logic
    const countDuplicates = await db
      .$count(folders,
        and(
          eq(folders.name, name),
          parentFolderId === null
            ? isNull(folders.parentFolderId)
            : eq(folders.parentFolderId, parentFolderId)
        )
      );

    if (countDuplicates > 0) {
      return { success: false, code: "DUPLICATE_NAME" };
    }

    // 4. Insertion Logic
    const [newFolder] = await db
      .insert(folders)
      .values({
        name,
        parentFolderId,
      })
      .returning();

    return { success: true, data: newFolder };

  } catch (error) {
    console.error("Database error creating folder:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}