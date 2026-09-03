import { defineRelations } from "drizzle-orm";
import { storageBlobs, storageEntries } from "./filesystem.js";
import { downloadJobItems, downloadJobs } from "./downloads.js";

export const relations = defineRelations(
  { storageBlobs, storageEntries, downloadJobs, downloadJobItems },
  (r) => ({
    storageBlobs: {
      entries: r.many.storageEntries({
        from: r.storageBlobs.id,
        to: r.storageEntries.blobId,
      }),
    },

    storageEntries: {
      parent: r.one.storageEntries({
        from: r.storageEntries.parentId,
        to: r.storageEntries.id,
        alias: "entry_tree",
      }),

      children: r.many.storageEntries({
        from: r.storageEntries.id,
        to: r.storageEntries.parentId,
        alias: "entry_tree",
      }),

      blob: r.one.storageBlobs({
        from: r.storageEntries.blobId,
        to: r.storageBlobs.id,
      }),

      downloadItems: r.many.downloadJobItems({
        from: r.storageEntries.id,
        to: r.downloadJobItems.entryId,
      }),
    },

    downloadJobs: {
      items: r.many.downloadJobItems({
        from: r.downloadJobs.id,
        to: r.downloadJobItems.jobId,
      }),
    },

    downloadJobItems: {
      downloadJob: r.one.downloadJobs({
        from: r.downloadJobItems.jobId,
        to: r.downloadJobs.id,
      }),
      entry: r.one.storageEntries({
        from: r.downloadJobItems.entryId,
        to: r.storageEntries.id,
      }),
    },
  }),
);
