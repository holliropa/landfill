import styles from "./DetailsView.module.css";
import { DetailsShell } from "./DetailsShell";
import { FolderIcon } from "lucide-react";
import { useFolder } from "@/lib/client";
import { DetailsRow } from "./DetailsRow";
import { format } from "date-fns";
import { Button } from "@/ui/Button";
import { useNavigate } from "react-router-dom";
import { paths } from "@/router";

export function FolderDetails({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const { data: folder, isLoading, error } = useFolder(id);

  const handleOpenFolder = () => {
    if (!folder) return;

    navigate(paths.folderPath(folder.parentFolder.id));
  };

  if (isLoading) {
    return <DetailsShell title="Loading..." onClose={onClose} />;
  }

  if (error || !folder) {
    return <DetailsShell title="Folder unavailable" onClose={onClose} />;
  }

  return (
    <DetailsShell title={`${folder.name}`} onClose={onClose}>
      <div className={styles.preview}>
        <FolderIcon
          style={{
            width: "30%",
            height: "30%",
          }}
        />
      </div>
      <dl className={styles.detailsList}>
        <DetailsRow label="Type">Folder</DetailsRow>
        <DetailsRow label="Created">
          {format(folder.createdAt, "dd/MM/yyyy")}
        </DetailsRow>
        <DetailsRow label="Location">
          <Button
            size="small"
            variant="outlined"
            startIcon={<FolderIcon />}
            onClick={handleOpenFolder}
          >
            {folder.parentFolder.name}
          </Button>
        </DetailsRow>
      </dl>
    </DetailsShell>
  );
}
