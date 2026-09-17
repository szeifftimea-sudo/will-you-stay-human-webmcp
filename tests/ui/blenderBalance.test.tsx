import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { createAppServices, type AppServices } from "../../src/app/bootstrap";
import { dilemmaCatalog } from "../../src/content/dilemmaCatalog.hu";
import { uiCopy, type UiLocale } from "../../src/content/uiCopy";
import { LENSES, ZERO_BALANCE, type HumanBalance as Balance, type Lens } from "../../src/domain/gameTypes";
import { MemoryGameRepository } from "../../src/infrastructure/storage/gameRepository";
import type { RitualSoundPort } from "../../src/ui/audio/ritualSound";
import { HumanBalance } from "../../src/ui/components/HumanBalance";
import { UI_LOCALE_STORAGE_KEY } from "../../src/ui/presentationLocale";

// Only the decorative model is replaced. The original App, HTML balance and game engine run normally.
function DecorativeBalanceDepth(props: Record<string, unknown>) {
  return <div data-testid="balance-model-layer" aria-hidden="true" data-prop-count={Object.keys(props).length} />;
}

function createSoundSpy(): RitualSoundPort {
  return { play: vi.fn(), setMuted: vi.fn(), dispose: vi.fn() };
}

function click(label: string) {
  fireEvent.click(screen.getByRole("button", { name: label }));
}

function enterChoices(locale: UiLocale = "en") {
  const copy = uiCopy[locale];
  click(copy.landing.enter);
  click(copy.futura.showQuestion);
  click(copy.dilemma.showOptions);
  click(copy.guide.continue);
}

function select(lens: Lens, locale: UiLocale = "en") {
  const names = locale === "en" ? { brain: "MIND", hand: "HAND", heart: "HEART" } : { brain: "AGY", hand: "KÉZ", heart: "SZÍV" };
  fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${names[lens]} —`) }));
}

function reveal(lens: Lens, locale: UiLocale = "en") {
  const copy = uiCopy[locale];
  select(lens, locale);
  click(copy.choice.showCounterpoint);
  click(copy.counterpoint.keep[lens]);
  click(copy.confirmation.confirm);
  click(copy.sealed.reveal);
}

function expectNoModel() {
  expect(screen.queryByTestId("balance-model-layer")).not.toBeInTheDocument();
}

function expectDomainValues(balance: Balance, locale: UiLocale = "en", previousBalance?: Balance) {
  const instrument = screen.getByTestId("human-balance");
  const axes = Object.entries(uiCopy[locale].balance.axes) as Array<[keyof Balance, string]>;
  expect(within(instrument).getAllByRole("img")).toHaveLength(5);
  expect(instrument.querySelectorAll(".balance-row")).toHaveLength(5);
  expect(instrument.querySelectorAll(".balance-marker")).toHaveLength(5);
  for (const [axis, label] of axes) {
    const track = within(instrument).getByRole("img", { name: `${label}: ${balance[axis]}` });
    expect(track).toBeVisible();
    const row = track.closest<HTMLElement>(".balance-row")!;
    expect(row.querySelector(".balance-label")).toHaveTextContent(label);
    expect(row.querySelector(".balance-zero")).toHaveAttribute("aria-hidden", "true");
    expect(row.querySelector(".balance-marker")).toHaveAttribute("aria-hidden", "true");
    // These are the original HTML projection coordinates, not a second outcome calculation.
    expect(row.style.getPropertyValue("--marker-position")).toBe(`${((balance[axis] + 2) / 4) * 100}%`);
    expect(row.style.getPropertyValue("--marker-start-position")).toBe(`${(((previousBalance?.[axis] ?? balance[axis]) + 2) / 4) * 100}%`);
    expect(row).toHaveClass(previousBalance && previousBalance[axis] !== balance[axis] ? "is-changing" : "is-static");
  }
  return instrument;
}

function expectUnconfirmed(services: AppServices) {
  const session = services.engine.getSnapshot()!;
  expect(session.confirmedDecision).toBeNull();
  expect(session.revealedOutcome).toBeNull();
  expect(session.balance).toEqual(ZERO_BALANCE);
  expect(session.outcomeHistory).toEqual([]);
  expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();
  expectNoModel();
}

describe("optional Blender instrument on the original domain-driven balance", () => {
  beforeEach(() => {
    localStorage.setItem(UI_LOCALE_STORAGE_KEY, "en");
  });

  it("offers companion navigation only from the spatial result without mutating the session", () => {
    const services = createAppServices(new MemoryGameRepository());
    const copy = uiCopy.en;
    render(<App services={services} sound={createSoundSpy()} balanceDepth={DecorativeBalanceDepth} />);
    expect(screen.queryByRole("link", { name: copy.balance.physicalCompanion })).not.toBeInTheDocument();
    enterChoices();
    reveal("brain");
    expect(screen.queryByRole("link", { name: copy.balance.physicalCompanion })).not.toBeInTheDocument();
    click(copy.outcome.showBalance);
    const before = structuredClone(services.engine.getSnapshot());
    const instrument = screen.getByTestId("human-balance");
    const link = within(instrument).getByRole("link", { name: "Meet the physical companion" });
    const primary = within(instrument).getByRole("button", { name: copy.balance.nextQuestion });
    expect(primary).toHaveClass("primary-action");
    expect(link).toHaveClass("secondary-action");
    expect(link).toHaveAttribute("href", "/product");
    expect(link).not.toHaveAttribute("target");
    expect(link.closest(".balance-housing")).toBeNull();
    expect(link.closest(".balance-footer")).not.toBeNull();
    link.focus();
    expect(link).toHaveFocus();
    // JSDOM cannot navigate documents. Cancel only the browser default here;
    // any React/game handler would still run and be caught by the snapshot.
    link.addEventListener("click", event => event.preventDefault(), { once: true });
    fireEvent.click(link);
    expect(services.engine.getSnapshot()).toEqual(before);
  });

  it("does not add companion navigation to the original non-spatial result", () => {
    render(<HumanBalance balance={ZERO_BALANCE} locale="en" />);
    expect(screen.queryByRole("link", { name: uiCopy.en.balance.physicalCompanion })).not.toBeInTheDocument();
  });

  it("leaves the original App and its balance free of the optional model", () => {
    const services = createAppServices(new MemoryGameRepository());
    render(<App services={services} sound={createSoundSpy()} />);
    expectNoModel();
    enterChoices();
    reveal("brain");
    expectNoModel();
    click(uiCopy.en.outcome.showBalance);
    const session = services.engine.getSnapshot()!;
    const instrument = expectDomainValues(session.balance, "en", session.revealedOutcome!.balanceBefore);
    const housing = instrument.querySelector(".balance-housing")!;
    const footer = instrument.querySelector(".balance-footer")!;
    expect(footer.parentElement).toBe(housing);
    expect(within(housing as HTMLElement).getByRole("button", { name: uiCopy.en.balance.nextQuestion })).toBeVisible();
    expect(instrument.querySelector(".balance-object-stage")).toBeNull();
    expect(instrument).not.toHaveClass("is-foldable");
    expectNoModel();
  });

  it("does not mount the instrument before the separate consequence and balance actions", () => {
    const services = createAppServices(new MemoryGameRepository());
    const sound = createSoundSpy();
    const copy = uiCopy.en;
    render(<App services={services} sound={sound} balanceDepth={DecorativeBalanceDepth} />);
    expectNoModel();
    click(copy.landing.enter);
    expectNoModel();
    click(copy.futura.showQuestion);
    expectNoModel();
    click(copy.dilemma.showOptions);
    expectNoModel();
    click(copy.guide.continue);
    expectNoModel();

    select("brain");
    expect(services.engine.getSnapshot()!.phase).toBe("TENTATIVE_SELECTION_RECORDED");
    expectUnconfirmed(services);
    click(copy.choice.showCounterpoint);
    expectUnconfirmed(services);
    click(copy.counterpoint.keep.brain);
    expect(services.engine.getSnapshot()!.phase).toBe("READY_FOR_CONFIRMATION");
    expectUnconfirmed(services);

    click(copy.confirmation.confirm);
    expect(services.engine.getSnapshot()!.confirmedDecision).toMatchObject({ lens: "brain", provenance: "PLAYER_UI" });
    expect(services.engine.getSnapshot()!.balance).toEqual(ZERO_BALANCE);
    expect(services.engine.getSnapshot()!.revealedOutcome).toBeNull();
    expectNoModel();
    click(copy.sealed.reveal);
    const revealed = services.engine.getSnapshot()!;
    expect(revealed.phase).toBe("CONSEQUENCE_REVEALED");
    expect(revealed.outcomeHistory).toHaveLength(1);
    expect(screen.getByTestId("consequence-resolution")).toBeVisible();
    expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();
    expectNoModel();

    click(copy.outcome.showBalance);
    const layer = screen.getByTestId("balance-model-layer");
    expect(layer).toHaveAttribute("aria-hidden", "true");
    expect(layer).toHaveAttribute("data-prop-count", "0");
    expect(layer.parentElement).toHaveClass("balance-housing");
    expect(within(layer).queryAllByRole("button")).toHaveLength(0);
    expect(services.engine.getSnapshot()).toEqual(revealed);
    expectDomainValues(revealed.balance, "en", revealed.revealedOutcome!.balanceBefore);
    expect(vi.mocked(sound.play).mock.calls).toEqual([
      ["futura-call"], ["futura-question"], ["cards-dealt"], ["selection"],
      ["counterpoint"], ["retention"], ["confirmation"], ["consequence"],
      ["balance", { changedBalanceAxes: [0, 1, 2] }],
    ]);
  });

  it.each(LENSES)("projects all five domain values for the apology %s branch without recalculating its outcome", (lens) => {
    const services = createAppServices(new MemoryGameRepository());
    render(<App services={services} sound={createSoundSpy()} balanceDepth={DecorativeBalanceDepth} />);
    enterChoices();
    reveal(lens);
    const session = services.engine.getSnapshot()!;
    const branch = dilemmaCatalog.dilemmas.find(({ id }) => id === "apology-delegation")!.lenses.find((option) => option.lens === lens)!;
    expect(session.revealedOutcome!.rawDelta).toEqual(branch.consequence.delta);
    click(uiCopy.en.outcome.showBalance);
    expectDomainValues(session.balance, "en", session.revealedOutcome!.balanceBefore);
    expect(screen.getAllByTestId("balance-model-layer")).toHaveLength(1);
    expect(services.engine.getSnapshot()).toEqual(session);
  });

  it.each(["hu", "en"] as const)("preserves all five accessible %s labels and the original HTML continuation control", (locale) => {
    localStorage.setItem(UI_LOCALE_STORAGE_KEY, locale);
    const services = createAppServices(new MemoryGameRepository());
    render(<App services={services} sound={createSoundSpy()} balanceDepth={DecorativeBalanceDepth} />);
    enterChoices(locale);
    reveal("heart", locale);
    click(uiCopy[locale].outcome.showBalance);
    const session = services.engine.getSnapshot()!;
    const instrument = expectDomainValues(session.balance, locale, session.revealedOutcome!.balanceBefore);
    expect(within(instrument).getByText(uiCopy[locale].balance.note)).toBeVisible();
    expect(within(instrument).getAllByRole("button")).toHaveLength(1);
    const next = within(instrument).getByRole("button", { name: uiCopy[locale].balance.nextQuestion });
    expect(next.tagName).toBe("BUTTON");
    const footer = next.closest("footer")!;
    const housing = instrument.querySelector(".balance-housing")!;
    expect(footer.parentElement).toBe(instrument);
    expect(footer.previousElementSibling).toHaveClass("balance-object-stage");
    expect(housing.contains(next)).toBe(false);
    expect(within(housing as HTMLElement).queryAllByRole("button")).toHaveLength(0);
    next.focus();
    expect(next).toHaveFocus();
    expect(screen.getByRole("main")).toHaveAttribute("lang", locale);
    expect(localStorage.getItem(UI_LOCALE_STORAGE_KEY)).toBe(locale);
  });

  it.each(["hu", "en"] as const)("keeps the %s next, finish and restart CTAs as unchanged HTML controls below the foldable object", (locale) => {
    const copy = uiCopy[locale];
    const onContinue = vi.fn();
    const view = render(<HumanBalance balance={ZERO_BALANCE} locale={locale} depth={DecorativeBalanceDepth} />);
    const cases = [
      { label: copy.balance.nextQuestion, variant: "primary", memory: false },
      { label: copy.balance.endGame, variant: "secondary", memory: false },
      { label: copy.balance.restart, variant: "primary", memory: true },
    ] as const;
    for (const { label, variant, memory } of cases) {
      onContinue.mockClear();
      view.rerender(<HumanBalance
        balance={ZERO_BALANCE} locale={locale} depth={DecorativeBalanceDepth}
        onContinue={onContinue} continueLabel={label} continueVariant={variant} memory={memory}
      />);
      const instrument = expectDomainValues(ZERO_BALANCE, locale);
      const housing = instrument.querySelector(".balance-housing")!;
      const stage = instrument.querySelector(".balance-object-stage")!;
      const footer = instrument.querySelector(".balance-footer")!;
      const context = instrument.querySelector(".balance-context")!;
      const button = within(instrument).getByRole("button", { name: label });
      expect(instrument).toHaveClass("is-foldable");
      expect(footer.parentElement).toBe(instrument);
      expect(stage.nextElementSibling).toBe(footer);
      expect(housing.contains(button)).toBe(false);
      expect(stage.contains(button)).toBe(false);
      expect(within(footer as HTMLElement).getByText(memory ? copy.balance.gameComplete : copy.balance.roundMemory)).toBeVisible();
      expect(within(context as HTMLElement).getByRole("heading", { name: copy.balance.heading })).toBeVisible();
      expect(within(context as HTMLElement).getByText(copy.balance.note)).toBeVisible();
      expect(within(housing as HTMLElement).getByText(copy.balance.kicker)).toBeVisible();
      expect(within(instrument).getAllByRole("button")).toEqual([button]);
      expect(button).toHaveAttribute("type", "button");
      expect(button).toHaveClass(`${variant}-action`, "balance-new-round");
      button.focus();
      expect(button).toHaveFocus();
      fireEvent.click(button);
      expect(onContinue).toHaveBeenCalledTimes(1);
    }
  });

  it("adds the five numerical tick labels only to the optional spatial instrument", () => {
    const values: Balance = { comfort: -2, control: -1, connection: 0, freedom: 1, responsibility: 2 };
    const view = render(<HumanBalance balance={values} locale="en" />);
    const labels = () => Array.from(screen.getByTestId("human-balance").querySelectorAll(".balance-track"), (track) =>
      Array.from(track.querySelectorAll(".balance-stop"), (tick) => tick.textContent),
    );
    expectDomainValues(values);
    expect(labels()).toEqual(Array.from({ length: 5 }, () => ["−2", "0", "+2"]));

    view.rerender(<HumanBalance balance={values} locale="en" depth={DecorativeBalanceDepth} />);
    expectDomainValues(values);
    expect(labels()).toEqual(Array.from({ length: 5 }, () => ["−2", "−1", "0", "+1", "+2"]));

    view.rerender(<HumanBalance balance={values} locale="en" />);
    expectDomainValues(values);
    expect(labels()).toEqual(Array.from({ length: 5 }, () => ["−2", "0", "+2"]));
  });

  it("does not apply the product locale override to the original non-spatial Hungarian balance", () => {
    localStorage.setItem(UI_LOCALE_STORAGE_KEY, "hu");
    const services = createAppServices(new MemoryGameRepository());
    render(<App services={services} sound={createSoundSpy()} balanceLocale="en" />);
    enterChoices("hu");
    reveal("heart", "hu");
    click(uiCopy.hu.outcome.showBalance);
    expect(screen.getByRole("main")).toHaveAttribute("lang", "hu");
    const session = services.engine.getSnapshot()!;
    const instrument = expectDomainValues(session.balance, "hu", session.revealedOutcome!.balanceBefore);
    expect(within(instrument).getByText(uiCopy.hu.balance.note)).toBeVisible();
    const housing = instrument.querySelector(".balance-housing")!;
    expect(instrument.querySelector("footer")!.parentElement).toBe(housing);
    expect(within(housing as HTMLElement).getByRole("button", { name: uiCopy.hu.balance.nextQuestion })).toBeVisible();
    expectNoModel();
    expect(localStorage.getItem(UI_LOCALE_STORAGE_KEY)).toBe("hu");
  });

  it("uses English only for the opted-in product balance while preserving the saved Hungarian journey across rounds and restart", () => {
    localStorage.setItem(UI_LOCALE_STORAGE_KEY, "hu");
    const repository = new MemoryGameRepository();
    const services = createAppServices(repository);
    const save = vi.spyOn(repository, "save");
    const commands = [services.agentCommands, services.playerCommands].flatMap((port) =>
      Object.keys(port).map((key) => vi.spyOn(port as unknown as Record<string, (...args: unknown[]) => unknown>, key)),
    );
    render(<App services={services} sound={createSoundSpy()} balanceDepth={DecorativeBalanceDepth} balanceLocale="en" />);
    expect(screen.getByRole("heading", { name: uiCopy.hu.landing.title })).toBeVisible();
    expect(screen.getByRole("main")).toHaveAttribute("lang", "hu");
    enterChoices("hu");
    const sessionId = services.engine.getSnapshot()!.sessionId;

    for (const [round, lens] of (["brain", "hand", "hand", "heart"] as const).entries()) {
      reveal(lens, "hu");
      expect(screen.getByRole("main")).toHaveAttribute("lang", "hu");
      const revealed = services.engine.getSnapshot()!;
      expect(revealed.sessionId).toBe(sessionId);
      expect(revealed.outcomeHistory).toHaveLength(round + 1);
      save.mockClear();
      commands.forEach((command) => command.mockClear());

      click(uiCopy.hu.outcome.showBalance);
      expect(screen.getByRole("main")).toHaveAttribute("lang", "en");
      const instrument = expectDomainValues(revealed.balance, "en", revealed.revealedOutcome!.balanceBefore);
      expect(within(instrument).getByText(uiCopy.en.balance.note)).toBeVisible();
      expect(services.engine.getSnapshot()).toEqual(revealed);
      expect(repository.load()).toEqual(revealed);
      expect(save).not.toHaveBeenCalled();
      commands.forEach((command) => expect(command).not.toHaveBeenCalled());
      expect(localStorage.getItem(UI_LOCALE_STORAGE_KEY)).toBe("hu");

      const continuation = within(instrument).getByRole("button", {
        name: round < 3 ? uiCopy.en.balance.nextQuestion : uiCopy.en.balance.endGame,
      });
      expect(instrument.querySelector(".balance-object-stage")!.contains(continuation)).toBe(false);
      expect(continuation.closest("footer")!.parentElement).toBe(instrument);
      fireEvent.click(continuation);
      if (round < 3) {
        const next = services.engine.getSnapshot()!;
        expect(screen.getByRole("main")).toHaveAttribute("lang", "hu");
        expect(next.balance).toEqual(revealed.balance);
        expect(next.outcomeHistory).toEqual(revealed.outcomeHistory);
        expect(next.language).toBe(revealed.language);
        expect(next.sessionId).toBe(sessionId);
        expectNoModel();
        click(uiCopy.hu.dilemma.showOptions);
      }
    }

    const complete = services.engine.getSnapshot()!;
    expect(complete.phase).toBe("GAME_COMPLETE");
    expect(screen.getByRole("main")).toHaveAttribute("lang", "en");
    expectDomainValues(complete.balance, "en");
    expect(screen.getByText(uiCopy.en.balance.gameComplete)).toBeVisible();
    expect(localStorage.getItem(UI_LOCALE_STORAGE_KEY)).toBe("hu");
    click(uiCopy.en.balance.restart);
    expect(screen.getByRole("heading", { name: uiCopy.hu.landing.title })).toBeVisible();
    expect(screen.getByRole("main")).toHaveAttribute("lang", "hu");
    expect(localStorage.getItem(UI_LOCALE_STORAGE_KEY)).toBe("hu");
    expectNoModel();
  });

  it("rerenders current and previous domain snapshots without writing state or replaying sounds", () => {
    const repository = new MemoryGameRepository();
    const save = vi.spyOn(repository, "save");
    const services = createAppServices(repository);
    const sound = createSoundSpy();
    const view = render(<App services={services} sound={sound} balanceDepth={DecorativeBalanceDepth} />);
    enterChoices();
    reveal("heart");
    click(uiCopy.en.outcome.showBalance);
    const session = services.engine.getSnapshot()!;
    const saveCount = save.mock.calls.length;
    const soundCount = vi.mocked(sound.play).mock.calls.length;
    view.rerender(<App services={services} sound={sound} balanceDepth={DecorativeBalanceDepth} />);
    expectDomainValues(session.balance, "en", session.revealedOutcome!.balanceBefore);
    expect(services.engine.getSnapshot()).toEqual(session);
    expect(repository.load()).toEqual(session);
    expect(save).toHaveBeenCalledTimes(saveCount);
    expect(sound.play).toHaveBeenCalledTimes(soundCount);

    // The same current snapshot can be shown as a quiet memory with no changed-axis animation.
    view.unmount();
    render(<HumanBalance balance={session.balance} memory locale="en" depth={DecorativeBalanceDepth} />);
    expectDomainValues(session.balance);
    expect(screen.getByTestId("human-balance")).toHaveClass("is-memory");
    expect(screen.getByTestId("balance-model-layer")).toHaveAttribute("data-prop-count", "0");
    expect(save).toHaveBeenCalledTimes(saveCount);
    expect(repository.load()).toEqual(session);
  });

  it("retains cumulative balance and history across all four rounds and the final memory", () => {
    const services = createAppServices(new MemoryGameRepository());
    render(<App services={services} sound={createSoundSpy()} balanceDepth={DecorativeBalanceDepth} />);
    enterChoices();
    const sessionId = services.engine.getSnapshot()!.sessionId;
    const route: Lens[] = ["brain", "hand", "hand", "heart"];
    for (let round = 0; round < route.length; round += 1) {
      expectNoModel();
      reveal(route[round]);
      const revealed = services.engine.getSnapshot()!;
      expect(revealed.sessionId).toBe(sessionId);
      expect(revealed.outcomeHistory).toHaveLength(round + 1);
      expectNoModel();
      click(uiCopy.en.outcome.showBalance);
      expectDomainValues(revealed.balance, "en", revealed.revealedOutcome!.balanceBefore);
      expect(services.engine.getSnapshot()).toEqual(revealed);
      expect(screen.getAllByTestId("balance-model-layer")).toHaveLength(1);
      click(round < 3 ? uiCopy.en.balance.nextQuestion : uiCopy.en.balance.endGame);
      if (round < 3) {
        expectNoModel();
        expect(services.engine.getSnapshot()!.balance).toEqual(revealed.balance);
        expect(services.engine.getSnapshot()!.outcomeHistory).toEqual(revealed.outcomeHistory);
        click(uiCopy.en.dilemma.showOptions);
      }
    }
    const complete = services.engine.getSnapshot()!;
    expect(complete.phase).toBe("GAME_COMPLETE");
    expect(complete.sessionId).toBe(sessionId);
    expect(complete.outcomeHistory).toHaveLength(4);
    expectDomainValues(complete.balance);
    expect(screen.getByTestId("human-balance")).toHaveClass("is-memory");
    expect(screen.getAllByTestId("balance-model-layer")).toHaveLength(1);
    click(uiCopy.en.balance.restart);
    expect(screen.getByRole("heading", { name: uiCopy.en.landing.title })).toBeVisible();
    expectNoModel();
  });
});
