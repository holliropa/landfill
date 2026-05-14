import styles from "./DetailsView.module.css";
import { DetailsShell } from "./DetailsShell";
import { FileThumbnail } from "@/components/FileThumbnail";
import { useFile } from "@/lib/client";
import { DetailsRow } from "./DetailsRow";
import { formatSize } from "@/utils";
import { format } from "date-fns";
import { FolderIcon } from "lucide-react";
import { Button } from "@/ui/Button";
import { useFolderNavigation } from "@/hooks/useFolderNavigation";

export function FileDetails({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const openFolder = useFolderNavigation();
  const { data: fileData, isLoading, error } = useFile(id);

  const handleOpenFolder = () => {
    if (!fileData) return;

    openFolder(fileData.folder);
  };

  if (isLoading) {
    return <DetailsShell title="Loading..." onClose={onClose} />;
  }

  if (error || !fileData) {
    return <DetailsShell title="Error unavailable" onClose={onClose} />;
  }

  return (
    <DetailsShell title={`${fileData.name}`} onClose={onClose}>
      <div className={styles.preview}>
        <FileThumbnail fileId={id} alt={`${fileData.name}`} />
      </div>
      <dl className={styles.detailsList}>
        <DetailsRow label="Type">Folder</DetailsRow>
        <DetailsRow label="Size">{formatSize(fileData.sizeBytes)}</DetailsRow>
        <DetailsRow label="Location">
          <Button
            size="small"
            variant="outlined"
            startIcon={<FolderIcon />}
            onClick={handleOpenFolder}
          >
            {fileData.folder.name}
          </Button>
        </DetailsRow>
        <DetailsRow label="Created">
          {format(fileData.createdAt, "dd/MM/yyyy")}
        </DetailsRow>
      </dl>
    </DetailsShell>
  );
}
