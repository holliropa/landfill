import { getFile } from "@/application/files/get-file";
import { isFileInActiveTree } from "@/application/storage/trash-visibility";
import { getTargetsForFile } from "@/domain/conversions/converter-registry";

export type GetConversionTargetResult =
  | { success: true; data: ReturnType<typeof getTargetsForFile> }
  | { success: false; code: "FILE_NOT_FOUND" | "DATABASE_ERROR" };

export async function getConversionTargets(
  fileId: string,
): Promise<GetConversionTargetResult> {
  const fileResult = await getFile(fileId);

  if (!fileResult.success) {
    return fileResult.code === "DATABASE_ERROR"
      ? { success: false, code: "DATABASE_ERROR" }
      : { success: false, code: "FILE_NOT_FOUND" };
  }

  if (!(await isFileInActiveTree(fileResult.data))) {
    return { success: false, code: "FILE_NOT_FOUND" };
  }

  return {
    success: true,
    data: getTargetsForFile({
      fileName: fileResult.data.originalName,
      mimeType: fileResult.data.mimeType,
    }),
  };
}
