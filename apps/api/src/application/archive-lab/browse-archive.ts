import { lookup as lookupMimeType } from "mime-types";
import { getArchiveSource, type ArchiveSource } from "./get-archive-source";

export type ArchiveBrowserItem = {
  id: string;
  path: string;
  name: string;
  kind: "file" | "folder";
  entryIndex: number | null;
  size: number | null;
  mimeType: string | null;
  modifiedAt: Date | null;
  supported: boolean;
};

export type BrowseArchiveResult =
  | {
      success: true;
      data: {
        archive: Omit<ArchiveSource, "entries">;
        path: string;
        breadcrumbs: { name: string; path: string }[];
        items: ArchiveBrowserItem[];
      };
    }
  | {
      success: false;
      code:
        | "FILE_NOT_FOUND"
        | "UNSUPPORTED_ARCHIVE"
        | "INVALID_ARCHIVE"
        | "INVALID_PATH"
        | "PATH_NOT_FOUND";
      message?: string;
    };

export async function browseArchive(
  fileId: string,
  requestedPath: string,
): Promise<BrowseArchiveResult> {
  const path = normalizeDirectoryPath(requestedPath);
  if (path === null) return { success: false, code: "INVALID_PATH" };

  const sourceResult = await getArchiveSource(fileId);
  if (!sourceResult.success) {
    return {
      success: false,
      code:
        sourceResult.code === "FILE_NOT_FOUND" ||
        sourceResult.code === "UNSUPPORTED_ARCHIVE"
          ? sourceResult.code
          : "INVALID_ARCHIVE",
      message: sourceResult.message,
    };
  }

  const { entries, ...archive } = sourceResult.source;
  const prefix = path ? `${path}/` : "";
  if (
    path &&
    !entries.some(
      (entry) =>
        (entry.kind === "directory" && entry.path === path) ||
        entry.path.startsWith(prefix),
    )
  ) {
    return { success: false, code: "PATH_NOT_FOUND" };
  }

  const itemsById = new Map<string, ArchiveBrowserItem>();
  for (const entry of entries) {
    if (!entry.path.startsWith(prefix) || entry.path === path) continue;

    const relativePath = entry.path.slice(prefix.length);
    const separatorIndex = relativePath.indexOf("/");
    if (separatorIndex >= 0) {
      const name = relativePath.slice(0, separatorIndex);
      const childPath = path ? `${path}/${name}` : name;
      const id = `directory:${childPath}`;
      const existing = itemsById.get(id);
      itemsById.set(id, {
        id,
        path: childPath,
        name,
        kind: "folder",
        entryIndex: null,
        size: null,
        mimeType: null,
        modifiedAt: latestDate(existing?.modifiedAt, entry.modifiedAt),
        supported: existing?.supported === true || entry.supported,
      });
      continue;
    }

    if (entry.kind === "directory") {
      const id = `directory:${entry.path}`;
      itemsById.set(id, {
        id,
        path: entry.path,
        name: entry.name,
        kind: "folder",
        entryIndex: entry.index,
        size: null,
        mimeType: null,
        modifiedAt: entry.modifiedAt,
        supported: true,
      });
      continue;
    }

    itemsById.set(`entry:${entry.index}`, {
      id: `entry:${entry.index}`,
      path: entry.path,
      name: entry.name,
      kind: "file",
      entryIndex: entry.index,
      size: entry.size,
      mimeType: lookupMimeType(entry.name) || "application/octet-stream",
      modifiedAt: entry.modifiedAt,
      supported: entry.supported,
    });
  }

  const items = [...itemsById.values()].sort(
    (left, right) =>
      Number(right.kind === "folder") - Number(left.kind === "folder") ||
      left.name.localeCompare(right.name),
  );

  return {
    success: true,
    data: {
      archive,
      path,
      breadcrumbs: buildBreadcrumbs(path),
      items,
    },
  };
}

function normalizeDirectoryPath(value: string) {
  if (!value) return "";
  if (
    value.length > 4_096 ||
    value.startsWith("/") ||
    value.startsWith("\\") ||
    /[\\\u0000-\u001f]/.test(value)
  ) {
    return null;
  }

  const segments = value.split("/").filter(Boolean);
  if (segments.some((segment) => segment === "." || segment === "..")) {
    return null;
  }
  return segments.join("/");
}

function buildBreadcrumbs(path: string) {
  if (!path) return [];
  const segments = path.split("/");
  return segments.map((name, index) => ({
    name,
    path: segments.slice(0, index + 1).join("/"),
  }));
}

function latestDate(left: Date | null | undefined, right: Date | null) {
  if (!left) return right;
  if (!right) return left;
  return left > right ? left : right;
}
