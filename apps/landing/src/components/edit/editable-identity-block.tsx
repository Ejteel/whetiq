"use client";

import type { LandingProfile } from "@mvp/core";
import type { ReactElement } from "react";
import { useState } from "react";

type ContactField = keyof Pick<
  LandingProfile,
  "email" | "phone" | "linkedin" | "location"
>;
type EditableIdentityField = keyof Omit<LandingProfile, "cards">;

interface EditableIdentityBlockProps {
  profile: LandingProfile;
  onSaveField: <TField extends EditableIdentityField>(
    field: TField,
    value: LandingProfile[TField],
  ) => Promise<void>;
}

const CONTACT_FIELDS: readonly {
  field: ContactField;
  label: string;
  placeholder: string;
  icon: string;
  maxLength?: number;
}[] = [
  { field: "email", label: "Email", placeholder: "Add email", icon: "✉" },
  { field: "phone", label: "Phone", placeholder: "Add phone", icon: "☎" },
  {
    field: "linkedin",
    label: "LinkedIn",
    placeholder: "Add LinkedIn",
    icon: "in",
  },
  {
    field: "location",
    label: "Location",
    placeholder: "Add location",
    icon: "⌖",
    maxLength: 60,
  },
];

function Counter({
  current,
  max,
}: {
  current: number;
  max: number;
}): ReactElement {
  return (
    <span className="landing-field-counter">
      {current}/{max}
    </span>
  );
}

export function EditableIdentityBlock({
  profile,
  onSaveField,
}: EditableIdentityBlockProps): ReactElement {
  const [focusedField, setFocusedField] =
    useState<EditableIdentityField | null>(null);

  return (
    <section className="landing-identity">
      <div className="landing-editable-field">
        <input
          className="landing-inline-input landing-name"
          defaultValue={profile.name}
          maxLength={60}
          onBlur={async (event): Promise<void> => {
            await onSaveField("name", event.currentTarget.value.trim());
            setFocusedField(null);
          }}
          onFocus={() => setFocusedField("name")}
        />
        {focusedField === "name" ? (
          <Counter current={profile.name.length} max={60} />
        ) : null}
      </div>
      <div className="landing-editable-field">
        <input
          className="landing-inline-input landing-headline"
          defaultValue={profile.headline ?? ""}
          maxLength={120}
          placeholder="Add headline"
          onBlur={async (event): Promise<void> => {
            await onSaveField(
              "headline",
              event.currentTarget.value.trim() || null,
            );
            setFocusedField(null);
          }}
          onFocus={() => setFocusedField("headline")}
        />
        {focusedField === "headline" ? (
          <Counter current={(profile.headline ?? "").length} max={120} />
        ) : null}
      </div>
      <div className="landing-editable-field landing-editable-field-wide">
        <textarea
          className="landing-inline-textarea landing-about"
          defaultValue={profile.about ?? ""}
          maxLength={500}
          placeholder="Add about summary"
          onBlur={async (event): Promise<void> => {
            await onSaveField(
              "about",
              event.currentTarget.value.trim() || null,
            );
            setFocusedField(null);
          }}
          onFocus={() => setFocusedField("about")}
        />
        {focusedField === "about" ? (
          <Counter current={(profile.about ?? "").length} max={500} />
        ) : null}
      </div>
      <div className="landing-contact-row">
        {CONTACT_FIELDS.map((item) => (
          <label key={item.field} className="landing-edit-contact">
            <span aria-hidden="true" className="landing-contact-icon">
              {item.icon}
            </span>
            <span className="sr-only">{item.label}</span>
            <input
              className="landing-inline-input landing-contact-item"
              defaultValue={profile[item.field] ?? ""}
              maxLength={item.maxLength}
              placeholder={item.placeholder}
              onBlur={async (event): Promise<void> => {
                const value = event.currentTarget.value.trim() || null;
                await onSaveField(item.field, value);
                setFocusedField(null);
              }}
              onFocus={() => setFocusedField(item.field)}
            />
            {focusedField === item.field && item.maxLength ? (
              <Counter
                current={(profile[item.field] ?? "").length}
                max={item.maxLength}
              />
            ) : null}
          </label>
        ))}
      </div>
    </section>
  );
}
