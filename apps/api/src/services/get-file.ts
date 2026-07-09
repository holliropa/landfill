import db from "@/lib/db";

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
    const file = await db.query.files.findFirst({
      where: { id },
      with: {
        folder: {
          columns: { id: true, name: true },
        },
      },
    });

    if (!file) {
      return { success: false, code: "FILE_NOT_FOUND" };
    }

    const { folder, ...fileData } = file;

    return {
      success: true,
      data: {
        ...fileData,
        folder: folder ? { id: folder.id, name: folder.name } : null,
      },
    };
  } catch (error) {
    console.error("Error getting file", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
