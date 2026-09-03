import { restoreEntryFromTrash } from "@/application/trash/trash-operations";

export type RestoreFolderFromTrashResult =
  | { success: true; data: { id: string; parentFolderId: string | null } }
  | {
      success: false;
      code: "FOLDER_NOT_FOUND" | "FOLDER_NOT_IN_TRASH" | "DATABASE_ERROR";
    };

export async function restoreFolderFromTrash(
  id: string,
): Promise<RestoreFolderFromTrashResult> {
  const result = await restoreEntryFromTrash(id, "folder");
  if (result.success) {
    return {
      success: true,
      data: { id: result.data.id, parentFolderId: result.data.parentId },
    };
  }

  const code =
    result.code === "NOT_FOUND"
      ? "FOLDER_NOT_FOUND"
      : result.code === "NOT_IN_TRASH"
        ? "FOLDER_NOT_IN_TRASH"
        : "DATABASE_ERROR";
  return { success: false, code };
}
