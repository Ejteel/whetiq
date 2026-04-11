"use client";

import type { LandingProfile } from "@mvp/core";
import type { ReactElement } from "react";
import { EditBar } from "./edit-bar";
import { LandingEditorContent } from "./landing-editor-content";
import { useLandingEditorState } from "./landing-editor-state";
import { LandingPageView } from "../view/landing-page-view";

interface LandingPageShellProps {
  draftProfile: LandingProfile | null;
  publishedProfile: LandingProfile;
}

export function LandingPageShell({
  draftProfile,
  publishedProfile,
}: LandingPageShellProps): ReactElement {
  const {
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
    togglePreviewMode,
  } = useLandingEditorState({ draftProfile, publishedProfile });

  return (
    <main className="landing-page">
      <div className="landing-shell">
        <EditBar
          hasUnpublishedChanges={hasUnpublishedChanges}
          isPreviewMode={previewMode}
          saveState={saveState}
          onPublish={publishDraft}
          onTogglePreview={togglePreviewMode}
        />
        {errorMessage ? <p className="edit-bar-error">{errorMessage}</p> : null}
        {previewMode ? (
          <LandingPageView includePageChrome={false} profile={activeProfile} />
        ) : (
          <LandingEditorContent
            profile={activeProfile}
            onAddCard={addCard}
            onDeleteCard={deleteCard}
            onMoveCard={moveCard}
            onReorderCard={reorderCard}
            onSaveCard={saveCard}
            onSaveField={saveField}
          />
        )}
      </div>
    </main>
  );
}
