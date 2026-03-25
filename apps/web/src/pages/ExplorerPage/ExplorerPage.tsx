import { Explorer } from "@/components/Explorer";
import { useParams } from "react-router-dom";

export function ExplorerPage() {
  const { folderId } = useParams<{ folderId?: string }>();

  return <Explorer folderId={folderId ?? "root"} />;
}
