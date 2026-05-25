import db from "@/lib/db";

export type GetFolderData = {
  id: string;
  name: string;
  createdAt: Date;
  parentFolder: {
    id: string;
    name: string;
  } | null;
};

export type GetFolderResult =
  | { success: true; data: GetFolderData }
  | { success: false; code: "NOT_FOUND" | "DATABASE_ERROR" };

export async function getFolder(id: string): Promise<GetFolderResult> {
  if (!id || id === "root") {
    return {
      success: true,
      data: {
        id: "root",
        name: "root",
        createdAt: new Date(0),
        parentFolder: null,
      },
    };
  }

  try {
    const folder = await db.query.folders.findFirst({
      columns: {
        id: true,
        name: true,
        createdAt: true,
      },
      where: { id },
      with: {
        parentFolder: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!folder) {
      return { success: false, code: "NOT_FOUND" };
    }

    return { success: true, data: folder };
  } catch (error) {
    console.error("Error getting folder:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
