# Features, Workflows & User Guide

Landfill is designed for personal simplicity, maximum daily ergonomics, and zero-friction file handling. This guide covers all user-facing features, workflows, and interactive tools available in the web interface.

---

## 1. File Explorer & Namespace Management

The Explorer provides a clean, responsive view of your files and folders with high-density information display and instant interactions.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📁 Documents > 📁 Projects > 📁 Landfill                   [ Sort: Name ▾ ] │
├─────────────────────────────────────────────────────────────────────────────┤
│ [ Select All ]   [ Download (2) ]   [ Move ]   [ Trash ]                    │
│                                                                             │
│  [📁 assets]          2 items                   2026-09-06 21:00            │
│  [📁 src]             14 items                  2026-09-06 21:15            │
│  [📄 architecture.md] 4.2 KB    text/markdown   2026-09-06 22:04            │
│  [🖼️ banner.png]      1.2 MB    image/png       2026-09-06 20:45            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Folder Navigation & Breadcrumbs

- **Navigation Bar**: Interactive breadcrumbs at the top of the explorer show the full ancestor path from Root (`/`) to the active folder. Clicking any ancestor segment jumps directly to that folder.
- **Back / Up Actions**: Quickly navigate to the parent folder via toolbar buttons or keyboard shortcuts (`Backspace` / `Alt+Up`).
- **Sorting**: Sort contents dynamically by **Name**, **Date Modified**, or **Size** in ascending or descending order. Preferences are preserved across sessions.

### Multi-Item Selection & Actions

- **Selection**: Click items or use checkboxes to select individual or multiple items.
- **Batch Actions Toolbar**: Appears automatically when items are selected:
  - **Download**: Directly downloads a single file, or triggers an asynchronous ZIP archive creation for multiple files and folders.
  - **Move**: Opens the Folder Picker dialog or allows dragging selected items directly onto target folders.
  - **Trash**: Soft-deletes selected items to the Trash bin.

### Keyboard Shortcuts Reference

| Shortcut               | Action                                                |
| :--------------------- | :---------------------------------------------------- |
| `Enter`                | Open folder / Open file in `FileViewer` preview       |
| `Space`                | Toggle selection of active item                       |
| `Ctrl+A` / `Cmd+A`     | Select all items in current folder                    |
| `Ctrl+V` / `Cmd+V`     | Paste screenshot or text note from clipboard          |
| `F2`                   | Rename active item                                    |
| `Delete` / `Backspace` | Move selected items to Trash                          |
| `Esc`                  | Clear selection / Close open dialog or viewer overlay |

---

## 2. Ingestion & Upload Workflows

Getting files into Landfill is built around three zero-friction mechanisms:

### 1. Drag-and-Drop Dropzone

- Drag one or multiple files/folders anywhere onto the browser window.
- The full-screen dropzone overlay highlights active drop targets. Dropping files initiates immediate ingestion into the active folder.

### 2. Clipboard Paste (`Ctrl+V` / `Cmd+V`)

- **Instant Screenshot Upload**: Capture a screenshot with your OS shortcut (e.g. `Win+Shift+S` or `Cmd+Shift+4`) and press `Ctrl+V` inside Landfill. Landfill automatically converts the clipboard image into a timestamped PNG (`screenshot-YYYY-MM-DD-HHmmss.png`) and uploads it.
- **Quick Text Clips**: Copy raw code or text notes, press `Ctrl+V`, and Landfill creates a `.txt` or `.md` note directly in the current folder.

### 3. Resumable Chunked Upload Engine

- Automatically engaged for large files to avoid timeout errors on slow or unstable home connections.
- Files are sliced into 5MB chunks and uploaded with real-time percentage progress.
- If a connection drops, re-uploading resumes from the last uploaded chunk without restarting from byte zero.

---

## 3. Preview vs. Lab Workspaces

To prevent cognitive friction and accidental data corruption, Landfill strictly separates **Consumption** from **Production**:

```
                  ┌─────────────────────────────────────┐
                  │          File in Explorer           │
                  └──────────────────┬──────────────────┘
                                     │
                 ┌───────────────────┴───────────────────┐
                 ▼                                       ▼
    ┌──────────────────────────┐            ┌──────────────────────────┐
    │       FileViewer         │            │      Workspace Lab       │
    │      (Preview Mode)      │            │       (Edit Mode)        │
    ├──────────────────────────┤            ├──────────────────────────┤
    │ • Read-only inspection   │            │ • Stateful editor        │
    │ • Ultra-low latency      │            │ • Formatting & transforms│
    │ • Media playback         │            │ • Live split preview     │
    │ • Sibling carousel       │            │ • Atomic saves / exports │
    └──────────────────────────┘            └──────────────────────────┘
```

| Dimension          | File Preview (`FileViewer`)                      | Workspace Lab (`Text Lab`, `Image Lab`)               |
| :----------------- | :----------------------------------------------- | :---------------------------------------------------- |
| **Primary Goal**   | Fast inspection ("Is this what I need?")         | Active editing and manipulation ("Modify or export")  |
| **State & Safety** | Strictly read-only, zero risk of data loss       | Stateful, tracks dirty edits, prompts before discard  |
| **Navigation**     | Sibling carousel (Next / Prev arrows, slideshow) | Focused single-document workspace                     |
| **Tooling**        | Zoom, pan, rotate, word wrap, raw download       | Formatters (JSON), line sorting, case converter, crop |

---

## 4. Universal File Viewer (`FileViewer`)

The unified preview overlay opens automatically when clicking any file in the Explorer or Gallery:

- **Image Viewer**:
  - Pan and Zoom controls (up to 5x magnification).
  - 90-degree visual rotation.
  - Previous / Next sibling navigation without closing the viewer.
  - Action bridge: `Open in Image Lab` button.
- **Audio Player (`AudioViewer`)**:
  - Custom audio player with waveform scrubber and time displays.
  - Playback speed multiplier (0.5x, 1x, 1.25x, 1.5x, 2x).
  - Loop toggle and volume slider.
- **Video Player**:
  - Full HTML5 video playback with native streaming and controls.
- **PDF Viewer**:
  - In-browser interactive PDF rendering with page navigation.
- **Text & Code Preview**:
  - Syntax-aware formatted text preview with line numbers and word wrap toggle.
  - Action bridge: `Open in Text Lab` button.

---

## 5. Text Lab Workspace (`TextLabWorkspace`)

A dedicated in-browser text and Markdown environment designed for quick edits, documentation, and configuration files:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 📝 notes.md  [Dirty *]    [ 👁️ Split View ▾ ]  [ 🪄 Transform ▾ ]  [ 💾 Save ]│
├──────────────────────────────────────┬──────────────────────────────────────┤
│ 1 | # Meeting Notes                  │ # Meeting Notes                      │
│ 2 |                                  │                                      │
│ 3 | - Discuss backup schedule        │ • Discuss backup schedule            │
│ 4 | - Review chunked uploads         │ • Review chunked uploads             │
│ 5 |                                  │                                      │
├──────────────────────────────────────┴──────────────────────────────────────┤
│ Lines: 5  |  Words: 11  |  Characters: 78  |  Size: 78 B                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Capabilities:

- **View Modes**:
  - **Edit Only**: Maximized clean editor for plain text, `.env`, `.json`, `.sql`, etc.
  - **Split View**: Synchronized editor on the left with live rendered Markdown on the right.
  - **Preview Only**: Full-width rendered Markdown presentation.
- **Built-in Smart Transforms (`🪄 Transform`)**:
  - **Prettify JSON**: Parses and formats unformatted JSON with 2-space indentation.
  - **Minify JSON**: Compresses JSON by stripping whitespace.
  - **Sort Lines (A-Z / Z-A)**: Alphabetically sorts lines in the document.
  - **Uppercase / Lowercase / Title Case**: Fast casing transformations.
- **Document Metrics**: Real-time counter at the bottom bar showing line count, word count, character count, and raw byte size.
- **Atomic Save & Save As**:
  - **Save (`Ctrl+S`)**: Updates the file content in-place by creating a new content blob atomically.
  - **Save As...**: Saves the edited buffer into a new sibling file with a custom filename.

---

## 6. Image Lab Workspace (`ImageLabWorkspace`)

A non-destructive image manipulation studio powered by Sharp:

- **Transform Controls**:
  - **Crop & Aspect Ratio**: Freeform or fixed ratio (1:1, 4:3, 16:9) cropping.
  - **Resize**: Target width and height with aspect ratio locking.
  - **Rotation**: 90°, 180°, and 270° lossless rotations.
  - **Format Conversion**: Convert between JPEG, PNG, and WebP with fine quality tuning (1-100%).
- **Live Preview Canvas**: Real-time server-rendered preview reflecting transforms before saving.
- **Non-Destructive Export**: Exports the transformed result as a new file in the current folder without modifying the original source image.

---

## 7. Media Center & Gallery (`GalleryPage`)

A recursive photo and media browser aggregating all visual and audio media across your entire drive:

- **Recursive Discovery**: Scans all nested folders automatically—no need to manually open individual subdirectories.
- **Category Filter Tabs**:
  - **All**: Displays all discovered media items.
  - **Photos**: Filters strictly for images (JPEG, PNG, WebP, GIF, SVG, AVIF).
  - **Videos**: Filters for video files (MP4, WebM, MOV, MKV).
  - **Audio**: Filters for audio tracks (MP3, WAV, FLAC, OGG, AAC, M4A).
- **Slideshow Mode**:
  - Full-screen auto-advancing carousel.
  - Configurable interval timers (3s, 5s, 10s).
  - Play, pause, and manual next/previous navigation controls.

---

## 8. Global Search & Breadcrumb Explorer (`SearchPage`)

- **Instant Substring Search**: Real-time search across all active filenames and folder names.
- **Ancestor Path Breadcrumbs**: Every search result item displays its full folder hierarchy path (e.g. `Root > Archive > 2026 > Tax > document.pdf`), eliminating ambiguity when files have identical names.
- **Direct Jump**: Clicking any breadcrumb segment in a search result navigates directly to that folder in the Explorer.

---

## 9. Batch Downloads & In-Process ZIP Archives

- **Single File**: Streams the raw file directly to the browser with standard `Content-Disposition` headers.
- **Multi-Selection & Folders**:
  - Submitting multiple files or folders starts an asynchronous download job (`POST /api/downloads`).
  - A progress modal displays the ZIP compression state.
  - Once compression completes, Landfill automatically triggers the browser file download.
  - Download links remain valid for 24 hours.

---

## 10. Trash, Soft-Deletion & Recovery (`TrashPage`)

- **Soft Delete**: Trashing a file or folder marks it with a `deleted_at` timestamp. Trashed items are instantly hidden from Explorer, Gallery, and Search.
- **Subtree Inheritance**: Moving a parent folder to Trash automatically hides all descendant files and subfolders without modifying their individual records.
- **Item Restoration**: Restore individual files or entire folder trees back to their original location.
- **Permanent Purge**:
  - Permanently delete individual items from Trash.
  - **Empty Trash**: Purges all soft-deleted records and physically deletes their unreferenced blobs from disk.
