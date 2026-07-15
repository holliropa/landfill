import db from "@/infrastructure/db";
import { hasTrashedAncestor } from "@/application/storage/trash-visibility";

export type FindFoldersByNameResult =
  | {
      success: true;
      data: {
        id: string;
        name: string;
        createdAt: Date;
        parentFolder: { id: string; name: string } | null;
      }[];
    }
  | { success: false; code: "DATABASE_ERROR" };

export async function findFoldersByName(
  name: string,
): Promise<FindFoldersByNameResult> {
  try {
    const matchResult = await db.query.folders.findMany({
      where: {
        name: {
          like: `%${name}%`,
        },
      },
      with: {
        parentFolder: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    const activeMatches: {
      id: string;
      name: string;
      createdAt: Date;
      parentFolder: { id: string; name: string } | null;
    }[] = [];

    for (const folder of matchResult) {
      if (
        folder.deletedAt !== null ||
        (await hasTrashedAncestor(folder.parentFolderId))
      ) {
        continue;
      }

      const { deletedAt, parentFolderId, parentFolder, ...folderData } = folder;
      activeMatches.push({
        ...folderData,
        parentFolder: parentFolder
          ? { id: parentFolder.id, name: parentFolder.name }
          : null,
      });
    }

    return { success: true, data: activeMatches };
  } catch (error) {
    console.error("Error finding folders by name:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
