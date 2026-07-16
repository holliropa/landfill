import { ConversionFormat, ConverterDefinition } from "./converter.types";
import path from "path";
import { sharpImageConverter } from "./converters/shard-image.converter";

const converters = [sharpImageConverter];

export function listConverters() {
  return converters;
}

export function getConverterForFile(input: {
  fileName: string;
  mimeType: string;
}) {
  return converters.find((converter) => matchConverter(converter, input));
}

export function getTargetsForFile(input: {
  fileName: string;
  mimeType: string;
}) {
  const converter = getConverterForFile(input);

  if (!converter) {
    return [];
  }

  return converter.targets;
}

export function findConverterForTarget(input: {
  fileName: string;
  mimeType: string;
  targetFormat: ConversionFormat;
}) {
  const converter = getConverterForFile(input);

  if (!converter) {
    return null;
  }

  const target = converter.targets.find(
    (candidate) => candidate.format === input.targetFormat,
  );

  if (!target) {
    return null;
  }
  return { converter, target };
}

function matchConverter(
  converter: ConverterDefinition,
  input: { fileName: string; mimeType: string },
) {
  const mimeType = input.mimeType.toLowerCase();
  const extension = path
    .extname(input.fileName)
    .replace(/^\./, "")
    .toLowerCase();

  if (
    converter.accepts.mimeTypes?.some((candidate) => candidate === mimeType)
  ) {
    return true;
  }

  if (
    converter.accepts.mimePrefixes?.some((prefix) =>
      mimeType.startsWith(prefix.toLowerCase()),
    )
  ) {
    return true;
  }

  if (
    converter.accepts.extensions?.some(
      (candidate) => candidate.toLowerCase() === extension,
    )
  ) {
    return true;
  }

  return false;
}
