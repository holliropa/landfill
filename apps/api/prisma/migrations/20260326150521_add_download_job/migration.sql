-- CreateTable
CREATE TABLE "DownloadJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DownloadJobItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemKind" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    CONSTRAINT "DownloadJobItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "DownloadJob" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "DownloadJobItem_jobId_idx" ON "DownloadJobItem"("jobId");
