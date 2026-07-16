import { getConversionJob } from "@/application/conversions/get-conversion-job";
import type { Request, Response } from "express";
import { createConversionJob } from "@/application/conversions/create-conversion-job";

export async function createConversionJobHandler(req: Request, res: Response) {
  const result = await createConversionJob(req.body);

  if (!result.success) {
    const status =
      result.code === "FILE_NOT_FOUND"
        ? 404
        : result.code === "UNSUPPORTED_TARGET" ||
            result.code === "INVALID_SOURCE"
          ? 400
          : 503;
    return res.status(status).json({ error: result.code });
  }

  return res.status(201).json(result.data);
}

export async function getConversionJobHandler(req: Request, res: Response) {
  const { id } = req.params as { id: string };
  const result = await getConversionJob(id);

  if (!result.success) {
    return res.status(404).json({ error: "Conversion job not found" });
  }

  return res.status(200).json(result.data);
}
