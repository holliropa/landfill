import type { StoredFile } from "@/types";
import { FileThumbnail } from "@/components/FileThumbnail";

interface FileDetailsProps {
  file: StoredFile;
  onClose: () => void;
}

export function FileDetails({ file, onClose }: FileDetailsProps) {
  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          padding: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <strong style={{ fontSize: "14px" }}>File details</strong>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <div style={{ width: "100%" }}>
        <FileThumbnail fileId={file.id} alt={file.originalName} />
      </div>

      <div style={{ padding: "12px", overflow: "auto" }}>
        <div style={{ display: "grid", gap: "10px" }}>
          <div>
            <div style={{ fontSize: "12px", opacity: 0.7 }}>Name</div>
            <div style={{ wordBreak: "break-word" }}>{file.originalName}</div>
          </div>

          <div>
            <div style={{ fontSize: "12px", opacity: 0.7 }}>Size</div>
            <div>{file.size} bytes</div>
          </div>

          <div>
            <div style={{ fontSize: "12px", opacity: 0.7 }}>Uploaded</div>
            <div>{new Date(file.createdAt).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
