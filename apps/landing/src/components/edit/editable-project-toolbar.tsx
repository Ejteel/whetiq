"use client";

import type { ReactElement } from "react";

interface EditableProjectToolbarProps {
  isVisible: boolean;
  onDelete: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onToggleVisibility: () => void;
}

export function EditableProjectToolbar({
  isVisible,
  onDelete,
  onMoveDown,
  onMoveUp,
  onToggleVisibility,
}: EditableProjectToolbarProps): ReactElement {
  return (
    <div className="landing-card-edit-toolbar">
      <div className="landing-edit-actions">
        <span className="landing-card-handle" aria-hidden="true">
          ⠿
        </span>
        <button
          className="landing-icon-button"
          type="button"
          aria-label="Move card earlier"
          onClick={onMoveUp}
        >
          ↑
        </button>
        <button
          className="landing-icon-button"
          type="button"
          aria-label="Move card later"
          onClick={onMoveDown}
        >
          ↓
        </button>
      </div>
      <div className="landing-edit-actions">
        <button
          className="landing-icon-button"
          type="button"
          aria-label={
            isVisible ? "Hide card from visitors" : "Show card to visitors"
          }
          onClick={onToggleVisibility}
        >
          {isVisible ? "◐" : "◌"}
        </button>
        <button
          className="landing-icon-button"
          type="button"
          aria-label="Delete card"
          onClick={onDelete}
        >
          🗑
        </button>
      </div>
    </div>
  );
}
