"use client";

import type { LandingProfile, ProjectCard } from "@mvp/core";
import { useMemo, useState } from "react";

type SaveState = "idle" | "saving" | "saved" | "error" | "published";

interface UseLandingEditorStateOptions {
  draftProfile: LandingProfile | null;
  publishedProfile: LandingProfile;
}

interface LandingEditorState {
  activeProfile: LandingProfile;
  addCard: () => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  errorMessage: string | null;
  hasUnpublishedChanges: boolean;
  moveCard: (cardId: string, direction: -1 | 1) => Promise<void>;
  previewMode: boolean;
  publishDraft: () => Promise<void>;
  reorderCard: (sourceCardId: string, targetCardId: string) => Promise<void>;
  saveCard: (card: ProjectCard) => Promise<void>;
  saveField: (
    field: keyof Omit<LandingProfile, "cards">,
    value: string | null,
  ) => Promise<void>;
  saveState: SaveState;
  togglePreviewMode: () => void;
}

function profilesDiffer(
  draftProfile: LandingProfile | null,
  publishedProfile: LandingProfile,
): boolean {
  return draftProfile
    ? JSON.stringify(draftProfile) !== JSON.stringify(publishedProfile)
    : false;
}

function createEmptyProjectCard(sortOrder: number): ProjectCard {
  return {
    id: crypto.randomUUID(),
    name: "",
    description: "",
    status: "coming_soon",
    url: "",
    isExternal: false,
    isVisible: true,
    sortOrder,
  };
}

export function useLandingEditorState({
  draftProfile,
  publishedProfile,
}: UseLandingEditorStateOptions): LandingEditorState {
  const [draft, setDraft] = useState<LandingProfile | null>(draftProfile);
  const [published, setPublished] = useState<LandingProfile>(publishedProfile);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const activeProfile = useMemo(
    () => (previewMode || !draft ? published : draft),
    [draft, previewMode, published],
  );
  const hasUnpublishedChanges = profilesDiffer(draft, published);

  async function savePatch(patch: Partial<LandingProfile>): Promise<void> {
    if (!draft) {
      return;
    }

    setSaveState("saving");
    setErrorMessage(null);

    const response = await fetch("/api/landing/draft", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      setSaveState("error");
      setErrorMessage("Draft save failed");
      return;
    }

    const nextDraft = (await response.json()) as LandingProfile;
    setDraft(nextDraft);
    setSaveState("saved");
    window.setTimeout(() => setSaveState("idle"), 1_500);
  }

  function updateCards(nextCards: ProjectCard[]): Promise<void> {
    return savePatch({
      cards: nextCards.map((card, index) => ({ ...card, sortOrder: index })),
    });
  }

  async function publishDraft(): Promise<void> {
    if (!draft || !hasUnpublishedChanges) {
      return;
    }

    setSaveState("saving");
    setErrorMessage(null);

    const response = await fetch("/api/landing/publish", { method: "POST" });
    if (!response.ok) {
      setSaveState("error");
      setErrorMessage("Publish failed");
      return;
    }

    setPublished(draft);
    setSaveState("published");
    window.setTimeout(() => setSaveState("idle"), 2_000);
  }

  async function saveField(
    field: keyof Omit<LandingProfile, "cards">,
    value: string | null,
  ): Promise<void> {
    await savePatch({ [field]: value } as Partial<LandingProfile>);
  }

  async function addCard(): Promise<void> {
    await updateCards([
      ...activeProfile.cards,
      createEmptyProjectCard(activeProfile.cards.length),
    ]);
  }

  async function deleteCard(cardId: string): Promise<void> {
    await updateCards(activeProfile.cards.filter((card) => card.id !== cardId));
  }

  async function moveCard(cardId: string, direction: -1 | 1): Promise<void> {
    const cards = [...activeProfile.cards];
    const currentIndex = cards.findIndex((card) => card.id === cardId);
    const nextIndex = currentIndex + direction;

    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= cards.length) {
      return;
    }

    [cards[currentIndex], cards[nextIndex]] = [
      cards[nextIndex],
      cards[currentIndex],
    ];
    await updateCards(cards);
  }

  async function reorderCard(
    sourceCardId: string,
    targetCardId: string,
  ): Promise<void> {
    const cards = [...activeProfile.cards];
    const sourceIndex = cards.findIndex((card) => card.id === sourceCardId);
    const targetIndex = cards.findIndex((card) => card.id === targetCardId);

    if (sourceIndex < 0 || targetIndex < 0) {
      return;
    }

    const [sourceCard] = cards.splice(sourceIndex, 1);
    cards.splice(targetIndex, 0, sourceCard);
    await updateCards(cards);
  }

  async function saveCard(card: ProjectCard): Promise<void> {
    await updateCards(
      activeProfile.cards.map((currentCard) =>
        currentCard.id === card.id ? card : currentCard,
      ),
    );
  }

  return {
    activeProfile,
    addCard,
    deleteCard,
    errorMessage,
    hasUnpublishedChanges,
    moveCard,
    previewMode,
    publishDraft,
    reorderCard,
    saveCard,
    saveField,
    saveState,
    togglePreviewMode: (): void => setPreviewMode((current) => !current),
  };
}
