import db, { files } from "@/lib/db";
import { and, eq, isNull, ne } from "drizzle-orm";

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
    const currentFile = await db.query.files.findFirst({
      where: { id: fileId },
      columns: {
        id: true,
        folderId: true,
      },
    });

    if (!currentFile) {
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
      ),
    );

    if (duplicateCount > 0) {
      return { success: false, code: "DUPLICATE_NAME" };
    }

    const [updatedFile] = await db
      .update(files)
      .set({ originalName: normalizedName })
      .where(eq(files.id, fileId))
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
