import { moveFolderToTrash } from "@/application/folders/move-folder-to-trash";

export type DeleteFolderResult =
  | {
      success: true;
      data: { affectedFiles: { id: string; diskName: string }[] };
    }
  | {
      success: false;
      code: "FOLDER_NOT_FOUND" | "DATABASE_ERROR" | "FOLDER_IN_TRASH";
    };

export async function deleteFolder(id: string): Promise<DeleteFolderResult> {
  const result = await moveFolderToTrash(id);

  if (!result.success) {
    return result;
  }

  return { success: true, data: { affectedFiles: [] } };
}
