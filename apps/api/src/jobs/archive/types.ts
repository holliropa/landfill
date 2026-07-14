export const archiveQueueName = "archive";

export const archiveJobName = {
  createArchive: "archive.create",
} as const;

export type ArchiveJobName =
  (typeof archiveJobName)[keyof typeof archiveJobName];

export type CreateArchiveJobData = {
  downloadJobId: string;
};
