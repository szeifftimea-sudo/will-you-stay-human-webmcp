import type { GameEngine, PresentDilemmaResult } from "../domain/gameEngine";
import type {
  ConsequenceRevealPayload,
  GameSession,
  ReflectionPayload,
} from "../domain/gameTypes";

export interface AgentCommandPort {
  enterMachineCity(): { session: GameSession; resumed: boolean };
  presentDilemma(sessionId: string, expectedRevision: number): PresentDilemmaResult;
  presentChoiceReflection(
    sessionId: string,
    tentativeSelectionId: string,
    expectedRevision: number,
  ): { session: GameSession; payload: ReflectionPayload };
  revealConfirmedConsequence(
    sessionId: string,
    confirmedDecisionId: string,
    expectedRevision: number,
  ): { session: GameSession; payload: ConsequenceRevealPayload };
}

export function createAgentCommandPort(engine: GameEngine): AgentCommandPort {
  return {
    enterMachineCity: () => engine.enterMachineCity(),
    presentDilemma: (sessionId, expectedRevision) =>
      engine.presentDilemma(sessionId, expectedRevision),
    presentChoiceReflection: (sessionId, tentativeSelectionId, expectedRevision) =>
      engine.presentChoiceReflection(sessionId, tentativeSelectionId, expectedRevision),
    revealConfirmedConsequence: (sessionId, confirmedDecisionId, expectedRevision) =>
      engine.revealConfirmedConsequence(sessionId, confirmedDecisionId, expectedRevision),
  };
}

