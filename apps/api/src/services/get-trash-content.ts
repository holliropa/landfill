import db from "@/lib/db";

export type TrashItem = {
  id: string;
  kind: "file" | "folder";
  name: string;
  createdAt: Date;
  deletedAt: Date;
  size: number | null;
  mimeType: string | null;
  location: {
    id: string;
    name: string;
  };
};

export type GetTrashContentResult =
  | { success: true; data: { items: TrashItem[] } }
  | { success: false; code: "DATABASE_ERROR" };

export async function getTrashContent(): Promise<GetTrashContentResult> {
  try {
    const [deletedFiles, allFolders] = await Promise.all([
      db.query.files.findMany({
        columns: {
          id: true,
          originalName: true,
          createdAt: true,
          deletedAt: true,
          size: true,
          mimeType: true,
          folderId: true,
        },
        where: {
          deletedAt: { isNotNull: true },
        },
      }),
      db.query.folders.findMany({
        columns: {
          id: true,
          name: true,
          createdAt: true,
          deletedAt: true,
          parentFolderId: true,
        },
      }),
    ]);

    const foldersById = new Map(
      allFolders.map((folder) => [folder.id, folder]),
    );

    const getDeletedAncestorAt = (folderId: string | null) => {
      let currentFolderId = folderId;

      while (currentFolderId !== null) {
        const folder = foldersById.get(currentFolderId);

        if (!folder) return new Date(0);
        if (folder.deletedAt !== null) return folder.deletedAt;

        currentFolderId = folder.parentFolderId;
      }

      return null;
    };

    const isExplicitTrashItem = (
      itemDeletedAt: Date,
      parentFolderId: string | null,
    ) => {
      const ancestorDeletedAt = getDeletedAncestorAt(parentFolderId);

      if (ancestorDeletedAt === null) {
        return true;
      }

      return itemDeletedAt.getTime() <= ancestorDeletedAt.getTime();
    };

    const folderItems: TrashItem[] = allFolders
      .filter(
        (folder) =>
          folder.deletedAt !== null &&
          isExplicitTrashItem(folder.deletedAt, folder.parentFolderId),
      )
      .map((folder) => {
        const parent = folder.parentFolderId
          ? foldersById.get(folder.parentFolderId)
          : null;

        return {
          id: folder.id,
          kind: "folder",
          name: folder.name,
          createdAt: folder.createdAt,
          deletedAt: folder.deletedAt!,
          size: null,
          mimeType: null,
          location: parent
            ? { id: parent.id, name: parent.name }
            : { id: "root", name: "root" },
        };
      });

    const fileItems: TrashItem[] = deletedFiles
      .filter((file) => isExplicitTrashItem(file.deletedAt!, file.folderId))
      .map((file) => {
        const parent = file.folderId ? foldersById.get(file.folderId) : null;

        return {
          id: file.id,
          kind: "file",
          name: file.originalName,
          createdAt: file.createdAt,
          deletedAt: file.deletedAt!,
          size: file.size,
          mimeType: file.mimeType,
          location: parent
            ? { id: parent.id, name: parent.name }
            : { id: "root", name: "root" },
        };
      });

    return {
      success: true,
      data: {
        items: [...folderItems, ...fileItems].sort(
          (a, b) => b.deletedAt.getTime() - a.deletedAt.getTime(),
        ),
      },
    };
  } catch (error) {
    console.error("Error getting trash content:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
