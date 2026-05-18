import styles from "./FileViewer.module.css";
import {
  FileViewerSource,
  type FileViewerSourceProps,
} from "./FileViewerSource";
import type { FileResponse } from "@/lib/client/api";
import { Children, isValidElement, type ReactNode, useMemo } from "react";

type ViewerMatchInput = {
  file: FileResponse;
  extension: string;
};

function getFileExtension(name: string) {
  const extensionStartIndex = name.lastIndexOf(".");

  if (extensionStartIndex <= 0 || extensionStartIndex === name.length - 1) {
    return "";
  }

  return name.slice(extensionStartIndex + 1).toLowerCase();
}

function normalizeExtension(extension: string) {
  return extension.replace(/^\./, "").toLowerCase();
}

function matchesViewerSource(
  source: FileViewerSourceProps,
  { file, extension }: ViewerMatchInput,
) {
  const normalizedMimeType = file.mimeType.toLowerCase();

  if (
    source.extensions?.some(
      (supportedExtension) =>
        normalizeExtension(supportedExtension) === extension,
    )
  ) {
    return true;
  }

  if (
    source.mimeTypes?.some(
      (mimeType) => mimeType.toLowerCase() === normalizedMimeType,
    )
  ) {
    return true;
  }

  if (
    source.mimePrefixes?.some((mimePrefix) =>
      normalizedMimeType.startsWith(mimePrefix.toLowerCase()),
    )
  ) {
    return true;
  }

  return false;
}

export function FileViewerSwitch({
  file,
  children,
}: {
  file: FileResponse;
  children: ReactNode;
}) {
  const extension = useMemo(() => getFileExtension(file.name), [file.name]);

  for (const source of Children.toArray(children)) {
    if (!isValidElement(source) || source.type !== FileViewerSource) {
      continue;
    }

    const props = source.props as FileViewerSourceProps;

    if (matchesViewerSource(props, { file, extension })) {
      return props.children(file);
    }
  }

  return (
    <div className={styles.unsupportedStatus}>
      <strong>Preview unavailable</strong>
      <span>
        {extension
          ? `.${extension} files are not supported in the viewer.`
          : "This file type is not supported in the viewer."}
      </span>
      <span className={styles.unsupportedMeta}>{file.mimeType}</span>
    </div>
  );
}
