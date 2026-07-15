import db, { folders } from "@/infrastructure/db";
import { and, eq, isNull, ne } from "drizzle-orm";
import { hasTrashedAncestor } from "@/application/storage/trash-visibility";

export type RenameFolderResult =
  | {
      success: true;
      data: {
        id: string;
        name: string;
        parentFolderId: string | null;
        createdAt: Date;
      };
    }
  | {
      success: false;
      code: "INVALID_NAME" | "NOT_FOUND" | "DUPLICATE_NAME" | "DATABASE_ERROR";
    };

export async function renameFolder(
  id: string,
  newName: string,
): Promise<RenameFolderResult> {
  const normalizedName = newName.trim();

  if (!normalizedName) {
    return { success: false, code: "INVALID_NAME" };
  }

  try {
    const [folder] = await db
      .select({
        id: folders.id,
        parentFolderId: folders.parentFolderId,
      })
      .from(folders)
      .where(and(eq(folders.id, id), isNull(folders.deletedAt)))
      .limit(1);

    if (!folder || (await hasTrashedAncestor(folder.parentFolderId))) {
      return { success: false, code: "NOT_FOUND" };
    }

    const duplicateCount = await db.$count(
      folders,
      and(
        eq(folders.name, normalizedName),
        ne(folders.id, id),
        folder.parentFolderId === null
          ? isNull(folders.parentFolderId)
          : eq(folders.parentFolderId, folder.parentFolderId),
        isNull(folders.deletedAt),
      ),
    );

    if (duplicateCount > 0) {
      return { success: false, code: "DUPLICATE_NAME" };
    }

    const [updatedFolder] = await db
      .update(folders)
      .set({ name: normalizedName })
      .where(and(eq(folders.id, folder.id), isNull(folders.deletedAt)))
      .limit(1)
      .returning();

    if (!updatedFolder) {
      return { success: false, code: "NOT_FOUND" };
    }

    return { success: true, data: updatedFolder };
  } catch (error) {
    console.error("Error renaming folder:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
