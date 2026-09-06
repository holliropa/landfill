import { createImagePreview } from "@/application/image-lab/create-image-preview";
import { exportImage } from "@/application/image-lab/export-image";
import { getImageSource } from "@/application/image-lab/get-image-source";
import {
  imageOutputDefinitions,
  parseImageTransformRequest,
} from "@/domain/image-lab/image-transform";
import type { Request, Response } from "express";

export async function getImageSourceHandler(req: Request, res: Response) {
  const { id } = req.params as { id?: string };
  if (!id) return res.status(400).json({ error: "File ID is required" });

  const result = await getImageSource(id);
  if (!result.success) return sendImageLabError(res, result.code);

  return res.status(200).json(result.data);
}

export async function createImagePreviewHandler(req: Request, res: Response) {
  const parsed = parseImageTransformRequest(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const result = await createImagePreview(parsed.data);
  if (!result.success) return sendImageLabError(res, result.code);

  const output = imageOutputDefinitions[parsed.data.options.format];
  res.setHeader("Content-Type", output.mimeType);
  res.setHeader("Content-Length", result.data.size);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Landfill-Preview-Width", result.data.width);
  res.setHeader("X-Landfill-Preview-Height", result.data.height);
  res.setHeader("X-Landfill-Output-Width", result.data.outputWidth);
  res.setHeader("X-Landfill-Output-Height", result.data.outputHeight);
  return res.status(200).send(result.data.buffer);
}

export async function exportImageHandler(req: Request, res: Response) {
  const parsed = parseImageTransformRequest(req.body, {
    requireOutputName: true,
  });
  if (!parsed.success) return res.status(400).json({ error: parsed.error });

  const result = await exportImage(parsed.data);
  if (!result.success) return sendImageLabError(res, result.code);

  return res.status(201).json(result.data);
}

function sendImageLabError(res: Response, code: string) {
  switch (code) {
    case "FILE_NOT_FOUND":
      return res.status(404).json({ error: "Source image not found" });
    case "UNSUPPORTED_IMAGE":
      return res.status(415).json({
        error: "Image Lab supports static JPEG, PNG, and WebP images",
      });
    case "UNREADABLE_IMAGE":
      return res
        .status(422)
        .json({ error: "The source image could not be read" });
    case "INVALID_OUTPUT_NAME":
      return res.status(400).json({ error: "Output name is invalid" });
    case "TRANSFORM_FAILED":
      return res
        .status(422)
        .json({ error: "The image could not be transformed" });
    case "DATABASE_ERROR":
    default:
      return res.status(500).json({ error: "Internal server error" });
  }
}
