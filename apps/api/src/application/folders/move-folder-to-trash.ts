import { moveEntryToTrash } from "@/application/storage/entry-operations";

export type MoveToTrashResult =
  | { success: true; data: { id: string; name: string } }
  | {
      success: false;
      code: "FOLDER_NOT_FOUND" | "DATABASE_ERROR" | "FOLDER_IN_TRASH";
    };

export async function moveFolderToTrash(
  id: string,
): Promise<MoveToTrashResult> {
  const result = await moveEntryToTrash(id, "folder");

  if (result.success) return result;

  const code =
    result.code === "NOT_FOUND"
      ? "FOLDER_NOT_FOUND"
      : result.code === "ALREADY_IN_TRASH"
        ? "FOLDER_IN_TRASH"
        : "DATABASE_ERROR";
  return { success: false, code };
}
