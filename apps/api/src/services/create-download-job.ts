import db, { downloadJobItems, downloadJobs } from "@/lib/db";

export type CreateDownloadJobResult =
  | {
      success: true;
      data: {
        id: string;
        status: string;
      };
    }
  | { success: false; code: "DATABASE_ERROR" | "NO_ITEMS_PROVIDED" };

export type DownloadJobItem = {
  id: string;
  kind: "file" | "folder";
};

export async function createDownloadJob(
  items: DownloadJobItem[],
): Promise<CreateDownloadJobResult> {
  try {
    if (items.length === 0)
      return { success: false, code: "NO_ITEMS_PROVIDED" };

    return db.transaction((tx) => {
      const createdJobResult = tx
        .insert(downloadJobs)
        .values({
          status: "pending",
        })
        .returning({
          id: downloadJobs.id,
          status: downloadJobs.status,
        })
        .get();

      if (!createdJobResult) {
        return { success: false, code: "DATABASE_ERROR" };
      }

      tx.insert(downloadJobItems)
        .values(
          items.map((item) => ({
            jobId: createdJobResult.id,
            itemId: item.id,
            itemKind: item.kind,
          })),
        )
        .run();

      return { success: true, data: createdJobResult };
    });
  } catch (error) {
    console.error("Error creating download job", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
