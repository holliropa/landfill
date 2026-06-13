import type { DetailsTarget } from "@/features/explorer/details";
import { EmptyDetails } from "./EmptyDetails";
import { FileDetails } from "./FileDetails";
import { FolderDetails } from "./FolderDetails";
import { SelectionDetails } from "./SelectionDetails";

export type DetailsViewProps = {
  target: DetailsTarget;
  onClose: () => void;
};

export function DetailsView({ target, onClose }: DetailsViewProps) {
  switch (target.type) {
    case "none":
      return <EmptyDetails onClose={onClose} />;
    case "file":
      return <FileDetails id={target.id} onClose={onClose} />;
    case "folder":
      return <FolderDetails id={target.id} onClose={onClose} />;
    case "selection":
      return (
        <SelectionDetails selectionItems={target.items} onClose={onClose} />
      );
    default:
      return null;
  }
}

