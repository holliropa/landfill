import { prisma } from "@/lib/prisma";

export const FolderService = {
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

  async create(name: string, parentFolderId: string | null) {
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
