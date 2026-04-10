"use client";

import type { ReactElement } from "react";
import { useEffect, useState } from "react";

export function ScrollCue(): ReactElement | null {
  const [isVisible, setIsVisible] = useState(true);

  useEffect((): (() => void) => {
    const handleScroll = (): void => {
      if (window.scrollY > 0) {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return (): void => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="scroll-cue" aria-hidden="true">
      <span>Scroll</span>
      <span className="scroll-cue-chevron">⌄</span>
    </div>
  );
}
