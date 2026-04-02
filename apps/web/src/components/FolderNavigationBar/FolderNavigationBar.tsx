import React, { useRef } from "react";
import { useCreateFolder, useFolderPath, useUploadFiles } from "@/lib/client";
import { useNavigate } from "react-router-dom";

export type NavigationBarProps = {
  folderId: string;
};

export function FolderNavigationBar({ folderId }: NavigationBarProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { mutateAsync: createFolder } = useCreateFolder();
  const { mutateAsync: uploadFiles } = useUploadFiles();

  const { data: folderPath } = useFolderPath(folderId);

  const handleCreateFolder = async () => {
    const name = window.prompt("Enter folder name:");

    if (!name?.trim()) return;

    await createFolder({
      name: name.trim(),
      parentFolderId: folderId,
    });
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selected = Array.from(e.target.files ?? []);

    if (selected.length > 0) {
      await uploadFiles({
        files: selected,
        parentFolderId: folderId,
      });
    }

    e.target.value = "";
  };

  const handleOpenFolder = (folderId: string) => {
    navigate(`/folder/${folderId}`);
  };

  const breadcrumbs = folderPath?.path ?? [];

  return (
    <>
      {breadcrumbs.map((breadcrumb) => (
        <div key={breadcrumb.id}>
          <span
            style={{ marginRight: "4px", cursor: "pointer" }}
            onClick={() => {
              if (breadcrumb.id !== folderId) handleOpenFolder(breadcrumb.id);
            }}
          >
            {breadcrumb.name}
          </span>
          <span style={{ marginRight: "4px" }}>/</span>
        </div>
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
        <button onClick={() => fileInputRef.current?.click()}>ADD FILES</button>
      </div>

      <input
        ref={fileInputRef}
        hidden
        type="file"
        multiple
        onChange={handleFileInputChange}
      />
    </>
  );
}
