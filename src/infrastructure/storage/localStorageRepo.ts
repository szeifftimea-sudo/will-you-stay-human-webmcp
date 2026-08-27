import { z } from "zod";
import { GAME_PHASES, LENSES, type GameSession } from "../../domain/gameTypes";
import type { GameRepository } from "./gameRepository";

export const STORAGE_KEY = "ember-maradsz:game-session:v1";

const sessionEnvelopeSchema = z.object({
  schemaVersion: z.literal(1),
  contentVersion: z.string(),
  sessionId: z.string(),
  stateRevision: z.number().int().nonnegative(),
  language: z.literal("hu"),
  phase: z.enum(GAME_PHASES),
  startedAt: z.string(),
  updatedAt: z.string(),
  activeDilemmaId: z.string().nullable(),
  tentativeSelection: z
    .object({
      selectionId: z.string(),
      dilemmaId: z.string(),
      lens: z.enum(LENSES),
      provenance: z.literal("PLAYER_UI"),
      selectedAt: z.string(),
      supersedesSelectionId: z.string().nullable(),
    })
    .nullable(),
  presentedReflection: z.unknown().nullable(),
  confirmedDecision: z.unknown().nullable(),
  revealedOutcome: z.unknown().nullable(),
  outcomeHistory: z.array(z.unknown()),
  completedDilemmaIds: z.array(z.string()),
  balance: z.object({
    comfort: z.number(),
    control: z.number(),
    connection: z.number(),
    freedom: z.number(),
    responsibility: z.number(),
  }),
});

export class LocalStorageGameRepository implements GameRepository {
  constructor(private readonly storage: Storage) {}

  load(): GameSession | null {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return sessionEnvelopeSchema.parse(JSON.parse(raw)) as GameSession;
  }

  save(session: GameSession): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  clear(): void {
    this.storage.removeItem(STORAGE_KEY);
  }
}

