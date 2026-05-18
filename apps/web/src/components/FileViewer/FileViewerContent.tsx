import { AudioViewer } from "./AudioViewer";
import { FileViewerSource } from "./FileViewerSource";
import { FileViewerSwitch } from "./FileViewerSwitch";
import { ImageViewer } from "./ImageViewer";
import { PdfViewer } from "./PdfViewer";
import { VideoViewer } from "./VideoViewer";
import type { FileResponse } from "@/lib/client/api";

export function FileViewerContent({ file }: { file: FileResponse }) {
  return (
    <FileViewerSwitch file={file}>
      <FileViewerSource
        extensions={[
          "avif",
          "bmp",
          "gif",
          "ico",
          "jpeg",
          "jpg",
          "png",
          "svg",
          "webp",
        ]}
        mimePrefixes={["image/"]}
      >
        {(matchedFile) => <ImageViewer file={matchedFile} />}
      </FileViewerSource>
      <FileViewerSource
        extensions={["mp4", "m4v", "mov", "ogg", "ogv", "webm", "ts"]}
        mimePrefixes={["video/"]}
      >
        {(matchedFile) => <VideoViewer file={matchedFile} />}
      </FileViewerSource>
      <FileViewerSource
        extensions={["pdf"]}
        mimeTypes={["application/pdf", "application/x-pdf"]}
      >
        {(matchedFile) => <PdfViewer file={matchedFile} />}
      </FileViewerSource>
      <FileViewerSource
        extensions={["aac", "flac", "m4a", "mp3", "oga", "ogg", "wav"]}
        mimePrefixes={["audio/"]}
      >
        {(matchedFile) => <AudioViewer file={matchedFile} />}
      </FileViewerSource>
    </FileViewerSwitch>
  );
}
