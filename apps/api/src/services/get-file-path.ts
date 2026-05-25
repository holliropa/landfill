import path from "path";
import config from "@/config";

export function getFilePath(diskName: string) {
  return path.join(config.storage.uploadsDir, diskName);
}
