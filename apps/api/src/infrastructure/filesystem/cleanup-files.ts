import { deleteFromDisk } from "./delete-from-disk";

export function cleanupFiles(fileNames: string[]) {
  fileNames.forEach((name) => deleteFromDisk(name));
}
