const VIEW_PAD = 16;
const GAP = 12;

export type TourRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

export type TourPoint = { top: number; left: number };

function clamp(
  point: TourPoint,
  card: { width: number; height: number },
  viewport: { width: number; height: number },
): TourPoint {
  const maxLeft = Math.max(VIEW_PAD, viewport.width - card.width - VIEW_PAD);
  const maxTop = Math.max(VIEW_PAD, viewport.height - card.height - VIEW_PAD);
  return {
    top: Math.min(Math.max(VIEW_PAD, point.top), maxTop),
    left: Math.min(Math.max(VIEW_PAD, point.left), maxLeft),
  };
}

function overlapArea(a: TourRect, b: TourRect): number {
  const left = Math.max(a.left, b.left);
  const right = Math.min(a.left + a.width, b.left + b.width);
  const top = Math.max(a.top, b.top);
  const bottom = Math.min(a.top + a.height, b.top + b.height);
  const w = right - left;
  const h = bottom - top;
  if (w <= 0 || h <= 0) return 0;
  return w * h;
}

/**
 * Prefer beside / below / above the target; always clamp fully on-screen.
 * When the target is huge, pick the clamped candidate that overlaps it least.
 */
export function placeTourCard(
  target: TourRect,
  card: { width: number; height: number },
  viewport: { width: number; height: number },
): TourPoint {
  const nearTop = Math.max(VIEW_PAD, target.top);
  const centeredTop = target.top + target.height / 2 - card.height / 2;
  const centeredLeft = target.left + target.width / 2 - card.width / 2;

  const candidates: TourPoint[] = [
    // Beside the top of the target (best for tall Fit / Radar / Bench rails).
    { top: nearTop, left: target.left + target.width + GAP },
    { top: nearTop, left: target.left - card.width - GAP },
    // Vertically centered beside.
    { top: centeredTop, left: target.left + target.width + GAP },
    { top: centeredTop, left: target.left - card.width - GAP },
    // Below / above (best for short targets like search).
    { top: target.top + target.height + GAP, left: centeredLeft },
    { top: target.top - card.height - GAP, left: centeredLeft },
    // Corners of the viewport as last resorts.
    { top: VIEW_PAD, left: VIEW_PAD },
    {
      top: VIEW_PAD,
      left: viewport.width - card.width - VIEW_PAD,
    },
    {
      top: viewport.height - card.height - VIEW_PAD,
      left: VIEW_PAD,
    },
    {
      top: viewport.height - card.height - VIEW_PAD,
      left: viewport.width - card.width - VIEW_PAD,
    },
  ];

  let best: TourPoint | null = null;
  let bestOverlap = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const next = clamp(candidate, card, viewport);
    const cardRect: TourRect = {
      top: next.top,
      left: next.left,
      width: card.width,
      height: card.height,
    };
    const overlap = overlapArea(cardRect, target);
    // Prefer zero-overlap placements that match the candidate order.
    if (overlap === 0) {
      return next;
    }
    if (overlap < bestOverlap) {
      bestOverlap = overlap;
      best = next;
    }
  }

  return best ?? clamp({ top: VIEW_PAD, left: VIEW_PAD }, card, viewport);
}
