import db from "@/infrastructure/db";
import { hasTrashedAncestor } from "@/application/storage/trash-visibility";

export type GetFolderData = {
  id: string;
  name: string;
  createdAt: Date;
  parentFolder: { id: string; name: string } | null;
};

export type GetFolderResult =
  | { success: true; data: GetFolderData }
  | { success: false; code: "NOT_FOUND" | "DATABASE_ERROR" };

export async function getFolder(id: string): Promise<GetFolderResult> {
  if (!id || id === "root") {
    return {
      success: true,
      data: {
        id: "root",
        name: "root",
        createdAt: new Date(0),
        parentFolder: null,
      },
    };
  }

  try {
    const folder = await db.query.storageEntries.findFirst({
      columns: {
        id: true,
        name: true,
        createdAt: true,
        parentId: true,
        deletedAt: true,
      },
      where: { id, kind: "folder" },
      with: {
        parent: { columns: { id: true, name: true } },
      },
    });

    if (
      !folder ||
      folder.deletedAt !== null ||
      (await hasTrashedAncestor(folder.parentId))
    ) {
      return { success: false, code: "NOT_FOUND" };
    }

    return {
      success: true,
      data: {
        id: folder.id,
        name: folder.name,
        createdAt: folder.createdAt,
        parentFolder: folder.parent
          ? { id: folder.parent.id, name: folder.parent.name }
          : null,
      },
    };
  } catch (error) {
    console.error("Error getting folder:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
