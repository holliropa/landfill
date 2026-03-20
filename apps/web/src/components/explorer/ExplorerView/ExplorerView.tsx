import { ExplorerList, type ExplorerListProps } from "../ExplorerList";
import React, { useRef } from "react";

type ExplorerViewProps = ExplorerListProps & {
  folderId: string;
  breadcrumbs: { key: string; name: string }[];
  onFilesSelected: (file: File[]) => void;
  onCreateFolder: (name: string) => void;
  onOpenFolder: (folderId: string) => void;
};

export function ExplorerView({
  folderId,
  breadcrumbs,
  onFilesSelected,
  onCreateFolder,
  onOpenFolder,
  ...explorerListProps
}: ExplorerViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCreateFolder = async () => {
    const name = window.prompt("Enter folder name:");

    if (!name?.trim()) return;

    onCreateFolder(name);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);

    if (selected.length > 0) {
      onFilesSelected?.(selected);
    }

    e.target.value = "";
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        flex: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flex: "0 0 auto",
          padding: "8px 12px",
          borderBottom: "1px solid #d0d0d0",
          userSelect: "none",
        }}
      >
        {breadcrumbs.map((breadcrumb) => (
          <>
            <span
              key={breadcrumb.key}
              style={{ marginRight: "4px", cursor: "pointer" }}
              onClick={() => {
                if (breadcrumb.key !== folderId) onOpenFolder(breadcrumb.key);
              }}
            >
              {breadcrumb.name}
            </span>
            <span style={{ marginRight: "4px" }}>/</span>
          </>
        ))}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            flex: "1 1 auto",
            justifyContent: "flex-end",
            gap: "8px",
          }}
        >
          <button onClick={handleCreateFolder}>CREATE FOLDER</button>
          <button onClick={() => fileInputRef.current?.click()}>
            ADD FILES
          </button>
        </div>
      </div>
      <div
        style={{
          flex: "1 1 auto",
          minHeight: 0,
          minWidth: 0,
          overflow: "auto",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <ExplorerList {...explorerListProps} />
      </div>

      <input
        ref={fileInputRef}
        hidden
        type="file"
        multiple
        onChange={handleFileInputChange}
      />
    </div>
  );
}
