import { GameError } from "./gameErrors";
import type { DilemmaCatalog, GameSession } from "./gameTypes";

const ACTIVE_PHASES = new Set([
  "AWAITING_HUMAN_SELECTION",
  "TENTATIVE_SELECTION_RECORDED",
  "REFLECTION_PRESENTED",
  "READY_FOR_CONFIRMATION",
  "DECISION_CONFIRMED",
  "CONSEQUENCE_REVEALED",
]);

export function assertSessionInvariants(session: GameSession, catalog: DilemmaCatalog): void {
  if (session.contentVersion !== catalog.contentVersion) {
    throw new GameError("CONTENT_VERSION_MISMATCH", "A session tartalomverziója nem kompatibilis.", false);
  }

  if (ACTIVE_PHASES.has(session.phase) && !session.activeDilemmaId) {
    throw new GameError(
      "DILEMMA_MISMATCH",
      "Kiválasztható vagy aktív állapot nem létezhet bemutatott dilemma nélkül.",
      false,
    );
  }

  if (
    session.activeDilemmaId &&
    !catalog.dilemmas.some((dilemma) => dilemma.id === session.activeDilemmaId)
  ) {
    throw new GameError("DILEMMA_MISMATCH", "Az aktív dilemma nem található a katalógusban.", false);
  }

  if (session.phase === "AWAITING_HUMAN_SELECTION" && session.tentativeSelection) {
    throw new GameError("DILEMMA_MISMATCH", "A kijelölésre váró állapot már tartalmaz kijelölést.", false);
  }

  if (
    ["TENTATIVE_SELECTION_RECORDED", "REFLECTION_PRESENTED", "READY_FOR_CONFIRMATION"].includes(
      session.phase,
    ) &&
    (!session.tentativeSelection || session.tentativeSelection.provenance !== "PLAYER_UI")
  ) {
    throw new GameError("TENTATIVE_SELECTION_REQUIRED", "Hiányzik a játékosi kijelölés.", false);
  }

  if (
    ["REFLECTION_PRESENTED", "READY_FOR_CONFIRMATION", "DECISION_CONFIRMED"].includes(
      session.phase,
    ) &&
    (!session.presentedReflection ||
      !session.tentativeSelection ||
      session.presentedReflection.selectionId !== session.tentativeSelection.selectionId ||
      session.presentedReflection.lens !== session.tentativeSelection.lens)
  ) {
    throw new GameError("REFLECTION_REQUIRED", "Hiányzik az aktuális kijelöléshez kötött reflexió.", false);
  }

  if (
    session.phase === "READY_FOR_CONFIRMATION" &&
    !session.presentedReflection?.acknowledgedAt
  ) {
    throw new GameError(
      "REFLECTION_NOT_ACKNOWLEDGED",
      "A reflexiót kizárólag a játékos tarthatja meg.",
      false,
    );
  }

  if (session.phase === "DECISION_CONFIRMED") {
    const decision = session.confirmedDecision;
    if (
      !decision ||
      decision.provenance !== "PLAYER_UI" ||
      decision.basedOnSelectionId !== session.tentativeSelection?.selectionId ||
      decision.basedOnReflectionId !== session.presentedReflection?.reflectionId ||
      !session.presentedReflection.acknowledgedAt
    ) {
      throw new GameError("HUMAN_DECISION_REQUIRED", "Nincs érvényes emberi megerősítés.", false);
    }
  }

  if (session.phase === "CONSEQUENCE_REVEALED") {
    const outcome = session.revealedOutcome;
    if (
      !outcome ||
      !outcome.effectApplied ||
      outcome.effectApplicationKey !== outcome.decisionId ||
      !session.outcomeHistory.some((item) => item.decisionId === outcome.decisionId)
    ) {
      throw new GameError("DILEMMA_MISMATCH", "A feltárt következmény bizonylata hiányos.", false);
    }
  }

  const effectKeys = session.outcomeHistory.map((outcome) => outcome.effectApplicationKey);
  if (new Set(effectKeys).size !== effectKeys.length) {
    throw new GameError("DILEMMA_MISMATCH", "Egy döntés hatása többször szerepel.", false);
  }
}

