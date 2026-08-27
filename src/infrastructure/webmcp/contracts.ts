import { z } from "zod";

const sessionId = z.string().min(1).max(64);
const opaqueId = z.string().min(1).max(64);
const revision = z.number().int().nonnegative();

export const enterMachineCityInput = z.object({}).strict();
export const presentDilemmaInput = z
  .object({ sessionId, expectedRevision: revision })
  .strict();
export const getCurrentGameStateInput = z.object({ sessionId }).strict();
export const presentChoiceReflectionInput = z
  .object({ sessionId, tentativeSelectionId: opaqueId, expectedRevision: revision })
  .strict();
export const revealConfirmedConsequenceInput = z
  .object({ sessionId, confirmedDecisionId: opaqueId, expectedRevision: revision })
  .strict();

export const toolInputSchemas = {
  enter_machine_city: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  present_dilemma: {
    type: "object",
    properties: {
      sessionId: { type: "string", minLength: 1, maxLength: 64 },
      expectedRevision: { type: "integer", minimum: 0 },
    },
    required: ["sessionId", "expectedRevision"],
    additionalProperties: false,
  },
  get_current_game_state: {
    type: "object",
    properties: {
      sessionId: { type: "string", minLength: 1, maxLength: 64 },
    },
    required: ["sessionId"],
    additionalProperties: false,
  },
  present_choice_reflection: {
    type: "object",
    properties: {
      sessionId: { type: "string", minLength: 1, maxLength: 64 },
      tentativeSelectionId: { type: "string", minLength: 1, maxLength: 64 },
      expectedRevision: { type: "integer", minimum: 0 },
    },
    required: ["sessionId", "tentativeSelectionId", "expectedRevision"],
    additionalProperties: false,
  },
  reveal_confirmed_consequence: {
    type: "object",
    properties: {
      sessionId: { type: "string", minLength: 1, maxLength: 64 },
      confirmedDecisionId: { type: "string", minLength: 1, maxLength: 64 },
      expectedRevision: { type: "integer", minimum: 0 },
    },
    required: ["sessionId", "confirmedDecisionId", "expectedRevision"],
    additionalProperties: false,
  },
} as const;

export const WEBMCP_TOOL_NAMES = Object.freeze([
  "enter_machine_city",
  "present_dilemma",
  "get_current_game_state",
  "present_choice_reflection",
  "reveal_confirmed_consequence",
] as const);

export type WebMcpToolName = (typeof WEBMCP_TOOL_NAMES)[number];

