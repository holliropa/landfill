# Landfill 🗄️

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22.12-brightgreen.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL-003B57.svg)](https://www.sqlite.org/)

**Landfill** is a fast, self-hosted personal drive and file workbench. It gives one person a single place to upload, organize, preview, edit, transform, and retrieve files through a responsive browser interface.

![Landfill File Explorer](docs/landfill-explorer.png)

---

## 🌟 Key Highlights & Features

- **🚀 Zero-Friction Ingestion**:
  - **Clipboard Ingest (`Ctrl+V` / `Cmd+V`)**: Paste screenshots directly from your clipboard as timestamped PNGs, or raw text as `.md` / `.txt` notes.
  - **Resumable Chunked Uploads**: Automatically slices large multi-gigabyte files into 5MB chunks with retry and resumption support.
  - **Drag-and-Drop**: Drop files or folders anywhere onto the browser window.

- **🛠️ Dedicated Workspaces (Preview vs. Lab)**:
  - **Universal File Viewer**: Ultra-low-latency preview for images (pan/zoom/rotate), audio (custom player with speed/looping), video, PDFs, and code.
  - **Text Lab Workspace**: In-browser Markdown and text editor with live split-screen preview, document metrics, and smart transforms (JSON prettify/minify, line sorting, casing).
  - **Image Lab Workspace**: Non-destructive image studio for resizing, visual cropping, rotating, and format conversions (WebP, PNG, JPEG) powered by Sharp.

- **🖼️ Recursive Media Gallery**:
  - Automatically discovers all photos, videos, and audio tracks across your entire folder tree.
  - Filter tabs (`All`, `Photos`, `Videos`, `Audio`) and full-screen auto-advancing slideshow mode.

- **🔍 Deep Search & Navigation**:
  - Instant substring search across all files and folders.
  - Full ancestor breadcrumbs (`Root > Documents > Projects > notes.md`) for instant context and one-click folder jumping.

- **📦 In-Process Async Archives**:
  - Download single files directly, or batch-download multiple files/folders as compressed ZIP archives.
  - Background queue runs in-process and resumes interrupted jobs across API restarts with zero external dependencies (no Redis needed).

- **🔒 Hardened Single-Owner Security**:
  - Memory-hard **scrypt** password hashing, SHA-256 database-backed session tokens, `HttpOnly` / `SameSite=Strict` cookies, and CSRF origin validation.
  - Host-only disaster recovery command (`npm run auth:reset`).

---

## ⚡ 30-Second Quick Start (Docker Compose)

The easiest way to run Landfill is using Docker Compose:

```sh
# 1. Start Landfill (binds to 127.0.0.1:8080 by default)
docker compose up -d --build

# 2. View the one-time bootstrap setup code in API logs
docker compose logs api
```

1. Open **<http://127.0.0.1:8080>** in your browser.
2. Enter the one-time setup code printed in the logs and choose your permanent password (min. 12 characters).
3. Start dropping files!

### Custom Port or Network Binding

To expose Landfill to a trusted local network or use a custom port, copy `.env.example` to `.env`:

```sh
# Set binding to all interfaces for local network access
LANDFILL_BIND_ADDRESS=0.0.0.0
LANDFILL_PORT=9000
```

---

## 🏛️ System Architecture & Tech Stack

Landfill uses a clean monorepo structure orchestrated by Turborepo:

```
[ Browser Client ]
       │
       ▼
[ Caddy Edge Proxy :80 / :8080 ]
       ├── Static Files ──────► [ React 19 + Vite SPA ]
       └── /api/* Proxy ──────► [ Express 5 REST API :3000 ]
                                       │
                        ┌──────────────┴──────────────┐
                        ▼                             ▼
               [ SQLite Database ]           [ Local Storage ]
             (WAL Mode + Foreign Keys)      (DATA_DIR/storage/*)
```

| Component             | Path          | Technology Stack                                                                      |
| :-------------------- | :------------ | :------------------------------------------------------------------------------------ |
| **Frontend Web**      | `apps/web`    | React 19, TypeScript, Vite, TanStack Query, React Router 7, CSS Modules, Lucide Icons |
| **Backend API**       | `apps/api`    | Node.js 22, Express 5, Multer, Sharp (libvips), Archiver, TypeScript                  |
| **Database & Schema** | `packages/db` | SQLite (Better-SQLite3), Drizzle ORM, Automated Migration Runner                      |
| **Reverse Proxy**     | `infra/caddy` | Caddy 2 (Alpine Linux)                                                                |

---

## 📚 Complete Documentation Index

For in-depth architectural guides, workflows, API specifications, and deployment runbooks:

- 🏗️ **[System Architecture & Design Philosophy](docs/ARCHITECTURE.md)**: Deep dive into the decoupled storage engine (`storage_blobs` vs `storage_entries`), in-process async queue, and relational schema.
- 📖 **[Features, Workflows & User Guide](docs/FEATURES_AND_WORKFLOWS.md)**: Comprehensive tour of File Explorer, Resumable Uploads, Text Lab, Image Lab, Gallery, Search, and Trash.
- 🔌 **[REST API Reference](docs/API_REFERENCE.md)**: Complete endpoint catalog, request/response formats, parameters, and HTTP error codes.
- 🛡️ **[Security Model & Threat Assessment](docs/SECURITY.md)**: Single-owner threat model, scrypt parameters, session lifecycle, CSRF defense, and reverse-proxy TLS hardening.
- 🚀 **[Deployment, Operations & Backups](docs/DEPLOYMENT_AND_OPERATIONS.md)**: Production configurations, environment variables reference, volume management, live backups, and disaster recovery.
- 💻 **[Developer Guide & Local Workflows](docs/DEVELOPMENT.md)**: Local development setup, testing strategies, running smoke tests, and Drizzle migrations.

---

## 🛠️ Local Development

Requirements: **Node.js >= 22.12.0** and **npm 10.9.2+**.

```sh
# 1. Install dependencies
npm ci

# 2. Copy development configuration templates
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Start development servers with hot-reload
npm run dev
```

Open <http://localhost:5173>. The terminal will output the initial owner setup code on first run.

### Running Verification & Tests

```sh
npm test              # Runs database tests & API end-to-end smoke test
npm run check-types   # Validates TypeScript types across monorepo
npm run lint          # Runs ESLint
npm run build         # Production bundle build
```

---

## 🚫 Limitations & Non-Goals

Landfill deliberately focuses on single-owner simplicity:

- **Single Owner Only**: No multi-tenant user accounts, invitations, or shared permission hierarchies.
- **Self-Contained Storage**: No third-party S3/cloud dependencies; data stays local on disk.
- **No Direct Internet Exposure**: Intended for localhost, VPN (Tailscale/WireGuard), or behind an authenticated/TLS-terminating reverse proxy.

---

## 📄 License

Landfill is open-source software licensed under the [MIT License](LICENSE).
