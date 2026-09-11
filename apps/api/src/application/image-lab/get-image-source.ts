import { getActiveFileContentSource } from "@/application/storage/get-active-file-content-source";
import {
  imageOutputFormats,
  isSupportedImageInput,
} from "@/domain/image-lab/image-transform";
import sharp from "sharp";

export type ImageSourceData = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  hasAlpha: boolean;
  supportedOutputs: (typeof imageOutputFormats)[number][];
};

export type LoadedImageSource = {
  data: ImageSourceData;
  contentRevisionId: string;
  folderId: string | null;
  sourcePath: string;
};

export type LoadImageSourceResult =
  | { success: true; source: LoadedImageSource }
  | {
      success: false;
      code:
        | "FILE_NOT_FOUND"
        | "DATABASE_ERROR"
        | "UNSUPPORTED_IMAGE"
        | "UNREADABLE_IMAGE";
    };

export async function loadImageSource(
  fileId: string,
): Promise<LoadImageSourceResult> {
  const fileResult = await getActiveFileContentSource(fileId);
  if (!fileResult.success) return fileResult;
  const file = fileResult.source;

  try {
    const metadata = await sharp(file.sourcePath).metadata();
    if (
      !isSupportedImageInput(metadata.format) ||
      !metadata.width ||
      !metadata.height ||
      (metadata.pages ?? 1) > 1
    ) {
      return { success: false, code: "UNSUPPORTED_IMAGE" };
    }

    const swapsDimensions =
      metadata.orientation !== undefined && metadata.orientation >= 5;
    const width = swapsDimensions ? metadata.height : metadata.width;
    const height = swapsDimensions ? metadata.width : metadata.height;

    return {
      success: true,
      source: {
        contentRevisionId: file.contentRevisionId,
        folderId: file.folderId,
        sourcePath: file.sourcePath,
        data: {
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size,
          width,
          height,
          hasAlpha: metadata.hasAlpha ?? false,
          supportedOutputs: [...imageOutputFormats],
        },
      },
    };
  } catch (error) {
    console.error(`Could not read image ${fileId}:`, error);
    return { success: false, code: "UNREADABLE_IMAGE" };
  }
}

export async function getImageSource(fileId: string) {
  const result = await loadImageSource(fileId);
  if (!result.success) return result;

  return { success: true, data: result.source.data } as const;
}
