import db, { folders } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function hasTrashedAncestor(
  folderId: string | null,
): Promise<boolean> {
  let currentFolderId = folderId;

  while (currentFolderId !== null) {
    const folder = await db.query.folders.findFirst({
      where: { id: currentFolderId },
      columns: {
        id: true,
        parentFolderId: true,
        deletedAt: true,
      },
    });

    if (!folder || folder.deletedAt !== null) {
      return true;
    }

    currentFolderId = folder.parentFolderId;
  }

  return false;
}

export async function isFileInActiveTree(file: {
  deletedAt: Date | null;
  folderId: string | null;
}): Promise<boolean> {
  if (file.deletedAt !== null) {
    return false;
  }

  return !(await hasTrashedAncestor(file.folderId));
}

export async function isFolderInActiveTree(id: string): Promise<boolean> {
  const [folder] = await db
    .select({
      id: folders.id,
      parentFolderId: folders.parentFolderId,
      deletedAt: folders.deletedAt,
    })
    .from(folders)
    .where(eq(folders.id, id))
    .limit(1);

  if (!folder || folder.deletedAt !== null) {
    return false;
  }

  return !(await hasTrashedAncestor(folder.parentFolderId));
}
