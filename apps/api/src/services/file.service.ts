import * as fs from "fs";
import path from "path";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export const FileService = {
  ensureUploadDir() {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  },

  getFilePath(diskName: string) {
    return path.join(UPLOAD_DIR, diskName);
  },

  deleteFromDisk(diskName: string) {
    const filePath = this.getFilePath(diskName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  },

  cleanupFiles(fileNames: string[]) {
    fileNames.forEach((name) => this.deleteFromDisk(name));
  },

  isImage(mimeType: string) {
    return ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
      mimeType,
    );
  },
};
