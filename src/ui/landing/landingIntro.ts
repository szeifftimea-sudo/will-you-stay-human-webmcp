/** Presentation timing only. Never advances the game or invokes a command. */
export function landingIntro(elapsed: number, reducedMotion: boolean) {
  const linear = reducedMotion ? 1 : Math.max(0, Math.min(1, (elapsed - 3000) / 2000));
  return {
    humanOpacity: .72 * linear * linear * (3 - 2 * linear),
    copyStage: reducedMotion ? 4 : elapsed < 4700 ? 0 : elapsed < 5400 ? 1 : elapsed < 6100 ? 2 : elapsed < 7000 ? 3 : 4,
    entryReady: reducedMotion || elapsed >= 7700,
  };
}
