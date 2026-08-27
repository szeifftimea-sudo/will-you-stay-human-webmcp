import { createAgentCommandPort, type AgentCommandPort } from "../application/agentCommandPort";
import { createPlayerCommandPort, type PlayerCommandPort } from "../application/playerCommandPort";
import { createAgentQueryPort, type AgentQueryPort } from "../application/queryPorts";
import { dilemmaCatalog } from "../content/dilemmaCatalog.hu";
import { GameEngine } from "../domain/gameEngine";
import { createWebMcpToolDefinitions } from "../infrastructure/webmcp/toolHandlers";
import { LocalStorageGameRepository } from "../infrastructure/storage/localStorageRepo";
import type { GameRepository } from "../infrastructure/storage/gameRepository";

export interface AppServices {
  engine: GameEngine;
  playerCommands: PlayerCommandPort;
  agentCommands: AgentCommandPort;
  agentQuery: AgentQueryPort;
  webMcpTools: WebMcpToolDefinition[];
}

export function createAppServices(repository: GameRepository): AppServices {
  const engine = new GameEngine(dilemmaCatalog, repository);
  const playerCommands = createPlayerCommandPort(engine);
  const agentCommands = createAgentCommandPort(engine);
  const agentQuery = createAgentQueryPort(engine);
  const webMcpTools = createWebMcpToolDefinitions(
    agentCommands,
    agentQuery,
    () => engine.getSnapshot(),
  );
  return { engine, playerCommands, agentCommands, agentQuery, webMcpTools };
}

export const createBrowserServices = (): AppServices =>
  createAppServices(new LocalStorageGameRepository(window.localStorage));

