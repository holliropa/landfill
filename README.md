# Landfill

Landfill is a local file storage app built as an npm workspaces monorepo. The
web app provides a folder explorer, uploads, search, file downloads, archive
downloads, and basic item details. The API stores metadata in SQLite through
Prisma and writes uploaded files to disk.

## Apps

- `apps/web`: Vite, React, React Router, and TanStack Query client.
- `apps/api`: Express API, Prisma, SQLite, Multer uploads, Sharp thumbnails, and
  Archiver download jobs.

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
DATABASE_URL="file:./dev.db"
```

Apply Prisma migrations from the API workspace when the database needs to be
created or updated:

```sh
npm exec prisma migrate dev --workspace @landfill/api
```

Generate the Prisma client after schema changes:

```sh
npm exec prisma generate --workspace @landfill/api
```

## Development

Run both apps through Turbo:

```sh
npm run dev
```

The API listens on `http://localhost:3000` and exposes routes under `/api`.
The web app is served by Vite, usually on `http://localhost:5173`.

## Scripts

- `npm run dev`: start all workspace development servers.
- `npm run build`: build all workspaces.
- `npm run lint`: run workspace lint tasks.
- `npm run check-types`: run TypeScript checks for the web and API workspaces.
- `npm run format`: format TypeScript, TSX, and Markdown files with Prettier.

Workspace scripts:

- `npm run check-types --workspace @landfill/web`: `tsc -b --noEmit`.
- `npm run check-types --workspace @landfill/api`: `tsc --noEmit`.
- `npm run lint --workspace @landfill/web`: ESLint for the web app.

## Architecture Notes

The web client keeps server state in TanStack Query. Folder content queries use
`folderKeys.content(folderId)` and mutations invalidate the affected folder
after create, upload, rename, and delete operations.

The API owns persistence and file processing:

- Folder and file metadata live in SQLite through Prisma models.
- Uploaded files are stored on disk with metadata retained in the database.
- Thumbnail requests are generated through the existing file thumbnail route.
- Multi-item downloads create `DownloadJob` records and archive files that can
  be polled and downloaded when ready.

## Prisma Notes

Prisma config lives in `apps/api/prisma.config.ts`. The schema is split under
`apps/api/prisma/schema`, with migrations under `apps/api/prisma/migrations`.
The development SQLite database is `apps/api/dev.db` when using the default
`DATABASE_URL`.
