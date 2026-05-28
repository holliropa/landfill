# Landfill

Landfill is a local-first file storage app for home and small local network use.
It is built as a TypeScript npm workspaces monorepo with a React web client, an
Express API, SQLite metadata storage, and disk-backed file storage.

The project is currently a development-stage local file manager. It already
supports browsing folders, uploading files, searching, downloading individual
files, creating archive downloads, viewing basic item details, and generating
image thumbnails.

## Current State

Landfill currently runs as two development services:

```txt
apps/web  -> Vite React client
apps/api  -> Express API
```

The API listens on `http://localhost:3000` and exposes routes under `/api`.
The web app is served by Vite, usually on `http://localhost:5173`.

In development, the web client calls same-origin `/api` routes. With
`API_PROXY_TARGET` configured, Vite proxies those requests to the Express API on
`http://localhost:3000`.

## Current Features

- Folder explorer with root and nested folders.
- File uploads through the browser.
- File and folder search.
- File downloads.
- Multi-item archive downloads.
- Basic file and folder details.
- File renaming and deletion.
- Folder creation, renaming, and deletion.
- Image thumbnail generation through the API.
- Raw file streaming for browser previews.
- SQLite-backed metadata.
- Disk-backed uploaded file storage.
- Automatic database initialization and migrations at API startup.

## Current Architecture

```txt
landfill/
  apps/
    web/      React, Vite, React Router, TanStack Query
    api/      Express, Multer, Sharp, Archiver
  packages/
    db/       Drizzle schema, migrations, SQLite initialization
```

The web client owns the browser experience and keeps server state in TanStack
Query. Folder content queries use `folderKeys.content(folderId)`, and mutations
invalidate affected folder data after create, upload, rename, and delete
operations.

The API owns persistence and file processing:

- Folder and file metadata live in SQLite through Drizzle models.
- Uploaded files are stored on disk.
- The database is initialized through `@landfill/db`.
- Drizzle migrations are bundled in `packages/db`.
- Thumbnail requests are generated from the stored file.
- Archive download jobs create temporary archive files that can be polled and
  downloaded when ready.

## Current Data Layout

The API uses `DATA_DIR` as the root for application data.

```txt
DATA_DIR/
  database/
    main.db
    main.db-wal
    main.db-shm
  storage/
    uploads/
    downloads/
```

The database stores metadata. The uploaded files themselves live in
`storage/uploads`. Generated archive downloads live in `storage/downloads`.

SQLite is opened in WAL mode for better durability and local concurrency.

## Requirements

- Node.js 18 or newer.
- npm 10.9.2 or compatible.

## Setup

Install dependencies from the repository root:

```sh
npm install
```

Create or update `apps/api/.env`:

```sh
DATA_DIR="./.landfill"
HOST="0.0.0.0"
PORT="3000"
```

The API creates the configured data directories on startup and initializes the
SQLite database automatically.

Create `apps/web/.env` for web and Vite development-server configuration:

```sh
API_PROXY_TARGET="http://localhost:3000"
```

The React app always calls the API through the same-origin `/api` path.
`API_PROXY_TARGET` is optional and only used by the Vite development server. If
it is set, Vite proxies `/api` requests to the API target. If it is not set, the
web development server does not proxy API requests.

## Development

Run both apps through Turbo:

```sh
npm run dev
```

Open the web app:

```txt
http://localhost:5173
```

The API is available at:

```txt
http://localhost:3000/api
```

When `API_PROXY_TARGET` is set, the Vite development server proxies web requests
from `/api` to the API server. This lets frontend code use the same `/api` paths
that a production reverse proxy can expose later.

To run the web app through the same-origin dev proxy against an API on another
port or host, change `API_PROXY_TARGET` in `apps/web/.env` or set it when
starting the web workspace:

```sh
API_PROXY_TARGET="http://localhost:3001" npm run dev --workspace @landfill/web
```

## Docker

Landfill has an initial Docker Compose setup with two services:

```txt
api     -> Express API, SQLite database, uploaded files
proxy   -> Caddy, built React app, /api routing to the API service
```

Start the Docker deployment from the repository root:

```sh
docker compose up --build
```

Open the app:

```txt
http://localhost:8080
```

The API is routed through the same public origin:

```txt
http://localhost:8080/api
```

Health check:

```txt
http://localhost:8080/api/health
```

Stop the containers:

```sh
docker compose down
```

Application data is stored in the `landfill-data` Docker volume and mounted into
the API container at `/data`.

```txt
/data/database/main.db
/data/storage/uploads/
/data/storage/downloads/
```

Stopping containers with `docker compose down` keeps the volume. To remove the
containers and delete the stored Landfill data:

```sh
docker compose down -v
```

Use `-v` carefully. It deletes the Docker volume that contains the SQLite
database and uploaded files.

## Scripts

- `npm run dev`: start all workspace development servers.
- `npm run build`: build database, web, and API workspace outputs.
- `npm run lint`: run workspace lint tasks.
- `npm run check-types`: run TypeScript checks for the web and API workspaces.
- `npm run format`: format TypeScript, TSX, and Markdown files with Prettier.

Workspace scripts:

- `npm run check-types --workspace @landfill/web`: `tsc -b --noEmit`.
- `npm run check-types --workspace @landfill/api`: `tsc --noEmit`.
- `npm run lint --workspace @landfill/web`: ESLint for the web app.

## Current Limitations

Landfill is not production-packaged yet.

Current limitations:

- The web app and API run as separate development services.
- There is no production reverse proxy or service routing setup yet.
- There is no Docker image or Compose setup yet.
- There is no native installer yet.
- There is no authentication yet.
- Backup and restore behavior is not yet documented as a user-facing workflow.

These limitations are part of the next delivery work, not blockers for local
development.

---

# Future Direction

The long-term shape of Landfill is a self-contained home storage appliance: one
install, one local server, one data directory, and browser access from devices on
the same network.

```txt
Landfill runtime
  web/static service
  Express API service
  router/proxy for / and /api
  one public HTTP port
  one DATA_DIR for database and files
```

Example LAN access:

```txt
http://landfill.local
http://192.168.1.50
```

## Delivery Vision

Landfill will support multiple delivery paths that all expose the same public
URL shape.

```txt
Same public app shape
  -> Docker Compose
  -> Native installer/package
  -> Raw npm install
```

The goal is to avoid separate browser-facing behavior for each installation
type. Docker, native packages, and npm installs should all expose:

```txt
/      -> web app
/api   -> API
```

Internally, the web service and API service can still run on separate ports.
The mapping belongs to the development server, reverse proxy, or package
runtime, not to the frontend code.

## Planned Delivery Paths

### 1. Docker Compose

Docker Compose is the planned primary delivery path for home servers, NAS
devices, mini PCs, and other always-on machines.

Planned Compose shape:

```yaml
services:
  web:
    image: landfill/web:latest

  api:
    image: landfill/api:latest
    volumes:
      - ./landfill-data:/data
    environment:
      DATA_DIR: /data
      HOST: 0.0.0.0
      PORT: 3000

  proxy:
    image: landfill/proxy:latest
    ports:
      - "80:80"
    depends_on:
      - web
      - api
```

The public routing model is:

```txt
/      -> web service
/api   -> API service
```

The API service owns persistent data:

```yaml
services:
  api:
    volumes:
      - ./landfill-data:/data
    environment:
      DATA_DIR: /data
```

The default Docker install will not require a separate Postgres, MySQL, or Redis
container.

### 2. Native Installer / Package

Native installers are planned as the friendlier desktop/home-user packaging
option. They will use the same web, API, and routing model with OS-specific data
locations.

Possible data directory defaults:

```txt
Windows:
  %ProgramData%\Landfill
  or %LOCALAPPDATA%\Landfill

macOS:
  ~/Library/Application Support/Landfill
  or /Library/Application Support/Landfill

Linux:
  ~/.local/share/landfill
  or /var/lib/landfill for service installs
```

The native package should not require users to install or manage a separate
database server.

### 3. Raw npm Install

Raw npm install remains useful for development, contributors, and advanced
manual installs.

This path gives the user direct control over:

- Node.js version.
- Native dependency installation.
- Ports.
- Startup behavior.
- Updates.
- Data location.

It is the most transparent path, but also the least polished for normal users.

## Database Direction

SQLite remains the default database across all delivery paths.

Landfill is a local-first file storage app, so an embedded database fits the
product better than requiring a separate database server:

- no database service to install or maintain
- one data directory to back up
- works in Docker, native installers, and npm installs
- startup migrations are simple
- metadata stays beside the uploaded files
- suitable for folders, files, download jobs, settings, users, and sessions

Using SQLite everywhere also keeps migrations, backup behavior, and update
testing consistent. Docker deployments should not use a different default
database than native installs.

SQLite usage assumptions:

- The database should live on a local disk.
- The database and uploaded files should be backed up together.
- Landfill is aimed at home and small local network use.
- Enterprise-scale multi-user storage is outside the default target.

## Planned Production Runtime

The production runtime work is centered around turning the current development
setup into a packaged service layout:

- Build `apps/web`.
- Build `apps/api`.
- Serve the built web UI from a web/static service.
- Route `/api` requests to the API service.
- Use same-origin API calls such as `/api`.
- Expose one public HTTP port.
- Keep all mutable data under `DATA_DIR`.
- Add a health check endpoint.

Once this runtime exists, Docker and native installers can wrap the same web,
API, and routing model rather than becoming separate versions of the app.

## Planned Security Work

Authentication is required before Landfill is suitable for normal LAN use.
Without it, anyone on the local network can upload, download, rename, or delete
files.

Planned first version:

- First-run setup.
- Local admin account or passphrase.
- Session-based browser login.
- Protected API routes.

Possible later additions:

- Multiple local users.
- Share links.
- Per-folder permissions.
- Read-only access.

## Planned Backup And Restore Story

Landfill's backup model is intended to be simple:

```txt
Back up DATA_DIR.
Restore DATA_DIR.
Start Landfill.
```

The backup documentation should explain:

- what files live in `DATA_DIR`
- how to stop the app before a clean backup
- how to restore onto a new machine
- how Docker volumes map to the data directory
- how native installers choose the data directory
- what to expect from SQLite WAL files

## Planned Upgrade Testing Flow

Docker will be used as part of the development and release process to test
stateful updates against persistent data.

Planned flow:

```txt
1. Develop locally with npm/dev servers.
2. Build a Docker image.
3. Start it with a persistent DATA_DIR volume.
4. Upload files and use the app like a real user.
5. Make code, schema, or storage changes.
6. Build the next image.
7. Restart the container against the same DATA_DIR.
8. Verify migrations, existing files, downloads, thumbnails, and searches.
```

This flow is especially important for changes to:

- SQLite schema and migrations.
- Physical file layout.
- Stored file names.
- Cleanup behavior.
- Archive jobs.
- Backup and restore expectations.

Old `DATA_DIR` samples can be kept around and used as upgrade fixtures before
publishing updates.

## Roadmap Snapshot

Near-term:

- Add production web/static serving.
- Add `/api` routing through a proxy or package runtime.
- Add Dockerfile and Docker Compose setup.
- Add persistent-volume upgrade testing.

Next:

- Add first-run setup and authentication.
- Document backup and restore.
- Add release/update instructions.
- Add health checks and runtime diagnostics.

Later:

- Native installers/packages.
- Better LAN discovery.
- Multi-user support.
- More advanced sharing and permissions.
