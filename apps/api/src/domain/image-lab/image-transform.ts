import sharp, { type Sharp } from "sharp";

export const imageOutputFormats = ["jpeg", "png", "webp"] as const;

export type ImageOutputFormat = (typeof imageOutputFormats)[number];
export type ImageResize = {
  width?: number;
  height?: number;
  fit: "inside" | "fill";
  withoutEnlargement: boolean;
};

export type ImageTransformOptions = {
  format: ImageOutputFormat;
  resize?: ImageResize;
  quality: number;
  background: string;
};

export type ImageTransformRequest = {
  sourceFileId: string;
  outputName?: string;
  options: ImageTransformOptions;
};

export const imageOutputDefinitions: Record<
  ImageOutputFormat,
  { extension: string; mimeType: string; label: string }
> = {
  jpeg: { extension: "jpg", mimeType: "image/jpeg", label: "JPEG" },
  png: { extension: "png", mimeType: "image/png", label: "PNG" },
  webp: { extension: "webp", mimeType: "image/webp", label: "WebP" },
};

const maximumDimension = 32_768;

export function parseImageTransformRequest(
  value: unknown,
  { requireOutputName = false } = {},
):
  | { success: true; data: ImageTransformRequest }
  | { success: false; error: string } {
  if (!isRecord(value)) {
    return { success: false, error: "A request body is required" };
  }

  const sourceFileId = value.sourceFileId;
  if (typeof sourceFileId !== "string" || !sourceFileId.trim()) {
    return { success: false, error: "Source file ID is required" };
  }

  if (!isRecord(value.output)) {
    return { success: false, error: "Output settings are required" };
  }

  const format = value.output.format;
  if (!isImageOutputFormat(format)) {
    return { success: false, error: "Unsupported output format" };
  }

  const outputName = value.output.name;
  if (
    requireOutputName &&
    (typeof outputName !== "string" || !outputName.trim())
  ) {
    return { success: false, error: "Output name is required" };
  }

  if (outputName !== undefined && typeof outputName !== "string") {
    return { success: false, error: "Output name must be text" };
  }

  const quality = value.quality ?? 82;
  if (!isIntegerInRange(quality, 1, 100)) {
    return { success: false, error: "Quality must be between 1 and 100" };
  }

  const background = value.background ?? "#ffffff";
  if (typeof background !== "string" || !/^#[0-9a-f]{6}$/i.test(background)) {
    return {
      success: false,
      error: "Background must be a six-digit hex colour",
    };
  }

  let resize: ImageResize | undefined;
  if (value.resize !== undefined) {
    if (!isRecord(value.resize)) {
      return { success: false, error: "Resize settings are invalid" };
    }

    const width = value.resize.width;
    const height = value.resize.height;
    if (width === undefined && height === undefined) {
      return { success: false, error: "A resize width or height is required" };
    }
    if (
      (width !== undefined && !isIntegerInRange(width, 1, maximumDimension)) ||
      (height !== undefined && !isIntegerInRange(height, 1, maximumDimension))
    ) {
      return {
        success: false,
        error: `Image dimensions must be between 1 and ${maximumDimension}`,
      };
    }

    const fit = value.resize.fit ?? "inside";
    if (fit !== "inside" && fit !== "fill") {
      return { success: false, error: "Resize fit is invalid" };
    }

    const withoutEnlargement = value.resize.withoutEnlargement ?? true;
    if (typeof withoutEnlargement !== "boolean") {
      return { success: false, error: "Resize enlargement setting is invalid" };
    }

    resize = { width, height, fit, withoutEnlargement };
  }

  return {
    success: true,
    data: {
      sourceFileId: sourceFileId.trim(),
      outputName: typeof outputName === "string" ? outputName : undefined,
      options: { format, resize, quality, background },
    },
  };
}

export function normalizeImageOutputName(
  requestedName: string,
  format: ImageOutputFormat,
) {
  const trimmedName = requestedName.trim();
  if (
    !trimmedName ||
    trimmedName === "." ||
    trimmedName === ".." ||
    trimmedName.length > 255 ||
    /[\\/\u0000-\u001f]/.test(trimmedName)
  ) {
    return null;
  }

  const extension = imageOutputDefinitions[format].extension;
  const finalDot = trimmedName.lastIndexOf(".");
  const baseName = finalDot > 0 ? trimmedName.slice(0, finalDot) : trimmedName;
  const outputName = `${baseName}.${extension}`;

  return outputName.length <= 255 ? outputName : null;
}

export function calculateImageDimensions(
  source: { width: number; height: number },
  resize?: ImageResize,
) {
  if (!resize) return source;

  const requestedWidth = resize.width;
  const requestedHeight = resize.height;

  if (resize.fit === "fill" && requestedWidth && requestedHeight) {
    return {
      width: resize.withoutEnlargement
        ? Math.min(requestedWidth, source.width)
        : requestedWidth,
      height: resize.withoutEnlargement
        ? Math.min(requestedHeight, source.height)
        : requestedHeight,
    };
  }

  const widthScale = requestedWidth ? requestedWidth / source.width : Infinity;
  const heightScale = requestedHeight
    ? requestedHeight / source.height
    : Infinity;
  let scale = Math.min(widthScale, heightScale);
  if (resize.withoutEnlargement) scale = Math.min(scale, 1);

  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  };
}

export function createImagePipeline(
  sourcePath: string,
  options: ImageTransformOptions,
  dimensions: { width: number; height: number } | undefined,
  { preserveMetadata }: { preserveMetadata: boolean },
) {
  let pipeline: Sharp = sharp(sourcePath).autoOrient();

  if (dimensions) {
    pipeline = pipeline.resize({
      width: dimensions.width,
      height: dimensions.height,
      fit: "fill",
    });
  }

  if (options.format === "jpeg") {
    pipeline = pipeline
      .flatten({ background: options.background })
      .jpeg({ quality: options.quality });
  } else if (options.format === "webp") {
    pipeline = pipeline.webp({ quality: options.quality });
  } else {
    pipeline = pipeline.png();
  }

  return preserveMetadata ? pipeline.keepMetadata() : pipeline;
}

export function isSupportedImageInput(format: string | undefined) {
  return format === "jpeg" || format === "png" || format === "webp";
}

function isImageOutputFormat(value: unknown): value is ImageOutputFormat {
  return imageOutputFormats.some((format) => format === value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isIntegerInRange(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= minimum &&
    value <= maximum
  );
}
