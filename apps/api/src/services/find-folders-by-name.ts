import db from "@/lib/db";

export type FindFoldersByNameResult =
  | {
      success: true;
      data: {
        id: string;
        name: string;
        createdAt: Date;
        parentFolder: { id: string; name: string } | null;
      }[];
    }
  | { success: false; code: "DATABASE_ERROR" };

export async function findFoldersByName(
  name: string,
): Promise<FindFoldersByNameResult> {
  try {
    const matchResult = await db.query.folders.findMany({
      where: {
        name: {
          like: `%${name}%`,
        },
      },
      with: {
        parentFolder: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    return { success: true, data: matchResult };
  } catch (error) {
    console.error("Error finding folders by name:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
