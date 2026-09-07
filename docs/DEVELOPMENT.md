# Developer Guide & Local Workflows

This document outlines local environment setup, testing strategies, monorepo architecture, database schema migrations, and contribution standards for **Landfill**.

---

## 1. Prerequisites & Environment Setup

- **Node.js**: `v22.12.0` or newer (matching `<23` engine constraint)
- **Package Manager**: `npm v10.9.2` or compatible
- **Operating System**: Linux, macOS, or Windows (via native Node or WSL2)

### Clone & Install Dependencies

```sh
git clone https://github.com/your-username/landfill.git
cd landfill
npm ci
```

### Configure Environment Files

Copy development environment templates into place:

```sh
# Root / Docker compose (optional)
cp .env.example .env

# Express API service
cp apps/api/.env.example apps/api/.env

# React Web client
cp apps/web/.env.example apps/web/.env
```

---

## 2. Running Local Development

Start all workspace services concurrently with hot-reloading:

```sh
npm run dev
```

This runs Turborepo, orchestrating:

1. **`@landfill/api`**: Runs `tsx --watch` on `apps/api/src/interfaces/http/server.ts` (Listening on `http://localhost:3000`).
2. **`@landfill/web`**: Runs Vite dev server on `http://localhost:5173` with automatic API proxying.

### First Boot Setup

When starting for the first time, check your API terminal output for the initial bootstrap code:

```text
================================================================
[Auth] Owner setup required!
[Auth] Use this one-time setup code in the web browser:
[Auth] a1b2c3d4e5f67890abcdef1234567890
================================================================
```

Open <http://localhost:5173>, paste the code, and set your local password.

---

## 3. Testing Strategy & Smoke Tests

Landfill emphasizes high-fidelity smoke testing over brittle mock tests. Tests interact with a real SQLite database and local disk filesystem in an isolated sandbox.

```sh
# Run entire test suite across all packages
npm test

# Run database tests only
npm run test --workspace @landfill/db

# Run API end-to-end smoke test
npm run test --workspace @landfill/api
```

### What the API Smoke Test Exercises:

- Initial owner setup with console token.
- Secure cookie validation and invalid login throttling.
- Session persistence, rolling expiry, and host-only password reset.
- Nested folder creation and path breadcrumb resolution.
- Multipart and resumable chunked file uploads.
- Text Lab file content updates.
- Deep search with ancestor breadcrumbs.
- File and folder renaming, drag-and-drop moves, and conflict protection.
- In-process ZIP archive creation and downloading.
- Image Lab transformations, preview generation, and non-destructive exports.
- Soft-deletion to Trash, parent-chain invisibility, and item restoration.

---

## 4. Database Schema & Migrations

Database definitions reside in `packages/db/src/schema/`.

### Schema Structure:

- `auth.ts`: `owner_credentials` and `auth_sessions`
- `filesystem.ts`: `storage_blobs` and `storage_entries`
- `downloads.ts`: `download_jobs` and `download_job_item`

### Making Schema Changes:

1. Edit table definitions in `packages/db/src/schema/`.
2. Generate migration SQL files using Drizzle Kit:
   ```sh
   cd packages/db
   npx drizzle-kit generate
   ```
3. Bundle migrations and build the package:
   ```sh
   npm run build --workspace @landfill/db
   ```
4. Run migration tests to ensure zero regressions:
   ```sh
   npm run test --workspace @landfill/db
   ```

---

## 5. Code Quality & Formatting

Before committing changes, ensure all quality gates pass:

```sh
# Type-check all workspaces
npm run check-types

# Lint source files with ESLint
npm run lint

# Format markdown, typescript, and styling
npm run format
```

### Code Style Guidelines:

- **TypeScript**: Strict type annotations; avoid `any`.
- **CSS Modules**: Colocate styles alongside components (`*.module.css`) and utilize CSS variables from `apps/web/src/styles/theme.css`.
- **No Unused Dependencies**: Keep bundle size lean; prefer web platform standards where available.
