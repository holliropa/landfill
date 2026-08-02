import { useConversionTargets, useCreateConversion } from "@/lib/client";
import { Button } from "@/ui/Button";
import { IconButton } from "@/ui/IconButton";
import { FileIcon, XIcon } from "lucide-react";
import { useState } from "react";
import styles from "./ConversionsPage.module.css";

type ConversionEntryProps = {
  id: string;
  name: string;
  onRemove: () => void;
};

export function ConversionEntry({ id, name, onRemove }: ConversionEntryProps) {
  const [selectedFormat, setSelectedFormat] = useState<string>("");
  const [conversionJob, setConversionJob] = useState<string | null>(null);
  const { data: conversionTargets, isLoading } = useConversionTargets(id);
  const { mutateAsync } = useCreateConversion();

  const targetOptions = conversionTargets?.targets.map((target) => ({
    key: target.format,
    label: target.label,
  }));

  const handleConversion = async () => {
    if (!selectedFormat.trim()) return;
    const conversionJobResponse = await mutateAsync({
      source: {
        kind: "file",
        id,
      },
      target: {
        format: selectedFormat,
      },
    });
    setConversionJob(conversionJobResponse.id);
  };

  return (
    <div className={styles.selectedRow}>
      <FileIcon size={18} />
      <span title={name}>{name}</span>
      <select
        value={selectedFormat}
        disabled={isLoading || !targetOptions?.length}
        onChange={(event) => setSelectedFormat(event.currentTarget.value)}
      >
        {targetOptions?.map((option) => (
          <option key={option.key} value={option.key}>
            {option.label}
          </option>
        ))}
      </select>
      <Button size="small" variant="contained" onClick={handleConversion}>
        Convert
      </Button>
      <IconButton
        size="small"
        variant="ghost"
        icon={<XIcon size={16} />}
        aria-label={`Remove ${name}`}
        title="Remove"
        onClick={onRemove}
      />
    </div>
  );
}
