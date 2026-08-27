import { describe, expect, it } from "vitest";
import { apologyDilemma } from "../../src/content/dilemmas/apology.hu";
import { GameError } from "../../src/domain/gameErrors";
import type { DilemmaCatalog } from "../../src/domain/gameTypes";
import { advanceToConfirmedDecision, createTestEngine } from "../../src/test/fixtures";

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

  it("a következményt pontosan egyszer alkalmazza és a mentett eredményt adja retry esetén", () => {
    const context = advanceToConfirmedDecision();
    const confirmed = context.engine.getSnapshot()!;
    const decisionId = confirmed.confirmedDecision!.decisionId;

    const first = context.agent.revealConfirmedConsequence(
      confirmed.sessionId,
      decisionId,
      confirmed.stateRevision,
    );
    const balanceAfterFirst = first.session.balance;
    const retry = context.agent.revealConfirmedConsequence(
      confirmed.sessionId,
      decisionId,
      confirmed.stateRevision,
    );

    expect(first.session.phase).toBe("CONSEQUENCE_REVEALED");
    expect(first.payload.alreadyRevealed).toBe(false);
    expect(retry.payload.alreadyRevealed).toBe(true);
    expect(retry.session.balance).toEqual(balanceAfterFirst);
    expect(retry.session.outcomeHistory).toHaveLength(1);
    expect(retry.session.revealedOutcome?.effectApplicationKey).toBe(decisionId);
    expect(retry.session.revealedOutcome?.toolExecution.resultPayload).toEqual(first.payload);
  });

  it("az AGY ág narratív árát Kapcsolódás mínusz egyként alkalmazza", () => {
    const context = advanceToConfirmedDecision();
    const confirmed = context.engine.getSnapshot()!;
    const decisionId = confirmed.confirmedDecision!.decisionId;

    const revealed = context.agent.revealConfirmedConsequence(
      confirmed.sessionId,
      decisionId,
      confirmed.stateRevision,
    );

    expect(revealed.payload.rawDelta).toEqual({
      comfort: 1,
      control: 1,
      connection: -1,
      freedom: 0,
      responsibility: 0,
    });
    expect(revealed.payload.appliedDelta).toEqual(revealed.payload.rawDelta);
    expect(revealed.session.balance).toEqual(revealed.payload.balanceAfter);
    expect(revealed.session.balance.connection).toBe(-1);
    expect(revealed.payload.costs).toContain(
      "A saját hangod és a generált hang közötti határ elmosódhat.",
    );
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
