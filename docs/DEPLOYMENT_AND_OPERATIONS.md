# Deployment, Operations & Backups

This guide outlines production deployment, environment variables, data directory structure, backup and restore procedures, and operational maintenance for Landfill.

---

## 1. Production Docker Compose Setup

Landfill is packaged as a lightweight multi-container setup via Docker Compose:

```
[ Incoming Client Requests ]
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│ proxy (Caddy Alpine)                                        │
│ Ports: ${LANDFILL_BIND_ADDRESS}:${LANDFILL_PORT}:80         │
│ Serves React SPA & reverse-proxies /api/*                   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ api (Node.js 22 LTS Alpine)                                 │
│ Port: 3000 (Internal Docker Network)                        │
│ Volumes: landfill-api:/data                                 │
└─────────────────────────────────────────────────────────────┘
```

### Standard Compose Commands

```sh
# Start Landfill in the background with automatic build
docker compose up -d --build

# Inspect running container logs
docker compose logs -f api

# Stop Landfill gracefully
docker compose down
```

> **Warning**: Never run `docker compose down -v` unless you explicitly intend to permanently delete the SQLite database and all uploaded files.

---

## 2. Directory Layout & Persistence

All persistent and mutable state is strictly stored inside `DATA_DIR` (`/data` in Docker, `./.landfill` in local dev):

```text
DATA_DIR/
├── database/
│   ├── main.db          # Primary SQLite database file
│   ├── main.db-wal      # Write-Ahead Log journal
│   └── main.db-shm      # Shared-memory index for WAL
└── storage/
    ├── uploads/         # Immutable file blobs (named by UUIDv4)
    ├── downloads/       # Asynchronously generated ZIP archives
    └── temp_uploads/    # Staging directories for chunked upload sessions
```

---

## 3. Environment Variables Reference

### Root / Docker Compose (`.env`)

| Variable                | Default     | Description                                                                        |
| :---------------------- | :---------- | :--------------------------------------------------------------------------------- |
| `LANDFILL_BIND_ADDRESS` | `127.0.0.1` | Network interface IP binding. Set to `0.0.0.0` to expose to trusted local network. |
| `LANDFILL_PORT`         | `8080`      | Host port mapped to the Caddy reverse proxy.                                       |

### API Service (`apps/api/.env`)

| Variable        | Default       | Description                                                                                          |
| :-------------- | :------------ | :--------------------------------------------------------------------------------------------------- |
| `DATA_DIR`      | `./.landfill` | Absolute or relative path to the persistent data root.                                               |
| `HOST`          | `127.0.0.1`   | Host address the Express API listens on (`0.0.0.0` in Docker).                                       |
| `PORT`          | `3000`        | Port the Express API listens on.                                                                     |
| `TRUST_PROXY`   | `0`           | Number of trusted proxy hops (set to `1` behind Caddy).                                              |
| `COOKIE_SECURE` | `auto`        | Cookie `Secure` flag policy: `auto` (detect HTTPS), `true` (enforce HTTPS), or `false` (plain HTTP). |

### Web Client (`apps/web/.env`)

| Variable           | Default                 | Description                                                                   |
| :----------------- | :---------------------- | :---------------------------------------------------------------------------- |
| `API_PROXY_TARGET` | `http://localhost:3000` | Target URL for Vite dev server proxying `/api` requests in local development. |

---

## 4. Backup & Disaster Recovery

Because Landfill decouples metadata (SQLite) from raw disk storage (Blobs), **the database and storage directory must always be backed up together**.

### Method 1: Cold Backup (Recommended)

1. Stop the containers to flush SQLite WAL buffers:
   ```sh
   docker compose down
   ```
2. Archive the Docker named volume:
   ```sh
   docker run --rm \
     -v landfill-api:/data:ro \
     -v $(pwd)/backups:/backup \
     alpine tar -czvf /backup/landfill-backup-$(date +%Y%m%d_%H%M%S).tar.gz -C /data .
   ```
3. Restart Landfill:
   ```sh
   docker compose up -d
   ```

### Method 2: Live Hot Backup (Zero Downtime)

To back up without stopping the API container:

1. Force a SQLite WAL checkpoint and online backup:
   ```sh
   docker compose exec api node -e '
     const Database = require("better-sqlite3");
     const db = new Database("/data/database/main.db");
     db.backup("/data/database/backup.db").then(() => console.log("DB Backup Complete"));
   '
   ```
2. Copy the storage files and database snapshot using `rsync` or `tar`.

---

### Disaster Recovery / Restoration

1. Extract backup contents into the `landfill-api` volume:
   ```sh
   docker run --rm \
     -v landfill-api:/data \
     -v $(pwd)/backups:/backup \
     alpine sh -c "rm -rf /data/* && tar -xzvf /backup/landfill-backup-YYYYMMDD_HHMMSS.tar.gz -C /data"
   ```
2. Start Landfill:
   ```sh
   docker compose up -d --build
   ```

---

## 5. Upgrades & Database Migrations

Landfill features an automated migration runner powered by Drizzle ORM:

1. **Automatic Execution**: When the API container starts, `@landfill/db` executes `runMigrations(sqlite)` before listening for HTTP requests.
2. **Safety**: Schema migrations run inside SQLite transactions. If a migration fails, the database automatically rolls back and the API process exits safely.
3. **Upgrade Procedure**:
   ```sh
   # 1. Take a backup
   docker compose down
   # 2. Pull or build latest image
   docker compose up -d --build
   ```
