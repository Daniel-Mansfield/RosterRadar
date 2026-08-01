"use client";

import {
  useCallback,
  useEffect,
  useId,
  useState,
  type ReactElement,
} from "react";

import styles from "./SpotlightTour.module.css";

type TourStep = {
  target: string;
  title: string;
  body: string;
};

const TOUR_STEPS: TourStep[] = [
  {
    target: "search",
    title: "Search acquisition targets",
    body: "Find non-Nets players and open a role-fit dossier — verdict first, evidence second.",
  },
  {
    target: "court",
    title: "Starting five",
    body: "Click a Nets starter for their dossier. During a swap, drop or click a slot to place a Radar candidate.",
  },
  {
    target: "team-fit",
    title: "Lineup Fit",
    body: "Peer-percentile read for the starting five — grade, pillars, and balance callouts. Hypothetical swaps show deltas vs the real five.",
  },
  {
    target: "radar",
    title: "On the Radar",
    body: "A rotating shortlist of acquisition targets. Click for a dossier, or drag / Place onto a starter to simulate fit.",
  },
  {
    target: "radar",
    title: "Try a swap",
    body: "Drag a Radar row onto a court card, or press Place then click a starter. Reset lineup in Lineup Fit clears the hypothetical.",
  },
];

type SpotlightTourProps = {
  open: boolean;
  onClose: () => void;
};

type Rect = { top: number; left: number; width: number; height: number };

/**
 * Optional coach-mark tour over live home regions (`data-tour` hooks).
 * Explicit start only — never auto-blocks the page.
 */
export function SpotlightTour({
  open,
  onClose,
}: SpotlightTourProps): ReactElement | null {
  const titleId = useId();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const step = TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0];

  const measure = useCallback(() => {
    if (!step) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!(el instanceof HTMLElement)) {
      setRect(null);
      return;
    }
    el.scrollIntoView({
      block: "nearest",
      behavior: reduceMotion ? "auto" : "smooth",
    });
    const r = el.getBoundingClientRect();
    const pad = 8;
    setRect({
      top: r.top - pad,
      left: r.left - pad,
      width: r.width + pad * 2,
      height: r.height + pad * 2,
    });
  }, [step, reduceMotion]);

  useEffect(() => {
    if (!open) return;
    // Defer measure so setRect is not synchronous inside the effect body.
    const raf = requestAnimationFrame(() => {
      measure();
    });
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, measure, stepIndex]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        setStepIndex((i) => Math.min(i + 1, TOUR_STEPS.length - 1));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setStepIndex((i) => Math.max(i - 1, 0));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !step) {
    return null;
  }

  const isLast = stepIndex >= TOUR_STEPS.length - 1;
  const tooltipStyle =
    rect != null
      ? {
          top: Math.min(
            rect.top + rect.height + 12,
            window.innerHeight - 180,
          ),
          left: Math.min(
            Math.max(16, rect.left),
            window.innerWidth - 320,
          ),
        }
      : { top: "30%", left: "50%", transform: "translateX(-50%)" };

  return (
    <div className={styles.root} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className={styles.scrim} onClick={onClose} aria-hidden="true" />
      {rect ? (
        <div
          className={styles.hole}
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
          aria-hidden="true"
        />
      ) : null}
      <div className={styles.card} style={tooltipStyle}>
        <p className={styles.stepMeta}>
          {stepIndex + 1} / {TOUR_STEPS.length}
        </p>
        <h2 id={titleId} className={styles.title}>
          {step.title}
        </h2>
        <p className={styles.body}>{step.body}</p>
        <div className={styles.actions}>
          <button type="button" className={styles.ghost} onClick={onClose}>
            Skip
          </button>
          <div className={styles.nav}>
            <button
              type="button"
              className={styles.ghost}
              onClick={() => setStepIndex((i) => Math.max(i - 1, 0))}
              disabled={stepIndex === 0}
            >
              Back
            </button>
            {isLast ? (
              <button type="button" className={styles.primary} onClick={onClose}>
                Done
              </button>
            ) : (
              <button
                type="button"
                className={styles.primary}
                onClick={() =>
                  setStepIndex((i) => Math.min(i + 1, TOUR_STEPS.length - 1))
                }
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
