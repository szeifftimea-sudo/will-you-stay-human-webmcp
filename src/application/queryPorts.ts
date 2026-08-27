import type { GameEngine } from "../domain/gameEngine";
import { GameError } from "../domain/gameErrors";
import type {
  GamePhase,
  HumanBalance,
  Lens,
  PublicDilemma,
  ReflectionContent,
} from "../domain/gameTypes";

export interface AgentGameView {
  language: "hu";
  sessionId: string;
  phase: GamePhase;
  stateRevision: number;
  activeDilemma: { id: string; title: string } | null;
  tentativeSelectionId: string | null;
  tentativeLens: Lens | null;
  reflectionId: string | null;
  reflectionAcknowledged: boolean;
  confirmedDecisionId: string | null;
  confirmedLens: Lens | null;
  balance: HumanBalance;
  completedDilemmaIds: string[];
}

export interface AgentQueryPort {
  getCurrentGameState(sessionId: string): AgentGameView;
}

export interface UiGameView {
  session: ReturnType<GameEngine["getSnapshot"]>;
  activeDilemma: PublicDilemma | null;
  reflection: ReflectionContent | null;
}

const publicDilemma = (engine: GameEngine): PublicDilemma | null => {
  const dilemma = engine.getActiveDilemma();
  if (!dilemma) return null;
  return {
    id: dilemma.id,
    title: dilemma.title,
    callPrompt: dilemma.callPrompt,
    situation: dilemma.situation,
    automationPromise: dilemma.automationPromise,
    centralTension: dilemma.centralTension,
    contentNotice: dilemma.contentNotice,
    canSkip: dilemma.canSkip,
    choices: dilemma.lenses.map(({ lens, label, framing, choiceText }) => ({
      lens,
      label,
      framing,
      choiceText,
    })),
  };
};

export function createAgentQueryPort(engine: GameEngine): AgentQueryPort {
  return {
    getCurrentGameState(sessionId) {
      const session = engine.getSnapshot();
      if (!session || session.sessionId !== sessionId) {
        throw new GameError("SESSION_NOT_FOUND", "Nincs ilyen aktív játékmenet.");
      }
      const dilemma = engine.getActiveDilemma();
      return {
        language: session.language,
        sessionId: session.sessionId,
        phase: session.phase,
        stateRevision: session.stateRevision,
        activeDilemma: dilemma ? { id: dilemma.id, title: dilemma.title } : null,
        tentativeSelectionId: session.tentativeSelection?.selectionId ?? null,
        tentativeLens: session.tentativeSelection?.lens ?? null,
        reflectionId: session.presentedReflection?.reflectionId ?? null,
        reflectionAcknowledged: Boolean(session.presentedReflection?.acknowledgedAt),
        confirmedDecisionId: session.confirmedDecision?.decisionId ?? null,
        confirmedLens: session.confirmedDecision?.lens ?? null,
        balance: session.balance,
        completedDilemmaIds: [...session.completedDilemmaIds],
      };
    },
  };
}

export function getUiGameView(engine: GameEngine): UiGameView {
  const session = engine.getSnapshot();
  const dilemma = engine.getActiveDilemma();
  const selectedLens = session?.tentativeSelection?.lens;
  return {
    session,
    activeDilemma: publicDilemma(engine),
    reflection:
      session?.presentedReflection && selectedLens
        ? dilemma?.lenses.find(({ lens }) => lens === selectedLens)?.reflection ?? null
        : null,
  };
}
