import type { AgentCommandPort } from "../../application/agentCommandPort";
import type { AgentQueryPort } from "../../application/queryPorts";
import { GameError } from "../../domain/gameErrors";
import type { GamePhase, GameSession } from "../../domain/gameTypes";
import { ZodError, type ZodType } from "zod";
import {
  enterMachineCityInput,
  getCurrentGameStateInput,
  presentChoiceReflectionInput,
  presentDilemmaInput,
  revealConfirmedConsequenceInput,
  toolInputSchemas,
  type WebMcpToolName,
} from "./contracts";

interface ToolSuccess<T> {
  ok: true;
  tool: WebMcpToolName;
  schemaVersion: 1;
  sessionId: string;
  phase: GamePhase;
  stateRevision: number;
  data: T;
  nextAllowedActions: string[];
}

interface ToolFailure {
  ok: false;
  tool: WebMcpToolName;
  schemaVersion: 1;
  sessionId: string | null;
  phase: GamePhase | null;
  stateRevision: number | null;
  error: {
    code: string;
    message: string;
    recoverable: boolean;
  };
}

const nextActions = (phase: GamePhase): string[] => {
  switch (phase) {
    case "MACHINE_CITY_READY":
    case "CONSEQUENCE_REVEALED":
      return ["present_dilemma", "get_current_game_state"];
    case "TENTATIVE_SELECTION_RECORDED":
      return ["present_choice_reflection", "get_current_game_state"];
    case "DECISION_CONFIRMED":
      return ["reveal_confirmed_consequence", "get_current_game_state"];
    default:
      return ["get_current_game_state"];
  }
};

const success = <T>(
  tool: WebMcpToolName,
  session: GameSession,
  data: T,
): ToolSuccess<T> => ({
  ok: true,
  tool,
  schemaVersion: 1,
  sessionId: session.sessionId,
  phase: session.phase,
  stateRevision: session.stateRevision,
  data,
  nextAllowedActions: nextActions(session.phase),
});

const failure = (
  tool: WebMcpToolName,
  error: unknown,
  session: GameSession | null,
): ToolFailure => {
  const normalized =
    error instanceof GameError
      ? error
      : error instanceof ZodError
        ? new GameError("INVALID_INPUT", "A tool bemenete nem felel meg a zárt sémának.")
        : new GameError("INVALID_INPUT", error instanceof Error ? error.message : "Ismeretlen hiba.", false);
  return {
    ok: false,
    tool,
    schemaVersion: 1,
    sessionId: session?.sessionId ?? null,
    phase: session?.phase ?? null,
    stateRevision: session?.stateRevision ?? null,
    error: {
      code: normalized.code,
      message: normalized.message,
      recoverable: normalized.recoverable,
    },
  };
};

const definition = <TInput extends Record<string, unknown>>(
  name: WebMcpToolName,
  title: string,
  description: string,
  schema: Record<string, unknown>,
  parser: ZodType<TInput>,
  readOnlyHint: boolean,
  getSession: () => GameSession | null,
  handler: (input: TInput) => unknown,
): WebMcpToolDefinition => ({
  name,
  title,
  description,
  inputSchema: schema,
  annotations: { readOnlyHint, untrustedContentHint: false },
  async execute(input, { signal }) {
    if (signal.aborted) {
      return failure(name, new GameError("INVALID_INPUT", "A toolhívás megszakadt."), getSession());
    }
    try {
      return handler(parser.parse(input));
    } catch (error) {
      return failure(name, error, getSession());
    }
  },
});

export function createWebMcpToolDefinitions(
  agentCommands: AgentCommandPort,
  agentQuery: AgentQueryPort,
  getSession: () => GameSession | null,
): WebMcpToolDefinition[] {
  return [
    definition(
      "enter_machine_city",
      "Belépés a Gépvárosba",
      "Aktív magyar játékmenetet hoz létre vagy a meglévőt folytatja. Nem nulláz játékot.",
      toolInputSchemas.enter_machine_city,
      enterMachineCityInput,
      false,
      getSession,
      () => {
        const { session, resumed } = agentCommands.enterMachineCity();
        return success("enter_machine_city", session, {
          language: session.language,
          resumed,
          balance: session.balance,
          playableDilemmaCount: 1,
        });
      },
    ),
    definition(
      "present_dilemma",
      "Dilemma bemutatása",
      "Bemutatja a következő kurált dilemmát. Választást vagy emberi megerősítést nem hoz létre.",
      toolInputSchemas.present_dilemma,
      presentDilemmaInput,
      false,
      getSession,
      ({ sessionId, expectedRevision }) => {
        const { session, dilemma, gameComplete } = agentCommands.presentDilemma(
          sessionId,
          expectedRevision,
        );
        return success("present_dilemma", session, {
          dilemma,
          gameComplete,
          decisionStatus: gameComplete ? "complete" : "awaiting_human_selection",
        });
      },
    ),
    definition(
      "get_current_game_state",
      "Aktuális játékállapot",
      "A szerepkör szerint szűrt játékállapotot olvassa. Nem módosít állapotot.",
      toolInputSchemas.get_current_game_state,
      getCurrentGameStateInput,
      true,
      getSession,
      ({ sessionId }) => {
        const view = agentQuery.getCurrentGameState(sessionId);
        const session = getSession();
        if (!session) throw new GameError("SESSION_NOT_FOUND", "Nincs aktív session.");
        return success("get_current_game_state", session, view);
      },
    ),
    definition(
      "present_choice_reflection",
      "A kijelölt irány ellenpontja",
      "Kizárólag a játékos aktuális kijelöléséhez tartozó ellenérvet és kérdést mutatja meg. Nem választhat és nem erősíthet meg.",
      toolInputSchemas.present_choice_reflection,
      presentChoiceReflectionInput,
      false,
      getSession,
      ({ sessionId, tentativeSelectionId, expectedRevision }) => {
        const { session, payload } = agentCommands.presentChoiceReflection(
          sessionId,
          tentativeSelectionId,
          expectedRevision,
        );
        return success("present_choice_reflection", session, payload);
      },
    ),
    definition(
      "reveal_confirmed_consequence",
      "Megerősített döntés következménye",
      "Egy már ember által megerősített döntés statikus következményét pontosan egyszer alkalmazza és tárja fel.",
      toolInputSchemas.reveal_confirmed_consequence,
      revealConfirmedConsequenceInput,
      false,
      getSession,
      ({ sessionId, confirmedDecisionId, expectedRevision }) => {
        const { session, payload } = agentCommands.revealConfirmedConsequence(
          sessionId,
          confirmedDecisionId,
          expectedRevision,
        );
        return success("reveal_confirmed_consequence", session, payload);
      },
    ),
  ];
}

