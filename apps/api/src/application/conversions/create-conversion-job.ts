import { getFile } from "@/application/files/get-file";
import { isFileInActiveTree } from "@/application/storage/trash-visibility";
import { findConverterForTarget } from "@/domain/conversions/converter-registry";
import { ConversionFormat } from "@/domain/conversions/converter.types";
import { addImageConversionJob } from "@/jobs/conversion/queue";

export type CreateConversionJobInput = {
  source: { kind: "file"; id: string };
  target: { format: ConversionFormat };
  options?: { quality?: number };
};

export type CreateConversionJobResult =
  | {
      success: true;
      data: { id: string; status: string };
    }
  | {
      success: false;
      code:
        | "INVALID_SOURCE"
        | "FILE_NOT_FOUND"
        | "UNSUPPORTED_TARGET"
        | "QUEUE_ERROR";
    };

export async function createConversionJob(
  input: CreateConversionJobInput,
): Promise<CreateConversionJobResult> {
  if (input.source.kind !== "file")
    return { success: false, code: "INVALID_SOURCE" };

  const fileResult = await getFile(input.source.id);

  if (!fileResult.success || !(await isFileInActiveTree(fileResult.data)))
    return { success: false, code: "FILE_NOT_FOUND" };

  const match = findConverterForTarget({
    fileName: fileResult.data.originalName,
    mimeType: fileResult.data.mimeType,
    targetFormat: input.target.format,
  });

  if (!match) {
    return { success: false, code: "UNSUPPORTED_TARGET" };
  }

  try {
    const job = await addImageConversionJob({
      sourceFileId: fileResult.data.id,
      targetFormat: input.target.format,
      quality: input.options?.quality,
    });

    return {
      success: true,
      data: {
        id: job.id!,
        status: "queued",
      },
    };
  } catch (error) {
    console.error("Error enqueueing conversion job:", error);
    return { success: false, code: "QUEUE_ERROR" };
  }
}
