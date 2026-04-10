import type { ReactElement } from "react";

interface EditBarProps {
  isPreviewMode: boolean;
}

export function EditBar({ isPreviewMode }: EditBarProps): ReactElement {
  return (
    <div className="edit-bar">
      <p className="edit-bar-label">
        {isPreviewMode ? "PREVIEW AS VISITOR" : "EDITING DRAFT"}
      </p>
      <div className="edit-bar-actions">
        <button className="ghost-button" type="button">
          Preview as Visitor
        </button>
        <button className="primary-button" type="button" disabled>
          Publish
        </button>
      </div>
    </div>
  );
}
