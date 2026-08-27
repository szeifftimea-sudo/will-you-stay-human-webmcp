import { describe, expect, it } from "vitest";
import { apologyDilemma } from "../../src/content/dilemmas/apology.hu";
import { GameError } from "../../src/domain/gameErrors";
import {
  ZERO_BALANCE,
  type BalanceDelta,
  type DilemmaCatalog,
  type Lens,
} from "../../src/domain/gameTypes";
import { advanceToConfirmedDecision, createTestEngine } from "../../src/test/fixtures";

const LENS_CASES = [
  {
    lens: "brain",
    label: "AGY",
    expectedDelta: { comfort: 1, control: 1, connection: -1, freedom: 0, responsibility: 0 },
  },
  {
    lens: "hand",
    label: "KÉZ",
    expectedDelta: { comfort: 2, control: -1, connection: -1, freedom: 1, responsibility: -1 },
  },
  {
    lens: "heart",
    label: "SZÍV",
    expectedDelta: { comfort: -1, control: 1, connection: 1, freedom: -1, responsibility: 1 },
  },
] satisfies Array<{ lens: Lens; label: string; expectedDelta: BalanceDelta }>;

const expectNonEmptyText = (value: string) => expect(value.trim().length).toBeGreaterThan(0);

describe("GameEngine", () => {
  it("atomikusan mutatja be a dilemmát és csak utána enged kijelölést", () => {
    const { agent, engine } = createTestEngine();
    const entered = agent.enterMachineCity().session;

    const result = agent.presentDilemma(entered.sessionId, entered.stateRevision);

    expect(result.session.phase).toBe("AWAITING_HUMAN_SELECTION");
    expect(result.session.activeDilemmaId).toBe("apology-delegation");
    expect(result.dilemma?.id).toBe(result.session.activeDilemmaId);
    expect(() => engine.selectLens("brain")).not.toThrow();
  });

  it("nem tár fel következményt emberi megerősítés előtt", () => {
    const { agent } = createTestEngine();
    const entered = agent.enterMachineCity().session;
    const presented = agent.presentDilemma(entered.sessionId, entered.stateRevision).session;

    expect(() =>
      agent.revealConfirmedConsequence(presented.sessionId, "fake-decision", presented.stateRevision),
    ).toThrowError(GameError);

    try {
      agent.revealConfirmedConsequence(presented.sessionId, "fake-decision", presented.stateRevision);
    } catch (error) {
      expect((error as GameError).code).toBe("HUMAN_DECISION_REQUIRED");
    }
  });

  it("csak az aktuális játékosi kijelöléshez mutat reflexiót", () => {
    const { agent, player, engine } = createTestEngine();
    const entered = agent.enterMachineCity().session;
    agent.presentDilemma(entered.sessionId, entered.stateRevision);
    player.selectLens("heart");
    const selected = engine.getSnapshot()!;

    expect(() =>
      agent.presentChoiceReflection(selected.sessionId, "nem-aktualis-id", selected.stateRevision),
    ).toThrowError(expect.objectContaining({ code: "SELECTION_ID_MISMATCH" }));
  });

  it.each(LENS_CASES)(
    "$label ág: azonos emberi kontrollfolyam, pontos tartalomkapcsolat és egyszeri hatás",
    ({ lens, label, expectedDelta }) => {
      const context = createTestEngine();
      const phases = ["NO_SESSION"];
      const option = apologyDilemma.lenses.find((candidate) => candidate.lens === lens)!;
      expect(option.label).toBe(label);

      const entered = context.agent.enterMachineCity().session;
      phases.push(entered.phase);
      const presented = context.agent.presentDilemma(
        entered.sessionId,
        entered.stateRevision,
      ).session;
      phases.push(presented.phase);

      const selected = context.player.selectLens(lens);
      phases.push(selected.phase);
      const selectionId = selected.tentativeSelection!.selectionId;
      expect(selected.tentativeSelection).toMatchObject({
        dilemmaId: apologyDilemma.id,
        lens,
        provenance: "PLAYER_UI",
      });

      const reflected = context.agent.presentChoiceReflection(
        selected.sessionId,
        selectionId,
        selected.stateRevision,
      );
      phases.push(reflected.session.phase);
      expect(reflected.payload).toMatchObject({
        tentativeSelectionId: selectionId,
        selectedLens: lens,
        reflection: option.reflection,
      });
      expect(reflected.session.presentedReflection).toMatchObject({
        selectionId,
        dilemmaId: apologyDilemma.id,
        lens,
        provenance: "WEBMCP_AGENT",
      });
      Object.values(reflected.payload.reflection).forEach(expectNonEmptyText);

      expect(() => context.player.confirmDecision()).toThrowError(
        expect.objectContaining({ code: "REFLECTION_NOT_ACKNOWLEDGED" }),
      );
      expect("acknowledgeReflection" in context.agent).toBe(false);

      const acknowledged = context.player.acknowledgeReflection(
        reflected.session.presentedReflection!.reflectionId,
      );
      phases.push(acknowledged.phase);
      expect(acknowledged.presentedReflection?.acknowledgedAt).not.toBeNull();

      const confirmed = context.player.confirmDecision();
      phases.push(confirmed.phase);
      const decisionId = confirmed.confirmedDecision!.decisionId;
      expect(confirmed.confirmedDecision).toMatchObject({
        dilemmaId: apologyDilemma.id,
        lens,
        basedOnSelectionId: selectionId,
        basedOnReflectionId: acknowledged.presentedReflection!.reflectionId,
        provenance: "PLAYER_UI",
      });
      expect(confirmed.balance).toEqual(ZERO_BALANCE);

      const revealed = context.agent.revealConfirmedConsequence(
        confirmed.sessionId,
        decisionId,
        confirmed.stateRevision,
      );
      phases.push(revealed.session.phase);
      expect(revealed.payload).toMatchObject({
        dilemmaId: apologyDilemma.id,
        decisionId,
        lens,
        rawDelta: expectedDelta,
        appliedDelta: expectedDelta,
        balanceBefore: ZERO_BALANCE,
        balanceAfter: expectedDelta,
        alreadyRevealed: false,
      });
      expect(revealed.payload.gains).toEqual(option.consequence.gains);
      expect(revealed.payload.costs).toEqual(option.consequence.costs);
      expect(revealed.payload.explanation).toBe(option.consequence.explanation);
      expect(revealed.payload.closingReflection).toBe(option.consequence.closingReflection);
      revealed.payload.gains.forEach(expectNonEmptyText);
      revealed.payload.costs.forEach(expectNonEmptyText);
      expectNonEmptyText(revealed.payload.explanation);
      expectNonEmptyText(revealed.payload.closingReflection);
      expect(revealed.session.balance).toEqual(expectedDelta);
      expect(revealed.session.revealedOutcome).toMatchObject({
        dilemmaId: apologyDilemma.id,
        decisionId,
        lens,
        effectApplicationKey: decisionId,
        effectApplied: true,
      });

      const retry = context.agent.revealConfirmedConsequence(
        confirmed.sessionId,
        decisionId,
        confirmed.stateRevision,
      );
      expect(retry.payload).toEqual({ ...revealed.payload, alreadyRevealed: true });
      expect(retry.session.balance).toEqual(expectedDelta);
      expect(retry.session.outcomeHistory).toHaveLength(1);

      const completed = context.agent.presentDilemma(
        retry.session.sessionId,
        retry.session.stateRevision,
      );
      phases.push(completed.session.phase);
      expect(completed.gameComplete).toBe(true);
      expect(phases).toEqual([
        "NO_SESSION",
        "MACHINE_CITY_READY",
        "AWAITING_HUMAN_SELECTION",
        "TENTATIVE_SELECTION_RECORDED",
        "REFLECTION_PRESENTED",
        "READY_FOR_CONFIRMATION",
        "DECISION_CONFIRMED",
        "CONSEQUENCE_REVEALED",
        "GAME_COMPLETE",
      ]);
    },
  );

  it("SZÍV-ről AGY-ra váltva érvényteleníti a régi reflexiót és újat követel", () => {
    const context = createTestEngine();
    const entered = context.agent.enterMachineCity().session;
    context.agent.presentDilemma(entered.sessionId, entered.stateRevision);

    const heartSelection = context.player.selectLens("heart");
    const heartSelectionId = heartSelection.tentativeSelection!.selectionId;
    const heartReflection = context.agent.presentChoiceReflection(
      heartSelection.sessionId,
      heartSelectionId,
      heartSelection.stateRevision,
    );
    const heartReflectionId = heartReflection.session.presentedReflection!.reflectionId;

    const brainSelection = context.player.selectLens("brain");
    const brainSelectionId = brainSelection.tentativeSelection!.selectionId;
    expect(brainSelection.phase).toBe("TENTATIVE_SELECTION_RECORDED");
    expect(brainSelection.tentativeSelection).toMatchObject({
      lens: "brain",
      supersedesSelectionId: heartSelectionId,
    });
    expect(brainSelection.presentedReflection).toBeNull();
    expect(brainSelection.confirmedDecision).toBeNull();
    expect(() => context.player.acknowledgeReflection(heartReflectionId)).toThrowError(
      expect.objectContaining({ code: "REFLECTION_REQUIRED" }),
    );
    expect(() => context.player.confirmDecision()).toThrowError(
      expect.objectContaining({ code: "REFLECTION_NOT_ACKNOWLEDGED" }),
    );
    expect(() =>
      context.agent.presentChoiceReflection(
        brainSelection.sessionId,
        heartSelectionId,
        brainSelection.stateRevision,
      ),
    ).toThrowError(expect.objectContaining({ code: "SELECTION_ID_MISMATCH" }));

    const brainReflection = context.agent.presentChoiceReflection(
      brainSelection.sessionId,
      brainSelectionId,
      brainSelection.stateRevision,
    );
    expect(brainReflection.payload.selectedLens).toBe("brain");
    expect(brainReflection.payload.tentativeSelectionId).toBe(brainSelectionId);
    expect(brainReflection.payload.reflection).toEqual(
      apologyDilemma.lenses.find(({ lens }) => lens === "brain")!.reflection,
    );
    expect(brainReflection.session.presentedReflection?.reflectionId).not.toBe(heartReflectionId);
    expect(() => context.player.confirmDecision()).toThrowError(
      expect.objectContaining({ code: "REFLECTION_NOT_ACKNOWLEDGED" }),
    );

    const acknowledged = context.player.acknowledgeReflection(
      brainReflection.session.presentedReflection!.reflectionId,
    );
    const confirmed = context.player.confirmDecision();
    expect(acknowledged.phase).toBe("READY_FOR_CONFIRMATION");
    expect(confirmed.confirmedDecision).toMatchObject({
      lens: "brain",
      basedOnSelectionId: brainSelectionId,
      basedOnReflectionId: brainReflection.session.presentedReflection!.reflectionId,
      provenance: "PLAYER_UI",
    });
  });

  it("a következő dilemma bemutatását és a választható fázist együtt commitálja", () => {
    const second = structuredClone(apologyDilemma);
    second.id = "second-temporary-dilemma";
    second.order = 2;
    second.title = "Második ideiglenes tesztdilemma";
    const catalog: DilemmaCatalog = {
      schemaVersion: 1,
      contentVersion: "test-two-dilemmas",
      language: "hu",
      dilemmas: [apologyDilemma, second],
    };
    const context = createTestEngine(catalog);
    const entered = context.agent.enterMachineCity().session;
    context.agent.presentDilemma(entered.sessionId, entered.stateRevision);
    context.player.selectLens("brain");
    let session = context.engine.getSnapshot()!;
    context.agent.presentChoiceReflection(
      session.sessionId,
      session.tentativeSelection!.selectionId,
      session.stateRevision,
    );
    session = context.engine.getSnapshot()!;
    context.player.acknowledgeReflection(session.presentedReflection!.reflectionId);
    context.player.confirmDecision();
    session = context.engine.getSnapshot()!;
    context.agent.revealConfirmedConsequence(
      session.sessionId,
      session.confirmedDecision!.decisionId,
      session.stateRevision,
    );
    session = context.engine.getSnapshot()!;

    const nextRound = context.agent.presentDilemma(session.sessionId, session.stateRevision);

    expect(nextRound.session.phase).toBe("AWAITING_HUMAN_SELECTION");
    expect(nextRound.session.activeDilemmaId).toBe(second.id);
    expect(nextRound.dilemma?.id).toBe(second.id);
    expect(nextRound.session.tentativeSelection).toBeNull();
  });

  it("az utolsó feltárt dilemma után külön present_dilemma hívással zár", () => {
    const context = advanceToConfirmedDecision();
    let session = context.engine.getSnapshot()!;
    context.agent.revealConfirmedConsequence(
      session.sessionId,
      session.confirmedDecision!.decisionId,
      session.stateRevision,
    );
    session = context.engine.getSnapshot()!;

    const completed = context.agent.presentDilemma(session.sessionId, session.stateRevision);

    expect(completed.gameComplete).toBe(true);
    expect(completed.session.phase).toBe("GAME_COMPLETE");
    expect(completed.session.activeDilemmaId).toBeNull();
  });
});
