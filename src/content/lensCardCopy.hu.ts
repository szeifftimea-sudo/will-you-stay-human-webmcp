import type { Lens, LensOption } from "../domain/gameTypes";

type LensCardCopy = Pick<LensOption, "label" | "framing" | "choiceText">;

export const lensCardCopyHu = {
  brain: {
    label: "AGY",
    framing: "Segítséget kérek, én döntök",
    choiceText: "A Gép segít elindulni, de a döntés az enyém.",
  },
  hand: {
    label: "KÉZ",
    framing: "Rábízom a Gépre",
    choiceText: "A Gép végzi el helyettem.",
  },
  heart: {
    label: "SZÍV",
    framing: "Én viszem végig",
    choiceText: "Én döntök és én cselekszem.",
  },
} satisfies Record<Lens, LensCardCopy>;

export const lensChoiceInstructionHu = "Válaszd ki, meddig segítsen Futura.";

export const lensSelectionFeedbackHu = {
  brain: "Segítséget kértél, de a döntés a tiéd.",
  hand: "Rábíztad a feladatot a Gépre.",
  heart: "Úgy döntöttél, hogy te viszed végig.",
} satisfies Record<Lens, string>;
