import { AudioViewer } from "@/components/FileViewer/AudioViewer";
import { ImageViewer } from "@/components/FileViewer/ImageViewer";
import { PdfViewer } from "@/components/FileViewer/PdfViewer";
import { TextViewer } from "@/components/FileViewer/TextViewer";
import { VideoViewer } from "@/components/FileViewer/VideoViewer";
import { ArchiveIcon, FileEditIcon, ImageIcon } from "lucide-react";
import { lazy } from "react";
import type {
  CapabilityFile,
  CapabilityWorkspaceProps,
  FileCapability,
} from "./types";

const workspaceSurfaces = [
  "toolbar",
  "context-menu",
  "file-viewer",
  "details",
] as const;

const ImageLabWorkspace = lazy(async () => {
  const module = await import("@/features/image-lab");
  return {
    default: ({ file, onClose, onResult }: CapabilityWorkspaceProps) => (
      <module.ImageLabWorkspace
        file={file}
        onClose={onClose}
        onShowExported={(output) =>
          onResult({
            type: "reveal-file",
            fileId: output.id,
            folderId: output.folderId ?? "root",
          })
        }
        onOpenExported={(output) =>
          onResult({
            type: "open-file",
            fileId: output.id,
            folderId: output.folderId ?? "root",
          })
        }
      />
    ),
  };
});

const TextLabWorkspace = lazy(async () => {
  const module = await import("@/features/text-lab");
  return {
    default: ({ file, onClose, onResult }: CapabilityWorkspaceProps) => (
      <module.TextLabWorkspace
        file={file}
        onClose={onClose}
        onSaved={() =>
          onResult({
            type: "reveal-file",
            fileId: file.id,
            folderId: file.location?.id ?? "root",
          })
        }
      />
    ),
  };
});

const ArchiveLabWorkspace = lazy(async () => {
  const module = await import("@/features/archive-lab");
  return {
    default: ({ file, onClose, onResult }: CapabilityWorkspaceProps) => (
      <module.ArchiveLabWorkspace
        file={file}
        onClose={onClose}
        onShowExtracted={(output) =>
          onResult({ type: "open-folder", folderId: output.folderId })
        }
      />
    ),
  };
});

export const fileCapabilities: readonly FileCapability[] = [
  {
    id: "image",
    matches: isImagePreview,
    Preview: ImageViewer,
    Workspace: ImageLabWorkspace,
    workspaceMatches: isImageLabCandidate,
    workspaceCommand: {
      id: "imageLab",
      label: "Image Lab",
      icon: <ImageIcon size={16} />,
      surfaces: workspaceSurfaces,
      order: 40,
    },
  },
  {
    id: "video",
    matches: matchesTypes(
      ["mp4", "m4v", "mov", "ogg", "ogv", "webm", "ts"],
      [],
      ["video/"],
    ),
    Preview: VideoViewer,
  },
  {
    id: "pdf",
    matches: matchesTypes(["pdf"], ["application/pdf", "application/x-pdf"]),
    Preview: PdfViewer,
  },
  {
    id: "audio",
    matches: matchesTypes(
      ["aac", "flac", "m4a", "mp3", "oga", "ogg", "wav"],
      [],
      ["audio/"],
    ),
    Preview: AudioViewer,
  },
  {
    id: "text",
    matches: isTextLabCandidate,
    Preview: TextViewer,
    Workspace: TextLabWorkspace,
    workspaceCommand: {
      id: "textLab",
      label: "Text Lab",
      icon: <FileEditIcon size={16} />,
      surfaces: workspaceSurfaces,
      order: 41,
    },
  },
  {
    id: "archive",
    matches: isArchiveCandidate,
    Workspace: ArchiveLabWorkspace,
    workspaceCommand: {
      id: "archiveLab",
      label: "Archive Lab",
      icon: <ArchiveIcon size={16} />,
      surfaces: workspaceSurfaces,
      order: 42,
    },
    defaultOpen: "archive-browser",
  },
];

export function findPreviewCapability(file: CapabilityFile) {
  return fileCapabilities.find(
    (capability) => capability.Preview && capability.matches(file),
  );
}

export function isArchiveCandidate(file: CapabilityFile) {
  return matchesTypes(
    ["zip"],
    ["application/zip", "application/x-zip-compressed"],
  )(file);
}

function isImagePreview(file: CapabilityFile) {
  return matchesTypes(
    ["avif", "bmp", "gif", "ico", "jpeg", "jpg", "png", "svg", "webp"],
    [],
    ["image/"],
  )(file);
}

function isImageLabCandidate(file: CapabilityFile) {
  return matchesTypes(
    ["jpeg", "jpg", "png", "webp"],
    ["image/jpeg", "image/png", "image/webp"],
  )(file);
}

function isTextLabCandidate(file: CapabilityFile) {
  return matchesTypes(
    [
      "txt",
      "md",
      "markdown",
      "json",
      "js",
      "jsx",
      "ts",
      "tsx",
      "html",
      "css",
      "scss",
      "yaml",
      "yml",
      "xml",
      "csv",
      "tsv",
      "log",
      "sql",
      "sh",
      "bash",
      "env",
      "ini",
      "conf",
      "toml",
      "py",
      "rs",
      "go",
      "java",
      "c",
      "cpp",
      "h",
      "cs",
    ],
    [
      "application/json",
      "application/javascript",
      "application/typescript",
      "application/xml",
      "application/x-yaml",
      "application/x-sh",
    ],
    ["text/"],
  )(file);
}

function matchesTypes(
  extensions: readonly string[],
  mimeTypes: readonly string[] = [],
  mimePrefixes: readonly string[] = [],
) {
  const extensionSet = new Set(extensions.map((value) => value.toLowerCase()));
  const mimeTypeSet = new Set(mimeTypes.map((value) => value.toLowerCase()));
  const normalizedPrefixes = mimePrefixes.map((value) => value.toLowerCase());

  return (file: CapabilityFile) => {
    const extension = getExtension(file.name);
    const mimeType = file.mimeType?.toLowerCase() ?? "";
    return (
      extensionSet.has(extension) ||
      mimeTypeSet.has(mimeType) ||
      normalizedPrefixes.some((prefix) => mimeType.startsWith(prefix))
    );
  };
}

function getExtension(name: string) {
  const index = name.lastIndexOf(".");
  return index > 0 && index < name.length - 1
    ? name.slice(index + 1).toLowerCase()
    : "";
}
