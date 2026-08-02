"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react";

import { placeTourCard } from "@/lib/ui/placeTourCard";

import styles from "./SpotlightTour.module.css";

type TourStep = {
  target: string;
  title: string;
  /** One-line “what this is”. */
  intro: string;
  /** Short “what to try” cues — keep to 2–3. */
  bullets: readonly [string, string] | readonly [string, string, string];
};

const TOUR_STEPS: TourStep[] = [
  {
    target: "search",
    title: "Search",
    intro: "Look up non-Nets players as acquisition targets.",
    bullets: [
      "Open a role-fit dossier from any result",
      "Use the swap icon or Try in lineup to place them on a starter slot",
      "Stack more slots — or drop someone else on the same hole to compare",
    ],
  },
  {
    target: "court",
    title: "Starting five",
    intro: "The Nets starters live here.",
    bullets: [
      "Click a player to open their dossier",
      "While placing someone, drop or click a slot to fill it",
      "Overwrite a slot you’ve already changed without resetting",
    ],
  },
  {
    target: "team-fit",
    title: "Lineup Fit",
    intro: "How the starting five grades versus league peers.",
    bullets: [
      "Read the overall grade, six pillars, and balance callouts",
      "After swaps, Fit shows deltas versus the real five",
      "The banner lists every stacked change; Reset clears them",
    ],
  },
  {
    target: "radar",
    title: "On the Radar",
    intro: "A curated shortlist of acquisition targets.",
    bullets: [
      "Scroll the full list; Shuffle redraws it",
      "Sort by any Fit pillar (defaults to the lineup’s softest need)",
      "Click for a dossier, or drag / tap swap onto a starter",
    ],
  },
  {
    target: "bench",
    title: "Bench",
    intro: "Depth players you can exchange with a starter.",
    bullets: [
      "Drag onto a starter, or tap swap then click a slot",
      "It’s a true exchange — Fit updates with deltas",
      "Out pins can return to a slot; Reset clears every change",
    ],
  },
];

const VIEW_PAD = 16;

type SpotlightTourProps = {
  open: boolean;
  onClose: () => void;
};

type Rect = { top: number; left: number; width: number; height: number };
type Point = { top: number; left: number };

/**
 * Optional coach-mark tour over live home regions (`data-tour` hooks).
 * Explicit start only — never auto-blocks the page.
 */
export function SpotlightTour({
  open,
  onClose,
}: SpotlightTourProps): ReactElement | null {
  const titleId = useId();
  const cardRef = useRef<HTMLDivElement>(null);
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [cardPos, setCardPos] = useState<Point | null>(null);
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const step = TOUR_STEPS[stepIndex] ?? TOUR_STEPS[0];

  const measureTarget = useCallback(() => {
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
      inline: "nearest",
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
    const raf = requestAnimationFrame(() => {
      measureTarget();
    });
    // Remeasure after smooth scroll settles.
    const settle = window.setTimeout(measureTarget, reduceMotion ? 0 : 320);
    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", measureTarget, true);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.removeEventListener("resize", measureTarget);
      window.removeEventListener("scroll", measureTarget, true);
    };
  }, [open, measureTarget, stepIndex, reduceMotion]);

  useLayoutEffect(() => {
    if (!open || rect == null || !cardRef.current) {
      setCardPos(null);
      return;
    }
    const card = cardRef.current.getBoundingClientRect();
    setCardPos(
      placeTourCard(
        rect,
        { width: card.width, height: card.height },
        { width: window.innerWidth, height: window.innerHeight },
      ),
    );
  }, [open, rect, stepIndex, step?.intro, step?.title, step?.bullets]);

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    // Prefer Next/Done; fall back after paint if the primary button remounts.
    const focusPrimary = window.setTimeout(() => {
      primaryButtonRef.current?.focus();
    }, 0);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        setStepIndex((i) => Math.min(i + 1, TOUR_STEPS.length - 1));
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setStepIndex((i) => Math.max(i - 1, 0));
        return;
      }

      // Enter activates the focused control — do not hijack it for Next.
      if (event.key !== "Tab" || !cardRef.current) {
        return;
      }

      const focusable = getFocusableElements(cardRef.current);
      if (focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusPrimary);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  // Keep focus on the primary action when the step changes (Next remounts).
  useEffect(() => {
    if (!open) return;
    primaryButtonRef.current?.focus();
  }, [open, stepIndex]);

  if (!open || !step) {
    return null;
  }

  const isLast = stepIndex >= TOUR_STEPS.length - 1;
  const tooltipStyle: CSSProperties =
    cardPos != null
      ? { top: cardPos.top, left: cardPos.left }
      : { top: VIEW_PAD, left: VIEW_PAD, visibility: "hidden" };

  return (
    <div
      className={styles.root}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
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
      <div ref={cardRef} className={styles.card} style={tooltipStyle}>
        <p className={styles.stepMeta}>
          {stepIndex + 1} / {TOUR_STEPS.length}
        </p>
        <h2 id={titleId} className={styles.title}>
          {step.title}
        </h2>
        <p className={styles.intro}>{step.intro}</p>
        <ul className={styles.bullets}>
          {step.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
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
              <button
                ref={primaryButtonRef}
                type="button"
                className={styles.primary}
                onClick={onClose}
              >
                Done
              </button>
            ) : (
              <button
                ref={primaryButtonRef}
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

function getFocusableElements(root: HTMLElement): HTMLElement[] {
  const selector =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute("disabled") && el.tabIndex !== -1,
  );
}
