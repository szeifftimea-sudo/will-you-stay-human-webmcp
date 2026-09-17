import type { GameSession } from "../domain/gameTypes";
import { LocalStorageGameRepository } from "../infrastructure/storage/localStorageRepo";

// Tab-local presentation bookmark, never part of the game session or tool contract.
export const PRODUCT_RETURN_KEY = "ember-maradsz:product-return:v1";
export const PRODUCT_FROM_BALANCE = "/product?from=human-balance";
export const RETURN_TO_BALANCE = "/play?view=human-balance";

export function rememberBalanceReturn(session: GameSession): void {
  if (session.phase !== "CONSEQUENCE_REVEALED" || !session.revealedOutcome) return;
  try {
    window.sessionStorage.setItem(PRODUCT_RETURN_KEY, JSON.stringify({
      sessionId: session.sessionId,
      revision: session.stateRevision,
      decisionId: session.revealedOutcome.decisionId,
    }));
  } catch { /* Unavailable presentation storage must not affect the game. */ }
}

export function hasBalanceReturn(session: GameSession | null): boolean {
  if (session?.phase !== "CONSEQUENCE_REVEALED" || !session.revealedOutcome) return false;
  try {
    const saved = JSON.parse(window.sessionStorage.getItem(PRODUCT_RETURN_KEY) ?? "null");
    return Boolean(saved && saved.sessionId === session.sessionId
      && saved.revision === session.stateRevision
      && saved.decisionId === session.revealedOutcome.decisionId
      && saved.decisionId === session.confirmedDecision?.decisionId);
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
