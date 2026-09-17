/** Presentation only: this clock never produces a balance value or a command. */
export const BALANCE_OPEN_DURATION_MS = 900;
export const BALANCE_OPEN_ANGLE_RADIANS = 35 * Math.PI / 180;

type MotionOptions = { revealDelayMs: number; reducedMotion: boolean; memory: boolean };

export function balanceMotionAt(elapsedMs: number, { revealDelayMs, reducedMotion, memory }: MotionOptions) {
  if (reducedMotion || memory) {
    return { foldRadians: 0, progress: 1, pushScale: 1, contentOpacity: 1, active: false };
  }
  const progress = Math.max(0, Math.min(1, (elapsedMs - revealDelayMs) / BALANCE_OPEN_DURATION_MS));
  const eased = 1 - (1 - progress) ** 3;
  // Text fades in only as its physical leaves approach their final plane. Its
  // DOM and accessible reading order remain present throughout the opening.
  const readable = Math.max(0, Math.min(1, (progress - .6) / .4));
  return {
    foldRadians: BALANCE_OPEN_ANGLE_RADIANS * (1 - eased),
    progress,
    // Pull back while the raised leaves sweep toward the camera, then approach
    // the open product. This keeps the thicker 3/4 object below the HTML heading.
    pushScale: .60 + .40 * progress,
    contentOpacity: readable * readable * (3 - 2 * readable),
    active: progress < 1,
  };
}

export function balanceAxisIsActive(
  elapsedMs: number,
  delayMs: number,
  durationMs: number,
  { changing, reducedMotion, memory }: { changing: boolean; reducedMotion: boolean; memory: boolean },
) {
  return changing && !reducedMotion && !memory && elapsedMs >= delayMs && elapsedMs < delayMs + durationMs;
}
