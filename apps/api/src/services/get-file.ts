import db from "@/lib/db";

export type GetFileResult =
  | {
      success: true;
      data: {
        id: string;
        originalName: string;
        diskName: string;
        size: number;
        mimeType: string;
        createdAt: Date;
        folderId: string | null;
        folder: { id: string; name: string } | null;
      };
    }
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

    return { success: true, data: file };
  } catch (error) {
    console.error("Error getting file", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
