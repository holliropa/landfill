import { Request, Response } from "express";
import { findFilesByName } from "@/application/search/find-files-by-name";
import { findFoldersByName } from "@/application/search/find-folders-by-name";
import { getFolderPath } from "@/application/folders/get-folder-path";
import {
  moveItems,
  type StorageItemReference,
} from "@/application/storage/move-items";

type StorageItem = {
  id: string;
  kind: "file" | "folder";
  name: string;
  createdAt: Date;
  size: number | null;
  mimeType: string | null;
  location: {
    id: string;
    name: string;
    path: { id: string; name: string }[];
  };
};

export async function searchItemsHandler(req: Request, res: Response) {
  const { query } = req.query as { query?: string };

  if (!query) return res.status(200).json([]);

  try {
    const filesResult = await findFilesByName(query);
    const matchedFiles = filesResult.success ? filesResult.data : [];

    const foldersResult = await findFoldersByName(query);
    const matchedFolders = foldersResult.success ? foldersResult.data : [];

    const locationPathPromises = new Map<
      string,
      Promise<{ id: string; name: string }[]>
    >();
    const getLocationPath = (id: string) => {
      const cached = locationPathPromises.get(id);
      if (cached) return cached;

      const pathPromise = getFolderPath(id === "root" ? null : id).then(
        (result) => (result.success ? result.path : []),
      );
      locationPathPromises.set(id, pathPromise);
      return pathPromise;
    };

    const items: StorageItem[] = await Promise.all([
      ...matchedFolders.map(async (folder) => ({
        id: folder.id,
        kind: "folder" as const,
        name: folder.name,
        createdAt: folder.createdAt,
        size: null,
        mimeType: null,
        location: {
          id: folder.parentFolder ? folder.parentFolder.id : "root",
          name: folder.parentFolder ? folder.parentFolder.name : "root",
          path: await getLocationPath(
            folder.parentFolder ? folder.parentFolder.id : "root",
          ),
        },
      })),
      ...matchedFiles.map(async (file) => ({
        id: file.id,
        kind: "file" as const,
        name: file.originalName,
        createdAt: file.createdAt,
        size: file.size,
        mimeType: file.mimeType,
        location: {
          id: file.folder ? file.folder.id : "root",
          name: file.folder ? file.folder.name : "root",
          path: await getLocationPath(file.folder ? file.folder.id : "root"),
        },
      })),
    ]);

    res.status(200).json({
      items,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to search items" });
  }
}

export function moveItemsHandler(req: Request, res: Response) {
  const body = (req.body ?? {}) as {
    items?: unknown;
    destinationFolderId?: unknown;
  };

  if (
    !Array.isArray(body.items) ||
    body.items.length === 0 ||
    body.items.length > 100 ||
    typeof body.destinationFolderId !== "string" ||
    body.items.some(
      (item) =>
        typeof item !== "object" ||
        item === null ||
        !("kind" in item) ||
        !("id" in item) ||
        (item.kind !== "file" && item.kind !== "folder") ||
        typeof item.id !== "string" ||
        item.id.length === 0,
    )
  ) {
    return res.status(400).json({ error: "Invalid move request" });
  }

  const items = body.items as StorageItemReference[];
  const uniqueItems = Array.from(
    new Map(items.map((item) => [`${item.kind}:${item.id}`, item])).values(),
  );
  const destinationFolderId =
    body.destinationFolderId === "root" ? null : body.destinationFolderId;
  const result = moveItems(uniqueItems, destinationFolderId);

  if (!result.success) {
    switch (result.code) {
      case "DESTINATION_NOT_FOUND":
        return res.status(404).json({ error: "Destination folder not found" });
      case "ITEM_NOT_FOUND":
        return res
          .status(404)
          .json({ error: "One or more items were not found" });
      case "INVALID_DESTINATION":
        return res.status(409).json({
          error:
            "A folder cannot be moved into itself or one of its descendants",
        });
      case "NAME_CONFLICT":
        return res.status(409).json({
          error: "One or more items have the same name in the destination",
          conflicts: result.conflicts,
        });
      case "DATABASE_ERROR":
      default:
        return res.status(500).json({ error: "Failed to move items" });
    }
  }

  return res.status(200).json(result.data);
}
