# Changelog

All notable changes to Landfill will be documented in this file.

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

