export type GameErrorCode =
  | "SESSION_NOT_FOUND"
  | "INVALID_PHASE"
  | "STALE_REVISION"
  | "NO_PLAYABLE_DILEMMA"
  | "DILEMMA_MISMATCH"
  | "TENTATIVE_SELECTION_REQUIRED"
  | "SELECTION_ID_MISMATCH"
  | "REFLECTION_REQUIRED"
  | "REFLECTION_ID_MISMATCH"
  | "REFLECTION_NOT_ACKNOWLEDGED"
  | "HUMAN_DECISION_REQUIRED"
  | "DECISION_ID_MISMATCH"
  | "CONTENT_VERSION_MISMATCH"
  | "STORAGE_CORRUPTED"
  | "INVALID_INPUT";

export class GameError extends Error {
  constructor(
    public readonly code: GameErrorCode,
    message: string,
    public readonly recoverable = true,
  ) {
    super(message);
    this.name = "GameError";
  }
}

