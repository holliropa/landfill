import db from "@/infrastructure/db";

type FileData = {
  id: string;
  originalName: string;
  diskName: string;
  size: number;
  mimeType: string;
  deletedAt: Date | null;
  createdAt: Date;
  folderId: string | null;
  folder: { id: string; name: string } | null;
};

export type GetFileResult =
  | { success: true; data: FileData }
  | { success: false; code: "FILE_NOT_FOUND" | "DATABASE_ERROR" };

export async function getFile(id: string): Promise<GetFileResult> {
  try {
    const entry = await db.query.storageEntries.findFirst({
      where: { id, kind: "file" },
      with: {
        blob: true,
        parent: { columns: { id: true, name: true } },
      },
    });

    if (!entry || !entry.blob) {
      return { success: false, code: "FILE_NOT_FOUND" };
    }

    return {
      success: true,
      data: {
        id: entry.id,
        originalName: entry.name,
        diskName: entry.blob.diskName,
        size: entry.blob.size,
        mimeType: entry.blob.mimeType,
        deletedAt: entry.deletedAt,
        createdAt: entry.createdAt,
        folderId: entry.parentId,
        folder: entry.parent
          ? { id: entry.parent.id, name: entry.parent.name }
          : null,
      },
    };
  } catch (error) {
    console.error("Error getting file", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
