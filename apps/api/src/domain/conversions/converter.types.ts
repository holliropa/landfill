export type ConversionFormat = "jpeg" | "png" | "webp";

export type ConversionTarget = {
  format: ConversionFormat;
  extension: string;
  mimeType: string;
  label: string;
};

export type ConverterMatch = {
  mimeTypes?: string[];
  mimePrefixes?: string[];
  extensions?: string[];
};

export type ConverterDefinition = {
  id: string;
  label: string;
  accepts: ConverterMatch;
  targets: ConversionTarget[];
};

export type ConversionRunInput = {
  sourcePath: string;
  targetPath: string;
  targetFormat: ConversionFormat;
  quality?: number;
};

export type ConversionRunResult = {
  mimeType: string;
  extension: string;
};
