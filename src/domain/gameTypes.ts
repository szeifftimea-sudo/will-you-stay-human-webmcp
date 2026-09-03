export const LENSES = ["brain", "hand", "heart"] as const;
export type Lens = (typeof LENSES)[number];

export const GAME_PHASES = [
  "MACHINE_CITY_READY",
  "AWAITING_HUMAN_SELECTION",
  "TENTATIVE_SELECTION_RECORDED",
  "REFLECTION_PRESENTED",
  "READY_FOR_CONFIRMATION",
  "DECISION_CONFIRMED",
  "CONSEQUENCE_REVEALED",
  "GAME_COMPLETE",
] as const;

export type GamePhase = (typeof GAME_PHASES)[number];

export interface HumanBalance {
  comfort: number;
  control: number;
  connection: number;
  freedom: number;
  responsibility: number;
}

export type BalanceDelta = HumanBalance;

export interface ReflectionContent {
  counterargument: string;
  blindSpot: string;
  secondaryConsequence: string;
  question: string;
}

export interface Consequence {
  delta: BalanceDelta;
  gains: string[];
  costs: string[];
  explanation: string;
  closingReflection: string;
  physicalInstructions: string[];
}

export interface LensOption {
  lens: Lens;
  label: "AGY" | "KÉZ" | "SZÍV";
  framing: string;
  choiceText: string;
  reflection: ReflectionContent;
  consequence: Consequence;
}

export interface Dilemma {
  id: string;
  version: string;
  status: "draft" | "playable" | "disabled";
  order: number;
  shortTitle: string;
  title: string;
  callPrompt: string;
  situation: string;
  automationPromise: string;
  centralTension: string;
  contentNotice: string | null;
  canSkip: boolean;
  lenses: [LensOption, LensOption, LensOption];
}

export interface DilemmaCatalog {
  schemaVersion: 1;
  contentVersion: string;
  language: "hu";
  dilemmas: Dilemma[];
}

export interface TentativeSelection {
  selectionId: string;
  dilemmaId: string;
  lens: Lens;
  provenance: "PLAYER_UI";
  selectedAt: string;
  supersedesSelectionId: string | null;
}

export interface PresentedReflection {
  reflectionId: string;
  selectionId: string;
  dilemmaId: string;
  lens: Lens;
  contentVersion: string;
  provenance: "WEBMCP_AGENT";
  presentedAt: string;
  acknowledgedAt: string | null;
}

export interface ConfirmedDecision {
  decisionId: string;
  dilemmaId: string;
  lens: Lens;
  basedOnSelectionId: string;
  basedOnReflectionId: string;
  reasoning: string;
  provenance: "PLAYER_UI";
  confirmedAt: string;
  consumedAt: string | null;
}

export interface ConsequenceRevealPayload {
  dilemmaId: string;
  decisionId: string;
  lens: Lens;
  gains: string[];
  costs: string[];
  explanation: string;
  closingReflection: string;
  rawDelta: BalanceDelta;
  appliedDelta: BalanceDelta;
  balanceBefore: HumanBalance;
  balanceAfter: HumanBalance;
  physicalInstructions: string[];
  alreadyRevealed: boolean;
}

export interface ToolExecutionReceipt {
  tool: "reveal_confirmed_consequence";
  requestFingerprint: string;
  resultPayload: ConsequenceRevealPayload;
  completedAt: string;
}

export interface RevealedOutcome {
  decisionId: string;
  dilemmaId: string;
  lens: Lens;
  consequence: Consequence;
  rawDelta: BalanceDelta;
  appliedDelta: BalanceDelta;
  balanceBefore: HumanBalance;
  balanceAfter: HumanBalance;
  revealedAt: string;
  effectApplicationKey: string;
  effectApplied: true;
  toolExecution: ToolExecutionReceipt;
}

export interface GameSession {
  schemaVersion: 1;
  contentVersion: string;
  sessionId: string;
  stateRevision: number;
  language: "hu";
  phase: GamePhase;
  startedAt: string;
  updatedAt: string;
  activeDilemmaId: string | null;
  tentativeSelection: TentativeSelection | null;
  presentedReflection: PresentedReflection | null;
  confirmedDecision: ConfirmedDecision | null;
  revealedOutcome: RevealedOutcome | null;
  outcomeHistory: RevealedOutcome[];
  completedDilemmaIds: string[];
  balance: HumanBalance;
}

export interface PublicDilemma {
  id: string;
  shortTitle: string;
  title: string;
  callPrompt: string;
  situation: string;
  automationPromise: string;
  centralTension: string;
  contentNotice: string | null;
  canSkip: boolean;
  choices: Array<Pick<LensOption, "lens" | "label" | "framing" | "choiceText">>;
}

export interface ReflectionPayload {
  tentativeSelectionId: string;
  reflectionId: string;
  selectedLens: Lens;
  reflection: ReflectionContent;
  alreadyPresented: boolean;
}

export const ZERO_BALANCE: HumanBalance = {
  comfort: 0,
  control: 0,
  connection: 0,
  freedom: 0,
  responsibility: 0,
};
