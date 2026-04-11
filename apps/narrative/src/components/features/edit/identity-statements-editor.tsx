"use client";

import type { IdentityStatement } from "@mvp/core";
import type { ChangeEvent, ReactElement } from "react";

interface IdentityStatementsEditorProps {
  statements: IdentityStatement[];
  onSave: (statements: IdentityStatement[]) => Promise<void>;
}

const MAX_STATEMENTS = 5;
const CONTENT_LIMIT = 80;

function buildStatementUpdate(
  statements: IdentityStatement[],
  statementId: string,
  patch: Partial<IdentityStatement>,
): IdentityStatement[] {
  return statements.map((statement) =>
    statement.id === statementId ? { ...statement, ...patch } : statement,
  );
}

function buildActiveStatementUpdate(
  statements: IdentityStatement[],
  statementId: string,
): IdentityStatement[] {
  return statements.map((statement) => ({
    ...statement,
    isActive: statement.id === statementId,
  }));
}

export function IdentityStatementsEditor({
  statements,
  onSave,
}: IdentityStatementsEditorProps): ReactElement {
  async function saveStatementLabel(
    statementId: string,
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    await onSave(
      buildStatementUpdate(statements, statementId, {
        privateLabel: event.currentTarget.value.trim(),
      }),
    );
  }

  async function saveStatementContent(
    statementId: string,
    event: ChangeEvent<HTMLTextAreaElement>,
  ): Promise<void> {
    const nextContent = event.currentTarget.value.trim();
    if (nextContent.length === 0) {
      return;
    }

    await onSave(
      buildStatementUpdate(statements, statementId, { content: nextContent }),
    );
  }

  async function saveActiveStatement(statementId: string): Promise<void> {
    await onSave(buildActiveStatementUpdate(statements, statementId));
  }

  async function addStatement(): Promise<void> {
    if (statements.length >= MAX_STATEMENTS) {
      return;
    }

    await onSave([
      ...statements.map((statement) => ({ ...statement, isActive: false })),
      {
        id: crypto.randomUUID(),
        privateLabel: `statement ${statements.length + 1}`,
        content: "",
        isActive: true,
      },
    ]);
  }

  return (
    <div className="identity-statements-editor">
      {statements.map((statement, index) => (
        <fieldset key={statement.id} className="statement-editor-card">
          <legend className="statement-editor-legend">
            Identity statement {index + 1}
          </legend>
          <label className="statement-editor-field">
            <span>Private label</span>
            <input
              className="inline-input"
              defaultValue={statement.privateLabel}
              maxLength={40}
              onBlur={(event): Promise<void> =>
                saveStatementLabel(statement.id, event)
              }
            />
          </label>
          <label className="statement-editor-field">
            <span>Statement</span>
            <textarea
              className="inline-textarea statement-editor-textarea"
              defaultValue={statement.content}
              maxLength={CONTENT_LIMIT}
              placeholder="Add an identity statement"
              onBlur={(event): Promise<void> =>
                saveStatementContent(statement.id, event)
              }
            />
            <span className="statement-editor-counter">
              {statement.content.length}/{CONTENT_LIMIT}
            </span>
          </label>
          <label className="statement-editor-radio">
            <input
              checked={statement.isActive}
              name="active-identity-statement"
              type="radio"
              onChange={(): Promise<void> => saveActiveStatement(statement.id)}
            />
            <span>Render this statement in visitor view</span>
          </label>
        </fieldset>
      ))}
      {statements.length < MAX_STATEMENTS ? (
        <button
          className="ghost-button"
          type="button"
          onClick={(): void => void addStatement()}
        >
          + Add another statement
        </button>
      ) : null}
    </div>
  );
}
