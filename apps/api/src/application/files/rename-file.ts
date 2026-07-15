import db, { files } from "@/infrastructure/db";
import { and, eq, isNull, ne } from "drizzle-orm";
import { hasTrashedAncestor } from "@/application/storage/trash-visibility";

export type RenameFileResult =
  | {
      success: true;
      data: {
        id: string;
        name: string;
        diskName: string;
        size: number;
        mimeType: string;
        createdAt: Date;
        folderId: string | null;
      };
    }
  | {
      success: false;
      code:
        | "INVALID_NAME"
        | "FILE_NOT_FOUND"
        | "DUPLICATE_NAME"
        | "DATABASE_ERROR";
    };

export async function renameFile(
  fileId: string,
  newName: string,
): Promise<RenameFileResult> {
  const normalizedName = newName.trim();

  if (!normalizedName) {
    return { success: false, code: "INVALID_NAME" };
  }

  try {
    const [currentFile] = await db
      .select({
        id: files.id,
        folderId: files.folderId,
      })
      .from(files)
      .where(and(eq(files.id, fileId), isNull(files.deletedAt)))
      .limit(1);

    if (!currentFile || (await hasTrashedAncestor(currentFile.folderId))) {
      return { success: false, code: "FILE_NOT_FOUND" };
    }

    const duplicateCount = await db.$count(
      files,
      and(
        eq(files.originalName, normalizedName),
        ne(files.id, fileId),
        currentFile.folderId === null
          ? isNull(files.folderId)
          : eq(files.folderId, currentFile.folderId),
        isNull(files.deletedAt),
      ),
    );

    if (duplicateCount > 0) {
      return { success: false, code: "DUPLICATE_NAME" };
    }

    const [updatedFile] = await db
      .update(files)
      .set({ originalName: normalizedName })
      .where(and(eq(files.id, fileId), isNull(files.deletedAt)))
      .returning({
        id: files.id,
        name: files.originalName,
        diskName: files.diskName,
        size: files.size,
        mimeType: files.mimeType,
        createdAt: files.createdAt,
        folderId: files.folderId,
      });

    if (!updatedFile) {
      return { success: false, code: "FILE_NOT_FOUND" };
    }

    return { success: true, data: updatedFile };
  } catch (error) {
    console.error("Error renaming file:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
