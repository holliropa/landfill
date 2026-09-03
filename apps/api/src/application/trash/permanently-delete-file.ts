import { permanentlyDeleteEntry } from "@/application/trash/trash-operations";

export type PermanentlyDeleteFileResult =
  | { success: true; data: { id: string; diskName: string } }
  | {
      success: false;
      code: "FILE_NOT_FOUND" | "FILE_NOT_IN_TRASH" | "DATABASE_ERROR";
    };

export async function permanentlyDeleteFile(
  id: string,
): Promise<PermanentlyDeleteFileResult> {
  const result = await permanentlyDeleteEntry(id, "file");
  if (result.success) {
    const file = result.data.affectedFiles[0];
    return file
      ? { success: true, data: file }
      : { success: false, code: "DATABASE_ERROR" };
  }

  const code =
    result.code === "NOT_FOUND"
      ? "FILE_NOT_FOUND"
      : result.code === "NOT_IN_TRASH"
        ? "FILE_NOT_IN_TRASH"
        : "DATABASE_ERROR";
  return { success: false, code };
}
