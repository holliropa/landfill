import { permanentlyDeleteEntry } from "@/application/trash/trash-operations";

export type PermanentlyDeleteFolderResult =
  | {
      success: true;
      data: { affectedFiles: { id: string; diskName: string }[] };
    }
  | {
      success: false;
      code: "FOLDER_NOT_FOUND" | "FOLDER_NOT_IN_TRASH" | "DATABASE_ERROR";
    };

export async function permanentlyDeleteFolder(
  id: string,
): Promise<PermanentlyDeleteFolderResult> {
  const result = await permanentlyDeleteEntry(id, "folder");
  if (result.success) return result;

  const code =
    result.code === "NOT_FOUND"
      ? "FOLDER_NOT_FOUND"
      : result.code === "NOT_IN_TRASH"
        ? "FOLDER_NOT_IN_TRASH"
        : "DATABASE_ERROR";
  return { success: false, code };
}
