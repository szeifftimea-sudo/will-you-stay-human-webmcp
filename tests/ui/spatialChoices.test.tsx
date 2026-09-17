import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { createAppServices, type AppServices } from "../../src/app/bootstrap";
import { uiCopy, type UiLocale } from "../../src/content/uiCopy";
import { LENSES, ZERO_BALANCE, type Lens } from "../../src/domain/gameTypes";
import { MemoryGameRepository } from "../../src/infrastructure/storage/gameRepository";
import type { RitualSoundPort } from "../../src/ui/audio/ritualSound";
import { UI_LOCALE_STORAGE_KEY } from "../../src/ui/presentationLocale";

// Replace only the decorative WebGL surface. App, DecisionCard and the engine run normally.
function DecorativeDepth() {
  return <div data-testid="choice-depth-layer" aria-hidden="true" />;
}

const ORIGINAL_CARD_NAMES: Record<UiLocale, Record<Lens, string>> = {
  hu: {
    brain: "AGY — Segítséget kérek, én döntök. A Gép segít elindulni, de a döntés az enyém.",
    hand: "KÉZ — Rábízom a Gépre. A Gép végzi el helyettem.",
    heart: "SZÍV — Én viszem végig. Én döntök és én cselekszem.",
  },
  en: {
    brain: "MIND — The Machine helps; I decide.",
    hand: "HAND — I leave it to the Machine.",
    heart: "HEART — I decide and act.",
  },
};

function createSoundSpy(): RitualSoundPort {
  return { play: vi.fn(), setMuted: vi.fn(), dispose: vi.fn() };
}

function click(label: string) {
  fireEvent.click(screen.getByRole("button", { name: label }));
}

function enterFirstChoices(locale: UiLocale = "en") {
  const copy = uiCopy[locale];
  click(copy.landing.enter);
  click(copy.futura.showQuestion);
  click(copy.dilemma.showOptions);
  click(copy.guide.continue);
}

function pick(lens: Lens, locale: UiLocale = "en") {
  click(ORIGINAL_CARD_NAMES[locale][lens]);
}

function expectNoDepth() {
  expect(screen.queryByTestId("choice-depth-layer")).not.toBeInTheDocument();
}

function expectOriginalChoices(locale: UiLocale = "en", selectedLens: Lens | null = null) {
  const copy = uiCopy[locale];
  const group = screen.getByRole("group", {
    name: selectedLens ? copy.choice.selectedGroupLabel : copy.choice.groupLabel,
  });
  expect(within(group).getAllByRole("button")).toHaveLength(3);
  for (const lens of LENSES) {
    const selected = lens === selectedLens;
    const name = `${ORIGINAL_CARD_NAMES[locale][lens]}${selected ? ` ${copy.choice.selectedSuffix}` : ""}`;
    const button = within(group).getByRole("button", { name });
    expect(button).toBeVisible();
    expect(button).toBeEnabled();
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("aria-pressed", String(selected));
    expect(button).toHaveClass("route-choice", `route-choice-${lens}`);
    if (selected) expect(button).toHaveClass("is-selected");
    else expect(button).not.toHaveClass("is-selected");
    button.focus();
    expect(button).toHaveFocus();
  }
  return group;
}

function expectTentativeOnly(services: AppServices, lens: Lens) {
  const session = services.engine.getSnapshot()!;
  expect(session.phase).toBe("TENTATIVE_SELECTION_RECORDED");
  expect(session.tentativeSelection).toMatchObject({ lens, provenance: "PLAYER_UI" });
  expect(session.presentedReflection).toBeNull();
  expect(session.confirmedDecision).toBeNull();
  expect(session.revealedOutcome).toBeNull();
  expect(session.outcomeHistory).toEqual([]);
  expect(session.completedDilemmaIds).toEqual([]);
  expect(session.balance).toEqual(ZERO_BALANCE);
  expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: uiCopy.en.confirmation.confirm })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: uiCopy.en.sealed.reveal })).not.toBeInTheDocument();
}

describe("optional spatial depth on the original choice screen", () => {
  beforeEach(() => {
    localStorage.setItem(UI_LOCALE_STORAGE_KEY, "en");
  });

  it("keeps the default App free of the optional depth layer", () => {
    const services = createAppServices(new MemoryGameRepository());
    render(<App services={services} sound={createSoundSpy()} />);
    expectNoDepth();

    enterFirstChoices();
    expectOriginalChoices();
    expectNoDepth();
    pick("brain");
    expectOriginalChoices("en", "brain");
    expectNoDepth();
  });

  it("offers three concise digital meanings; focus never records a choice", () => {
    const services = createAppServices(new MemoryGameRepository());
    const view = render(<App services={services} sound={createSoundSpy()} />);
    enterFirstChoices();
    const before = services.engine.getSnapshot();
    const labels = ["The Machine helps; I decide.", "I leave it to the Machine.", "I decide and act."];
    const buttons = LENSES.map(lens => screen.getByRole("button", { name: ORIGINAL_CARD_NAMES.en[lens] }));
    expect(buttons.map(button => button.querySelector("strong")?.textContent)).toEqual(labels);
    for (const button of buttons) {
      expect(button.querySelector("small")).toBeNull();
      button.focus();
      expect(button).toHaveFocus();
      expect(button).toHaveAttribute("aria-pressed", "false");
      expect(services.engine.getSnapshot()).toEqual(before);
    }
    fireEvent.click(buttons[1]);
    expectTentativeOnly(services, "hand");
    expect([...view.container.querySelectorAll(".route-label")].map(label => label.textContent)).toEqual(["MIND", "HAND", "HEART"]);
  });

  it("mounts the decoration only when the original choice cards are shown", () => {
    const services = createAppServices(new MemoryGameRepository());
    render(<App services={services} sound={createSoundSpy()} choiceDepth={DecorativeDepth} />);
    expect(screen.getByRole("heading", { name: uiCopy.en.landing.title })).toBeVisible();
    expectNoDepth();

    click(uiCopy.en.landing.enter);
    expect(screen.getByRole("heading", { name: uiCopy.en.futura.heading })).toBeVisible();
    expectNoDepth();
    click(uiCopy.en.futura.showQuestion);
    expect(screen.getByRole("heading", { name: "Should I apologize on your behalf?" })).toBeVisible();
    expectNoDepth();
    const beforeDecoration = services.engine.getSnapshot();

    click(uiCopy.en.dilemma.showOptions);
    expect(screen.getByRole("heading", { name: uiCopy.en.guide.heading })).toBeVisible();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expectNoDepth();
    click(uiCopy.en.guide.continue);

    const choices = expectOriginalChoices();
    expect(within(choices).getAllByTestId("choice-depth-layer")).toHaveLength(1);
    expect(screen.getByTestId("choice-depth-layer")).toHaveAttribute("aria-hidden", "true");
    expect(services.engine.getSnapshot()).toEqual(beforeDecoration);
  });

  it.each(LENSES)("the original %s button only records a tentative selection", (lens) => {
    const services = createAppServices(new MemoryGameRepository());
    const sound = createSoundSpy();
    render(<App services={services} sound={sound} choiceDepth={DecorativeDepth} />);
    enterFirstChoices();
    const beforeSelection = services.engine.getSnapshot()!;

    pick(lens);

    expectTentativeOnly(services, lens);
    expect(services.engine.getSnapshot()!.stateRevision).toBe(beforeSelection.stateRevision + 1);
    const choices = expectOriginalChoices("en", lens);
    expect(within(choices).getAllByTestId("choice-depth-layer")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: uiCopy.en.choice.feedback[lens] })).toBeVisible();
    expect(sound.play).toHaveBeenLastCalledWith("selection");
  });

  it("lets the player change direction using the same three native buttons", () => {
    const services = createAppServices(new MemoryGameRepository());
    render(<App services={services} sound={createSoundSpy()} choiceDepth={DecorativeDepth} />);
    enterFirstChoices();
    pick("brain");
    const firstSelection = services.engine.getSnapshot()!.tentativeSelection!;

    pick("hand");
    expectTentativeOnly(services, "hand");
    const secondSelection = services.engine.getSnapshot()!.tentativeSelection!;
    expect(secondSelection.supersedesSelectionId).toBe(firstSelection.selectionId);
    expectOriginalChoices("en", "hand");

    pick("heart");
    expectTentativeOnly(services, "heart");
    expect(services.engine.getSnapshot()!.tentativeSelection!.supersedesSelectionId).toBe(secondSelection.selectionId);
    expectOriginalChoices("en", "heart");
    expect(screen.getAllByTestId("choice-depth-layer")).toHaveLength(1);
  });

  it("uses the original reflection, confirmation, outcome, balance and sound sequence without depth", () => {
    const services = createAppServices(new MemoryGameRepository());
    const sound = createSoundSpy();
    const copy = uiCopy.en;
    render(<App services={services} sound={sound} choiceDepth={DecorativeDepth} />);
    enterFirstChoices();
    pick("brain");

    click(copy.choice.showCounterpoint);
    expectNoDepth();
    expect(services.engine.getSnapshot()!.phase).toBe("REFLECTION_PRESENTED");
    expect(screen.getByRole("heading", { name: copy.counterpoint.heading })).toBeVisible();
    expect(screen.getByTestId("reflection-message")).toBeVisible();
    expect(screen.getByText(copy.dilemmas["apology-delegation"].branches.brain.reflection.question)).toBeVisible();
    expect(screen.queryByRole("button", { name: copy.confirmation.confirm })).not.toBeInTheDocument();
    expect(services.engine.getSnapshot()!.confirmedDecision).toBeNull();

    click(copy.counterpoint.keep.brain);
    expectNoDepth();
    expect(services.engine.getSnapshot()!.phase).toBe("READY_FOR_CONFIRMATION");
    expect(screen.getByTestId("human-confirmation")).toBeVisible();
    expect(screen.queryByText(copy.cards.keptSeal)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: copy.confirmation.heading })).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: copy.confirmation.reasonAriaLabel }), {
      target: { value: "I will choose the words myself." },
    });
    expect(services.engine.getSnapshot()!.confirmedDecision).toBeNull();
    expect(services.engine.getSnapshot()!.balance).toEqual(ZERO_BALANCE);

    click(copy.confirmation.confirm);
    expectNoDepth();
    expect(screen.getByTestId("ritual-card")).toHaveClass("ritual-card-sealed");
    expect(services.engine.getSnapshot()!.confirmedDecision).toMatchObject({
      lens: "brain", provenance: "PLAYER_UI", reasoning: "I will choose the words myself.", consumedAt: null,
    });
    expect(services.engine.getSnapshot()!.revealedOutcome).toBeNull();
    expect(services.engine.getSnapshot()!.balance).toEqual(ZERO_BALANCE);
    expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();

    click(copy.sealed.reveal);
    expectNoDepth();
    expect(screen.getByTestId("consequence-resolution")).toBeVisible();
    expect(screen.getByRole("heading", { name: copy.outcome.heading })).toBeVisible();
    const revealed = services.engine.getSnapshot()!;
    expect(revealed.phase).toBe("CONSEQUENCE_REVEALED");
    expect(revealed.outcomeHistory).toHaveLength(1);
    expect(revealed.balance).toEqual({ comfort: 1, control: 1, connection: -1, freedom: 0, responsibility: 0 });
    expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();

    click(copy.outcome.showBalance);
    expectNoDepth();
    expect(screen.getByTestId("human-balance")).toBeVisible();
    expect(services.engine.getSnapshot()).toEqual(revealed);
    expect(sound.play).toHaveBeenCalledTimes(9);
    expect(vi.mocked(sound.play).mock.calls).toEqual([
      ["futura-call"], ["futura-question"], ["cards-dealt"], ["selection"],
      ["counterpoint"], ["retention"], ["confirmation"], ["consequence"],
      ["balance", { changedBalanceAxes: [0, 1, 2] }],
    ]);
  });

  it.each(LENSES)("keeps %s reflection read-only until a separate human action", (lens) => {
    const services = createAppServices(new MemoryGameRepository());
    const copy = uiCopy.en;
    render(<App services={services} sound={createSoundSpy()} />);
    enterFirstChoices();
    pick(lens);
    click(copy.choice.showCounterpoint);
    const reflected = services.engine.getSnapshot()!;
    const message = screen.getByTestId("reflection-message");
    const reflection = copy.dilemmas["apology-delegation"].branches[lens].reflection;
    for (const text of [reflection.counterargument, reflection.blindSpot, reflection.question]) {
      expect(within(message).getAllByText(text)).toHaveLength(1);
    }
    expect(screen.getByText(copy.choice.selectedKicker)).toBeVisible();
    expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.confirmation.confirm })).not.toBeInTheDocument();
    const keep = screen.getByRole("button", { name: copy.counterpoint.keep[lens] });
    const reconsider = screen.getByRole("button", { name: copy.counterpoint.reconsider });
    keep.focus();
    reconsider.focus();
    expect(services.engine.getSnapshot()).toEqual(reflected);
    fireEvent.animationEnd(message);
    expect(services.engine.getSnapshot()).toEqual(reflected);
    fireEvent.click(reconsider);
    expectOriginalChoices();
    expect(services.engine.getSnapshot()).toEqual(reflected);
    const other = lens === "brain" ? "hand" : "brain";
    pick(other);
    expectTentativeOnly(services, other);
    click(copy.choice.showCounterpoint);
    click(copy.counterpoint.keep[other]);
    expect(services.engine.getSnapshot()!.phase).toBe("READY_FOR_CONFIRMATION");
    expect(services.engine.getSnapshot()!.confirmedDecision).toBeNull();
    expect(services.engine.getSnapshot()!.balance).toEqual(ZERO_BALANCE);
    expect(services.engine.getSnapshot()!.outcomeHistory).toEqual([]);
    expect(screen.getByRole("button", { name: copy.confirmation.confirm })).toBeVisible();
  });

  it.each(LENSES)("requires an explicit human Confirm for %s, never focus, motion or time", (lens) => {
    const services = createAppServices(new MemoryGameRepository());
    const sound = createSoundSpy();
    const copy = uiCopy.en;
    render(<App services={services} sound={sound} />);
    enterFirstChoices();
    pick(lens);
    click(copy.choice.showCounterpoint);
    click(copy.counterpoint.keep[lens]);
    const before = services.engine.getSnapshot()!;
    expect(before.phase).toBe("READY_FOR_CONFIRMATION");
    const scene = screen.getByTestId("human-confirmation");
    expect(within(scene).getByText(copy.cards.lenses[lens].label)).toBeVisible();
    expect(within(scene).getByText("Not final yet")).toBeVisible();
    expect(screen.queryByText("KEPT")).not.toBeInTheDocument();
    expect(screen.queryByText("CONFIRMED")).not.toBeInTheDocument();
    expect(screen.queryByText("Final decision")).not.toBeInTheDocument();
    expect(screen.queryByTestId("ritual-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("reflection-message")).not.toBeInTheDocument();
    expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();
    expect(within(scene).getAllByRole("button").map(button => button.textContent?.trim()))
      .toEqual(["Change my choice", "Confirm"]);
    const change = within(scene).getByRole("button", { name: "Change my choice" });
    const confirm = within(scene).getByRole("button", { name: "Confirm" });
    expect(confirm).not.toHaveFocus();
    change.focus();
    confirm.focus();
    fireEvent.animationEnd(scene);
    fireEvent.transitionEnd(scene);
    vi.useFakeTimers();
    try { act(() => { vi.advanceTimersByTime(60_000); }); }
    finally { vi.useRealTimers(); }
    expect(services.engine.getSnapshot()).toEqual(before);
    expect(sound.play).not.toHaveBeenCalledWith("confirmation");
    fireEvent.click(change);
    expectOriginalChoices();
    expect(services.engine.getSnapshot()).toEqual(before);
    pick(lens);
    click(copy.choice.showCounterpoint);
    click(copy.counterpoint.keep[lens]);
    const revision = services.engine.getSnapshot()!.stateRevision;
    fireEvent.change(screen.getByRole("textbox", { name: copy.confirmation.reasonAriaLabel }), {
      target: { value: "This is my decision." },
    });
    expect(services.engine.getSnapshot()!.confirmedDecision).toBeNull();
    click("Confirm");
    const confirmed = services.engine.getSnapshot()!;
    expect(confirmed.phase).toBe("DECISION_CONFIRMED");
    expect(confirmed.stateRevision).toBe(revision + 1);
    expect(confirmed.confirmedDecision).toMatchObject({ lens, provenance: "PLAYER_UI", reasoning: "This is my decision." });
    expect(confirmed.revealedOutcome).toBeNull();
    expect(confirmed.balance).toEqual(ZERO_BALANCE);
    expect(confirmed.outcomeHistory).toEqual([]);
    expect(sound.play).toHaveBeenLastCalledWith("confirmation");
    expect(screen.queryByRole("button", { name: "Change my choice" })).not.toBeInTheDocument();
  });

  it.each(LENSES)("shows the existing %s consequence only after confirmation, with balance separate", (lens) => {
    const services = createAppServices(new MemoryGameRepository());
    const sound = createSoundSpy();
    const copy = uiCopy.en;
    const rendered = render(<App services={services} sound={sound} />);
    enterFirstChoices();
    pick(lens);
    click(copy.choice.showCounterpoint);
    click(copy.counterpoint.keep[lens]);
    expect(screen.queryByTestId("consequence-resolution")).not.toBeInTheDocument();
    expect(screen.queryByText(copy.sealed.kicker)).not.toBeInTheDocument();
    click(copy.confirmation.confirm);
    expect(services.engine.getSnapshot()!.confirmedDecision?.lens).toBe(lens);
    expect(screen.getByText(copy.sealed.kicker)).toBeVisible();
    expect(screen.queryByTestId("consequence-resolution")).not.toBeInTheDocument();
    click(copy.sealed.reveal);
    const revealed = services.engine.getSnapshot()!;
    const consequence = copy.dilemmas["apology-delegation"].branches[lens].consequence;
    const resolution = screen.getByTestId("consequence-resolution");
    expect(within(resolution).getByText(copy.cards.lenses[lens].label)).toBeVisible();
    expect(within(resolution).getByText(copy.sealed.kicker)).toBeVisible();
    const gain = within(resolution).getByRole("region", { name: copy.outcome.gainLabel });
    const cost = within(resolution).getByRole("region", { name: copy.outcome.costLabel });
    for (const text of consequence.gains) expect(within(gain).getByText(text)).toBeVisible();
    for (const text of consequence.costs) expect(within(cost).getByText(text)).toBeVisible();
    expect(within(resolution).getAllByText(consequence.closingReflection)).toHaveLength(1);
    expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.balance.nextQuestion })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.confirmation.changeChoice })).not.toBeInTheDocument();
    fireEvent.animationEnd(resolution);
    vi.useFakeTimers();
    try { act(() => { vi.advanceTimersByTime(60_000); }); }
    finally { vi.useRealTimers(); }
    expect(services.engine.getSnapshot()).toEqual(revealed);
    expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();
    rendered.unmount();
    render(<App services={services} sound={createSoundSpy()} />);
    expect(screen.getByTestId("consequence-resolution")).toBeVisible();
    expect(services.engine.getSnapshot()).toEqual(revealed);
    click(copy.outcome.showBalance);
    expect(screen.getByTestId("human-balance")).toBeVisible();
    expect(screen.getByTestId("human-balance").closest(".balance-result-transition")).not.toBeNull();
    expect(document.getElementById("balance-title")).toHaveFocus();
    expect(screen.queryByTestId("consequence-resolution")).not.toBeInTheDocument();
    vi.useFakeTimers();
    try { act(() => { vi.advanceTimersByTime(60_000); }); }
    finally { vi.useRealTimers(); }
    expect(screen.getByTestId("human-balance")).toBeVisible();
    expect(services.engine.getSnapshot()).toEqual(revealed);
    expect(revealed.outcomeHistory).toHaveLength(1);
  });

  it.each([false, true])("supports returning to the original choices after acknowledgment=%s", (acknowledge) => {
    const services = createAppServices(new MemoryGameRepository());
    render(<App services={services} sound={createSoundSpy()} choiceDepth={DecorativeDepth} />);
    enterFirstChoices();
    pick("brain");
    click(uiCopy.en.choice.showCounterpoint);
    if (acknowledge) click(uiCopy.en.counterpoint.keep.brain);
    const previous = services.engine.getSnapshot()!;
    expectNoDepth();

    click(acknowledge ? uiCopy.en.confirmation.changeChoice : uiCopy.en.counterpoint.reconsider);
    const choices = expectOriginalChoices();
    expect(within(choices).getAllByTestId("choice-depth-layer")).toHaveLength(1);
    expect(services.engine.getSnapshot()).toEqual(previous);
    expect(screen.queryByTestId("ritual-card")).not.toBeInTheDocument();

    pick("heart");
    expectTentativeOnly(services, "heart");
    expectOriginalChoices("en", "heart");
    expect(services.engine.getSnapshot()!.tentativeSelection!.supersedesSelectionId).toBe(previous.tentativeSelection!.selectionId);
  });

  it.each(["hu", "en"] as const)("preserves the original %s cards throughout all four dilemmas", (locale) => {
    localStorage.setItem(UI_LOCALE_STORAGE_KEY, locale);
    const services = createAppServices(new MemoryGameRepository());
    const copy = uiCopy[locale];
    render(<App services={services} sound={createSoundSpy()} choiceDepth={DecorativeDepth} />);
    enterFirstChoices(locale);

    for (let round = 0; round < 4; round += 1) {
      expectOriginalChoices(locale);
      expect(screen.getAllByTestId("choice-depth-layer")).toHaveLength(1);
      expect(screen.getByRole("main")).toHaveAttribute("lang", locale);
      expect(localStorage.getItem(UI_LOCALE_STORAGE_KEY)).toBe(locale);
      expect(services.engine.getSnapshot()!.language).toBe("hu");
      const lens = LENSES[round % LENSES.length];
      pick(lens, locale);
      expectOriginalChoices(locale, lens);
      click(copy.choice.showCounterpoint);
      expectNoDepth();
      click(copy.counterpoint.keep[lens]);
      click(copy.confirmation.confirm);
      click(copy.sealed.reveal);
      click(copy.outcome.showBalance);
      expectNoDepth();
      click(round < 3 ? copy.balance.nextQuestion : copy.balance.endGame);
      expectNoDepth();
      if (round < 3) click(copy.dilemma.showOptions);
    }

    expect(services.engine.getSnapshot()!.phase).toBe("GAME_COMPLETE");
    expect(services.engine.getSnapshot()!.outcomeHistory).toHaveLength(4);
    expect(screen.getByText(copy.balance.gameComplete)).toBeVisible();
  });
});
