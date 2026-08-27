import type { GameEngine } from "../domain/gameEngine";
import type { GameSession, Lens } from "../domain/gameTypes";

export interface PlayerCommandPort {
  selectLens(lens: Lens): GameSession;
  acknowledgeReflection(reflectionId: string): GameSession;
  confirmDecision(reasoning?: string): GameSession;
  resetGame(): void;
}

export function createPlayerCommandPort(engine: GameEngine): PlayerCommandPort {
  return {
    selectLens: (lens) => engine.selectLens(lens),
    acknowledgeReflection: (reflectionId) => engine.acknowledgeReflection(reflectionId),
    confirmDecision: (reasoning) => engine.confirmDecision(reasoning),
    resetGame: () => engine.resetGame(),
  };
}

