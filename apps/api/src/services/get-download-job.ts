import db from "@/lib/db";

export type GetDownloadJobResult =
  | {
      success: true;
      data: {
        id: string;
        status: string;
        progress: number;
        fileName: string | null;
        errorMessage: string | null;
        expiresAt: Date | null;
      };
    }
  | { success: false; code: "NOT_FOUND" | "DATABASE_ERROR" };

export async function getDownloadJob(
  id: string,
): Promise<GetDownloadJobResult> {
  try {
    const downloadJobResult = await db.query.downloadJobs.findFirst({
      where: { id },
    });

    if (!downloadJobResult) {
      return { success: false, code: "NOT_FOUND" };
    }

    return { success: true, data: downloadJobResult };
  } catch (error) {
    console.error("Error fetching download job:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
