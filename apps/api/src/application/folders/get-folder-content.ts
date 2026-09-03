import db from "@/infrastructure/db";
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

    const entries = await db.query.storageEntries.findMany({
      where: {
        parentId: folderId === null ? { isNull: true } : folderId,
        deletedAt: { isNull: true },
      },
      with: { blob: true },
    });

    const folders = entries
      .filter((entry) => entry.kind === "folder")
      .map((entry) => ({
        id: entry.id,
        name: entry.name,
        parentFolderId: entry.parentId ?? "root",
        createdAt: entry.createdAt,
      }));

    const files = entries.flatMap((entry) =>
      entry.kind === "file" && entry.blob
        ? [
            {
              id: entry.id,
              name: entry.name,
              size: entry.blob.size,
              mimeType: entry.blob.mimeType,
              createdAt: entry.createdAt,
            },
          ]
        : [],
    );

    return { success: true, data: { files, folders } };
  } catch (error) {
    console.error("Error getting folder content:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
