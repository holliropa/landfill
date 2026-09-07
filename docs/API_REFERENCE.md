# REST API Reference

All Landfill API endpoints are served under `/api/*`. Requests requiring authentication use an `HttpOnly` session cookie (`landfill_session`).

---

## 1. Authentication Endpoints

### `GET /api/auth/status`

Checks the authentication state of the current client and whether initial setup is required.

- **Authentication**: Public
- **Response `200 OK`**:

```json
{
  "requiresSetup": false,
  "authenticated": true
}
```

---

### `POST /api/auth/setup`

Configures the initial owner password using the ephemeral bootstrap setup code printed to the API console on first boot.

- **Authentication**: Public (Throttled)
- **Request Body**:

```json
{
  "setupCode": "a1b2c3d4e5f6...",
  "password": "mySecurePassword123"
}
```

- **Response `201 Created`**: Sets `landfill_session` cookie.

```json
{
  "message": "Owner account created successfully"
}
```

---

### `POST /api/auth/login`

Authenticates the single instance owner.

- **Authentication**: Public (Throttled)
- **Request Body**:

```json
{
  "password": "mySecurePassword123"
}
```

- **Response `200 OK`**: Sets `landfill_session` cookie.

```json
{
  "message": "Authenticated successfully"
}
```

---

### `POST /api/auth/logout`

Invalidates the current session token in SQLite and clears the session cookie.

- **Authentication**: Authenticated
- **Response `200 OK`**:

```json
{
  "message": "Logged out successfully"
}
```

---

## 2. File Operations

### `POST /api/files`

Uploads one or more files using standard multipart form data.

- **Request Headers**: `Content-Type: multipart/form-data`
- **Form Fields**:
  - `files`: File payload (one or multiple)
  - `folder`: Destination folder ID (`"root"` or UUID)
- **Response `201 Created`**:

```json
[
  {
    "id": "f81d4fae-7dec-11d0-a765-00a0c91e6bf6",
    "name": "document.pdf",
    "size": 1048576,
    "mimeType": "application/pdf",
    "parentId": "root",
    "createdAt": 1772834400000,
    "updatedAt": 1772834400000
  }
]
```

---

### Resumable Chunked Upload Endpoints

#### `POST /api/files/upload/chunk-init`

Initializes a new chunked upload session.

- **Request Body**:

```json
{
  "filename": "backup.iso",
  "totalSize": 2147483648,
  "mimeType": "application/x-iso9660-image",
  "folder": "root",
  "chunkSize": 5242880,
  "totalChunks": 410,
  "uploadId": "custom-uuid-optional"
}
```

- **Response `200 OK`**:

```json
{
  "uploadId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "filename": "backup.iso",
  "totalSize": 2147483648,
  "totalChunks": 410,
  "chunkSize": 5242880,
  "uploadedChunks": []
}
```

#### `POST /api/files/upload/chunk`

Uploads a single slice of a chunked session.

- **Form Fields**:
  - `uploadId`: Session ID
  - `chunkIndex`: Zero-based chunk index (`0` to `totalChunks - 1`)
  - `chunk`: Binary chunk slice
- **Response `200 OK`**:

```json
{
  "uploadId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "chunkIndex": 0,
  "uploadedChunks": [0]
}
```

#### `GET /api/files/upload/status/:uploadId`

Returns upload progress and list of already uploaded chunks for resumption.

- **Response `200 OK`**:

```json
{
  "uploadId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "filename": "backup.iso",
  "totalSize": 2147483648,
  "totalChunks": 410,
  "chunkSize": 5242880,
  "uploadedChunks": [0, 1, 2, 3]
}
```

#### `POST /api/files/upload/chunk-complete`

Verifies all chunks and stitches them into the final file record.

- **Request Body**:

```json
{
  "uploadId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

- **Response `201 Created`**: Returns created File Entry object.

#### `DELETE /api/files/upload/:uploadId`

Cancels an active upload session and cleans up temporary chunk files.

- **Response `200 OK`**: `{ "success": true }`

---

### `GET /api/files/:id`

Fetches metadata for a specific file.

- **Response `200 OK`**: File entry metadata object.

### `PATCH /api/files/:id`

Renames an existing file.

- **Request Body**: `{ "name": "new_name.txt" }`
- **Response `200 OK`**: Updated file metadata object.

### `PUT /api/files/:id/content`

Updates raw text contents of a file (used by Text Lab). Creates a new content blob atomically.

- **Request Body**:

```json
{
  "content": "# Updated Markdown Notes\nNew text...",
  "mimeType": "text/markdown"
}
```

- **Response `200 OK`**: Updated file metadata object.

### `GET /api/files/:id/raw`

Streams raw file bytes with appropriate `Content-Type` for browser inline preview.

### `GET /api/files/:id/download`

Streams file with `Content-Disposition: attachment; filename="name"` header.

### `GET /api/files/:id/thumbnail`

Streams an optimized, resized thumbnail for image files.

### `DELETE /api/files/:id`

Soft-deletes a file to the Trash bin.

---

## 3. Folder Operations

### `POST /api/folders`

Creates a new directory.

- **Request Body**:

```json
{
  "name": "Projects",
  "parentId": "root"
}
```

- **Response `201 Created`**:

```json
{
  "id": "a2b3c4d5-e6f7-4890-a1b2-c3d4e5f60718",
  "name": "Projects",
  "parentId": null,
  "createdAt": 1772834400000,
  "updatedAt": 1772834400000
}
```

### `GET /api/folders/:id`

Gets folder metadata. (`:id` can be `"root"` or a folder UUID).

### `GET /api/folders/:id/content`

Lists immediate child folders and files inside the specified folder.

- **Query Parameters**:
  - `sortBy`: `"name"` | `"updatedAt"` | `"size"` (default: `"name"`)
  - `sortOrder`: `"asc"` | `"desc"` (default: `"asc"`)
- **Response `200 OK`**:

```json
{
  "folders": [ ... ],
  "files": [ ... ]
}
```

### `GET /api/folders/:id/path`

Returns the complete breadcrumb ancestor chain from root to this folder.

- **Response `200 OK`**:

```json
[
  { "id": "root", "name": "Root" },
  { "id": "uuid-1", "name": "Documents" },
  { "id": "uuid-2", "name": "Projects" }
]
```

### `PATCH /api/folders/:id`

Renames a folder.

- **Request Body**: `{ "name": "New Folder Name" }`

### `DELETE /api/folders/:id`

Soft-deletes a folder and all its nested subtrees to Trash.

---

## 4. Storage, Moving & Search

### `GET /api/storage/search`

Searches files and folders across the active namespace tree.

- **Query Parameters**:
  - `q`: Search query string
- **Response `200 OK`**:

```json
{
  "items": [
    {
      "id": "file-uuid",
      "name": "budget.xlsx",
      "type": "file",
      "size": 45000,
      "mimeType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "path": [
        { "id": "root", "name": "Root" },
        { "id": "folder-uuid", "name": "Finance" }
      ],
      "updatedAt": 1772834400000
    }
  ]
}
```

### `GET /api/storage/media`

Recursively lists all media items (photos, videos, audio) for the Gallery view.

- **Query Parameters**:
  - `type`: `"all"` | `"photos"` | `"videos"` | `"audio"` (optional)

### `POST /api/storage/move`

Moves one or multiple files and folders to a target parent folder.

- **Request Body**:

```json
{
  "itemIds": ["file-id-1", "folder-id-2"],
  "targetFolderId": "root"
}
```

- **Response `200 OK`**: `{ "success": true, "movedCount": 2 }`

---

## 5. Image Lab Endpoints

### `GET /api/image-lab/sources/:id`

Fetches source image dimensions, MIME type, and metadata for editing.

### `POST /api/image-lab/preview`

Generates an in-memory preview of image transformations without modifying storage.

- **Request Body**:

```json
{
  "fileId": "image-uuid",
  "crop": { "x": 100, "y": 100, "width": 800, "height": 600 },
  "resize": { "width": 400, "height": 300, "fit": "cover" },
  "rotation": 90,
  "format": "webp",
  "quality": 85
}
```

- **Response `200 OK`**: Streams converted image buffer.

### `POST /api/image-lab/exports`

Executes transformations and saves the result as a new file in Landfill.

- **Request Body**: Same as preview with optional `targetFilename` and `targetFolderId`.
- **Response `201 Created`**: New file entry object.

---

## 6. Batch Downloads & Archive Jobs

### `POST /api/downloads`

Creates an asynchronous zip archive job for one or multiple items/folders.

- **Request Body**:

```json
{
  "itemIds": ["file-1-uuid", "folder-1-uuid"]
}
```

- **Response `201 Created`**:

```json
{
  "jobId": "download-job-uuid",
  "status": "pending"
}
```

### `GET /api/downloads/:id`

Polls archive generation status.

- **Response `200 OK`**:

```json
{
  "id": "download-job-uuid",
  "status": "ready",
  "progress": 100,
  "fileName": "landfill-archive-2026-09-06.zip"
}
```

### `GET /api/downloads/:id/file`

Downloads the completed zip file.

---

## 7. Trash & Data Lifecycle

### `GET /api/trash`

Lists all directly soft-deleted files and folders in Trash.

### `POST /api/trash/files/:id/restore` & `POST /api/trash/folders/:id/restore`

Restores the specified item back to its original parent location.

### `DELETE /api/trash/files/:id` & `DELETE /api/trash/folders/:id`

Permanently deletes the specified item and frees physical disk space.

### `DELETE /api/trash`

Empties the Trash, permanently purging all deleted records and unreferenced storage blobs.

---

## 8. System & Health

### `GET /api/health`

Healthcheck endpoint for container orchestrators (e.g. Docker Compose / Kubernetes).

- **Authentication**: Public
- **Response `200 OK`**:

```json
{
  "status": "ok"
}
```
