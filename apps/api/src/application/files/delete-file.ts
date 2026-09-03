import db from "@/infrastructure/db";
import { moveEntryToTrash } from "@/application/storage/entry-operations";

export type DeleteFileResult =
  | { success: true; data: { id: string; diskName: string } }
  | {
      success: false;
      code: "FILE_NOT_FOUND" | "DATABASE_ERROR" | "FILE_IN_TRASH";
    };

export async function deleteFile(id: string): Promise<DeleteFileResult> {
  const file = await db.query.storageEntries.findFirst({
    where: { id, kind: "file" },
    columns: { id: true },
    with: { blob: { columns: { diskName: true } } },
  });

  if (!file || !file.blob) {
    return { success: false, code: "FILE_NOT_FOUND" };
  }

  const result = await moveEntryToTrash(id, "file");

  if (!result.success) {
    const code =
      result.code === "NOT_FOUND"
        ? "FILE_NOT_FOUND"
        : result.code === "ALREADY_IN_TRASH"
          ? "FILE_IN_TRASH"
          : "DATABASE_ERROR";
    return { success: false, code };
  }

  return { success: true, data: { id, diskName: file.blob.diskName } };
}
