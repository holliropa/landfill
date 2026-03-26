-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DownloadJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "fileName" TEXT,
    "filePath" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_DownloadJob" ("createdAt", "errorMessage", "expiresAt", "fileName", "filePath", "id", "progress", "status", "updatedAt") SELECT "createdAt", "errorMessage", "expiresAt", "fileName", "filePath", "id", "progress", "status", "updatedAt" FROM "DownloadJob";
DROP TABLE "DownloadJob";
ALTER TABLE "new_DownloadJob" RENAME TO "DownloadJob";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
