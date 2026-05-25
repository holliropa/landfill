import { getFilePath } from "./get-file-path";
import fs from "fs";

export function deleteFromDisk(diskName: string) {
  const filePath = getFilePath(diskName);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}
