import { restoreEntryFromTrash } from "@/application/trash/trash-operations";

export type RestoreFileFromTrashResult =
  | { success: true; data: { id: string; folderId: string | null } }
  | {
      success: false;
      code: "FILE_NOT_FOUND" | "FILE_NOT_IN_TRASH" | "DATABASE_ERROR";
    };

export async function restoreFileFromTrash(
  id: string,
): Promise<RestoreFileFromTrashResult> {
  const result = await restoreEntryFromTrash(id, "file");
  if (result.success) {
    return {
      success: true,
      data: { id: result.data.id, folderId: result.data.parentId },
    };
  }

  const code =
    result.code === "NOT_FOUND"
      ? "FILE_NOT_FOUND"
      : result.code === "NOT_IN_TRASH"
        ? "FILE_NOT_IN_TRASH"
        : "DATABASE_ERROR";
  return { success: false, code };
}
