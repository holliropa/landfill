import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { after, before, test } from "node:test";
import { tmpdir } from "node:os";
import type { Server } from "node:http";

let baseUrl = "";
let dataDir = "";
let server: Server | undefined;
let closeDatabase: (() => void) | undefined;

before(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), "landfill-api-smoke-"));
  process.env.DATA_DIR = dataDir;

  const { default: db } = await import("@/infrastructure/db");
  closeDatabase = () => db.$client.close();
  const { createApp } = await import("@/interfaces/http/app");
  const listeningServer = createApp().listen(0, "127.0.0.1");
  server = listeningServer;
  await new Promise<void>((resolve, reject) => {
    listeningServer.once("listening", resolve);
    listeningServer.once("error", reject);
  });

  const address = listeningServer.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()));
    });
  }
  closeDatabase?.();

  const resolvedDataDir = path.resolve(dataDir);
  const resolvedTempDir = path.resolve(tmpdir());
  assert.ok(resolvedDataDir.startsWith(`${resolvedTempDir}${path.sep}`));
  await rm(resolvedDataDir, { recursive: true, force: true });
});

test("core file-management workflow works over HTTP", async () => {
  const healthResponse = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), { status: "ok" });

  const createFolderResponse = await jsonRequest(`${baseUrl}/api/folders`, {
    method: "POST",
    body: { name: "Smoke files", parentFolder: "root" },
  });
  assert.equal(createFolderResponse.status, 201);
  const folder = (await createFolderResponse.json()) as { id: string };
  assert.ok(folder.id);

  const uploadBody = new FormData();
  uploadBody.append(
    "files",
    new Blob(["Landfill smoke test"], { type: "text/plain" }),
    "hello.txt",
  );
  uploadBody.append("folder", folder.id);

  const uploadResponse = await fetch(`${baseUrl}/api/files`, {
    method: "POST",
    body: uploadBody,
  });
  assert.equal(uploadResponse.status, 201);
  const uploadedFiles = (await uploadResponse.json()) as {
    id: string;
    name: string;
  }[];
  assert.equal(uploadedFiles.length, 1);
  assert.equal(uploadedFiles[0].name, "hello.txt");
  const fileId = uploadedFiles[0].id;

  const rawResponse = await fetch(`${baseUrl}/api/files/${fileId}/raw`);
  assert.equal(rawResponse.status, 200);
  assert.equal(await rawResponse.text(), "Landfill smoke test");

  const renameResponse = await jsonRequest(`${baseUrl}/api/files/${fileId}`, {
    method: "PATCH",
    body: { name: "renamed-note.txt" },
  });
  assert.equal(renameResponse.status, 200);

  const searchResponse = await fetch(
    `${baseUrl}/api/storage/search?query=renamed-note`,
  );
  assert.equal(searchResponse.status, 200);
  const search = (await searchResponse.json()) as {
    items: { id: string; name: string }[];
  };
  assert.deepEqual(
    search.items.map((item) => ({ id: item.id, name: item.name })),
    [{ id: fileId, name: "renamed-note.txt" }],
  );

  const createArchiveResponse = await jsonRequest(`${baseUrl}/api/downloads`, {
    method: "POST",
    body: { items: [{ kind: "folder", id: folder.id }] },
  });
  assert.equal(createArchiveResponse.status, 202);
  const archiveJob = (await createArchiveResponse.json()) as {
    jobId: string;
  };

  const readyJob = await waitForArchive(archiveJob.jobId);
  assert.equal(readyJob.status, "ready", readyJob.errorMessage ?? undefined);
  assert.equal(readyJob.progress, 100);

  const archiveResponse = await fetch(
    `${baseUrl}/api/downloads/${archiveJob.jobId}/file`,
  );
  assert.equal(archiveResponse.status, 200);
  assert.match(
    archiveResponse.headers.get("content-disposition") ?? "",
    /\.zip/,
  );
  assert.ok((await archiveResponse.arrayBuffer()).byteLength > 0);

  const trashResponse = await fetch(`${baseUrl}/api/files/${fileId}`, {
    method: "DELETE",
  });
  assert.equal(trashResponse.status, 200);

  const trashContentResponse = await fetch(`${baseUrl}/api/trash`);
  assert.equal(trashContentResponse.status, 200);
  const trash = (await trashContentResponse.json()) as {
    items: { id: string }[];
  };
  assert.ok(trash.items.some((item) => item.id === fileId));

  const restoreResponse = await fetch(
    `${baseUrl}/api/trash/files/${fileId}/restore`,
    { method: "POST" },
  );
  assert.equal(restoreResponse.status, 200);

  const folderContentResponse = await fetch(
    `${baseUrl}/api/folders/${folder.id}/content`,
  );
  assert.equal(folderContentResponse.status, 200);
  const folderContent = (await folderContentResponse.json()) as {
    files: { id: string; name: string }[];
  };
  assert.ok(
    folderContent.files.some(
      (file) => file.id === fileId && file.name === "renamed-note.txt",
    ),
  );

  const missingRouteResponse = await fetch(`${baseUrl}/api/not-a-route`);
  assert.equal(missingRouteResponse.status, 404);
  assert.deepEqual(await missingRouteResponse.json(), {
    error: "Route not found",
  });
});

function jsonRequest(url: string, init: { method: string; body: unknown }) {
  return fetch(url, {
    method: init.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(init.body),
  });
}

async function waitForArchive(jobId: string) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const response = await fetch(`${baseUrl}/api/downloads/${jobId}`);
    assert.equal(response.status, 200);

    const job = (await response.json()) as {
      status: "pending" | "processing" | "ready" | "failed" | "expired";
      progress: number;
      errorMessage: string | null;
    };

    if (job.status === "ready" || job.status === "failed") return job;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }

  assert.fail("Archive job did not finish within the smoke-test timeout");
}
