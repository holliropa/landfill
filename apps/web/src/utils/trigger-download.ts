export function triggerDownload(url: string, filename?: string | null) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename ? filename.trim() : "";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
