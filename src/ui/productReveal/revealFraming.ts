export type FrameRect = { left: number; top: number; right: number; bottom: number };

/** Presentation-only fit: preserve perspective, reserve real HTML copy/CTA space. */
export function fitProductFrame(bounds: FrameRect, safe: FrameRect) {
  const scale = Math.min(1,
    (safe.right - safe.left) / Math.max(1, bounds.right - bounds.left),
    (safe.bottom - safe.top) / Math.max(1, bounds.bottom - bounds.top));
  return {
    scale,
    x: (safe.left + safe.right) / 2 - scale * (bounds.left + bounds.right) / 2,
    y: (safe.top + safe.bottom) / 2 - scale * (bounds.top + bounds.bottom) / 2,
  };
}
