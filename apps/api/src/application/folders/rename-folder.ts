import { renameEntry } from "@/application/storage/entry-operations";

export type RenameFolderResult =
  | {
      success: true;
      data: {
        id: string;
        name: string;
        parentFolderId: string | null;
        createdAt: Date;
      };
    }
  | {
      success: false;
      code: "INVALID_NAME" | "NOT_FOUND" | "DUPLICATE_NAME" | "DATABASE_ERROR";
    };

export async function renameFolder(
  id: string,
  newName: string,
): Promise<RenameFolderResult> {
  const result = await renameEntry(id, "folder", newName);

  if (!result.success) return result as RenameFolderResult;

  return {
    success: true,
    data: {
      id: result.data.id,
      name: result.data.name,
      parentFolderId: result.data.parentId,
      createdAt: result.data.createdAt,
    },
  };
}
