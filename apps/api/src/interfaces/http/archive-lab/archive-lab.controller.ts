import { extractArchive } from "@/application/archive-lab/extract-archive";
import { getArchiveSource } from "@/application/archive-lab/get-archive-source";
import { openArchiveEntry } from "@/application/archive-lab/open-archive-entry";
import { browseArchive } from "@/application/archive-lab/browse-archive";
import type { Request, Response } from "express";

export async function getArchiveSourceHandler(req: Request, res: Response) {
  const { id } = req.params as { id?: string };
  if (!id) return res.status(400).json({ error: "File ID is required" });

  const result = await getArchiveSource(id);
  if (!result.success) return sendArchiveError(res, result);

  return res.status(200).json(result.source);
}

export async function downloadArchiveEntryHandler(req: Request, res: Response) {
  const { id } = req.params as { id?: string };
  const routeEntry = (req.params as { entry?: string }).entry;
  const entryIndex = Number(routeEntry ?? req.query.entry);
  if (!id || !Number.isInteger(entryIndex) || entryIndex < 0) {
    return res
      .status(400)
      .json({ error: "A valid file and entry are required" });
  }

  const revision =
    typeof req.query.revision === "string" ? req.query.revision : undefined;
  const result = await openArchiveEntry(id, entryIndex, revision);
  if (!result.success) return sendArchiveError(res, result);

  const { entry, stream, close } = result.data;
  if (routeEntry === undefined) res.attachment(entry.name);
  else {
    res.type(entry.name);
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
  }
  res.setHeader("Content-Length", entry.size);
  res.once("close", close);
  stream.once("error", (error) => {
    console.error(
      `Could not stream ZIP entry ${entryIndex} from ${id}:`,
      error,
    );
    if (!res.headersSent) {
      res.status(500).json({ error: "Could not download archive entry" });
    } else {
      res.destroy(error);
    }
  });
  stream.pipe(res);
}

export async function browseArchiveHandler(req: Request, res: Response) {
  const { id } = req.params as { id?: string };
  if (!id) return res.status(400).json({ error: "File ID is required" });
  if (req.query.path !== undefined && typeof req.query.path !== "string") {
    return res.status(400).json({ error: "Archive path must be text" });
  }

  const result = await browseArchive(id, req.query.path ?? "");
  if (!result.success) return sendArchiveError(res, result);
  return res.status(200).json(result.data);
}

export async function extractArchiveHandler(req: Request, res: Response) {
  const body = (req.body ?? {}) as {
    sourceFileId?: unknown;
    destinationFolderId?: unknown;
    entryIndexes?: unknown;
  };

  if (
    typeof body.sourceFileId !== "string" ||
    body.sourceFileId.length === 0 ||
    typeof body.destinationFolderId !== "string" ||
    body.destinationFolderId.length === 0 ||
    (body.entryIndexes !== undefined &&
      (!Array.isArray(body.entryIndexes) ||
        body.entryIndexes.length > 50_000 ||
        body.entryIndexes.some(
          (index) => !Number.isInteger(index) || Number(index) < 0,
        )))
  ) {
    return res.status(400).json({ error: "Invalid extraction request" });
  }

  const result = await extractArchive({
    sourceFileId: body.sourceFileId,
    destinationFolderId: body.destinationFolderId,
    entryIndexes:
      body.entryIndexes === undefined
        ? undefined
        : [...new Set(body.entryIndexes as number[])],
  });
  if (!result.success) return sendArchiveError(res, result);

  return res.status(201).json(result.data);
}

function sendArchiveError(
  res: Response,
  result: { success: false; code: string; message?: string },
) {
  const response = {
    error: getArchiveErrorMessage(result.code, result.message),
  };

  switch (result.code) {
    case "FILE_NOT_FOUND":
    case "DESTINATION_NOT_FOUND":
    case "ENTRY_NOT_FOUND":
      return res.status(404).json(response);
    case "UNSUPPORTED_ARCHIVE":
      return res.status(415).json(response);
    case "TOO_MANY_ENTRIES":
    case "ARCHIVE_TOO_LARGE":
      return res.status(413).json(response);
    case "INVALID_SELECTION":
    case "INVALID_PATH":
      return res.status(400).json(response);
    case "CONTENT_CHANGED":
      return res.status(409).json(response);
    case "PATH_NOT_FOUND":
      return res.status(404).json(response);
    case "INVALID_ARCHIVE":
    case "UNSAFE_ENTRY":
    case "UNSUPPORTED_ENTRY":
      return res.status(422).json(response);
    case "DATABASE_ERROR":
    case "EXTRACTION_FAILED":
    default:
      return res.status(500).json(response);
  }
}

function getArchiveErrorMessage(code: string, detail?: string) {
  if (detail) return detail;

  switch (code) {
    case "FILE_NOT_FOUND":
      return "Archive file not found";
    case "DESTINATION_NOT_FOUND":
      return "Destination folder not found";
    case "ENTRY_NOT_FOUND":
      return "Archive entry not found";
    case "PATH_NOT_FOUND":
      return "Archive folder not found";
    case "INVALID_PATH":
      return "Archive path is invalid";
    case "CONTENT_CHANGED":
      return "The archive changed while it was open";
    case "UNSUPPORTED_ARCHIVE":
      return "Archive Lab currently supports ZIP files";
    case "TOO_MANY_ENTRIES":
      return "The ZIP contains too many entries";
    case "ARCHIVE_TOO_LARGE":
      return "The ZIP expands beyond the supported archive size limit";
    case "INVALID_SELECTION":
      return "The selected archive entries are invalid";
    case "UNSUPPORTED_ENTRY":
      return "The selected archive entry cannot be extracted";
    case "UNSAFE_ENTRY":
      return "The ZIP contains an unsafe path";
    case "INVALID_ARCHIVE":
      return "The file is not a valid ZIP archive";
    default:
      return "Archive operation failed";
  }
}
