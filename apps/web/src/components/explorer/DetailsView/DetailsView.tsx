import { EmptyDetails } from "./EmptyDetails";
import { FileDetails } from "./FileDetails";
import type { SelectionItem } from "./types.ts";
import { SelectionDetails } from "./SelectionDetails";
import { FolderDetails } from "./FolderDetails";

export type DetailsTarget =
  | { type: "none" }
  | { type: "folder"; id: string }
  | { type: "file"; id: string }
  | {
      type: "selection";
      items: Array<SelectionItem>;
    };

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
