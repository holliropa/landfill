import type { ReactNode } from "react";
import { StorageFileDetails } from "./StorageFileDetails";
import { StorageFolderDetails } from "./StorageFolderDetails";
import { StorageSelectionDetails } from "./StorageSelectionDetails";
import {
  StorageEmptyDetails,
  StorageErrorDetails,
  StorageLoadingDetails,
} from "./StorageDetailsStates";
import type { StorageDetailsModel } from "./storageDetailsModel";
import type { StorageDetailsTarget } from "./storageDetailsTarget";
import { useStorageDetails } from "./useStorageDetails";

export type StorageDetailsViewProps = {
  target: StorageDetailsTarget;
  onClose: () => void;
  titleId?: string;
  actions?: ReactNode;
};

export function StorageDetailsView({
  target,
  onClose,
  titleId,
  actions,
}: StorageDetailsViewProps) {
  const details = useStorageDetails(target);

  return (
    <StorageDetailsContent
      key={target.key}
      details={details}
      onClose={onClose}
      titleId={titleId}
      actions={actions}
    />
  );
}

export function StorageDetailsContent({
  details,
  onClose,
  titleId,
  actions,
}: {
  details: StorageDetailsModel;
  onClose: () => void;
  titleId?: string;
  actions?: ReactNode;
}) {
  if (details.status === "empty") {
    return <StorageEmptyDetails onClose={onClose} titleId={titleId} />;
  }

  if (details.status === "loading") {
    return (
      <StorageLoadingDetails
        details={details}
        onClose={onClose}
        titleId={titleId}
        actions={actions}
      />
    );
  }

  if (details.status === "error") {
    return (
      <StorageErrorDetails
        details={details}
        onClose={onClose}
        titleId={titleId}
        actions={actions}
      />
    );
  }

  switch (details.kind) {
    case "file":
      return (
        <StorageFileDetails
          details={details}
          onClose={onClose}
          titleId={titleId}
          actions={actions}
        />
      );
    case "folder":
      return (
        <StorageFolderDetails
          details={details}
          onClose={onClose}
          titleId={titleId}
          actions={actions}
        />
      );
    case "selection":
      return (
        <StorageSelectionDetails
          details={details}
          onClose={onClose}
          titleId={titleId}
          actions={actions}
        />
      );
  }
}
