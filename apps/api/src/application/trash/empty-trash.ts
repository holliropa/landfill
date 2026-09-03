import { permanentlyDeleteAllTrashedEntries } from "@/application/trash/trash-operations";

export type EmptyTrashResult =
  | {
      success: true;
      data: { affectedFiles: { id: string; diskName: string }[] };
    }
  | { success: false; code: "DATABASE_ERROR" };

export async function emptyTrash(): Promise<EmptyTrashResult> {
  return permanentlyDeleteAllTrashedEntries();
}
