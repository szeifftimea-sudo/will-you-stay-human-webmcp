import { describe, expect, it } from "vitest";
import { BALANCE_OPEN_DURATION_MS, balanceAxisIsActive, balanceMotionAt } from "../../src/ui/tabletop/balanceMotion";

describe("presentation-only balance opening timeline", () => {
  const revealDelayMs = 1800;
  const ordinary = { revealDelayMs, reducedMotion: false, memory: false };

  it("waits for the existing reveal delay, unfolds monotonically and ends exactly flat", () => {
    const initial = balanceMotionAt(0, ordinary);
    const waiting = balanceMotionAt(revealDelayMs - 1, ordinary);
    expect(initial.foldRadians).toBeGreaterThan(0);
    expect(waiting.foldRadians).toBeCloseTo(initial.foldRadians);
    expect(initial.progress).toBe(0);
    expect(waiting.progress).toBe(0);
    expect(waiting.contentOpacity).toBe(0);
    expect(waiting.pushScale).toBe(0.60);
    expect(balanceMotionAt(revealDelayMs + BALANCE_OPEN_DURATION_MS / 2, ordinary).pushScale).toBe(0.80);

    let previousAngle = initial.foldRadians;
    let previousProgress = 0;
    for (const fraction of [0, .1, .25, .5, .75, .9, 1]) {
      const pose = balanceMotionAt(revealDelayMs + BALANCE_OPEN_DURATION_MS * fraction, ordinary);
      expect(pose.foldRadians).toBeLessThanOrEqual(previousAngle);
      expect(pose.progress).toBeGreaterThanOrEqual(previousProgress);
      expect([pose.foldRadians, pose.progress, pose.pushScale, pose.contentOpacity].every(Number.isFinite)).toBe(true);
      expect(pose.contentOpacity).toBeGreaterThanOrEqual(0);
      expect(pose.contentOpacity).toBeLessThanOrEqual(1);
      previousAngle = pose.foldRadians;
      previousProgress = pose.progress;
    }

    expect(balanceMotionAt(revealDelayMs + BALANCE_OPEN_DURATION_MS, ordinary)).toMatchObject({
      foldRadians: 0, progress: 1, contentOpacity: 1, active: false,
    });
  });

  it.each([
    { reason: "reduced motion", reducedMotion: true, memory: false },
    { reason: "final game memory", reducedMotion: false, memory: true },
  ])("never folds or pushes the camera for $reason", ({ reducedMotion, memory }) => {
    for (const elapsed of [0, revealDelayMs, revealDelayMs + 450, 10000]) {
      expect(balanceMotionAt(elapsed, { revealDelayMs, reducedMotion, memory })).toMatchObject({
        foldRadians: 0, progress: 1, pushScale: 1, contentOpacity: 1, active: false,
      });
    }
  });

  it("is a stateless clock projection so late loads and repeated layout samples cannot restart it", () => {
    const midpoint = revealDelayMs + BALANCE_OPEN_DURATION_MS / 2;
    const first = balanceMotionAt(midpoint, ordinary);
    balanceMotionAt(0, ordinary);
    expect(balanceMotionAt(midpoint, ordinary)).toEqual(first);
    const final = balanceMotionAt(20000, ordinary);
    expect(final).toMatchObject({ foldRadians: 0, progress: 1, active: false });
    expect(balanceMotionAt(20001, ordinary)).toEqual(final);
  });
});

describe("presentation-only native axis focus window", () => {
  it("focuses a changing axis only during its existing native marker-slide window", () => {
    const options = { changing: true, reducedMotion: false, memory: false };
    expect(balanceAxisIsActive(2999, 3000, 680, options)).toBe(false);
    expect(balanceAxisIsActive(3000, 3000, 680, options)).toBe(true);
    expect(balanceAxisIsActive(3679, 3000, 680, options)).toBe(true);
    expect(balanceAxisIsActive(3680, 3000, 680, options)).toBe(false);
    expect(balanceAxisIsActive(10000, 3000, 680, options)).toBe(false);
  });

  it.each([
    { reason: "unchanged axes", changing: false, reducedMotion: false, memory: false },
    { reason: "reduced motion", changing: true, reducedMotion: true, memory: false },
    { reason: "final memory", changing: true, reducedMotion: false, memory: true },
  ])("keeps $reason quiet at every point in the timeline", ({ changing, reducedMotion, memory }) => {
    for (const elapsed of [0, 3000, 3300, 3679, 5000]) {
      expect(balanceAxisIsActive(elapsed, 3000, 680, { changing, reducedMotion, memory })).toBe(false);
    }
  });
});
