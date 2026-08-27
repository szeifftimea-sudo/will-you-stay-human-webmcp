import type { GameSession } from "../../domain/gameTypes";

export interface GameRepository {
  load(): GameSession | null;
  save(session: GameSession): void;
  clear(): void;
}

export class MemoryGameRepository implements GameRepository {
  private session: GameSession | null = null;

  load(): GameSession | null {
    return this.session ? structuredClone(this.session) : null;
  }

  save(session: GameSession): void {
    this.session = structuredClone(session);
  }

  clear(): void {
    this.session = null;
  }
}

