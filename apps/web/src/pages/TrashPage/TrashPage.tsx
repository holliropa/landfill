import { FileThumbnail } from "@/components/FileThumbnail";
import type { ExplorerItem } from "@/features/explorer";
import { useEmptyTrash, useTrashContent } from "@/lib/client";
import { useDialog } from "@/providers";
import { Button } from "@/ui/Button";
import { FolderIcon, Trash2Icon, TrashIcon } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import styles from "./TrashPage.module.css";
import { TrashExplorer } from "./TrashExplorer";

export function TrashPage() {
  const dialog = useDialog();
  const { data, isLoading, isError } = useTrashContent();
  const emptyTrash = useEmptyTrash();

  const items = useMemo<ExplorerItem[]>(
    () =>
      (data?.items ?? []).map((item) => ({
        key: `${item.kind}-${item.id}`,
        kind: item.kind,
        id: item.id,
        name: item.name,
        createdAt: item.createdAt,
        size: item.size,
        location: item.location,
        ThumbnailComponent:
          item.kind === "file" ? (
            <FileThumbnail
              fileId={item.id}
              alt={item.name}
              mimeType={item.mimeType}
            />
          ) : (
            <FolderIcon size={18} />
          ),
      })),
    [data],
  );

  const handleEmptyTrash = async () => {
    if (items.length === 0) return;

    const confirmed = await dialog.confirm({
      title: "Empty trash?",
      destructive: true,
      description: `Permanently delete ${items.length} item${items.length === 1 ? "" : "s"} from trash? This cannot be undone.`,
      confirmLabel: "Empty trash",
    });

    if (!confirmed) return;

    toast.promise(emptyTrash.mutateAsync(), {
      loading: "Emptying trash",
      success: "Trash emptied",
      error: "Failed to empty trash",
      duration: 1500,
    });
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.title}>
          <TrashIcon size={22} />
          <span>Trash</span>
          {!isLoading && !isError && (
            <span className={styles.count}>{items.length} items</span>
          )}
        </div>

        <div className={styles.actions}>
          <Button
            variant="danger"
            size="small"
            startIcon={<Trash2Icon size={16} />}
            onClick={() => {
              void handleEmptyTrash();
            }}
            disabled={items.length === 0 || emptyTrash.isPending}
          >
            Empty trash
          </Button>
        </div>
      </div>

      <div className={styles.content}>
        <TrashExplorer items={items} isLoading={isLoading} isError={isError} />
      </div>
    </div>
  );
}
