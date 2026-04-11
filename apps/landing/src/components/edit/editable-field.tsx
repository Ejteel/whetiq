"use client";

import type { LandingProfile } from "@mvp/core";
import type { ChangeEvent, ReactElement } from "react";
import { useState } from "react";

type EditableIdentityField = keyof Omit<LandingProfile, "cards">;

interface CounterProps {
  current: number;
  max: number;
}

interface EditableFieldProps {
  className: string;
  field: EditableIdentityField;
  maxLength?: number;
  multiline?: boolean;
  placeholder: string;
  value: string;
  onSave: (
    field: EditableIdentityField,
    value: LandingProfile[EditableIdentityField],
  ) => Promise<void>;
}

export function Counter({ current, max }: CounterProps): ReactElement {
  const isNearLimit = max - current <= 10;

  return (
    <span
      className={`landing-field-counter${isNearLimit ? " landing-field-counter-warning" : ""}`}
    >
      {current}/{max}
    </span>
  );
}

function normalizeOptionalValue(value: string): string | null {
  return value.trim() || null;
}

export function EditableField({
  className,
  field,
  maxLength,
  multiline = false,
  placeholder,
  value,
  onSave,
}: EditableFieldProps): ReactElement {
  const [draftValue, setDraftValue] = useState(value);

  async function handleBlur(): Promise<void> {
    const nextValue = normalizeOptionalValue(draftValue);
    await onSave(field, field === "name" ? (nextValue ?? "") : nextValue);
  }

  const sharedProps = {
    maxLength,
    placeholder,
    value: draftValue,
    onBlur: (): Promise<void> => handleBlur(),
    onChange: (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ): void => setDraftValue(event.currentTarget.value),
  };

  return (
    <div className="landing-editable-field">
      {multiline ? (
        <textarea
          {...sharedProps}
          className={`${className} landing-inline-textarea`}
        />
      ) : (
        <input
          {...sharedProps}
          className={`${className} landing-inline-input`}
        />
      )}
      {maxLength ? (
        <Counter current={draftValue.length} max={maxLength} />
      ) : null}
    </div>
  );
}
