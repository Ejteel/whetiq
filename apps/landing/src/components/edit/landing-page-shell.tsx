"use client";

import type { LandingProfile, ProjectCard } from "@mvp/core";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { EditBar } from "./edit-bar";
import { EditableIdentityBlock } from "./editable-identity-block";
import { EditableProjectGrid } from "./editable-project-grid";
import { LandingPageView } from "../view/landing-page-view";
import { LandingFooter } from "../view/landing-footer";

interface LandingPageShellProps {
  draftProfile: LandingProfile | null;
  publishedProfile: LandingProfile;
}

type SaveState = "idle" | "saving" | "saved" | "error" | "published";

function profilesDiffer(
  draftProfile: LandingProfile | null,
  publishedProfile: LandingProfile,
): boolean {
  return draftProfile
    ? JSON.stringify(draftProfile) !== JSON.stringify(publishedProfile)
    : false;
}

export function LandingPageShell({
  draftProfile,
  publishedProfile,
}: LandingPageShellProps): ReactElement {
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
    switch (field) {
      case "name":
        await savePatch({ name: value ?? "" });
        return;
      case "headline":
        await savePatch({ headline: value });
        return;
      case "about":
        await savePatch({ about: value });
        return;
      case "email":
        await savePatch({ email: value });
        return;
      case "phone":
        await savePatch({ phone: value });
        return;
      case "linkedin":
        await savePatch({ linkedin: value });
        return;
      case "location":
        await savePatch({ location: value });
        return;
    }
  }

  function updateCards(nextCards: ProjectCard[]): Promise<void> {
    return savePatch({
      cards: nextCards.map((card, index) => ({ ...card, sortOrder: index })),
    });
  }

  return (
    <main className="landing-page">
      <div className="landing-shell">
        <EditBar
          hasUnpublishedChanges={hasUnpublishedChanges}
          isPreviewMode={previewMode}
          saveState={saveState}
          onPublish={publishDraft}
          onTogglePreview={() => setPreviewMode((current) => !current)}
        />
        {errorMessage ? <p className="edit-bar-error">{errorMessage}</p> : null}
        {previewMode ? (
          <LandingPageView includePageChrome={false} profile={activeProfile} />
        ) : (
          <>
            <EditableIdentityBlock
              profile={activeProfile}
              onSaveField={saveField}
            />
            <EditableProjectGrid
              cards={activeProfile.cards}
              onAddCard={async () => {
                await updateCards([
                  ...activeProfile.cards,
                  {
                    id: crypto.randomUUID(),
                    name: "",
                    description: "",
                    status: "coming_soon",
                    url: "",
                    isExternal: false,
                    isVisible: true,
                    sortOrder: activeProfile.cards.length,
                  },
                ]);
              }}
              onDeleteCard={async (cardId) => {
                await updateCards(
                  activeProfile.cards.filter((card) => card.id !== cardId),
                );
              }}
              onMoveCard={async (cardId, direction) => {
                const cards = [...activeProfile.cards];
                const currentIndex = cards.findIndex(
                  (card) => card.id === cardId,
                );
                const nextIndex = currentIndex + direction;

                if (
                  currentIndex < 0 ||
                  nextIndex < 0 ||
                  nextIndex >= cards.length
                ) {
                  return;
                }

                const currentCard = cards[currentIndex];
                const nextCard = cards[nextIndex];
                [cards[currentIndex], cards[nextIndex]] = [
                  nextCard,
                  currentCard,
                ];
                await updateCards(cards);
              }}
              onReorderCard={async (sourceCardId, targetCardId) => {
                const cards = [...activeProfile.cards];
                const sourceIndex = cards.findIndex(
                  (card) => card.id === sourceCardId,
                );
                const targetIndex = cards.findIndex(
                  (card) => card.id === targetCardId,
                );
                if (sourceIndex < 0 || targetIndex < 0) {
                  return;
                }

                const sourceCard = cards[sourceIndex];
                cards.splice(sourceIndex, 1);
                cards.splice(targetIndex, 0, sourceCard);
                await updateCards(cards);
              }}
              onSaveCard={async (card) => {
                await updateCards(
                  activeProfile.cards.map((currentCard) =>
                    currentCard.id === card.id ? card : currentCard,
                  ),
                );
              }}
            />
            <LandingFooter
              email={activeProfile.email}
              name={activeProfile.name}
            />
          </>
        )}
      </div>
    </main>
  );
}
