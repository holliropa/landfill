import db, { files, folders } from "@/infrastructure/db";
import { and, eq, isNull } from "drizzle-orm";
import { isFolderInActiveTree } from "@/application/storage/trash-visibility";

export type GetFolderContentResult =
  | {
      success: true;
      data: {
        files: {
          id: string;
          name: string;
          size: number;
          mimeType: string;
          createdAt: Date;
        }[];
        folders: {
          id: string;
          name: string;
          parentFolderId: string;
          createdAt: Date;
        }[];
      };
    }
  | { success: false; code: "FOLDER_NOT_FOUND" | "DATABASE_ERROR" };

export async function getFolderContent(
  folderId: string | null,
): Promise<GetFolderContentResult> {
  try {
    if (folderId !== null && !(await isFolderInActiveTree(folderId))) {
      return { success: false, code: "FOLDER_NOT_FOUND" };
    }

    const foldersResult = await db
      .select({
        id: folders.id,
        name: folders.name,
        parentFolderId: folders.parentFolderId,
        createdAt: folders.createdAt,
      })
      .from(folders)
      .where(
        and(
          folderId === null
            ? isNull(folders.parentFolderId)
            : eq(folders.parentFolderId, folderId),
          isNull(folders.deletedAt),
        ),
      );

    const filesResult = await db
      .select({
        id: files.id,
        originalName: files.originalName,
        size: files.size,
        mimeType: files.mimeType,
        createdAt: files.createdAt,
      })
      .from(files)
      .where(
        and(
          folderId === null
            ? isNull(files.folderId)
            : eq(files.folderId, folderId),
          isNull(files.deletedAt),
        ),
      );

    return {
      success: true,
      data: {
        files: filesResult.map(({ originalName, ...restFile }) => ({
          ...restFile,
          name: originalName,
        })),
        folders: foldersResult.map(({ parentFolderId, ...restFolder }) => ({
          ...restFolder,
          parentFolderId: parentFolderId ?? "root",
        })),
      },
    };
  } catch (error) {
    console.error("Error getting folder content:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
