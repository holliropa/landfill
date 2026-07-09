import db, { downloadJobItems, downloadJobs } from "@/lib/db";
import { hasTrashedAncestor } from "./trash-visibility";

export type CreateDownloadJobResult =
  | {
      success: true;
      data: {
        id: string;
        status: string;
      };
    }
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
      if (item.kind === "file") {
        const file = await db.query.files.findFirst({
          where: { id: item.id },
          columns: {
            id: true,
            folderId: true,
            deletedAt: true,
          },
        });

        if (
          !file ||
          file.deletedAt !== null ||
          (await hasTrashedAncestor(file.folderId))
        ) {
          return { success: false, code: "ITEM_NOT_FOUND" };
        }

        continue;
      }

      const folder = await db.query.folders.findFirst({
        where: { id: item.id },
        columns: {
          id: true,
          parentFolderId: true,
          deletedAt: true,
        },
      });

      if (
        !folder ||
        folder.deletedAt !== null ||
        (await hasTrashedAncestor(folder.parentFolderId))
      ) {
        return { success: false, code: "ITEM_NOT_FOUND" };
      }
    }

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
