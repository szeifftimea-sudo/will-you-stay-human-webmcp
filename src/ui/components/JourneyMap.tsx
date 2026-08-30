import type { GamePhase } from "../../domain/gameTypes";

export type JourneyStepId =
  | "connection"
  | "dilemma"
  | "direction"
  | "counterpoint"
  | "retention"
  | "confirmation"
  | "imprint";

const ACTIVE_STEP_BY_PHASE: Record<GamePhase | "NO_SESSION", JourneyStepId> = {
  NO_SESSION: "connection",
  MACHINE_CITY_READY: "dilemma",
  AWAITING_HUMAN_SELECTION: "direction",
  TENTATIVE_SELECTION_RECORDED: "counterpoint",
  REFLECTION_PRESENTED: "retention",
  READY_FOR_CONFIRMATION: "confirmation",
  DECISION_CONFIRMED: "imprint",
  CONSEQUENCE_REVEALED: "imprint",
  GAME_COMPLETE: "imprint",
};

export function getActiveJourneyStep(phase: GamePhase | "NO_SESSION"): JourneyStepId {
  return ACTIVE_STEP_BY_PHASE[phase];
}
