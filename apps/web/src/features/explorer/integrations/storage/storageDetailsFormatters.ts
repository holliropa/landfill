const MIME_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF document",
  "application/zip": "ZIP archive",
  "application/json": "JSON document",
  "image/jpeg": "JPEG image",
  "image/png": "PNG image",
  "image/gif": "GIF image",
  "image/webp": "WebP image",
  "audio/mpeg": "MP3 audio",
  "video/mp4": "MP4 video",
  "text/plain": "Text document",
  "text/csv": "CSV document",
};

export function formatStorageFileType(mimeType: string) {
  const normalizedMimeType = mimeType.trim().toLowerCase();
  const exactLabel = MIME_TYPE_LABELS[normalizedMimeType];

  if (exactLabel) return exactLabel;
  if (normalizedMimeType.startsWith("image/")) return "Image";
  if (normalizedMimeType.startsWith("audio/")) return "Audio";
  if (normalizedMimeType.startsWith("video/")) return "Video";
  if (normalizedMimeType.startsWith("text/")) return "Text document";

  return "File";
}
