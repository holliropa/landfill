import { defineRelations } from "drizzle-orm";
import { files, folders } from "./filesystem.js";
import { downloadJobItems, downloadJobs } from "./downloads.js";

export const relations = defineRelations(
  { files, folders, downloadJobs, downloadJobItems },
  (r) => ({
    files: {
      folder: r.one.folders({
        from: r.files.folderId,
        to: r.folders.id,
      }),
    },

    folders: {
      parentFolder: r.one.folders({
        from: r.folders.parentFolderId,
        to: r.folders.id,
        alias: "folder_tree",
      }),

      childrenFolders: r.many.folders({
        from: r.folders.id,
        to: r.folders.parentFolderId,
        alias: "folder_tree",
      }),

      files: r.many.files({
        from: r.folders.id,
        to: r.files.folderId,
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
    },
  }),
);
