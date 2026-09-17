import type { Lens } from "../../domain/gameTypes";

/** Short English labels for digital selection only, not the ritual or domain copy. */
export const digitalSelectionMeaning = {
  brain: "The Machine helps; I decide.",
  hand: "I leave it to the Machine.",
  heart: "I decide and act.",
} satisfies Record<Lens, string>;
