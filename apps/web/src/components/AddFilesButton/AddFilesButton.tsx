import styles from "./AddFilesButton.module.css";
import { useRef } from "react";

interface AddFilesButtonProps {
  className?: string;
  onFilesSelected?: (files: File[]) => void;
  children?: React.ReactNode;
}

export function AddFilesButton({
  children,
  onFilesSelected,
  className,
}: AddFilesButtonProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);

    if (selected.length > 0) {
      onFilesSelected?.(selected);
    }

    e.target.value = "";
  };

  return (
    <div className={className}>
      {children}

      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        onChange={handleInputChange}
      />

      <button
        className={styles.button}
        type="button"
        onClick={() => fileInputRef.current?.click()}
      />
    </div>
  );
}
