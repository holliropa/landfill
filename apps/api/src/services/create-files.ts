import db, { files, folders } from "@/lib/db";
import { eq, isNull } from "drizzle-orm";

export type UploadedFileData = {
  id: string;
  mimeType: string;
  size: number;
  folderId: string | null;
  createdAt: Date;
  name: string;
};

export type UploadFilesResult =
  | { success: true; data: UploadedFileData[] }
  | { success: false; code: "FOLDER_NOT_FOUND" | "DATABASE_ERROR" };

export type FileEntry = {
  originalName: string;
  filename: string;
  size: number;
  mimeType: string;
};

export async function createFiles(
  payloads: FileEntry[],
  folderId: string,
): Promise<UploadFilesResult> {
  try {
    return db.transaction((tx) => {
      const normalizedFolderId = folderId == "root" ? null : folderId;

      if (normalizedFolderId !== null) {
        const [folderExists] = tx
          .select({ id: folders.id })
          .from(folders)
          .where(eq(folders.id, normalizedFolderId))
          .limit(1)
          .all();

        if (!folderExists) {
          return { success: false, code: "FOLDER_NOT_FOUND" };
        }
      }

      const existingFiles = tx
        .select({ originalName: files.originalName })
        .from(files)
        .where(
          normalizedFolderId === null
            ? isNull(files.folderId)
            : eq(files.folderId, normalizedFolderId),
        )
        .all();

      const usedNames = new Set(
        existingFiles.map((file) => normalizeFileNameKey(file.originalName)),
      );

      const valuesToInsert = payloads.map((file) => ({
        originalName: getAvailableFileName(file.originalName, usedNames),
        diskName: file.filename,
        size: file.size,
        mimeType: file.mimeType,
        folderId: normalizedFolderId,
      }));

      const insertedRows = tx
        .insert(files)
        .values(valuesToInsert)
        .returning()
        .all();

      const formattedFiles = insertedRows.map(
        ({ originalName, diskName, ...file }) => ({
          ...file,
          name: originalName,
        }),
      );

      return { success: true, data: formattedFiles };
    });
  } catch (error) {
    console.error("Error creating files:", error);
    return { success: false, code: "DATABASE_ERROR" };
  }
}

function getAvailableFileName(originalName: string, usedNames: Set<string>) {
  if (!usedNames.has(normalizeFileNameKey(originalName))) {
    usedNames.add(normalizeFileNameKey(originalName));
    return originalName;
  }

  const { baseName, extension } = splitFileName(originalName);

  for (let copyNumber = 1; ; copyNumber++) {
    const candidate = `${baseName} (${copyNumber})${extension}`;
    const candidateKey = normalizeFileNameKey(candidate);

    if (!usedNames.has(candidateKey)) {
      usedNames.add(candidateKey);
      return candidate;
    }
  }
}

function splitFileName(fileName: string) {
  const extensionStart = fileName.lastIndexOf(".");

  if (extensionStart <= 0) {
    return { baseName: fileName, extension: "" };
  }

  return {
    baseName: fileName.slice(0, extensionStart),
    extension: fileName.slice(extensionStart),
  };
}

function normalizeFileNameKey(fileName: string) {
  return fileName.toLocaleLowerCase();
}
