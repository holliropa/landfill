export const folderKeys = {
  all: ["folders"] as const,
  content: (folderId: string) =>
    [...folderKeys.all, "content", folderId] as const,
  path: (folderId: string) => [...folderKeys.all, "path", folderId] as const,
};

export const fileKeys = {
  all: ["files"] as const,
  byId: (id: string) => [...fileKeys.all, "byId", id] as const,
};
