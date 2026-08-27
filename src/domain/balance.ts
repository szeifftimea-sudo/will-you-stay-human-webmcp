import type { BalanceDelta, HumanBalance } from "./gameTypes";

const KEYS = ["comfort", "control", "connection", "freedom", "responsibility"] as const;

const clamp = (value: number): number => Math.max(-2, Math.min(2, value));

export function applyBalanceDelta(
  before: HumanBalance,
  rawDelta: BalanceDelta,
): { balanceAfter: HumanBalance; appliedDelta: BalanceDelta } {
  const balanceAfter = { ...before };
  const appliedDelta = { ...rawDelta };

  for (const key of KEYS) {
    balanceAfter[key] = clamp(before[key] + rawDelta[key]);
    appliedDelta[key] = balanceAfter[key] - before[key];
  }

  return { balanceAfter, appliedDelta };
}

