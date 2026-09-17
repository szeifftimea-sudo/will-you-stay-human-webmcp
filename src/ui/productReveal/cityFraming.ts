import { ease } from "./revealSequence";

/** The city fills the view; only the physical product needs fit-to-width.
 * Pulling the city camera back on a tall viewport hid it in fog/clipping. */
export function productCameraDistanceScale(aspect: number, position: number) {
  return 1 + (Math.max(1, 1.55 / Math.max(.1, aspect)) - 1) * ease(position / .82);
}
