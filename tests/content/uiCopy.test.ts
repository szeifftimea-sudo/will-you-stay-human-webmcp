import { describe, expect, it } from "vitest";
import { dilemmaCatalog } from "../../src/content/dilemmaCatalog.hu";
import {
  localizeConsequence,
  localizeDilemma,
  localizeReflection,
  uiCopy,
} from "../../src/content/uiCopy";

function keyPaths(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => keyPaths(item, `${prefix}[${index}]`));
  }
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      keyPaths(item, prefix ? `${prefix}.${key}` : key));
  }
  return [prefix];
}

describe("HU/EN presentation copy", () => {
  it("azonos fordítási kulcsstruktúrát tart fenn mindkét nyelven", () => {
    expect(keyPaths(uiCopy.en).sort()).toEqual(keyPaths(uiCopy.hu).sort());
  });

  it("a magyar prezentációs dilemma-copy a domainkatalógus látható mezőivel egyezik", () => {
    for (const dilemma of dilemmaCatalog.dilemmas) {
      const localized = localizeDilemma({
        id: dilemma.id,
        shortTitle: dilemma.shortTitle,
        title: dilemma.title,
        callPrompt: dilemma.callPrompt,
        situation: dilemma.situation,
        automationPromise: dilemma.automationPromise,
        centralTension: dilemma.centralTension,
        contentNotice: dilemma.contentNotice,
        canSkip: dilemma.canSkip,
        choices: dilemma.lenses.map(({ lens, label, framing, choiceText }) => ({
          lens,
          label,
          framing,
          choiceText,
        })),
      }, "hu");

      expect(localized).toMatchObject({
        shortTitle: dilemma.shortTitle,
        title: dilemma.title,
        situation: dilemma.situation,
        contentNotice: dilemma.contentNotice,
      });

      for (const branch of dilemma.lenses) {
        expect(localizeReflection(dilemma.id, branch.lens, branch.reflection, "hu"))
          .toMatchObject({
            counterargument: branch.reflection.counterargument,
            blindSpot: branch.reflection.blindSpot,
            question: branch.reflection.question,
          });
        expect(localizeConsequence(dilemma.id, branch.lens, branch.consequence, "hu"))
          .toMatchObject({
            gains: branch.consequence.gains,
            costs: branch.consequence.costs,
            closingReflection: branch.consequence.closingReflection,
          });
      }
    }
  });

  it("a jóváhagyott angol P0-copyt és terminológiát adja vissza", () => {
    const apology = dilemmaCatalog.dilemmas[0];
    const homework = dilemmaCatalog.dilemmas[1];
    const interview = dilemmaCatalog.dilemmas[2];
    const claim = dilemmaCatalog.dilemmas[3];
    const toPublic = (dilemma: typeof apology) => ({
      id: dilemma.id,
      shortTitle: dilemma.shortTitle,
      title: dilemma.title,
      callPrompt: dilemma.callPrompt,
      situation: dilemma.situation,
      automationPromise: dilemma.automationPromise,
      centralTension: dilemma.centralTension,
      contentNotice: dilemma.contentNotice,
      canSkip: dilemma.canSkip,
      choices: dilemma.lenses.map(({ lens, label, framing, choiceText }) => ({ lens, label, framing, choiceText })),
    });

    expect(localizeDilemma(toPublic(apology), "en").situation).toBe(
      "You hurt someone and haven’t responded since. Futura knows the context of the conversation and offers to draft an apology—or even send it on your behalf.",
    );
    expect(localizeDilemma(toPublic(homework), "en").situation).toContain(
      "Your teacher allows you to use AI as long as you disclose it and can explain the solution.",
    );
    expect(localizeConsequence(homework.id, "heart", homework.lenses[2].consequence, "en").gains)
      .toEqual(["You worked through your own reasoning and discovered what you truly understood."]);
    expect(localizeConsequence(interview.id, "heart", interview.lenses[2].consequence, "en").gains)
      .toEqual(["You read every application and made the final decision yourself."]);
    expect(localizeDilemma(toPublic(claim), "en").situation).toMatch(
      /^A fast-spreading post claims that a new rule affecting many people is about to take effect\./,
    );
    expect(uiCopy.en.balance.axes.comfort).toBe("Convenience");
    expect(uiCopy.en.balance.kicker).toBe("Human Balance");
    expect(uiCopy.hu.guide.lenses).toEqual({
      brain: "Segít elindulni, te döntesz.",
      hand: "Futura elvégzi helyetted.",
      heart: "Te döntesz és te cselekszel.",
    });
    expect(uiCopy.en.guide.lenses).toEqual({
      brain: "Helps you get started. You decide.",
      hand: "The Machine does it for you.",
      heart: "You decide and you act.",
    });
  });
});
