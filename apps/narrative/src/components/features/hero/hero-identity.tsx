"use client";

import type { NarrativeProfile } from "@mvp/core";
import type { ReactElement } from "react";
import { useState } from "react";
import { ScrollCue } from "./scroll-cue";

interface HeroIdentityProps {
  profile: NarrativeProfile;
  editMode: boolean;
  onSaveName: (value: string) => Promise<void>;
  onSaveIdentityStatement: (value: string) => Promise<void>;
  onSaveLocation: (value: string) => Promise<void>;
  onSaveAvailability: (value: string) => Promise<void>;
}

interface EditableTextProps {
  value: string;
  className: string;
  editMode: boolean;
  multiline?: boolean;
  onSave: (value: string) => Promise<void>;
}

function EditableText({
  value,
  className,
  editMode,
  multiline = false,
  onSave,
}: EditableTextProps): ReactElement {
  const [draftValue, setDraftValue] = useState(value);

  if (!editMode) {
    return multiline ? (
      <p className={className}>{value}</p>
    ) : (
      <span className={className}>{value}</span>
    );
  }

  if (multiline) {
    return (
      <textarea
        className={`${className} inline-textarea`}
        defaultValue={draftValue}
        maxLength={400}
        onBlur={async (event): Promise<void> => {
          const nextValue = event.currentTarget.value.trim();
          setDraftValue(nextValue);
          if (nextValue !== value && nextValue.length > 0) {
            await onSave(nextValue);
          }
        }}
        onChange={(event): void => setDraftValue(event.currentTarget.value)}
      />
    );
  }

  return (
    <input
      className={`${className} inline-input`}
      defaultValue={draftValue}
      onBlur={async (event): Promise<void> => {
        const nextValue = event.currentTarget.value.trim();
        setDraftValue(nextValue);
        if (nextValue !== value && nextValue.length > 0) {
          await onSave(nextValue);
        }
      }}
      onChange={(event): void => setDraftValue(event.currentTarget.value)}
    />
  );
}

export function HeroIdentity({
  profile,
  editMode,
  onSaveName,
  onSaveIdentityStatement,
  onSaveLocation,
  onSaveAvailability,
}: HeroIdentityProps): ReactElement {
  const activeStatement =
    profile.identityStatements.find((statement) => statement.isActive) ?? null;

  return (
    <section className="hero-identity">
      <div className="hero-copy">
        <p className="hero-kicker">Career narrative</p>
        {editMode ? (
          <EditableText
            value={profile.name}
            className="hero-name"
            editMode
            onSave={onSaveName}
          />
        ) : (
          <h1 className="hero-name">{profile.name}</h1>
        )}
        {activeStatement ? (
          <EditableText
            value={activeStatement.content}
            className="hero-identity-statement"
            editMode={editMode}
            multiline
            onSave={onSaveIdentityStatement}
          />
        ) : null}
        <p className="hero-meta">
          <EditableText
            value={profile.location}
            className="hero-meta-value"
            editMode={editMode}
            onSave={onSaveLocation}
          />
          <span className="hero-meta-dot" aria-hidden="true">
            •
          </span>
          <EditableText
            value={profile.availability}
            className="hero-meta-value"
            editMode={editMode}
            onSave={onSaveAvailability}
          />
        </p>
      </div>
      <ScrollCue />
    </section>
  );
}
