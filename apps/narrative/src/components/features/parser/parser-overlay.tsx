"use client";

import type { NarrativeProfile, ParserResult, TimelineEntry } from "@mvp/core";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { toNarrativePath } from "../../../config/app.config";

type ReviewResolution = "unresolved" | "accepted" | "dismissed";
type UnmatchedResolution = "unresolved" | "dismissed" | "placed";
type ParserPhase = "upload" | "parsing" | "review" | "error";

interface ParserOverlayProps {
  slug: string;
  isOpen: boolean;
  profile: NarrativeProfile;
  onClose: () => void;
  onApplyPatch: (
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
  ) => Promise<void>;
}

interface ReviewFieldState {
  key: "name" | "location" | "availability" | "summary";
  label: string;
  confidence: "high" | "medium" | "low";
  resolution: ReviewResolution;
  value: string;
}

interface TimelineReviewState {
  id: string;
  confidence: "high" | "medium" | "low";
  resolution: ReviewResolution;
  entry: TimelineEntry;
}

interface UnmatchedItemState {
  id: string;
  text: string;
  resolution: UnmatchedResolution;
  target: "summary" | "timeline" | null;
}

const ACCEPTED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function createInitialFieldState(result: ParserResult): ReviewFieldState[] {
  return [
    {
      key: "name",
      label: "Full name",
      confidence: result.confidenceByField.name,
      resolution: "unresolved",
      value: result.profile.name,
    },
    {
      key: "location",
      label: "Location",
      confidence: result.confidenceByField.location,
      resolution: "unresolved",
      value: result.profile.location,
    },
    {
      key: "availability",
      label: "Availability",
      confidence: result.confidenceByField.availability,
      resolution: "unresolved",
      value: result.profile.availability,
    },
    {
      key: "summary",
      label: "Fallback summary",
      confidence: result.confidenceByField["summary.fallback"] ?? "medium",
      resolution: "unresolved",
      value: result.profile.summary.fallback,
    },
  ];
}

function createInitialTimelineState(
  result: ParserResult,
): TimelineReviewState[] {
  return result.profile.timeline.map((entry, index) => ({
    id: entry.id,
    confidence: result.confidenceByField[`timeline.${index}`] ?? "medium",
    resolution: "unresolved",
    entry,
  }));
}

function createInitialUnmatchedState(
  result: ParserResult,
): UnmatchedItemState[] {
  return result.unmatchedContent.map((text) => ({
    id: crypto.randomUUID(),
    text,
    resolution: "unresolved",
    target: null,
  }));
}

function isAcceptedFile(file: File): boolean {
  return (
    ACCEPTED_FILE_TYPES.includes(file.type) ||
    file.name.endsWith(".doc") ||
    file.name.endsWith(".docx") ||
    file.name.endsWith(".pdf") ||
    file.name.endsWith(".txt")
  );
}

export function ParserOverlay({
  slug,
  isOpen,
  profile,
  onClose,
  onApplyPatch,
}: ParserOverlayProps): ReactElement | null {
  const [phase, setPhase] = useState<ParserPhase>("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentText, setDocumentText] = useState("");
  const [sourcePreview, setSourcePreview] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reviewFields, setReviewFields] = useState<ReviewFieldState[]>([]);
  const [timelineItems, setTimelineItems] = useState<TimelineReviewState[]>([]);
  const [unmatchedItems, setUnmatchedItems] = useState<UnmatchedItemState[]>(
    [],
  );

  const canApply = useMemo(() => {
    const fieldsResolved = reviewFields.every(
      (field) => field.resolution !== "unresolved",
    );
    const timelineResolved = timelineItems.every(
      (item) => item.resolution !== "unresolved",
    );
    const unmatchedResolved = unmatchedItems.every(
      (item) => item.resolution !== "unresolved",
    );

    return fieldsResolved && timelineResolved && unmatchedResolved;
  }, [reviewFields, timelineItems, unmatchedItems]);

  if (!isOpen) {
    return null;
  }

  async function parseDocument(): Promise<void> {
    setErrorMessage(null);

    let documentBase64: string | undefined;
    let sourceText = documentText.trim();

    if (!sourceText && selectedFile) {
      if (selectedFile.type === "application/pdf") {
        // PDFs must be sent as base64 so Anthropic can use its native document
        // API. Reading a PDF as text produces binary garbage, not extractable text.
        const buf = await selectedFile.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        bytes.forEach((b) => (binary += String.fromCharCode(b)));
        documentBase64 = btoa(binary);
      } else {
        sourceText = await selectedFile.text();
      }
    }

    if (!sourceText && !documentBase64) {
      setErrorMessage("Upload a file or paste document text to continue.");
      return;
    }

    setPhase("parsing");
    setSourcePreview(sourceText || "(PDF document)");

    const response = await fetch(toNarrativePath("/api/parser"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentText: sourceText,
        documentBase64,
        fileName: selectedFile?.name ?? `${slug}-resume.txt`,
        mimeType: selectedFile?.type ?? "text/plain",
      }),
    });

    if (!response.ok) {
      setPhase("error");
      setErrorMessage(
        "Parsing failed. Try again or continue with manual editing.",
      );
      return;
    }

    const result = (await response.json()) as ParserResult;
    setReviewFields(createInitialFieldState(result));
    setTimelineItems(createInitialTimelineState(result));
    setUnmatchedItems(createInitialUnmatchedState(result));
    setPhase("review");
  }

  async function applyToProfile(): Promise<void> {
    if (!canApply) {
      return;
    }

    const acceptedFields = Object.fromEntries(
      reviewFields
        .filter((field) => field.resolution === "accepted")
        .map((field) => [field.key, field.value]),
    );

    const placedSummaryNotes = unmatchedItems
      .filter(
        (item) => item.resolution === "placed" && item.target === "summary",
      )
      .map((item) => item.text);

    const placedTimelineEntries = unmatchedItems
      .filter(
        (item) => item.resolution === "placed" && item.target === "timeline",
      )
      .map(
        (item, index): TimelineEntry => ({
          id: crypto.randomUUID(),
          track: "other",
          role: `Imported note ${index + 1}`,
          organization: "Unmatched content",
          startDate: { month: 1, year: 2026 },
          endDate: null,
          bullets: [item.text],
          tags: ["imported"],
          isVisible: true,
        }),
      );

    const acceptedTimelineEntries = timelineItems
      .filter((item) => item.resolution === "accepted")
      .map((item) => item.entry);

    await onApplyPatch({
      name: acceptedFields.name,
      location: acceptedFields.location,
      availability: acceptedFields.availability,
      summary:
        acceptedFields.summary || placedSummaryNotes.length > 0
          ? {
              ...profile.summary,
              fallback: [
                acceptedFields.summary || profile.summary.fallback,
                ...placedSummaryNotes,
              ]
                .filter(Boolean)
                .join("\n\n"),
            }
          : undefined,
      timeline:
        acceptedTimelineEntries.length > 0 || placedTimelineEntries.length > 0
          ? [
              ...profile.timeline,
              ...acceptedTimelineEntries,
              ...placedTimelineEntries,
            ]
          : undefined,
    });

    onClose();
  }

  function bulkAcceptHighConfidence(section: "profile" | "timeline"): void {
    if (section === "profile") {
      setReviewFields((current) =>
        current.map((field) =>
          field.confidence === "high" && field.resolution === "unresolved"
            ? { ...field, resolution: "accepted" }
            : field,
        ),
      );
      return;
    }

    setTimelineItems((current) =>
      current.map((item) =>
        item.confidence === "high" && item.resolution === "unresolved"
          ? { ...item, resolution: "accepted" }
          : item,
      ),
    );
  }

  return (
    <div
      className="parser-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Resume parser"
      tabIndex={-1}
      onKeyDown={(event): void => {
        if (event.key === "Escape") {
          onClose();
        }
      }}
    >
      <div className="parser-overlay-shell">
        <div className="parser-overlay-header">
          <p className="parser-section-label">Resume import</p>
          <button
            className="icon-button"
            type="button"
            aria-label="Close parser"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        {phase === "upload" ? (
          <div className="parser-upload">
            <div className="parser-upload-zone">
              <p className="parser-section-label">Import your resume</p>
              <input
                className="parser-file-input"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(event): void => {
                  const file = event.currentTarget.files?.[0] ?? null;
                  if (!file) {
                    return;
                  }
                  if (!isAcceptedFile(file) || file.size > MAX_UPLOAD_BYTES) {
                    setErrorMessage(
                      "Accepted formats: PDF, DOCX, DOC, TXT up to 10MB.",
                    );
                    return;
                  }
                  setSelectedFile(file);
                  setErrorMessage(null);
                }}
              />
              <p className="parser-upload-meta">
                {selectedFile
                  ? `${selectedFile.name} selected`
                  : "PDF, DOCX, DOC, TXT up to 10MB"}
              </p>
              <textarea
                className="inline-textarea parser-paste-input"
                placeholder="Paste resume text here if you prefer"
                value={documentText}
                onChange={(event): void =>
                  setDocumentText(event.currentTarget.value)
                }
              />
              {errorMessage ? (
                <p className="parser-error">{errorMessage}</p>
              ) : null}
              <div className="parser-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  className="primary-button"
                  type="button"
                  onClick={() => void parseDocument()}
                >
                  Parse resume
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {phase === "parsing" ? (
          <div className="parser-progress">
            <p className="parser-section-label">Parsing your resume...</p>
            <div className="parser-progress-bar" aria-hidden="true">
              <span />
            </div>
          </div>
        ) : null}
        {phase === "error" ? (
          <div className="parser-progress">
            <p className="parser-section-label">Parser unavailable</p>
            <p className="parser-error">{errorMessage}</p>
            <div className="parser-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={() => setPhase("upload")}
              >
                Retry
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={onClose}
              >
                Continue editing manually
              </button>
            </div>
          </div>
        ) : null}
        {phase === "review" ? (
          <div className="parser-review">
            <div className="parser-review-left">
              <div className="parser-section-header">
                <p className="parser-section-label">Extracted profile data</p>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => bulkAcceptHighConfidence("profile")}
                >
                  Accept all high confidence
                </button>
              </div>
              {reviewFields.map((field) => (
                <div key={field.key} className="parser-review-card">
                  <div className="parser-review-card-header">
                    <p>{field.label}</p>
                    <span
                      className={`confidence-badge confidence-${field.confidence}`}
                    >
                      {field.confidence}
                    </span>
                  </div>
                  <textarea
                    className="inline-textarea parser-review-input"
                    value={field.value}
                    onChange={(event): void => {
                      const nextValue = event.currentTarget.value;
                      setReviewFields((current) =>
                        current.map((item) =>
                          item.key === field.key
                            ? { ...item, value: nextValue }
                            : item,
                        ),
                      );
                    }}
                  />
                  <div className="parser-review-actions">
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() =>
                        setReviewFields((current) =>
                          current.map((item) =>
                            item.key === field.key
                              ? { ...item, resolution: "accepted" }
                              : item,
                          ),
                        )
                      }
                    >
                      Accept
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() =>
                        setReviewFields((current) =>
                          current.map((item) =>
                            item.key === field.key
                              ? { ...item, resolution: "dismissed" }
                              : item,
                          ),
                        )
                      }
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
              <div className="parser-section-header">
                <p className="parser-section-label">Timeline entries</p>
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => bulkAcceptHighConfidence("timeline")}
                >
                  Accept all high confidence
                </button>
              </div>
              {timelineItems.map((item) => (
                <div key={item.id} className="parser-review-card">
                  <div className="parser-review-card-header">
                    <p>{item.entry.role}</p>
                    <span
                      className={`confidence-badge confidence-${item.confidence}`}
                    >
                      {item.confidence}
                    </span>
                  </div>
                  <input
                    className="inline-input"
                    value={item.entry.role}
                    onChange={(event): void =>
                      setTimelineItems((current) =>
                        current.map((currentItem) =>
                          currentItem.id === item.id
                            ? {
                                ...currentItem,
                                entry: {
                                  ...currentItem.entry,
                                  role: event.currentTarget.value,
                                },
                              }
                            : currentItem,
                        ),
                      )
                    }
                  />
                  <input
                    className="inline-input"
                    value={item.entry.organization}
                    onChange={(event): void =>
                      setTimelineItems((current) =>
                        current.map((currentItem) =>
                          currentItem.id === item.id
                            ? {
                                ...currentItem,
                                entry: {
                                  ...currentItem.entry,
                                  organization: event.currentTarget.value,
                                },
                              }
                            : currentItem,
                        ),
                      )
                    }
                  />
                  <textarea
                    className="inline-textarea parser-review-input"
                    value={item.entry.bullets.join("\n")}
                    onChange={(event): void =>
                      setTimelineItems((current) =>
                        current.map((currentItem) =>
                          currentItem.id === item.id
                            ? {
                                ...currentItem,
                                entry: {
                                  ...currentItem.entry,
                                  bullets: event.currentTarget.value
                                    .split("\n")
                                    .map((bullet) => bullet.trim())
                                    .filter(Boolean)
                                    .slice(0, 4),
                                },
                              }
                            : currentItem,
                        ),
                      )
                    }
                  />
                  <div className="parser-review-actions">
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() =>
                        setTimelineItems((current) =>
                          current.map((currentItem) =>
                            currentItem.id === item.id
                              ? { ...currentItem, resolution: "accepted" }
                              : currentItem,
                          ),
                        )
                      }
                    >
                      Accept
                    </button>
                    <button
                      className="ghost-button"
                      type="button"
                      onClick={() =>
                        setTimelineItems((current) =>
                          current.map((currentItem) =>
                            currentItem.id === item.id
                              ? { ...currentItem, resolution: "dismissed" }
                              : currentItem,
                          ),
                        )
                      }
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="parser-review-right">
              <p className="parser-section-label">Original document</p>
              <pre className="parser-document-preview">{sourcePreview}</pre>
            </div>
            <div className="parser-unmatched-tray">
              <p className="parser-section-label">Unmatched content</p>
              {unmatchedItems.length === 0 ? (
                <p className="parser-upload-meta">Nothing unmatched.</p>
              ) : (
                unmatchedItems.map((item) => (
                  <div key={item.id} className="parser-unmatched-item">
                    <p>{item.text}</p>
                    <div className="parser-review-actions">
                      <select
                        className="parser-select"
                        value={item.target ?? ""}
                        onChange={(event): void => {
                          const nextTarget = event.currentTarget.value as
                            | "summary"
                            | "timeline"
                            | "";
                          setUnmatchedItems((current) =>
                            current.map((currentItem) =>
                              currentItem.id === item.id
                                ? {
                                    ...currentItem,
                                    target: nextTarget || null,
                                    resolution: nextTarget
                                      ? "placed"
                                      : "unresolved",
                                  }
                                : currentItem,
                            ),
                          );
                        }}
                      >
                        <option value="">Place manually</option>
                        <option value="summary">Summary</option>
                        <option value="timeline">Timeline note</option>
                      </select>
                      <button
                        className="ghost-button"
                        type="button"
                        onClick={() =>
                          setUnmatchedItems((current) =>
                            current.map((currentItem) =>
                              currentItem.id === item.id
                                ? {
                                    ...currentItem,
                                    resolution: "dismissed",
                                    target: null,
                                  }
                                : currentItem,
                            ),
                          )
                        }
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))
              )}
              <div className="parser-actions">
                <button
                  className="ghost-button"
                  type="button"
                  onClick={onClose}
                >
                  Close
                </button>
                <button
                  className="primary-button"
                  type="button"
                  disabled={!canApply}
                  onClick={() => void applyToProfile()}
                >
                  Apply to Profile
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
