"use client";

import type { NarrativeProfile } from "@mvp/core";
import type { AnalyticsBatchInput } from "../../../types/analytics.types";
import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import { analyticsEventNames } from "../../../config/analytics.config";

interface NarrativeAnalyticsProps {
  profile: NarrativeProfile;
  contextToken: string | null;
}

type AnalyticsEventName = (typeof analyticsEventNames)[number];

interface BufferedAnalyticsEvent {
  eventName: AnalyticsEventName;
  payload: Record<string, string | number | boolean | null>;
  occurredAt: string;
}

const FLUSH_INTERVAL_MS = 30_000;
const HOVER_DELAY_MS = 500;
const SCROLL_DEPTH_MILESTONES = [25, 50, 75, 100] as const;

function detectDeviceType(): "desktop" | "tablet" | "mobile" {
  const width = window.innerWidth;
  if (width < 768) {
    return "mobile";
  }

  if (width < 1024) {
    return "tablet";
  }

  return "desktop";
}

function detectCompanyFromReferrer(referrer: string): string | null {
  if (referrer.includes("linkedin.com")) {
    return "LinkedIn";
  }

  if (referrer.includes("greenhouse.io")) {
    return "Greenhouse";
  }

  if (referrer.includes("lever.co")) {
    return "Lever";
  }

  if (referrer.includes("workday.com")) {
    return "Workday";
  }

  return null;
}

export function NarrativeAnalytics({
  profile,
  contextToken,
}: NarrativeAnalyticsProps): ReactElement | null {
  const queueRef = useRef<BufferedAnalyticsEvent[]>([]);
  const sessionIdRef = useRef<string | null>(null);
  const heroStartRef = useRef<number>(Date.now());
  const sectionSeenRef = useRef<Set<string>>(new Set());
  const scrollDepthRef = useRef<Set<number>>(new Set());

  useEffect((): (() => void) => {
    function enqueueEvent(
      eventName: AnalyticsEventName,
      payload: Record<string, string | number | boolean | null>,
    ): void {
      queueRef.current.push({
        eventName,
        payload,
        occurredAt: new Date().toISOString(),
      });
    }

    async function flushQueue(useBeacon: boolean): Promise<void> {
      if (queueRef.current.length === 0) {
        return;
      }

      const batch: AnalyticsBatchInput = {
        profileId: profile.id,
        sessionId: sessionIdRef.current ?? undefined,
        referrer: document.referrer || null,
        contextToken,
        deviceType: detectDeviceType(),
        events: [...queueRef.current],
      };

      queueRef.current = [];

      if (useBeacon) {
        navigator.sendBeacon("/api/analytics", JSON.stringify(batch));
        return;
      }

      const response = await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(batch),
      });

      if (response.ok) {
        const data = (await response.json()) as { sessionId: string };
        sessionIdRef.current = data.sessionId;
      }
    }

    enqueueEvent("session_start", {
      referrer: document.referrer || null,
      context_token: contextToken,
      detected_company: detectCompanyFromReferrer(document.referrer || ""),
      timestamp: new Date().toISOString(),
      device_type: detectDeviceType(),
    });

    const flushIntervalId = window.setInterval(() => {
      void flushQueue(false);
    }, FLUSH_INTERVAL_MS);

    const heroSection = document.querySelector<HTMLElement>(
      "[data-section-id='hero']",
    );
    const timelineSection = document.querySelector<HTMLElement>(
      "[data-section-id='timeline']",
    );
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const sectionId = entry.target.getAttribute("data-section-id");
          if (!sectionId) {
            continue;
          }

          if (entry.isIntersecting && !sectionSeenRef.current.has(sectionId)) {
            sectionSeenRef.current.add(sectionId);
            enqueueEvent("section_dwell", {
              section_id: sectionId,
              timestamp: new Date().toISOString(),
            });
          }

          if (
            sectionId === "timeline" &&
            entry.isIntersecting &&
            !sectionSeenRef.current.has("hero_dwell")
          ) {
            sectionSeenRef.current.add("hero_dwell");
            enqueueEvent("hero_dwell", {
              dwell_ms: Date.now() - heroStartRef.current,
            });
          }
        }
      },
      { threshold: 0.5 },
    );

    if (heroSection) {
      sectionObserver.observe(heroSection);
    }

    if (timelineSection) {
      sectionObserver.observe(timelineSection);
    }

    function handleScrollDepth(): void {
      const scrollableHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (scrollableHeight <= 0) {
        return;
      }

      const currentDepth = Math.round(
        (window.scrollY / scrollableHeight) * 100,
      );
      for (const milestone of SCROLL_DEPTH_MILESTONES) {
        if (
          currentDepth >= milestone &&
          !scrollDepthRef.current.has(milestone)
        ) {
          scrollDepthRef.current.add(milestone);
          enqueueEvent("scroll_depth", {
            depth_pct: milestone,
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    const hoverTimeoutIds = new Map<string, number>();

    function handlePointerOver(event: Event): void {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-card-id]",
      );
      if (!target) {
        return;
      }

      const cardId = target.dataset.cardId;
      if (!cardId || hoverTimeoutIds.has(cardId)) {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        enqueueEvent("card_hover", { card_id: cardId });
        hoverTimeoutIds.delete(cardId);
      }, HOVER_DELAY_MS);

      hoverTimeoutIds.set(cardId, timeoutId);
    }

    function handlePointerOut(event: Event): void {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>(
        "[data-card-id]",
      );
      if (!target) {
        return;
      }

      const cardId = target.dataset.cardId;
      if (!cardId) {
        return;
      }

      const timeoutId = hoverTimeoutIds.get(cardId);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        hoverTimeoutIds.delete(cardId);
      }
    }

    function handleAnalyticsEvent(event: Event): void {
      const detail = (
        event as CustomEvent<Record<string, string | number | boolean | null>>
      ).detail;
      const eventName = (event as CustomEvent).type as AnalyticsEventName;
      enqueueEvent(eventName, detail);
    }

    window.addEventListener("scroll", handleScrollDepth, { passive: true });
    document.addEventListener("pointerover", handlePointerOver);
    document.addEventListener("pointerout", handlePointerOut);
    window.addEventListener(
      "card_expand",
      handleAnalyticsEvent as EventListener,
    );
    window.addEventListener(
      "card_collapse",
      handleAnalyticsEvent as EventListener,
    );

    function handleBeforeUnload(): void {
      void flushQueue(true);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return (): void => {
      window.clearInterval(flushIntervalId);
      sectionObserver.disconnect();
      window.removeEventListener("scroll", handleScrollDepth);
      document.removeEventListener("pointerover", handlePointerOver);
      document.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener(
        "card_expand",
        handleAnalyticsEvent as EventListener,
      );
      window.removeEventListener(
        "card_collapse",
        handleAnalyticsEvent as EventListener,
      );
      window.removeEventListener("beforeunload", handleBeforeUnload);
      for (const timeoutId of hoverTimeoutIds.values()) {
        window.clearTimeout(timeoutId);
      }
      void flushQueue(true);
    };
  }, [contextToken, profile.id]);

  return null;
}
