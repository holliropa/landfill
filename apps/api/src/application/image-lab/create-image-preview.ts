import { loadImageSource } from "./get-image-source";
import {
  calculateImageDimensions,
  createImagePipeline,
  type ImageTransformRequest,
} from "@/domain/image-lab/image-transform";

const maximumPreviewDimension = 1600;

export async function createImagePreview(input: ImageTransformRequest) {
  const sourceResult = await loadImageSource(input.sourceFileId);
  if (!sourceResult.success) return sourceResult;

  const source = sourceResult.source;
  const outputDimensions = calculateImageDimensions(
    source.data,
    input.options.resize,
  );
  const previewScale = Math.min(
    1,
    maximumPreviewDimension / outputDimensions.width,
    maximumPreviewDimension / outputDimensions.height,
  );
  const previewDimensions = {
    width: Math.max(1, Math.round(outputDimensions.width * previewScale)),
    height: Math.max(1, Math.round(outputDimensions.height * previewScale)),
  };

  try {
    const { data, info } = await createImagePipeline(
      source.sourcePath,
      input.options,
      previewDimensions,
      { preserveMetadata: false },
    ).toBuffer({ resolveWithObject: true });

    return {
      success: true,
      data: {
        buffer: data,
        width: info.width,
        height: info.height,
        size: info.size,
        outputWidth: outputDimensions.width,
        outputHeight: outputDimensions.height,
      },
    } as const;
  } catch (error) {
    console.error(`Could not preview image ${input.sourceFileId}:`, error);
    return { success: false, code: "TRANSFORM_FAILED" } as const;
  }
}
