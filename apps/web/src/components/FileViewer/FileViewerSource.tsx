import type { FileResponse } from "@/lib/client/api";
import type { ReactNode } from "react";

export type FileViewerSourceProps = {
  children: (file: FileResponse) => ReactNode;
  extensions?: string[];
  mimeTypes?: string[];
  mimePrefixes?: string[];
};

export function FileViewerSource({ children }: FileViewerSourceProps) {
  void children;

  return null;
}
