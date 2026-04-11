import type { ReactElement } from "react";

interface EditBarProps {
  hasUnpublishedChanges: boolean;
  isPreviewMode: boolean;
  saveState: "idle" | "saving" | "saved" | "error" | "published";
  onPublish: () => Promise<void>;
  onTogglePreview: () => void;
}

function getStatusLabel(
  isPreviewMode: boolean,
  hasUnpublishedChanges: boolean,
  saveState: EditBarProps["saveState"],
): string {
  if (saveState === "saving") {
    return "Saving...";
  }

  if (saveState === "saved") {
    return "Saved";
  }

  if (saveState === "published") {
    return "✓ Published";
  }

  if (isPreviewMode && hasUnpublishedChanges) {
    return "PREVIEWING DRAFT AS VISITOR";
  }

  if (isPreviewMode) {
    return "VIEWING PUBLISHED PAGE";
  }

  if (hasUnpublishedChanges) {
    return "UNPUBLISHED CHANGES";
  }

  return "EDITING DRAFT";
}

export function EditBar({
  hasUnpublishedChanges,
  isPreviewMode,
  saveState,
  onPublish,
  onTogglePreview,
}: EditBarProps): ReactElement {
  return (
    <div className="landing-edit-bar">
      <p className="landing-edit-label">
        {getStatusLabel(isPreviewMode, hasUnpublishedChanges, saveState)}
      </p>
      <div className="landing-edit-actions">
        <button
          className="landing-button-ghost"
          type="button"
          onClick={onTogglePreview}
        >
          {isPreviewMode ? "Return to Editing" : "Preview Draft as Visitor"}
        </button>
        <button
          className="landing-button-primary"
          type="button"
          disabled={!hasUnpublishedChanges || saveState === "saving"}
          onClick={() => void onPublish()}
        >
          Publish
        </button>
      </div>
    </div>
  );
}
