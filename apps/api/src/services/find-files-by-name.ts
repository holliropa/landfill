import db from "@/lib/db";
import { hasTrashedAncestor } from "./trash-visibility";

export type FindFilesByNameResult =
  | {
      success: true;
      data: {
        id: string;
        originalName: string;
        createdAt: Date;
        size: number;
        mimeType: string;
        folder: { id: string; name: string } | null;
      }[];
    }
  | { success: false; code: "DATABASE_ERROR" };

export async function findFilesByName(
  name: string,
): Promise<FindFilesByNameResult> {
  try {
    const matchResult = await db.query.files.findMany({
      where: {
        originalName: {
          like: `%${name}%`,
        },
      },
      with: {
        folder: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    const activeMatches: {
      id: string;
      originalName: string;
      createdAt: Date;
      size: number;
      mimeType: string;
      folder: { id: string; name: string } | null;
    }[] = [];

    for (const file of matchResult) {
      if (
        file.deletedAt !== null ||
        (await hasTrashedAncestor(file.folderId))
      ) {
        continue;
      }

      const { deletedAt, diskName, folderId, folder, ...fileData } = file;
      activeMatches.push({
        ...fileData,
        folder: folder ? { id: folder.id, name: folder.name } : null,
      });
    }

    return { success: true, data: activeMatches };
  } catch (error) {
    console.error("Error finding files by name:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
