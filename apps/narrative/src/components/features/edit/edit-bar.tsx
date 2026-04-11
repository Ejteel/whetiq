"use client";

import type { ReactElement } from "react";

interface EditBarProps {
  isPreviewMode: boolean;
  hasUnpublishedChanges: boolean;
  isProfileEmpty: boolean;
  saveState: "idle" | "saving" | "saved" | "error" | "published";
  errorMessage: string | null;
  onOpenParser: () => void;
  onTogglePreview: () => void;
  onPublish: () => void;
}

function getStatusLabel(
  isPreviewMode: boolean,
  hasUnpublishedChanges: boolean,
  saveState: EditBarProps["saveState"],
): string {
  if (saveState === "saving") {
    return "SAVING...";
  }

  if (saveState === "saved") {
    return "SAVED";
  }

  if (saveState === "published") {
    return "PUBLISHED";
  }

  if (hasUnpublishedChanges) {
    return "UNPUBLISHED CHANGES";
  }

  if (isPreviewMode) {
    return "PREVIEW AS VISITOR";
  }

  return "EDITING DRAFT";
}

export function EditBar({
  isPreviewMode,
  hasUnpublishedChanges,
  isProfileEmpty,
  saveState,
  errorMessage,
  onOpenParser,
  onTogglePreview,
  onPublish,
}: EditBarProps): ReactElement {
  return (
    <div className="edit-bar">
      <div className="edit-bar-status">
        <p className="edit-bar-label">
          {getStatusLabel(isPreviewMode, hasUnpublishedChanges, saveState)}
        </p>
        {errorMessage ? (
          <p className="edit-bar-error" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </div>
      <div className="edit-bar-actions">
        <button
          className={
            isProfileEmpty ? "ghost-button edit-bar-import" : "ghost-button"
          }
          type="button"
          onClick={onOpenParser}
        >
          {isProfileEmpty ? "Import your resume →" : "Re-import resume"}
        </button>
        <button
          className="ghost-button"
          type="button"
          onClick={onTogglePreview}
        >
          {isPreviewMode ? "Return to Draft" : "Preview as Visitor"}
        </button>
        <button
          className="primary-button"
          type="button"
          disabled={!hasUnpublishedChanges || saveState === "saving"}
          onClick={onPublish}
        >
          Publish
        </button>
      </div>
    </div>
  );
}
