"use client";

import type { LandingProfile } from "@mvp/core";
import type { ReactElement } from "react";
import { EditableContactField } from "./editable-contact-field";
import { EditableField } from "./editable-field";

type EditableIdentityField = keyof Omit<LandingProfile, "cards">;

interface EditableIdentityBlockProps {
  profile: LandingProfile;
  onSaveField: <TField extends EditableIdentityField>(
    field: TField,
    value: LandingProfile[TField],
  ) => Promise<void>;
}

const CONTACT_FIELDS = [
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
] as const;

export function EditableIdentityBlock({
  profile,
  onSaveField,
}: EditableIdentityBlockProps): ReactElement {
  return (
    <section className="landing-identity">
      <EditableField
        className="landing-name"
        field="name"
        maxLength={60}
        placeholder="Add name"
        value={profile.name}
        onSave={onSaveField}
      />
      <EditableField
        className="landing-headline"
        field="headline"
        maxLength={120}
        placeholder="Add headline"
        value={profile.headline ?? ""}
        onSave={onSaveField}
      />
      <EditableField
        className="landing-about landing-editable-field-wide"
        field="about"
        maxLength={500}
        multiline
        placeholder="Add about summary"
        value={profile.about ?? ""}
        onSave={onSaveField}
      />
      <div className="landing-contact-row">
        {CONTACT_FIELDS.map((item) => (
          <EditableContactField
            key={item.field}
            {...item}
            value={profile[item.field] ?? ""}
            onSave={onSaveField}
          />
        ))}
      </div>
    </section>
  );
}
