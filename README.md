# Landfill

Landfill is a small, self-hosted file drop and browser. It gives one person—or
devices on a trusted home network—one place to upload, organize, preview, find,
and retrieve files through a browser.

![Landfill file explorer](docs/landfill-explorer.png)

## What it does

- Upload multiple files or drag them directly into a folder.
- Create and browse nested folders.
- Search files and folders by name.
- Preview images, PDFs, audio, and video in the browser.
- Rename files and folders.
- Download one file directly or prepare a ZIP from several items or folders.
- Move items to trash, restore them, or delete them permanently.
- Store metadata in SQLite and file contents on disk under one data directory.

Landfill deliberately targets a small single-instance installation. It is not
a Dropbox replacement, collaboration suite, or internet-facing storage server.

## Quick start with Docker

Requirements: Docker with Compose support.

```sh
docker compose up --build
```

Open <http://127.0.0.1:8080>. The database and uploaded files persist in the
`landfill-api` Docker volume when the containers stop.

To use another local port:

```sh
LANDFILL_PORT=9000 docker compose up --build
```

PowerShell:

```powershell
$env:LANDFILL_PORT = "9000"
docker compose up --build
```

Stop Landfill without deleting its data:

```sh
docker compose down
```

Do not add `-v` unless you intend to permanently delete Landfill's database and
stored files.

### Upgrading from v0.0.2

Back up the `landfill-api` volume before upgrading. Then pull the new version
and replace the old API, worker, Redis, and proxy containers:

```sh
docker compose down --remove-orphans
docker compose up --build -d --remove-orphans
```

Do not add `-v`: v0.1 reuses the existing `landfill-api` volume, so files and
database records remain available. The old Redis volume is no longer used.

Version 0.1 also changes the default public binding from every network
interface to `127.0.0.1`. Trusted-LAN installations must explicitly set
`LANDFILL_BIND_ADDRESS=0.0.0.0` as described below.

## Security model

Landfill v0.1 has no built-in authentication. Docker therefore binds to
`127.0.0.1` by default and is only reachable from the host machine.

For an explicitly trusted private network, set `LANDFILL_BIND_ADDRESS=0.0.0.0`
before starting Compose. Every device that can reach that port will be able to
upload, rename, download, trash, restore, and permanently delete files. Do not
expose Landfill directly to the public internet. Use an authenticated private
network or an authentication-capable reverse proxy if remote access is needed.

## Data and backups

The API stores all mutable state below `DATA_DIR`:

```text
DATA_DIR/
  database/
    main.db
    main.db-wal
    main.db-shm
  storage/
    uploads/
    downloads/
```

For a consistent backup, stop Landfill and copy the complete data directory.
Restore by putting that directory back in the same location before starting the
same or a newer Landfill version.

For Docker installations, archive the named volume while the containers are
stopped. Uploaded files and the SQLite database must always be backed up and
restored together.

## Local development

Requirements: Node.js 22.12 or newer and npm 10.9.2 or compatible.

```sh
npm ci
```

Copy the example environment files:

```text
apps/api/.env.example -> apps/api/.env
apps/web/.env.example -> apps/web/.env
```

Then run both development services:

```sh
npm run dev
```

Open <http://localhost:5173>. Vite proxies same-origin `/api` requests to the
API target configured in `apps/web/.env`.

Useful checks:

```sh
npm test
npm run check-types
npm run lint
npm run build
```

The API smoke test creates an isolated temporary data directory and exercises
health, folder creation, upload, search, rename, archive download, trash, and
restore through real HTTP requests.

## Architecture

```text
Browser
  -> React + Vite static client
  -> same-origin /api
  -> Express API
       -> SQLite metadata
       -> disk-backed uploads and generated ZIP files
```

The npm workspace layout is:

```text
apps/web      React, React Router, TanStack Query
apps/api      Express, Multer, Sharp, Archiver
packages/db   Drizzle schema and bundled SQLite migrations
infra/caddy   Production static hosting and /api reverse proxy
```

Archive downloads run one at a time inside the API process. Their inputs and
status live in SQLite, allowing pending work to resume after a restart without
requiring a separate queue service.

## Current limitations

- No authentication or user accounts.
- No public-internet deployment support.
- No sharing links or per-folder permissions.
- No storage quotas or duplicate-content detection.
- Docker Compose is the supported packaged installation; native installers are
  not currently planned for v0.1.

The next release work is limited to hardening the core workflow: better failure
diagnostics, upgrade fixtures, and broader automated browser coverage.

## License

Landfill is available under the [MIT License](LICENSE).
