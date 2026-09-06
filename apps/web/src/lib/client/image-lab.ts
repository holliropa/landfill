import { useMutation, useQuery } from "@tanstack/react-query";
import config from "@/config";
import { apiFetch, HttpError } from "./api";
import { normalizeApiDate, type SerializedDate } from "./normalizers";
import { useInvalidateStorageQueries } from "./invalidation";

export type ImageLabFormat = "jpeg" | "png" | "webp";

export type ImageLabSource = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  hasAlpha: boolean;
  supportedOutputs: ImageLabFormat[];
};

export type ImageLabTransformRequest = {
  sourceFileId: string;
  output: {
    format: ImageLabFormat;
    name?: string;
  };
  resize?: {
    width?: number;
    height?: number;
    fit: "inside" | "fill";
    withoutEnlargement: boolean;
  };
  quality: number;
  background: string;
};

export type ImageLabPreview = {
  blob: Blob;
  width: number;
  height: number;
  outputWidth: number;
  outputHeight: number;
  size: number;
};

export type ImageLabExport = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  folderId: string | null;
  createdAt: Date;
  width: number;
  height: number;
};

export async function getImageLabSource(
  fileId: string,
  signal?: AbortSignal,
): Promise<ImageLabSource> {
  const response = await apiFetch(
    `${config.api.url}/image-lab/sources/${fileId}`,
    { signal },
  );
  if (!response.ok)
    throw await imageLabHttpError(response, "Could not open image");
  return response.json();
}

export async function createImageLabPreview(
  input: ImageLabTransformRequest,
  signal?: AbortSignal,
): Promise<ImageLabPreview> {
  const response = await apiFetch(`${config.api.url}/image-lab/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) {
    throw await imageLabHttpError(response, "Could not update preview");
  }

  const blob = await response.blob();
  return {
    blob,
    width: readNumberHeader(response, "X-Landfill-Preview-Width"),
    height: readNumberHeader(response, "X-Landfill-Preview-Height"),
    outputWidth: readNumberHeader(response, "X-Landfill-Output-Width"),
    outputHeight: readNumberHeader(response, "X-Landfill-Output-Height"),
    size: blob.size,
  };
}

export async function exportImageLab(
  input: ImageLabTransformRequest,
): Promise<ImageLabExport> {
  const response = await apiFetch(`${config.api.url}/image-lab/exports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok)
    throw await imageLabHttpError(response, "Could not export image");

  const data = (await response.json()) as Omit<ImageLabExport, "createdAt"> & {
    createdAt: SerializedDate;
  };
  return { ...data, createdAt: normalizeApiDate(data.createdAt) };
}

export function useImageLabSource(fileId: string) {
  return useQuery({
    queryKey: ["image-lab", "source", fileId],
    queryFn: ({ signal }) => getImageLabSource(fileId, signal),
    retry: false,
  });
}

export function useExportImageLab() {
  const invalidateStorageQueries = useInvalidateStorageQueries();

  return useMutation({
    mutationFn: exportImageLab,
    onSuccess: async () => {
      await invalidateStorageQueries();
    },
  });
}

async function imageLabHttpError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as {
    error?: string;
  } | null;
  return new HttpError(data?.error ?? fallback, response.status);
}

function readNumberHeader(response: Response, name: string) {
  const value = Number(response.headers.get(name));
  return Number.isFinite(value) ? value : 0;
}
