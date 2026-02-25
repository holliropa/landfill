import styles from "./Home.module.css";
import { useEffect, useState } from "react";
import { AddFilesButton } from "@/components/AddFilesButton";
import { PlusIcon } from "lucide-react";
import { FileDetails } from "@/components/FileDetails";
import { FileList } from "@/components/FileList";
import type { StoredFile } from "@/types";

export function Home() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [detailFile, setDetailFile] = useState<StoredFile | null>(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/files")
      .then((res) => res.json())
      .then((data) => setFiles(data))
      .catch((err) => console.error("Failed to fetch file:", err));
  }, []);

  const handleFilesSelected = async (selectedFiles: File[]) => {
    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("files", file));

    try {
      const response = await fetch("http://localhost:3000/api/files", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const uploadedFiles = await response.json();
        console.log("Files uploaded successfully:", uploadedFiles);
        setFiles((prev) => [...prev, ...uploadedFiles]);
      } else {
        console.error("Upload failed:");
      }
    } catch (err) {
      console.error("Error uploading files:", err);
    }
  };

  const handleDeleteFile = async (file: StoredFile) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/files/${file.id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
        if (detailFile?.id === file.id) setDetailFile(null);
      } else {
        console.error("Failed to delete file");
      }
    } catch (err) {
      console.error("Error deleting file:", err);
    }
  };

  const handleShowDetails = (file: StoredFile) => {
    setDetailFile(file);
  };

  const closeDetails = () => {
    setDetailFile(null);
  };

  return (
    <div className={styles.layout}>
      <div className={styles.mainContent}>
        <div className={styles.filesContainer}>
          <FileList
            files={files}
            onShowDetails={handleShowDetails}
            onDelete={handleDeleteFile}
          />
        </div>

        <AddFilesButton
          className={styles.addFilesButton}
          onFilesSelected={handleFilesSelected}
        >
          <div className={styles.addFilesContent}>
            <PlusIcon />
            Add files
          </div>
        </AddFilesButton>
      </div>

      {detailFile && (
        <div className={styles.detailsContainer}>
          <FileDetails file={detailFile} onClose={closeDetails} />
        </div>
      )}
    </div>
  );
}
