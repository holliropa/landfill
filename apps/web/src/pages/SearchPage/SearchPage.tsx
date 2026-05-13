import { Navigate, useSearchParams } from "react-router-dom";
import { useStorageSearch } from "@/lib/client";
import { useMemo } from "react";
import { Explorer, type ExplorerItem } from "@/components/Explorer";
import { FolderIcon } from "lucide-react";
import { FileThumbnail } from "@/components/FileThumbnail";

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();

  const { data: searchResult, isLoading, error } = useStorageSearch(query);

  const items = useMemo<ExplorerItem[]>(() => {
    if (isLoading || error || !searchResult) return [];

    return searchResult.items.map((item) => ({
      key: `${item.kind}:${item.id}`,
      id: item.id,
      kind: item.kind,
      name: item.name,
      createdAt: item.createdAt,
      size: item.size,
      location: item.location,
      ThumbnailComponent:
        item.kind === "folder" ? (
          <FolderIcon />
        ) : (
          <FileThumbnail fileId={item.id} alt={item.name} />
        ),
    }));
  }, [error, isLoading, searchResult]);

  if (!query) {
    return <Navigate to="/" replace />;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        flex: 1,
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          flex: "0 0 auto",
          padding: "8px 16px",
          borderBottom: "2px solid var(--divider)",
          userSelect: "none",
        }}
      >
        <span
          style={{
            fontSize: "20px",
          }}
        >
          Search results
        </span>
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
        <Explorer items={items} />
      </div>
    </div>
  );
}
