"use client";

import type { ProjectCard } from "@mvp/core";
import type { ReactElement } from "react";
import { useState } from "react";
import { EditableProjectCard } from "./editable-project-card";

interface EditableProjectGridProps {
  cards: ProjectCard[];
  onAddCard: () => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onMoveCard: (cardId: string, direction: -1 | 1) => Promise<void>;
  onReorderCard: (sourceCardId: string, targetCardId: string) => Promise<void>;
  onSaveCard: (card: ProjectCard) => Promise<void>;
}

export function EditableProjectGrid({
  cards,
  onAddCard,
  onDeleteCard,
  onMoveCard,
  onReorderCard,
  onSaveCard,
}: EditableProjectGridProps): ReactElement {
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null);

  const sortedCards = [...cards].sort(
    (left, right) => left.sortOrder - right.sortOrder,
  );

  return (
    <>
      <section className="landing-cards" aria-label="Projects">
        {sortedCards.map((card) => (
          <EditableProjectCard
            key={card.id}
            card={card}
            onDelete={onDeleteCard}
            onDragStart={setDraggedCardId}
            onDrop={async (targetCardId) => {
              if (!draggedCardId || draggedCardId === targetCardId) {
                return;
              }

              await onReorderCard(draggedCardId, targetCardId);
              setDraggedCardId(null);
            }}
            onMove={onMoveCard}
            onSave={onSaveCard}
          />
        ))}
      </section>
      <div className="landing-add-card">
        <button
          className="landing-button-ghost"
          type="button"
          onClick={() => void onAddCard()}
        >
          + Add Project
        </button>
      </div>
    </>
  );
}
