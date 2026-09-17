/** Presentation choreography only. No session, commands, decisions or balance math. */
export type RevealStep = 0 | 1 | 2 | 3;
export const REVEAL_COPY = [
  { eyebrow: "HEART IN THE MACHINE", title: "From Machine City. Into your hands.", description: "Turn your digital choices into something you can touch.", action: "Discover the tabletop edition" },
  { eyebrow: "THE TABLETOP EDITION", title: "A world, held in one box.", description: "A foldable Human Balance and five markers bring your online decisions into the physical world.", action: "Open the box" },
  { eyebrow: "MADE TO UNFOLD", title: "Built to unfold. Made to stay with you.", description: "Inside: the foldable Human Balance and five markers that carry your choices beyond the screen.", action: "Unfold the Human Balance" },
  { eyebrow: "HUMAN BALANCE", title: "Your choices. Made tangible.", description: "Five dimensions track what you kept — and what you handed to the Machine.", action: "Enter the game" },
] as const;
export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
export const ease = (value: number) => { const t = clamp01(value); return t*t*(3-2*t); };
/** Blender's single 6-second presentation clip: box opening (1.8 s), unfolding (4.2 s). */
export const revealClipTime = (position: number) => position <= 1
  ? 0 : position <= 2 ? clamp01(position-1)*1.8 : 1.8+clamp01(position-2)*4.2;
export function revealPose(position: number) {
  const opening = clamp01((position - 1.25) / .75);
  const unfold = clamp01(position - 2);
  return {
    lidLift: ease(opening / .40) * 2.0,
    lidAway: ease((opening - .35) / .65),
    lidRest: ease((opening - .72) / .28),
    // Full clearance before either leaf moves. This is not gameplay animation.
    boardLift: ease(unfold / .32),
    boardUnfold: ease((unfold - .35) / .40),
    markers: Array.from({length: 5}, (_, i) => ease((unfold - .76 - i*.035) / .10)),
  };
}
