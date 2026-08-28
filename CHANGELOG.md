# Changelog

All notable changes to Landfill will be documented in this file.

## v0.1.0 - 2026-08-28

### Added

- Added a real HTTP smoke test for the complete core file-management workflow.
- Added a restartable, in-process archive job runner backed by SQLite.
- Added explicit localhost-by-default security and backup documentation.
- Added continuous integration for clean installs, tests, type checking,
  linting, and production builds.

### Changed

- Focused Landfill on single-user and trusted-home-network file management.
- Simplified Docker Compose to the API and same-origin web proxy.
- Separated Express app creation from server startup and added graceful shutdown.
- Updated the browser navigation, project identity, accessibility labels, and
  release documentation.
- Documented the container cleanup and binding changes required when upgrading
  from v0.0.2.

### Removed

- Removed the unfinished file-conversion experience.
- Removed Redis, BullMQ, the separate worker, and the public queue dashboard.
- Removed unfinished settings navigation and development debug logging.

## v0.0.2 - 2026-05-31

### Added

- Added drag-and-drop file upload to the explorer file list.
- Added a reusable `FileDropZone` component for file drag/drop interactions.
- Added explorer loading, empty, and error states.
- Added explorer context-menu actions for open, rename, download, details, and delete.
- Added keyboard shortcuts for rename, delete, and download actions.

### Changed

- Moved explorer upload/drop handling into the explorer UI layer.
- Improved selected-row and focused-row styling.
- Reworked file preview actions so download and delete perform their expected behavior.
- Added release version metadata across the root package and workspaces.

### Fixed

- Removed debug logging from explorer item opening.
