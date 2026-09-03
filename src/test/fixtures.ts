import { createAgentCommandPort } from "../application/agentCommandPort";
import { createPlayerCommandPort } from "../application/playerCommandPort";
import { createAgentQueryPort } from "../application/queryPorts";
import { dilemmaCatalog } from "../content/dilemmaCatalog.hu";
import type { DilemmaCatalog } from "../domain/gameTypes";
import { GameEngine } from "../domain/gameEngine";
import { MemoryGameRepository } from "../infrastructure/storage/gameRepository";

export function createTestEngine(catalog: DilemmaCatalog = dilemmaCatalog) {
  let id = 0;
  let tick = 0;
  const repository = new MemoryGameRepository();
  const engine = new GameEngine(catalog, repository, {
    idFactory: () => `id-${++id}`,
    now: () => `2026-08-27T10:00:${String(tick++).padStart(2, "0")}.000Z`,
  });
  return {
    engine,
    repository,
    player: createPlayerCommandPort(engine),
    agent: createAgentCommandPort(engine),
    query: createAgentQueryPort(engine),
  };
}

export function advanceToConfirmedDecision(catalog: DilemmaCatalog = dilemmaCatalog) {
  const context = createTestEngine(catalog);
  const entered = context.agent.enterMachineCity().session;
  context.agent.presentDilemma(entered.sessionId, entered.stateRevision);
  context.player.selectLens("brain");
  let session = context.engine.getSnapshot()!;
  context.agent.presentChoiceReflection(
    session.sessionId,
    session.tentativeSelection!.selectionId,
    session.stateRevision,
  );
  session = context.engine.getSnapshot()!;
  context.player.acknowledgeReflection(session.presentedReflection!.reflectionId);
  context.player.confirmDecision("A végső kontrollt magamnál tartom.");
  return context;
}
