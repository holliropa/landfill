import { ConversionEntry } from "@/pages/ConversionsPage/ConversionEntry.tsx";
import { FileSelectorDialog } from "@/pages/ConversionsPage/FileSelectorDialog.tsx";
import { Button } from "@/ui/Button";
import { FileIcon, PlusIcon, Shuffle } from "lucide-react";
import { useState } from "react";
import styles from "./ConversionsPage.module.css";

type ConversionSourceFile = {
  id: string;
  name: string;
};

export function ConversionsPage() {
  const [sourceFiles, setSourceFiles] = useState<ConversionSourceFile[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const addSourceFiles = (files: ConversionSourceFile[]) => {
    setSourceFiles((currentFiles) => {
      const filesById = new Map(currentFiles.map((file) => [file.id, file]));

      files.forEach((file) => {
        filesById.set(file.id, file);
      });

      return [...filesById.values()];
    });
  };

  const removeSourceFile = (fileId: string) => {
    setSourceFiles((currentFiles) =>
      currentFiles.filter((file) => file.id !== fileId),
    );
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.title}>
          <Shuffle size={22} />
          <span>Conversions</span>
        </div>
        <Button
          size="small"
          variant="contained"
          startIcon={<PlusIcon size={16} />}
          onClick={() => setIsSelectorOpen(true)}
        >
          Add files
        </Button>
      </div>

      <div className={styles.content}>
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2>Source files</h2>
            <span>{sourceFiles.length} selected</span>
          </div>

          {sourceFiles.length === 0 ? (
            <div className={styles.emptyState}>
              <FileIcon size={28} />
              <strong>No files selected</strong>
              <span>Add files to prepare a conversion.</span>
            </div>
          ) : (
            <div className={styles.selectedList}>
              {sourceFiles.map((sourceFile) => (
                <ConversionEntry
                  id={sourceFile.id}
                  key={sourceFile.id}
                  name={sourceFile.name}
                  onRemove={() => removeSourceFile(sourceFile.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <FileSelectorDialog
        open={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onConfirm={(files) => {
          addSourceFiles(files);
          setIsSelectorOpen(false);
        }}
      />
    </div>
  );
}
