import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

const ownerPassword = "correct horse battery staple";

let baseUrl = "";
let dataDir = "";
let server: Server | undefined;
let setupCode = "";
let sessionCookie = "";
let closeDatabase: (() => void) | undefined;
let createApp: typeof import("@/interfaces/http/app").createApp;

before(async () => {
  dataDir = await mkdtemp(path.join(tmpdir(), "landfill-api-smoke-"));
  process.env.DATA_DIR = dataDir;

  const { default: db } = await import("@/infrastructure/db");
  closeDatabase = () => db.$client.close();
  const auth = await import("@/application/auth/auth-service");
  const initialized = await auth.initializeAuthentication({
    logSetupCode: false,
  });
  assert.ok(initialized.setupCode);
  setupCode = initialized.setupCode;

  ({ createApp } = await import("@/interfaces/http/app"));
  await listen();
});

after(async () => {
  await closeServer();
  closeDatabase?.();

  const resolvedDataDir = path.resolve(dataDir);
  const resolvedTempDir = path.resolve(tmpdir());
  assert.ok(resolvedDataDir.startsWith(`${resolvedTempDir}${path.sep}`));
  await rm(resolvedDataDir, { recursive: true, force: true });
});

test("owner setup, sessions, and recovery work over HTTP", async () => {
  const healthResponse = await fetch(`${baseUrl}/api/health`);
  assert.equal(healthResponse.status, 200);
  assert.deepEqual(await healthResponse.json(), { status: "ok" });

  const initialStatus = await fetch(`${baseUrl}/api/auth/status`);
  assert.equal(initialStatus.status, 200);
  assert.deepEqual(await initialStatus.json(), {
    setupRequired: true,
    authenticated: false,
  });

  const protectedResponse = await fetch(`${baseUrl}/api/folders/root`);
  assert.equal(protectedResponse.status, 401);

  const badSetupResponse = await authJsonRequest("/setup", {
    setupCode: "NOT-THE-CODE",
    password: ownerPassword,
  });
  assert.equal(badSetupResponse.status, 401);

  const weakPasswordResponse = await authJsonRequest("/setup", {
    setupCode,
    password: "too-short",
  });
  assert.equal(weakPasswordResponse.status, 400);

  const setupResponse = await authJsonRequest("/setup", {
    setupCode,
    password: ownerPassword,
  });
  assert.equal(setupResponse.status, 201);
  const setCookie = setupResponse.headers.get("set-cookie") ?? "";
  assert.match(setCookie, /^landfill_session=/);
  assert.match(setCookie, /HttpOnly/i);
  assert.match(setCookie, /SameSite=Strict/i);
  assert.match(setCookie, /Path=\//i);
  assert.doesNotMatch(setCookie, /;\s*Secure/i);
  sessionCookie = setCookie.split(";", 1)[0];

  const duplicateSetup = await authJsonRequest("/setup", {
    setupCode,
    password: ownerPassword,
  });
  assert.equal(duplicateSetup.status, 409);

  const authenticatedStatus = await authenticatedFetch("/api/auth/status");
  assert.deepEqual(await authenticatedStatus.json(), {
    setupRequired: false,
    authenticated: true,
  });

  const { default: db } = await import("@/infrastructure/db");
  const owner = db.$client
    .prepare("SELECT password_hash AS passwordHash FROM owner_credentials")
    .get() as { passwordHash: string };
  assert.match(owner.passwordHash, /^scrypt-v1\$/);
  assert.notEqual(owner.passwordHash, ownerPassword);

  const sessionToken = sessionCookie.slice("landfill_session=".length);
  const storedSessions = db.$client
    .prepare("SELECT token_hash AS tokenHash FROM auth_sessions")
    .all() as { tokenHash: string }[];
  assert.equal(storedSessions.length, 1);
  assert.match(storedSessions[0].tokenHash, /^[a-f0-9]{64}$/);
  assert.notEqual(storedSessions[0].tokenHash, sessionToken);

  const crossOriginResponse = await fetch(`${baseUrl}/api/folders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: sessionCookie,
      Origin: "https://attacker.invalid",
    },
    body: JSON.stringify({ name: "Blocked", parentFolder: "root" }),
  });
  assert.equal(crossOriginResponse.status, 403);

  await closeServer();
  await listen();
  const persistedStatus = await authenticatedFetch("/api/auth/status");
  assert.deepEqual(await persistedStatus.json(), {
    setupRequired: false,
    authenticated: true,
  });

  const logoutResponse = await authenticatedFetch("/api/auth/logout", {
    method: "POST",
  });
  assert.equal(logoutResponse.status, 204);
  assert.match(
    logoutResponse.headers.get("set-cookie") ?? "",
    /Expires=Thu, 01 Jan 1970 00:00:00 GMT/i,
  );
  assert.equal((await authenticatedFetch("/api/folders/root")).status, 401);

  const wrongLogin = await authJsonRequest("/login", {
    password: "incorrect password",
  });
  assert.equal(wrongLogin.status, 401);

  const loginResponse = await authJsonRequest("/login", {
    password: ownerPassword,
  });
  assert.equal(loginResponse.status, 200);
  sessionCookie = extractCookie(loginResponse);

  const { hashSessionToken } = await import("@/application/auth/auth-service");
  const expiringToken = sessionCookie.slice("landfill_session=".length);
  db.$client
    .prepare("UPDATE auth_sessions SET expires_at = ? WHERE token_hash = ?")
    .run(Date.now() - 1_000, hashSessionToken(expiringToken));
  const expiredStatus = await authenticatedFetch("/api/auth/status");
  assert.deepEqual(await expiredStatus.json(), {
    setupRequired: false,
    authenticated: false,
  });

  const reloginResponse = await authJsonRequest("/login", {
    password: ownerPassword,
  });
  assert.equal(reloginResponse.status, 200);
  sessionCookie = extractCookie(reloginResponse);
});

test("authenticated core file-management workflow works over HTTP", async () => {
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

  const uploadResponse = await authenticatedFetch("/api/files", {
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

  const rawResponse = await authenticatedFetch(`/api/files/${fileId}/raw`);
  assert.equal(rawResponse.status, 200);
  assert.equal(await rawResponse.text(), "Landfill smoke test");

  const renameResponse = await jsonRequest(`${baseUrl}/api/files/${fileId}`, {
    method: "PATCH",
    body: { name: "renamed-note.txt" },
  });
  assert.equal(renameResponse.status, 200);

  const searchResponse = await authenticatedFetch(
    "/api/storage/search?query=renamed-note",
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
  const archiveJob = (await createArchiveResponse.json()) as { jobId: string };

  const readyJob = await waitForArchive(archiveJob.jobId);
  assert.equal(readyJob.status, "ready", readyJob.errorMessage ?? undefined);
  assert.equal(readyJob.progress, 100);

  const archiveResponse = await authenticatedFetch(
    `/api/downloads/${archiveJob.jobId}/file`,
  );
  assert.equal(archiveResponse.status, 200);
  assert.match(
    archiveResponse.headers.get("content-disposition") ?? "",
    /\.zip/,
  );
  assert.ok((await archiveResponse.arrayBuffer()).byteLength > 0);

  const trashResponse = await authenticatedFetch(`/api/files/${fileId}`, {
    method: "DELETE",
  });
  assert.equal(trashResponse.status, 200);

  const trashContentResponse = await authenticatedFetch("/api/trash");
  assert.equal(trashContentResponse.status, 200);
  const trash = (await trashContentResponse.json()) as {
    items: { id: string }[];
  };
  assert.ok(trash.items.some((item) => item.id === fileId));

  const restoreResponse = await authenticatedFetch(
    `/api/trash/files/${fileId}/restore`,
    { method: "POST" },
  );
  assert.equal(restoreResponse.status, 200);

  const folderContentResponse = await authenticatedFetch(
    `/api/folders/${folder.id}/content`,
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

  const missingRouteResponse = await authenticatedFetch("/api/not-a-route");
  assert.equal(missingRouteResponse.status, 404);
  assert.deepEqual(await missingRouteResponse.json(), {
    error: "Route not found",
  });
});

test("authentication can be reset for owner recovery", async () => {
  const { resetAuthentication } =
    await import("@/application/auth/auth-service");
  resetAuthentication();

  const response = await authenticatedFetch("/api/auth/status");
  assert.deepEqual(await response.json(), {
    setupRequired: true,
    authenticated: false,
  });
  assert.equal((await authenticatedFetch("/api/folders/root")).status, 401);
});

function authJsonRequest(pathname: string, body: unknown) {
  return fetch(`${baseUrl}/api/auth${pathname}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function authenticatedFetch(pathname: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("Cookie", sessionCookie);
  return fetch(`${baseUrl}${pathname}`, { ...init, headers });
}

function jsonRequest(url: string, init: { method: string; body: unknown }) {
  return authenticatedFetch(url.slice(baseUrl.length), {
    method: init.method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(init.body),
  });
}

function extractCookie(response: Response) {
  const cookie = response.headers.get("set-cookie")?.split(";", 1)[0];
  assert.ok(cookie, "Expected the response to set a session cookie");
  return cookie;
}

async function listen() {
  const listeningServer = createApp().listen(0, "127.0.0.1");
  server = listeningServer;
  await new Promise<void>((resolve, reject) => {
    listeningServer.once("listening", resolve);
    listeningServer.once("error", reject);
  });

  const address = listeningServer.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${address.port}`;
}

async function closeServer() {
  if (!server) return;

  const listeningServer = server;
  server = undefined;
  await new Promise<void>((resolve, reject) => {
    listeningServer.close((error) => (error ? reject(error) : resolve()));
  });
}

async function waitForArchive(jobId: string) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const response = await authenticatedFetch(`/api/downloads/${jobId}`);
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
