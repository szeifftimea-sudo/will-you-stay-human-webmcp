import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAppServices, type AppServices } from "../../src/app/bootstrap";
import { uiCopy, type UiLocale } from "../../src/content/uiCopy";
import { LENSES, ZERO_BALANCE, type HumanBalance, type Lens } from "../../src/domain/gameTypes";
import { MemoryGameRepository } from "../../src/infrastructure/storage/gameRepository";
import { WEBMCP_TOOL_NAMES } from "../../src/infrastructure/webmcp/contracts";
import { UI_LOCALE_STORAGE_KEY } from "../../src/ui/presentationLocale";
import { TabletopApp } from "../../src/ui/tabletop/TabletopApp";

interface CapturedSceneProps {
  balance: HumanBalance;
  previousBalance: HumanBalance;
  selectedLens: Lens | null;
  selectable: boolean;
  availableLenses: readonly Lens[];
  showBalance: boolean;
  labels: Record<Lens, string>;
  axisLabels: Record<keyof HumanBalance, string>;
  onSelect: (lens: Lens) => void;
}

const scene = vi.hoisted(() => ({ props: null as CapturedSceneProps | null }));

// Only WebGL is replaced. The actual engine, repositories, ports and subscriptions run.
vi.mock("../../src/ui/tabletop/TabletopScene", () => ({
  TabletopScene: (props: CapturedSceneProps) => {
    scene.props = props;
    return (
      <div data-testid="mock-tabletop-scene">
        {(["brain", "hand", "heart"] as const).map((lens) => (
          <button
            key={lens}
            aria-label={`scene pick ${lens}`}
            disabled={!props.selectable || !props.availableLenses.includes(lens)}
            onClick={() => props.onSelect(lens)}
          >
            {lens}
          </button>
        ))}
      </div>
    );
  },
}));

const APOLOGY_BALANCES: Record<Lens, HumanBalance> = {
  brain: { comfort: 1, control: 1, connection: -1, freedom: 0, responsibility: 0 },
  hand: { comfort: 2, control: -1, connection: -1, freedom: 1, responsibility: -1 },
  heart: { comfort: -1, control: 1, connection: 1, freedom: 0, responsibility: 2 },
};

const axes = ["comfort", "control", "connection", "freedom", "responsibility"] as const;

function click(label: string) {
  fireEvent.click(screen.getByRole("button", { name: label }));
}

function pick(lens: Lens, locale: UiLocale = "en") {
  const { label, framing } = uiCopy[locale].cards.lenses[lens];
  click(`${label} — ${framing}`);
}

function enterFirstChoices(locale: UiLocale = "en") {
  const copy = uiCopy[locale];
  click(copy.landing.enter);
  click(copy.futura.showQuestion);
  click(copy.dilemma.showOptions);
  click(copy.guide.continue);
}

function finishSelectedRound(lens: Lens, locale: UiLocale = "en") {
  const copy = uiCopy[locale];
  click(copy.choice.showCounterpoint);
  click(copy.counterpoint.keep[lens]);
  click(copy.confirmation.confirm);
  click(copy.sealed.reveal);
}

function expectPhase(services: AppServices, phase: string) {
  expect(screen.getByTestId("tabletop-app")).toHaveAttribute("data-phase", phase);
  expect(services.engine.getSnapshot()?.phase ?? "NO_SESSION").toBe(phase);
}

function expectBalanceHidden() {
  axes.forEach((axis) => expect(screen.queryByTestId(`tabletop-axis-${axis}`)).not.toBeInTheDocument());
  expect(scene.props?.showBalance).toBe(false);
}

function expectBalanceRows(balance: HumanBalance, delta: HumanBalance, locale: UiLocale = "en") {
  for (const axis of axes) {
    const row = screen.getByTestId(`tabletop-axis-${axis}`);
    expect(row).toBeVisible();
    expect(row).toHaveTextContent(uiCopy[locale].balance.axes[axis]);
    const numbers = row.textContent!.replaceAll("−", "-").match(/[+-]?\d+/g)?.map(Number);
    expect(numbers, `${axis}: current value and applied change`).toEqual([balance[axis], delta[axis]]);
  }
}

describe("3D tabletop flow using the real game engine", () => {
  beforeEach(() => {
    scene.props = null;
    localStorage.removeItem(UI_LOCALE_STORAGE_KEY);
  });

  it("defaults to English without inventing a saved preference or starting a session", () => {
    const services = createAppServices(new MemoryGameRepository());
    render(<TabletopApp services={services} />);

    expectPhase(services, "NO_SESSION");
    expect(screen.getByRole("heading", { name: uiCopy.en.landing.title })).toBeVisible();
    expect(localStorage.getItem(UI_LOCALE_STORAGE_KEY)).toBeNull();
    expect(scene.props?.selectable).toBe(false);
    expectBalanceHidden();
  });

  it.each(["en", "hu"] as const)("uses saved %s copy for the flow and scene labels", (locale) => {
    localStorage.setItem(UI_LOCALE_STORAGE_KEY, locale);
    const services = createAppServices(new MemoryGameRepository());
    render(<TabletopApp services={services} />);
    const copy = uiCopy[locale];

    expect(screen.getByRole("heading", { name: copy.landing.title })).toBeVisible();
    enterFirstChoices(locale);
    expect(scene.props?.axisLabels).toEqual(copy.balance.axes);
    for (const lens of LENSES) {
      const { label, framing } = copy.cards.lenses[lens];
      expect(screen.getByRole("button", { name: `${label} — ${framing}` })).toBeVisible();
      expect(scene.props?.labels[lens]).toBe(label);
    }
    pick("heart", locale);
    finishSelectedRound("heart", locale);
    expect(screen.getByText(copy.dilemmas["apology-delegation"].branches.heart.consequence.gains[0])).toBeVisible();
    click(copy.outcome.showBalance);
    expectBalanceRows(APOLOGY_BALANCES.heart, APOLOGY_BALANCES.heart, locale);
    expect(localStorage.getItem(UI_LOCALE_STORAGE_KEY)).toBe(locale);
  });

  it.each(LENSES)("keeps human selection, reflection acknowledgment and confirmation separate for %s", (lens) => {
    const services = createAppServices(new MemoryGameRepository());
    render(<TabletopApp services={services} />);
    const copy = uiCopy.en;

    click(copy.landing.enter);
    expectPhase(services, "MACHINE_CITY_READY");
    click(copy.futura.showQuestion);
    expectPhase(services, "AWAITING_HUMAN_SELECTION");
    expect(scene.props?.selectable).toBe(false);
    expect(screen.queryByRole("button", { name: copy.confirmation.confirm })).not.toBeInTheDocument();
    click(copy.dilemma.showOptions);
    click(copy.guide.continue);
    expect(scene.props?.availableLenses).toEqual(LENSES);
    expect(scene.props?.selectable).toBe(true);

    pick(lens);
    expectPhase(services, "TENTATIVE_SELECTION_RECORDED");
    let session = services.engine.getSnapshot()!;
    expect(session.tentativeSelection).toMatchObject({ lens, provenance: "PLAYER_UI" });
    expect(session.presentedReflection).toBeNull();
    expect(session.confirmedDecision).toBeNull();
    expect(session.revealedOutcome).toBeNull();
    expect(session.balance).toEqual(ZERO_BALANCE);
    expect(scene.props?.selectedLens).toBe(lens);
    expectBalanceHidden();
    expect(screen.queryByRole("button", { name: copy.confirmation.confirm })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.sealed.reveal })).not.toBeInTheDocument();

    click(copy.choice.showCounterpoint);
    expectPhase(services, "REFLECTION_PRESENTED");
    session = services.engine.getSnapshot()!;
    expect(session.presentedReflection).toMatchObject({ lens, acknowledgedAt: null, provenance: "WEBMCP_AGENT" });
    expect(session.confirmedDecision).toBeNull();
    expect(screen.getByText(copy.dilemmas["apology-delegation"].branches[lens].reflection.question)).toBeVisible();
    expect(screen.queryByRole("button", { name: copy.confirmation.confirm })).not.toBeInTheDocument();
    expectBalanceHidden();

    click(copy.counterpoint.keep[lens]);
    expectPhase(services, "READY_FOR_CONFIRMATION");
    session = services.engine.getSnapshot()!;
    expect(session.presentedReflection?.acknowledgedAt).toEqual(expect.any(String));
    expect(session.confirmedDecision).toBeNull();
    expect(session.balance).toEqual(ZERO_BALANCE);
    expect(screen.queryByRole("button", { name: copy.sealed.reveal })).not.toBeInTheDocument();
    expectBalanceHidden();

    click(copy.confirmation.confirm);
    expectPhase(services, "DECISION_CONFIRMED");
    session = services.engine.getSnapshot()!;
    expect(session.confirmedDecision).toMatchObject({ lens, provenance: "PLAYER_UI", consumedAt: null });
    expect(session.revealedOutcome).toBeNull();
    expect(session.balance).toEqual(ZERO_BALANCE);
    expect(screen.queryByRole("button", { name: copy.counterpoint.reconsider })).not.toBeInTheDocument();
    expect(scene.props?.selectable).toBe(false);
    expectBalanceHidden();

    click(copy.sealed.reveal);
    expectPhase(services, "CONSEQUENCE_REVEALED");
    session = services.engine.getSnapshot()!;
    expect(session.balance).toEqual(APOLOGY_BALANCES[lens]);
    expect(session.outcomeHistory).toHaveLength(1);
    expect(session.revealedOutcome).toMatchObject({ lens, balanceBefore: ZERO_BALANCE, balanceAfter: APOLOGY_BALANCES[lens], appliedDelta: APOLOGY_BALANCES[lens] });
    expect(screen.getByText(copy.dilemmas["apology-delegation"].branches[lens].consequence.gains[0])).toBeVisible();
    expectBalanceHidden();

    click(copy.outcome.showBalance);
    expectPhase(services, "CONSEQUENCE_REVEALED");
    expectBalanceRows(APOLOGY_BALANCES[lens], APOLOGY_BALANCES[lens]);
    expect(scene.props).toMatchObject({ balance: APOLOGY_BALANCES[lens], previousBalance: ZERO_BALANCE, showBalance: true, selectable: false });
    expect(services.engine.getSnapshot()).toEqual(session);
  });

  it("scene selection and changing the selected card only record a tentative human choice", () => {
    const services = createAppServices(new MemoryGameRepository());
    render(<TabletopApp services={services} />);
    enterFirstChoices();

    click("scene pick brain");
    const firstSelectionId = services.engine.getSnapshot()!.tentativeSelection!.selectionId;
    expectPhase(services, "TENTATIVE_SELECTION_RECORDED");
    expect(scene.props?.selectable).toBe(true);
    pick("hand");
    expect(services.engine.getSnapshot()!.tentativeSelection).toMatchObject({ lens: "hand", supersedesSelectionId: firstSelectionId });
    click("scene pick heart");
    const session = services.engine.getSnapshot()!;
    expect(session.tentativeSelection?.lens).toBe("heart");
    expect(session.presentedReflection).toBeNull();
    expect(session.confirmedDecision).toBeNull();
    expect(session.balance).toEqual(ZERO_BALANCE);
    expect(session.outcomeHistory).toHaveLength(0);
    expectPhase(services, "TENTATIVE_SELECTION_RECORDED");
  });

  it("updates the visible reflection when the agent port presents it externally", () => {
    const services = createAppServices(new MemoryGameRepository());
    render(<TabletopApp services={services} />);
    enterFirstChoices();
    pick("brain");
    const selected = services.engine.getSnapshot()!;

    act(() => {
      services.agentCommands.presentChoiceReflection(selected.sessionId, selected.tentativeSelection!.selectionId, selected.stateRevision);
    });

    expectPhase(services, "REFLECTION_PRESENTED");
    expect(screen.getByText(uiCopy.en.dilemmas["apology-delegation"].branches.brain.reflection.question)).toBeVisible();
    expect(screen.getByRole("button", { name: uiCopy.en.counterpoint.keep.brain })).toBeVisible();
    expect(services.agentQuery.getCurrentGameState(selected.sessionId)).toMatchObject({ reflectionAcknowledged: false, confirmedDecisionId: null });
    expect(screen.queryByRole("button", { name: uiCopy.en.confirmation.confirm })).not.toBeInTheDocument();
    expectBalanceHidden();
  });

  it.each([false, true])("reconsidering after acknowledgment=%s resets the previous reflection when another lens is picked", (acknowledge) => {
    const services = createAppServices(new MemoryGameRepository());
    render(<TabletopApp services={services} />);
    enterFirstChoices();
    pick("brain");
    click(uiCopy.en.choice.showCounterpoint);
    if (acknowledge) click(uiCopy.en.counterpoint.keep.brain);
    const previous = services.engine.getSnapshot()!;

    click(uiCopy.en.counterpoint.reconsider);
    expect(scene.props?.selectable).toBe(true);
    pick("hand");
    const changed = services.engine.getSnapshot()!;
    expectPhase(services, "TENTATIVE_SELECTION_RECORDED");
    expect(changed.tentativeSelection).toMatchObject({ lens: "hand", supersedesSelectionId: previous.tentativeSelection!.selectionId });
    expect(changed.presentedReflection).toBeNull();
    expect(changed.confirmedDecision).toBeNull();
    expect(changed.balance).toEqual(ZERO_BALANCE);
    expect(screen.queryByRole("button", { name: uiCopy.en.confirmation.confirm })).not.toBeInTheDocument();

    finishSelectedRound("hand");
    const finished = services.engine.getSnapshot()!;
    expect(finished.presentedReflection!.reflectionId).not.toBe(previous.presentedReflection!.reflectionId);
    expect(finished.balance).toEqual(APOLOGY_BALANCES.hand);
    expect(finished.outcomeHistory.map(({ lens }) => lens)).toEqual(["hand"]);
  });

  it("remounts persisted revealed state without applying a decision twice", () => {
    const repository = new MemoryGameRepository();
    const services = createAppServices(repository);
    const firstRender = render(<TabletopApp services={services} />);
    enterFirstChoices();
    pick("hand");
    finishSelectedRound("hand");
    click(uiCopy.en.outcome.showBalance);
    const before = services.engine.getSnapshot()!;
    firstRender.unmount();

    const restored = createAppServices(repository);
    render(<TabletopApp services={restored} />);
    expectPhase(restored, "CONSEQUENCE_REVEALED");
    expect(restored.engine.getSnapshot()).toEqual(before);
    const showBalance = screen.queryByRole("button", { name: uiCopy.en.outcome.showBalance });
    if (showBalance) fireEvent.click(showBalance);
    expectBalanceRows(APOLOGY_BALANCES.hand, APOLOGY_BALANCES.hand);
    expect(restored.engine.getSnapshot()).toEqual(before);
    expect(restored.engine.getSnapshot()!.outcomeHistory).toHaveLength(1);
  });

  it("clears reasoning from the previous direction after a successful reconsidered choice", () => {
    const services = createAppServices(new MemoryGameRepository());
    render(<TabletopApp services={services} />);
    enterFirstChoices();
    pick("brain");
    click(uiCopy.en.choice.showCounterpoint);
    click(uiCopy.en.counterpoint.keep.brain);
    fireEvent.change(screen.getByRole("textbox", { name: uiCopy.en.confirmation.reasonAriaLabel }), {
      target: { value: "I want help writing, but I will choose my own words." },
    });

    click(uiCopy.en.counterpoint.reconsider);
    pick("hand");
    click(uiCopy.en.choice.showCounterpoint);
    click(uiCopy.en.counterpoint.keep.hand);
    expectPhase(services, "READY_FOR_CONFIRMATION");
    expect(screen.getByRole("textbox", { name: uiCopy.en.confirmation.reasonAriaLabel })).toHaveValue("");
    click(uiCopy.en.confirmation.confirm);
    expect(services.engine.getSnapshot()!.confirmedDecision).toMatchObject({ lens: "hand", reasoning: "" });
  });

  it("plays all four catalog dilemmas in one session and only offers restart after GAME_COMPLETE", () => {
    const repository = new MemoryGameRepository();
    const services = createAppServices(repository);
    render(<TabletopApp services={services} />);
    click(uiCopy.en.landing.enter);
    const sessionId = services.engine.getSnapshot()!.sessionId;
    click(uiCopy.en.futura.showQuestion);
    const rounds = [
      { id: "apology-delegation", lens: "brain", balance: { comfort: 1, control: 1, connection: -1, freedom: 0, responsibility: 0 } },
      { id: "homework-delegation", lens: "heart", balance: { comfort: -1, control: 2, connection: 0, freedom: -1, responsibility: 2 } },
      { id: "interview-shortlist-delegation", lens: "hand", balance: { comfort: 1, control: 1, connection: -1, freedom: -1, responsibility: 1 } },
      { id: "claim-verification-delegation", lens: "brain", balance: { comfort: 2, control: 2, connection: -2, freedom: -1, responsibility: 2 } },
    ] as const;

    rounds.forEach((round, index) => {
      const before = services.engine.getSnapshot()!;
      expectPhase(services, "AWAITING_HUMAN_SELECTION");
      expect(before.sessionId).toBe(sessionId);
      expect(before.activeDilemmaId).toBe(round.id);
      expect(before.outcomeHistory).toHaveLength(index);
      expect(screen.getByRole("heading", { name: uiCopy.en.dilemmas[round.id].title })).toBeVisible();
      expect(screen.queryByRole("button", { name: uiCopy.en.balance.restart })).not.toBeInTheDocument();
      click(uiCopy.en.dilemma.showOptions);
      if (index === 0) click(uiCopy.en.guide.continue);
      else expect(screen.queryByRole("button", { name: uiCopy.en.guide.continue })).not.toBeInTheDocument();
      pick(round.lens);
      finishSelectedRound(round.lens);
      expect(screen.getByText(uiCopy.en.dilemmas[round.id].branches[round.lens].consequence.gains[0])).toBeVisible();
      click(uiCopy.en.outcome.showBalance);

      const after = services.engine.getSnapshot()!;
      expectPhase(services, "CONSEQUENCE_REVEALED");
      expect(after.sessionId).toBe(sessionId);
      expect(after.balance).toEqual(round.balance);
      expect(after.outcomeHistory).toHaveLength(index + 1);
      expect(after.outcomeHistory.slice(0, index)).toEqual(before.outcomeHistory);
      expect(after.completedDilemmaIds).toEqual(rounds.slice(0, index + 1).map(({ id }) => id));
      expect(screen.queryByRole("button", { name: uiCopy.en.balance.restart })).not.toBeInTheDocument();
      if (index < rounds.length - 1) {
        expect(screen.queryByRole("button", { name: uiCopy.en.balance.endGame })).not.toBeInTheDocument();
        click(uiCopy.en.balance.nextQuestion);
      } else {
        expect(screen.queryByRole("button", { name: uiCopy.en.balance.nextQuestion })).not.toBeInTheDocument();
        click(uiCopy.en.balance.endGame);
      }
    });

    expectPhase(services, "GAME_COMPLETE");
    const finished = services.engine.getSnapshot()!;
    expect(finished.sessionId).toBe(sessionId);
    expect(finished.balance).toEqual(rounds[3].balance);
    expect(finished.outcomeHistory).toHaveLength(4);
    expect(finished.activeDilemmaId).toBeNull();
    expect(screen.getByText(uiCopy.en.balance.gameComplete)).toBeVisible();
    expect(scene.props).toMatchObject({ balance: rounds[3].balance, showBalance: true, selectable: false });
    axes.forEach((axis) => {
      expect(screen.getByTestId(`tabletop-axis-${axis}`)).toHaveTextContent(String(rounds[3].balance[axis]));
    });
    click(uiCopy.en.balance.restart);
    expectPhase(services, "NO_SESSION");
    expect(repository.load()).toBeNull();
    expectBalanceHidden();
    click(uiCopy.en.landing.enter);
    const restarted = services.engine.getSnapshot()!;
    expect(restarted.sessionId).not.toBe(sessionId);
    expect(restarted.balance).toEqual(ZERO_BALANCE);
    expect(restarted.outcomeHistory).toHaveLength(0);
  });

  it("advances the same session to homework and shows cumulative values with clamped applied deltas", () => {
    const services = createAppServices(new MemoryGameRepository());
    render(<TabletopApp services={services} />);
    enterFirstChoices();
    pick("hand");
    finishSelectedRound("hand");
    click(uiCopy.en.outcome.showBalance);
    const first = services.engine.getSnapshot()!;

    click(uiCopy.en.balance.nextQuestion);
    expectPhase(services, "AWAITING_HUMAN_SELECTION");
    const next = services.engine.getSnapshot()!;
    expect(next.sessionId).toBe(first.sessionId);
    expect(next.activeDilemmaId).toBe("homework-delegation");
    expect(next.outcomeHistory).toEqual(first.outcomeHistory);
    expect(next.balance).toEqual(APOLOGY_BALANCES.hand);
    expect(screen.getByRole("heading", { name: uiCopy.en.dilemmas["homework-delegation"].title })).toBeVisible();
    expect(screen.queryByRole("heading", { name: uiCopy.en.dilemmas["apology-delegation"].title })).not.toBeInTheDocument();
    expectBalanceHidden();
    click(uiCopy.en.dilemma.showOptions);
    expect(screen.queryByRole("button", { name: uiCopy.en.guide.continue })).not.toBeInTheDocument();
    pick("brain");
    finishSelectedRound("brain");
    expect(screen.getByText(uiCopy.en.dilemmas["homework-delegation"].branches.brain.consequence.gains[0])).toBeVisible();
    click(uiCopy.en.outcome.showBalance);

    const expectedBalance = { comfort: 2, control: 0, connection: -1, freedom: 0, responsibility: 0 };
    const expectedAppliedDelta = { comfort: 0, control: 1, connection: 0, freedom: -1, responsibility: 1 };
    const completed = services.engine.getSnapshot()!;
    expect(completed.sessionId).toBe(first.sessionId);
    expect(completed.completedDilemmaIds).toEqual(["apology-delegation", "homework-delegation"]);
    expect(completed.outcomeHistory).toHaveLength(2);
    expect(completed.outcomeHistory[0]).toEqual(first.outcomeHistory[0]);
    expect(completed.balance).toEqual(expectedBalance);
    expect(completed.revealedOutcome?.rawDelta.comfort).toBe(1);
    expect(completed.revealedOutcome?.appliedDelta).toEqual(expectedAppliedDelta);
    expectBalanceRows(expectedBalance, expectedAppliedDelta);
    expect(scene.props).toMatchObject({ balance: expectedBalance, previousBalance: APOLOGY_BALANCES.hand, showBalance: true });
  });

  it("registers only the existing five agent tools, whose calls update the tabletop without confirming for the human", async () => {
    const services = createAppServices(new MemoryGameRepository());
    const registered: WebMcpToolDefinition[] = [];
    document.modelContext = {
      registerTool: vi.fn(async (tool) => { registered.push(tool); }),
    };
    render(<TabletopApp services={services} />);
    await waitFor(() => expect(registered).toHaveLength(5));
    expect(registered.map(({ name }) => name)).toEqual([...WEBMCP_TOOL_NAMES]);

    await act(async () => {
      await registered.find(({ name }) => name === "enter_machine_city")!.execute({});
    });
    expectPhase(services, "MACHINE_CITY_READY");
    const entered = services.engine.getSnapshot()!;
    await act(async () => {
      await registered.find(({ name }) => name === "present_dilemma")!.execute({ sessionId: entered.sessionId, expectedRevision: entered.stateRevision });
    });
    expectPhase(services, "AWAITING_HUMAN_SELECTION");
    click(uiCopy.en.dilemma.showOptions);
    click(uiCopy.en.guide.continue);
    pick("brain");
    const selected = services.engine.getSnapshot()!;
    await act(async () => {
      await registered.find(({ name }) => name === "present_choice_reflection")!.execute({ sessionId: selected.sessionId, tentativeSelectionId: selected.tentativeSelection!.selectionId, expectedRevision: selected.stateRevision });
    });
    expectPhase(services, "REFLECTION_PRESENTED");
    expect(screen.getByRole("button", { name: uiCopy.en.counterpoint.keep.brain })).toBeVisible();
    expect(services.engine.getSnapshot()!.confirmedDecision).toBeNull();
    expect(services.engine.getSnapshot()!.presentedReflection!.acknowledgedAt).toBeNull();
    expect(services.engine.getSnapshot()!.balance).toEqual(ZERO_BALANCE);
  });
});
