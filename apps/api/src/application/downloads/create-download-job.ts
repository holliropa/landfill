import db, { downloadJobItems, downloadJobs } from "@/infrastructure/db";
import { isEntryInActiveTree } from "@/application/storage/trash-visibility";

export type CreateDownloadJobResult =
  | { success: true; data: { id: string; status: string } }
  | {
      success: false;
      code: "DATABASE_ERROR" | "NO_ITEMS_PROVIDED" | "ITEM_NOT_FOUND";
    };

export type DownloadJobItem = {
  id: string;
  kind: "file" | "folder";
};

export async function createDownloadJob(
  items: DownloadJobItem[],
): Promise<CreateDownloadJobResult> {
  try {
    if (items.length === 0) {
      return { success: false, code: "NO_ITEMS_PROVIDED" };
    }

    for (const item of items) {
      const entry = await db.query.storageEntries.findFirst({
        where: { id: item.id, kind: item.kind },
        columns: { id: true, parentId: true, deletedAt: true },
      });

      if (!entry || !(await isEntryInActiveTree(entry))) {
        return { success: false, code: "ITEM_NOT_FOUND" };
      }
    }

    return db.transaction((tx) => {
      const createdJob = tx
        .insert(downloadJobs)
        .values({ status: "pending" })
        .returning({ id: downloadJobs.id, status: downloadJobs.status })
        .get();

      if (!createdJob) {
        return { success: false, code: "DATABASE_ERROR" };
      }

      tx.insert(downloadJobItems)
        .values(
          items.map((item) => ({
            jobId: createdJob.id,
            entryId: item.id,
          })),
        )
        .run();

      return { success: true, data: createdJob };
    });
  } catch (error) {
    console.error("Error creating download job", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}
