import { getFileRawUrl } from "@/lib/client";
import type { FileResponse } from "@/lib/client/api";
import { IconButton } from "@/ui/IconButton";
import {
  Maximize2Icon,
  RotateCwIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { useState } from "react";
import styles from "./FileViewer.module.css";

export function ImageViewer({ file }: { file: FileResponse }) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div className={styles.imageViewerWrapper}>
      <div className={styles.imageCanvas}>
        <img
          className={styles.media}
          src={getFileRawUrl(file.id)}
          alt={file.name}
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transition: "transform 0.15s ease-out",
          }}
        />
      </div>

      <div className={styles.viewerControlsOverlay}>
        <IconButton
          icon={<ZoomOutIcon size={16} />}
          variant="ghost"
          size="medium"
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          title="Zoom out"
          aria-label="Zoom out"
        />
        <button
          type="button"
          className={styles.zoomLevelBadge}
          onClick={handleResetZoom}
          title="Reset zoom & rotation"
        >
          {Math.round(zoom * 100)}%
        </button>
        <IconButton
          icon={<ZoomInIcon size={16} />}
          variant="ghost"
          size="medium"
          onClick={handleZoomIn}
          disabled={zoom >= 4}
          title="Zoom in"
          aria-label="Zoom in"
        />
        <IconButton
          icon={<RotateCwIcon size={16} />}
          variant="ghost"
          size="medium"
          onClick={handleRotate}
          title="Rotate 90°"
          aria-label="Rotate 90°"
        />
        {(zoom !== 1 || rotation !== 0) && (
          <IconButton
            icon={<Maximize2Icon size={16} />}
            variant="ghost"
            size="medium"
            onClick={handleResetZoom}
            title="Reset"
            aria-label="Reset"
          />
        )}
      </div>
    </div>
  );
}
