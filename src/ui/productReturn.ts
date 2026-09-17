import type { GameSession } from "../domain/gameTypes";
import { LocalStorageGameRepository } from "../infrastructure/storage/localStorageRepo";

/** Read-only presentation snapshot. Keep Three.js out of the HTML entry chunk. */
export function readProductBalance(): GameSession["balance"] | null {
  try {
    const balance = new LocalStorageGameRepository(window.localStorage).load()?.balance;
    if (!balance || Object.values(balance).some(value => !Number.isFinite(value) || value < -2 || value > 2)) return null;
    return { ...balance };
  } catch { return null; }
}

// Tab-local presentation bookmark, never part of the game session or tool contract.
export const PRODUCT_RETURN_KEY = "ember-maradsz:product-return:v1";
export const PRODUCT_FROM_BALANCE = "/product?from=human-balance";
export const RETURN_TO_BALANCE = "/play?view=human-balance";

export function rememberBalanceReturn(session: GameSession): void {
  if (!["CONSEQUENCE_REVEALED", "GAME_COMPLETE"].includes(session.phase)) return;
  const outcome = session.revealedOutcome ?? session.outcomeHistory.at(-1);
  if (!outcome) return;
  try {
    window.sessionStorage.setItem(PRODUCT_RETURN_KEY, JSON.stringify({
      sessionId: session.sessionId,
      revision: session.stateRevision,
      decisionId: outcome.decisionId,
    }));
  } catch { /* Unavailable presentation storage must not affect the game. */ }
}

export function hasBalanceReturn(session: GameSession | null): boolean {
  if (!session || !["CONSEQUENCE_REVEALED", "GAME_COMPLETE"].includes(session.phase)) return false;
  const decisionId = session.revealedOutcome?.decisionId ?? session.outcomeHistory.at(-1)?.decisionId;
  if (!decisionId) return false;
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(PRODUCT_RETURN_KEY) ?? "null");
    return Boolean(saved && saved.sessionId === session.sessionId
      && saved.revision === session.stateRevision
      && saved.decisionId === decisionId
      && (session.phase === "GAME_COMPLETE" || saved.decisionId === session.confirmedDecision?.decisionId));
  } catch { return false; }
}

export function shouldRestoreBalance(session: GameSession | null): boolean {
  return new URLSearchParams(window.location.search).get("view") === "human-balance"
    && hasBalanceReturn(session);
}

export function productReturnsToBalance(): boolean {
  if (new URLSearchParams(window.location.search).get("from") !== "human-balance") return false;
  try {
    return hasBalanceReturn(new LocalStorageGameRepository(window.localStorage).load());
  } catch { return false; }
}
