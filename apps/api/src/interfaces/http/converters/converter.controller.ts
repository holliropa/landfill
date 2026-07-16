import { getConversionTargets } from "@/application/converters/get-conversion-target";
import { listConverters } from "@/application/converters/list-converters";
import type { Request, Response } from "express";

export function listConvertersHandler(req: Request, res: Response) {
  return res.status(200).json({ converters: listConverters() });
}

export async function getConversionTargetsHandler(req: Request, res: Response) {
  const { fileId } = req.query as { fileId: string };

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required" });
  }

  const result = await getConversionTargets(fileId);

  if (!result.success) {
    return res
      .status(result.code === "FILE_NOT_FOUND" ? 404 : 500)
      .json({
        error:
          result.code === "FILE_NOT_FOUND"
            ? "File not found"
            : "Failed to get conversion targets",
      });
  }

  return res.status(200).json({ targets: result.data });
}
