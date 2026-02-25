import { FileCard } from "@/components/FileCard";
import { useState } from "react";
import type { StoredFile } from "@/types";

interface FileListProps {
  files: StoredFile[];
  onShowDetails?: (file: StoredFile) => void;
  onDelete?: (file: StoredFile) => void;
}

export function FileList({ files, onShowDetails, onDelete }: FileListProps) {
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);

  return (
    <div
      style={{
        display: "grid",
        gap: "15px",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        padding: "15px",
      }}
    >
      {files.map((file) => {
        const key = `${file.id}`;

        return (
          <FileCard
            key={key}
            file={file}
            onDelete={onDelete}
            onDetails={onShowDetails}
            menuOpen={openMenuKey === key}
            onToggleMenu={() =>
              setOpenMenuKey(openMenuKey === key ? null : key)
            }
            onCloseMenu={() => setOpenMenuKey(null)}
          />
        );
      })}
    </div>
  );
}
