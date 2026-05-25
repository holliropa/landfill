export function isImage(mimeType: string) {
  return ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
    mimeType,
  );
}
