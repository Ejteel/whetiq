"use client";

import type { LandingProfile } from "@mvp/core";
import type { ChangeEvent, ReactElement } from "react";
import { useState } from "react";
import { Counter } from "./editable-field";

type ContactField = keyof Pick<
  LandingProfile,
  "email" | "phone" | "linkedin" | "location"
>;

interface EditableContactFieldProps {
  field: ContactField;
  icon: string;
  label: string;
  maxLength?: number;
  placeholder: string;
  value: string;
  onSave: (field: ContactField, value: string | null) => Promise<void>;
}

function normalizeOptionalValue(value: string): string | null {
  return value.trim() || null;
}

export function EditableContactField({
  field,
  icon,
  label,
  maxLength,
  placeholder,
  value,
  onSave,
}: EditableContactFieldProps): ReactElement {
  const [draftValue, setDraftValue] = useState(value);

  return (
    <label className="landing-edit-contact">
      <span aria-hidden="true" className="landing-contact-icon">
        {icon}
      </span>
      <span className="sr-only">{label}</span>
      <input
        className="landing-inline-input landing-contact-item"
        maxLength={maxLength}
        placeholder={placeholder}
        value={draftValue}
        onBlur={(): Promise<void> =>
          onSave(field, normalizeOptionalValue(draftValue))
        }
        onChange={(event: ChangeEvent<HTMLInputElement>): void =>
          setDraftValue(event.currentTarget.value)
        }
      />
      {maxLength ? (
        <Counter current={draftValue.length} max={maxLength} />
      ) : null}
    </label>
  );
}
