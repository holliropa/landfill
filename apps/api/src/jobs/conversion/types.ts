import { ConversionFormat } from "@/domain/conversions/converter.types";

export const conversionQueueName = "conversion";

export const conversionJobName = {
  convertImage: "convert.image",
} as const;

export type ConversionJobName =
  (typeof conversionJobName)[keyof typeof conversionJobName];

export type ConvertImageJobData = {
  sourceFileId: string;
  targetFormat: ConversionFormat;
  quality?: number;
};

export type ConvertImageJobResult = {
  fileId: string;
  name: string;
};
