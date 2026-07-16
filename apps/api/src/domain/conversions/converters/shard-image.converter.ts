import sharp from "sharp";
import {
  ConversionFormat,
  ConversionRunInput,
  ConversionRunResult,
  ConverterDefinition,
} from "../converter.types";

export const sharpImageConverter: ConverterDefinition = {
  id: "image.sharp",
  label: "[Sharp] Image Converter",
  accepts: {
    mimePrefixes: ["image/"],
    extensions: ["jpg", "jpeg", "png", "webp"],
  },
  targets: [
    { format: "jpeg", extension: "jpg", mimeType: "image/jpeg", label: "JPEG" },
    { format: "png", extension: "png", mimeType: "image/png", label: "PNG" },
    {
      format: "webp",
      extension: "webp",
      mimeType: "image/webp",
      label: "WebP",
    },
  ],
};

export async function runSharpImageConversion({
  sourcePath,
  targetPath,
  targetFormat,
  quality = 82,
}: ConversionRunInput): Promise<ConversionRunResult> {
  let pipeline = sharp(sourcePath);

  switch (targetFormat) {
    case "jpeg":
      pipeline = pipeline.jpeg({ quality });
      break;
    case "webp":
      pipeline = pipeline.webp({ quality });
      break;
    case "png":
      pipeline = pipeline.png();
      break;
    default:
      throw new Error(
        `Unsupported image target format: ${targetFormat satisfies never}`,
      );
  }

  await pipeline.toFile(targetPath);

  return getFormatResult(targetFormat);
}

function getFormatResult(format: ConversionFormat) {
  switch (format) {
    case "jpeg":
      return { mimeType: "image/jpeg", extension: "jpg" };
    case "png":
      return { mimeType: "image/png", extension: "png" };
    case "webp":
      return { mimeType: "image/webp", extension: "webp" };
  }
}
