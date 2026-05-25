import db from "@/lib/db";

export type FindFilesByNameResult =
  | {
      success: true;
      data: {
        id: string;
        originalName: string;
        createdAt: Date;
        size: number;
        mimeType: string;
        folder: { id: string; name: string } | null;
      }[];
    }
  | { success: false; code: "DATABASE_ERROR" };

export async function findFilesByName(
  name: string,
): Promise<FindFilesByNameResult> {
  try {
    const matchResult = await db.query.files.findMany({
      where: {
        originalName: {
          like: `%${name}%`,
        },
      },
      with: {
        folder: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    return { success: true, data: matchResult };
  } catch (error) {
    console.error("Error finding files by name:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
