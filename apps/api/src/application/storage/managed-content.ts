import { cleanupFiles } from "@/infrastructure/filesystem/cleanup-files";
import { getFilePath } from "@/infrastructure/filesystem/get-file-path";
import { randomUUID } from "node:crypto";

export type ManagedContentTarget = {
  diskName: string;
  targetPath: string;
};

/** Public Drive-core boundary for a capability that must produce a blob. */
export function allocateManagedContentTarget(): ManagedContentTarget {
  const diskName = randomUUID();
  return { diskName, targetPath: getFilePath(diskName) };
}

export function discardManagedContent(diskNames: string[]) {
  cleanupFiles(diskNames);
}
