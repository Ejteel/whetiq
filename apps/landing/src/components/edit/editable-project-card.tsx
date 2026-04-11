"use client";

import type { ProjectCard } from "@mvp/core";
import type { DragEvent, ReactElement } from "react";
import { useState } from "react";
import { EditableProjectToolbar } from "./editable-project-toolbar";

interface EditableProjectCardProps {
  card: ProjectCard;
  onDelete: (cardId: string) => Promise<void>;
  onDragStart: (cardId: string) => void;
  onDrop: (cardId: string) => Promise<void>;
  onMove: (cardId: string, direction: -1 | 1) => Promise<void>;
  onSave: (card: ProjectCard) => Promise<void>;
}

export function EditableProjectCard({
  card,
  onDelete,
  onDragStart,
  onDrop,
  onMove,
  onSave,
}: EditableProjectCardProps): ReactElement {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  function handleDrop(event: DragEvent<HTMLElement>): Promise<void> {
    event.preventDefault();
    return onDrop(card.id);
  }

  return (
    <article
      className={`landing-card landing-card-edit ${card.isVisible ? "" : "landing-card-hidden"}`}
      draggable
      onDragOver={(event) => event.preventDefault()}
      onDragStart={() => onDragStart(card.id)}
      onDrop={(event) => void handleDrop(event)}
    >
      <EditableProjectToolbar
        isVisible={card.isVisible}
        onDelete={() => setIsConfirmingDelete(true)}
        onMoveDown={() => void onMove(card.id, 1)}
        onMoveUp={() => void onMove(card.id, -1)}
        onToggleVisibility={() =>
          void onSave({ ...card, isVisible: !card.isVisible })
        }
      />
      {isConfirmingDelete ? (
        <div className="landing-delete-confirmation">
          <p>Delete this card? This cannot be undone.</p>
          <div className="landing-edit-actions">
            <button
              className="landing-button-primary"
              type="button"
              onClick={() => void onDelete(card.id)}
            >
              Delete
            </button>
            <button
              className="landing-button-ghost"
              type="button"
              onClick={() => setIsConfirmingDelete(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
      <input
        className="landing-inline-input landing-card-title"
        defaultValue={card.name}
        maxLength={60}
        placeholder="Project name"
        onBlur={async (event): Promise<void> => {
          await onSave({ ...card, name: event.currentTarget.value.trim() });
        }}
      />
      <textarea
        className="landing-inline-textarea landing-card-description"
        defaultValue={card.description}
        maxLength={120}
        placeholder="Short project description"
        onBlur={async (event): Promise<void> => {
          await onSave({
            ...card,
            description: event.currentTarget.value.trim(),
          });
        }}
      />
      <input
        className="landing-inline-input"
        defaultValue={card.url}
        placeholder="/narrative or https://..."
        onBlur={async (event): Promise<void> => {
          await onSave({ ...card, url: event.currentTarget.value.trim() });
        }}
      />
      <select
        className="landing-inline-select"
        defaultValue={card.status}
        onChange={async (event): Promise<void> => {
          await onSave({
            ...card,
            status: event.currentTarget.value as ProjectCard["status"],
          });
        }}
      >
        <option value="live">Live</option>
        <option value="in_development">In Development</option>
        <option value="coming_soon">Coming Soon</option>
      </select>
      <label className="landing-contact-item">
        <input
          checked={card.isExternal}
          type="checkbox"
          onChange={async (event): Promise<void> => {
            await onSave({ ...card, isExternal: event.currentTarget.checked });
          }}
        />
        <span>Open externally</span>
      </label>
    </article>
  );
}
