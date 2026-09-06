import { createFiles } from "@/application/files/create-files";
import { loadImageSource } from "./get-image-source";
import {
  calculateImageDimensions,
  createImagePipeline,
  imageOutputDefinitions,
  normalizeImageOutputName,
  type ImageTransformRequest,
} from "@/domain/image-lab/image-transform";
import { cleanupFiles } from "@/infrastructure/filesystem/cleanup-files";
import { getFilePath } from "@/infrastructure/filesystem/get-file-path";
import { randomUUID } from "node:crypto";

export async function exportImage(input: ImageTransformRequest) {
  const sourceResult = await loadImageSource(input.sourceFileId);
  if (!sourceResult.success) return sourceResult;

  const outputName = normalizeImageOutputName(
    input.outputName ?? "",
    input.options.format,
  );
  if (!outputName) {
    return { success: false, code: "INVALID_OUTPUT_NAME" } as const;
  }

  const source = sourceResult.source;
  const outputDimensions = calculateImageDimensions(
    source.data,
    input.options.resize,
  );
  const outputDefinition = imageOutputDefinitions[input.options.format];
  const diskName = randomUUID();
  const outputPath = getFilePath(diskName);
  let outputRegistered = false;

  try {
    const info = await createImagePipeline(
      source.sourcePath,
      input.options,
      input.options.resize ? outputDimensions : undefined,
      { preserveMetadata: true },
    ).toFile(outputPath);

    const createResult = await createFiles(
      [
        {
          originalName: outputName,
          filename: diskName,
          size: info.size,
          mimeType: outputDefinition.mimeType,
        },
      ],
      source.folderId ?? "root",
    );

    if (!createResult.success) {
      return {
        success: false,
        code:
          createResult.code === "FOLDER_NOT_FOUND"
            ? "FILE_NOT_FOUND"
            : "DATABASE_ERROR",
      } as const;
    }

    const createdFile = createResult.data[0];
    if (!createdFile) {
      return { success: false, code: "DATABASE_ERROR" } as const;
    }

    outputRegistered = true;
    return {
      success: true,
      data: {
        ...createdFile,
        width: info.width,
        height: info.height,
      },
    } as const;
  } catch (error) {
    console.error(`Could not export image ${input.sourceFileId}:`, error);
    return { success: false, code: "TRANSFORM_FAILED" } as const;
  } finally {
    if (!outputRegistered) cleanupFiles([diskName]);
  }
}
