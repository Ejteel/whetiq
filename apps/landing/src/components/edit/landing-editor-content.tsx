"use client";

import type { LandingProfile, ProjectCard } from "@mvp/core";
import type { ReactElement } from "react";
import { EditableIdentityBlock } from "./editable-identity-block";
import { EditableProjectGrid } from "./editable-project-grid";
import { LandingFooter } from "../view/landing-footer";

interface LandingEditorContentProps {
  profile: LandingProfile;
  onAddCard: () => Promise<void>;
  onDeleteCard: (cardId: string) => Promise<void>;
  onMoveCard: (cardId: string, direction: -1 | 1) => Promise<void>;
  onReorderCard: (sourceCardId: string, targetCardId: string) => Promise<void>;
  onSaveCard: (card: ProjectCard) => Promise<void>;
  onSaveField: (
    field: keyof Omit<LandingProfile, "cards">,
    value: string | null,
  ) => Promise<void>;
}

export function LandingEditorContent({
  profile,
  onAddCard,
  onDeleteCard,
  onMoveCard,
  onReorderCard,
  onSaveCard,
  onSaveField,
}: LandingEditorContentProps): ReactElement {
  return (
    <>
      <EditableIdentityBlock profile={profile} onSaveField={onSaveField} />
      <EditableProjectGrid
        cards={profile.cards}
        onAddCard={onAddCard}
        onDeleteCard={onDeleteCard}
        onMoveCard={onMoveCard}
        onReorderCard={onReorderCard}
        onSaveCard={onSaveCard}
      />
      <LandingFooter email={profile.email} name={profile.name} />
    </>
  );
}
