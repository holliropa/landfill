import path from "path";
import config from "@/config";

export function getJobFilePath(jobFilename: string) {
  return path.join(config.storage.downloadsDir, jobFilename);
}
