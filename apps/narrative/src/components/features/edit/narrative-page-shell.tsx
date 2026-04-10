"use client";

import type { NarrativeProfile, TimelineEntry } from "@mvp/core";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EditBar } from "./edit-bar";
import { ParserOverlay } from "../parser/parser-overlay";
import { AISummaryPanel } from "../hero/ai-summary-panel";
import { HeroIdentity } from "../hero/hero-identity";
import { TimelineSpine } from "../timeline/timeline-spine";

interface NarrativePageShellProps {
  slug: string;
  draftProfile: NarrativeProfile | null;
  publishedProfile: NarrativeProfile;
  editMode: boolean;
  isPreviewMode: boolean;
  initialContextToken: string | null;
}

type SaveState = "idle" | "saving" | "saved" | "error" | "published";

function profilesDiffer(
  draftProfile: NarrativeProfile | null,
  publishedProfile: NarrativeProfile,
): boolean {
  if (!draftProfile) {
    return false;
  }

  return JSON.stringify(draftProfile) !== JSON.stringify(publishedProfile);
}

export function NarrativePageShell({
  slug,
  draftProfile,
  publishedProfile,
  editMode,
  isPreviewMode,
  initialContextToken,
}: NarrativePageShellProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [draft, setDraft] = useState<NarrativeProfile | null>(draftProfile);
  const [published, setPublished] =
    useState<NarrativeProfile>(publishedProfile);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isParserOpen, setIsParserOpen] = useState(false);

  const activeProfile = useMemo(() => {
    if (!editMode || isPreviewMode || !draft) {
      return published;
    }

    return draft;
  }, [draft, editMode, isPreviewMode, published]);

  const hasUnpublishedChanges = profilesDiffer(draft, published);
  const isProfileEmpty = activeProfile.timeline.length === 0;

  async function savePatch(
    patch: Partial<
      Pick<
        NarrativeProfile,
        | "name"
        | "location"
        | "availability"
        | "identityStatements"
        | "summary"
        | "timeline"
      >
    >,
  ): Promise<void> {
    if (!editMode || !draft) {
      return;
    }

    setSaveState("saving");
    setErrorMessage(null);

    const response = await fetch(`/api/profile/${slug}/draft`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      setSaveState("error");
      setErrorMessage("Draft save failed");
      return;
    }

    const nextDraft = (await response.json()) as NarrativeProfile;
    setDraft(nextDraft);
    setSaveState("saved");
    window.setTimeout(() => setSaveState("idle"), 1_500);
  }

  function togglePreviewMode(): void {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (isPreviewMode) {
      nextParams.delete("preview");
    } else {
      nextParams.set("preview", "visitor");
    }

    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    window.history.replaceState(null, "", nextUrl);
    router.refresh();
  }

  async function publishDraft(): Promise<void> {
    if (!editMode || !draft || !hasUnpublishedChanges) {
      return;
    }

    setSaveState("saving");
    setErrorMessage(null);

    const response = await fetch(`/api/profile/${slug}/publish`, {
      method: "POST",
    });

    if (!response.ok) {
      setSaveState("error");
      setErrorMessage("Publish failed");
      return;
    }

    setPublished(draft);
    setSaveState("published");
    window.setTimeout(() => setSaveState("idle"), 2_000);
  }

  function updateTimelineEntry(nextEntry: TimelineEntry): Promise<void> {
    return savePatch({
      timeline:
        draft?.timeline.map((entry) =>
          entry.id === nextEntry.id ? nextEntry : entry,
        ) ?? [],
    });
  }

  return (
    <main className="narrative-page">
      {editMode ? (
        <EditBar
          isPreviewMode={isPreviewMode}
          hasUnpublishedChanges={hasUnpublishedChanges}
          isProfileEmpty={isProfileEmpty}
          saveState={saveState}
          errorMessage={errorMessage}
          onOpenParser={() => setIsParserOpen(true)}
          onTogglePreview={togglePreviewMode}
          onPublish={publishDraft}
        />
      ) : null}
      {editMode && !isPreviewMode ? (
        <ParserOverlay
          slug={slug}
          isOpen={isParserOpen}
          profile={activeProfile}
          onClose={() => setIsParserOpen(false)}
          onApplyPatch={savePatch}
        />
      ) : null}
      <section className="hero-section">
        <HeroIdentity
          profile={activeProfile}
          editMode={editMode && !isPreviewMode}
          onSaveName={(name) => savePatch({ name })}
          onSaveIdentityStatement={(content) =>
            savePatch({
              identityStatements: activeProfile.identityStatements.map(
                (statement) =>
                  statement.isActive ? { ...statement, content } : statement,
              ),
            })
          }
          onSaveLocation={(location) => savePatch({ location })}
          onSaveAvailability={(availability) => savePatch({ availability })}
        />
        <AISummaryPanel
          profile={activeProfile}
          initialContextToken={initialContextToken}
          editMode={editMode && !isPreviewMode}
          onSaveFallbackSummary={(fallback) =>
            savePatch({
              summary: {
                ...activeProfile.summary,
                fallback,
              },
            })
          }
        />
      </section>
      <TimelineSpine
        profile={activeProfile}
        editMode={editMode && !isPreviewMode}
        onSaveEntry={updateTimelineEntry}
      />
    </main>
  );
}
