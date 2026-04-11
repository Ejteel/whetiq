"use client";

import type { ContextSummary } from "@mvp/core";
import type { ReactElement } from "react";

interface ContextSummariesEditorProps {
  summaries: ContextSummary[];
  onSave: (summaries: ContextSummary[]) => Promise<void>;
}

const MAX_CONTEXT_SUMMARIES = 5;
const CONTEXT_SUMMARY_LIMIT = 400;

function updateSummary(
  summaries: ContextSummary[],
  summaryId: string,
  patch: Partial<ContextSummary>,
): ContextSummary[] {
  return summaries.map((summary) =>
    summary.id === summaryId ? { ...summary, ...patch } : summary,
  );
}

export function ContextSummariesEditor({
  summaries,
  onSave,
}: ContextSummariesEditorProps): ReactElement {
  async function saveSummaryField(
    summaryId: string,
    field: keyof ContextSummary,
    value: string,
  ): Promise<void> {
    await onSave(updateSummary(summaries, summaryId, { [field]: value }));
  }
  async function saveTriggerType(
    summaryId: string,
    value: ContextSummary["triggerType"],
  ): Promise<void> {
    await onSave(updateSummary(summaries, summaryId, { triggerType: value }));
  }
  async function removeSummary(summaryId: string): Promise<void> {
    await onSave(summaries.filter((summary) => summary.id !== summaryId));
  }
  async function addSummary(): Promise<void> {
    if (summaries.length >= MAX_CONTEXT_SUMMARIES) {
      return;
    }

    await onSave([
      ...summaries,
      {
        id: crypto.randomUUID(),
        triggerType: "manual",
        triggerValue: "",
        label: "",
        content: "",
      },
    ]);
  }

  return (
    <div className="context-summaries-editor">
      <div className="context-summaries-header">
        <p className="context-summaries-label">Context summaries</p>
        {summaries.length < MAX_CONTEXT_SUMMARIES ? (
          <button
            className="ghost-button"
            type="button"
            onClick={(): void => void addSummary()}
          >
            + Add context summary
          </button>
        ) : null}
      </div>
      {summaries.map((summary, index) => (
        <fieldset key={summary.id} className="context-summary-card">
          <legend className="context-summary-legend">
            Context summary {index + 1}
          </legend>
          <div className="context-summary-grid">
            <label className="statement-editor-field">
              <span>Trigger type</span>
              <select
                className="inline-input"
                defaultValue={summary.triggerType}
                onChange={(event): Promise<void> =>
                  saveTriggerType(
                    summary.id,
                    event.currentTarget.value as ContextSummary["triggerType"],
                  )
                }
              >
                <option value="ctx_param">Context token</option>
                <option value="referrer">Referrer</option>
                <option value="manual">Manual</option>
              </select>
            </label>
            <label className="statement-editor-field">
              <span>Trigger value</span>
              <input
                className="inline-input"
                defaultValue={summary.triggerValue}
                onBlur={(event): Promise<void> =>
                  saveSummaryField(
                    summary.id,
                    "triggerValue",
                    event.currentTarget.value.trim(),
                  )
                }
              />
            </label>
            <label className="statement-editor-field">
              <span>Label</span>
              <input
                className="inline-input"
                defaultValue={summary.label}
                onBlur={(event): Promise<void> =>
                  saveSummaryField(
                    summary.id,
                    "label",
                    event.currentTarget.value.trim(),
                  )
                }
              />
            </label>
          </div>
          <label className="statement-editor-field">
            <span>Summary</span>
            <textarea
              className="inline-textarea statement-editor-textarea"
              defaultValue={summary.content}
              maxLength={CONTEXT_SUMMARY_LIMIT}
              onBlur={(event): Promise<void> =>
                saveSummaryField(
                  summary.id,
                  "content",
                  event.currentTarget.value.trim(),
                )
              }
            />
            <span className="statement-editor-counter">
              {summary.content.length}/{CONTEXT_SUMMARY_LIMIT}
            </span>
          </label>
          <button
            className="icon-button"
            type="button"
            aria-label={`Delete context summary ${index + 1}`}
            onClick={(): void => void removeSummary(summary.id)}
          >
            ✕
          </button>
        </fieldset>
      ))}
    </div>
  );
}
