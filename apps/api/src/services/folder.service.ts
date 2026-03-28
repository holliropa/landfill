import { prisma } from "@/lib/prisma";

export const FolderService = {
  rootFolderId: "root",

  async getChildren(folderId: string | null) {
    const [folders, files] = await Promise.all([
      prisma.folder.findMany({
        where: { parentFolderId: folderId },
      }),

      prisma.file.findMany({
        where: { folderId },
      }),
    ]);

    return { folders, files };
  },

  async collectSubtreeIds(folderId: string | null) {
    const result: string[] = [];
    const queue: string[] = [];

    if (folderId !== null) {
      queue.push(folderId);
    } else {
      const rootChildren = await prisma.folder.findMany({
        where: { parentFolderId: null },
        select: { id: true },
      });

      rootChildren.forEach((child) => queue.push(child.id));
    }

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) continue;

      result.push(currentId);

      const childrenFolders = await prisma.folder.findMany({
        where: { parentFolderId: currentId },
        select: { id: true },
      });

      childrenFolders.forEach((child) => queue.push(child.id));
    }

    return result;
  },

  async create(name: string, parentFolderId: string) {
    return prisma.folder.create({
      data: {
        name,
        parentFolderId,
      },
    });
  },

  async rename(folderId: string, name: string) {
    return prisma.folder.update({
      where: { id: folderId },
      data: { name },
    });
  },

  async delete(folderId: string) {
    return prisma.folder.delete({
      where: { id: folderId },
    });
  },
};
