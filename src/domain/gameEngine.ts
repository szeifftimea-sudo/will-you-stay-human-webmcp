import { applyBalanceDelta } from "./balance";
import { GameError } from "./gameErrors";
import { assertSessionInvariants } from "./invariants";
import {
  ZERO_BALANCE,
  type ConsequenceRevealPayload,
  type Dilemma,
  type DilemmaCatalog,
  type GameSession,
  type Lens,
  type PublicDilemma,
  type ReflectionPayload,
} from "./gameTypes";

export interface SessionStore {
  load(): GameSession | null;
  save(session: GameSession): void;
  clear(): void;
}

export interface EngineDependencies {
  idFactory?: () => string;
  now?: () => string;
}

export interface PresentDilemmaResult {
  session: GameSession;
  dilemma: PublicDilemma | null;
  gameComplete: boolean;
}

type Listener = (session: GameSession | null) => void;

const clone = <T>(value: T): T => structuredClone(value);

export class GameEngine {
  private session: GameSession | null;
  private readonly listeners = new Set<Listener>();
  private readonly idFactory: () => string;
  private readonly now: () => string;

  constructor(
    private readonly catalog: DilemmaCatalog,
    private readonly store: SessionStore,
    dependencies: EngineDependencies = {},
  ) {
    this.idFactory = dependencies.idFactory ?? (() => crypto.randomUUID());
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.session = this.restore();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): GameSession | null {
    return this.session ? clone(this.session) : null;
  }

  getActiveDilemma(): Dilemma | null {
    if (!this.session?.activeDilemmaId) return null;
    return this.catalog.dilemmas.find(({ id }) => id === this.session?.activeDilemmaId) ?? null;
  }

  enterMachineCity(): { session: GameSession; resumed: boolean } {
    if (this.session) return { session: clone(this.session), resumed: true };

    const timestamp = this.now();
    const next: GameSession = {
      schemaVersion: 1,
      contentVersion: this.catalog.contentVersion,
      sessionId: this.idFactory(),
      stateRevision: 0,
      language: "hu",
      phase: "MACHINE_CITY_READY",
      startedAt: timestamp,
      updatedAt: timestamp,
      activeDilemmaId: null,
      tentativeSelection: null,
      presentedReflection: null,
      confirmedDecision: null,
      revealedOutcome: null,
      outcomeHistory: [],
      completedDilemmaIds: [],
      balance: { ...ZERO_BALANCE },
    };
    this.persistNew(next);
    return { session: clone(next), resumed: false };
  }

  presentDilemma(sessionId: string, expectedRevision: number): PresentDilemmaResult {
    const current = this.requireSession(sessionId);
    if (![
      "MACHINE_CITY_READY",
      "CONSEQUENCE_REVEALED",
    ].includes(current.phase)) {
      throw new GameError("INVALID_PHASE", "Ebben a fázisban nem mutatható be dilemma.");
    }
    this.assertRevision(current, expectedRevision);

    const dilemma = this.catalog.dilemmas
      .filter(({ status }) => status === "playable")
      .sort((a, b) => a.order - b.order)
      .find(({ id }) => !current.completedDilemmaIds.includes(id));

    if (!dilemma) {
      if (current.phase !== "CONSEQUENCE_REVEALED") {
        throw new GameError("NO_PLAYABLE_DILEMMA", "Nincs bemutatható dilemma.", false);
      }
      const completed = this.commit(current, (next) => {
        next.phase = "GAME_COMPLETE";
        next.activeDilemmaId = null;
        next.tentativeSelection = null;
        next.presentedReflection = null;
        next.confirmedDecision = null;
        next.revealedOutcome = null;
      });
      return { session: completed, dilemma: null, gameComplete: true };
    }

    const next = this.commit(current, (draft) => {
      draft.activeDilemmaId = dilemma.id;
      draft.phase = "AWAITING_HUMAN_SELECTION";
      draft.tentativeSelection = null;
      draft.presentedReflection = null;
      draft.confirmedDecision = null;
      draft.revealedOutcome = null;
    });

    // The phase and active dilemma are committed together; selection is never enabled without content.
    return { session: next, dilemma: this.toPublicDilemma(dilemma), gameComplete: false };
  }

  selectLens(lens: Lens): GameSession {
    const current = this.requireSession();
    if (![
      "AWAITING_HUMAN_SELECTION",
      "TENTATIVE_SELECTION_RECORDED",
      "REFLECTION_PRESENTED",
      "READY_FOR_CONFIRMATION",
    ].includes(current.phase)) {
      throw new GameError("INVALID_PHASE", "Ebben a fázisban a játékos nem jelölhet irányt.");
    }
    const dilemma = this.requireActiveDilemma();
    if (!dilemma.lenses.some((option) => option.lens === lens)) {
      throw new GameError("INVALID_INPUT", "Ismeretlen döntési irány.");
    }
    const previousId = current.tentativeSelection?.selectionId ?? null;
    return this.commit(current, (next) => {
      next.tentativeSelection = {
        selectionId: this.idFactory(),
        dilemmaId: dilemma.id,
        lens,
        provenance: "PLAYER_UI",
        selectedAt: this.now(),
        supersedesSelectionId: previousId,
      };
      next.presentedReflection = null;
      next.confirmedDecision = null;
      next.phase = "TENTATIVE_SELECTION_RECORDED";
    });
  }

  presentChoiceReflection(
    sessionId: string,
    tentativeSelectionId: string,
    expectedRevision: number,
  ): { session: GameSession; payload: ReflectionPayload } {
    const current = this.requireSession(sessionId);
    const selection = current.tentativeSelection;
    if (!selection) {
      throw new GameError("TENTATIVE_SELECTION_REQUIRED", "Előbb a játékosnak kell kijelölnie egy irányt.");
    }
    if (selection.selectionId !== tentativeSelectionId) {
      throw new GameError("SELECTION_ID_MISMATCH", "A kijelölésazonosító nem az aktuális választáshoz tartozik.");
    }

    if (
      current.presentedReflection?.selectionId === tentativeSelectionId &&
      ["REFLECTION_PRESENTED", "READY_FOR_CONFIRMATION", "DECISION_CONFIRMED"].includes(
        current.phase,
      )
    ) {
      return {
        session: clone(current),
        payload: this.reflectionPayload(current, true),
      };
    }

    if (current.phase !== "TENTATIVE_SELECTION_RECORDED") {
      throw new GameError("INVALID_PHASE", "Ebben a fázisban nem mutatható be új reflexió.");
    }
    this.assertRevision(current, expectedRevision);

    const next = this.commit(current, (draft) => {
      draft.presentedReflection = {
        reflectionId: this.idFactory(),
        selectionId: selection.selectionId,
        dilemmaId: selection.dilemmaId,
        lens: selection.lens,
        contentVersion: this.catalog.contentVersion,
        provenance: "WEBMCP_AGENT",
        presentedAt: this.now(),
        acknowledgedAt: null,
      };
      draft.phase = "REFLECTION_PRESENTED";
    });

    return { session: next, payload: this.reflectionPayload(next, false) };
  }

  acknowledgeReflection(reflectionId: string): GameSession {
    const current = this.requireSession();
    if (current.phase !== "REFLECTION_PRESENTED" || !current.presentedReflection) {
      throw new GameError("REFLECTION_REQUIRED", "Nincs játékos által megtartható reflexió.");
    }
    if (current.presentedReflection.reflectionId !== reflectionId) {
      throw new GameError("REFLECTION_ID_MISMATCH", "A reflexióazonosító nem aktuális.");
    }
    return this.commit(current, (next) => {
      if (!next.presentedReflection) throw new GameError("REFLECTION_REQUIRED", "Hiányzó reflexió.");
      next.presentedReflection.acknowledgedAt = this.now();
      next.phase = "READY_FOR_CONFIRMATION";
    });
  }

  confirmDecision(reasoning = ""): GameSession {
    const current = this.requireSession();
    const selection = current.tentativeSelection;
    const reflection = current.presentedReflection;
    if (current.phase !== "READY_FOR_CONFIRMATION" || !selection || !reflection) {
      throw new GameError("REFLECTION_NOT_ACKNOWLEDGED", "A döntés csak megtartott reflexió után erősíthető meg.");
    }
    if (!reflection.acknowledgedAt) {
      throw new GameError("REFLECTION_NOT_ACKNOWLEDGED", "A reflexiót a játékos még nem tartotta meg.");
    }
    return this.commit(current, (next) => {
      next.confirmedDecision = {
        decisionId: this.idFactory(),
        dilemmaId: selection.dilemmaId,
        lens: selection.lens,
        basedOnSelectionId: selection.selectionId,
        basedOnReflectionId: reflection.reflectionId,
        reasoning: reasoning.slice(0, 500),
        provenance: "PLAYER_UI",
        confirmedAt: this.now(),
        consumedAt: null,
      };
      next.phase = "DECISION_CONFIRMED";
    });
  }

  revealConfirmedConsequence(
    sessionId: string,
    confirmedDecisionId: string,
    expectedRevision: number,
  ): { session: GameSession; payload: ConsequenceRevealPayload } {
    const current = this.requireSession(sessionId);
    const saved = current.outcomeHistory.find(({ decisionId }) => decisionId === confirmedDecisionId);
    if (saved) {
      return {
        session: clone(current),
        payload: { ...clone(saved.toolExecution.resultPayload), alreadyRevealed: true },
      };
    }
    if (current.phase !== "DECISION_CONFIRMED") {
      throw new GameError(
        "HUMAN_DECISION_REQUIRED",
        "Következmény csak véglegesen megerősített emberi döntés után tárható fel.",
      );
    }
    const decision = current.confirmedDecision;
    if (!decision) {
      throw new GameError("HUMAN_DECISION_REQUIRED", "Hiányzik a megerősített döntés.");
    }
    if (decision.decisionId !== confirmedDecisionId) {
      throw new GameError("DECISION_ID_MISMATCH", "A döntésazonosító nem egyezik.");
    }
    this.assertRevision(current, expectedRevision);

    const dilemma = this.requireActiveDilemma();
    const consequence = dilemma.lenses.find(({ lens }) => lens === decision.lens)?.consequence;
    if (!consequence) throw new GameError("DILEMMA_MISMATCH", "A döntés következménye hiányzik.", false);

    const balanceBefore = clone(current.balance);
    const { balanceAfter, appliedDelta } = applyBalanceDelta(balanceBefore, consequence.delta);
    const revealedAt = this.now();
    const payload: ConsequenceRevealPayload = {
      dilemmaId: dilemma.id,
      decisionId: decision.decisionId,
      lens: decision.lens,
      gains: [...consequence.gains],
      costs: [...consequence.costs],
      explanation: consequence.explanation,
      closingReflection: consequence.closingReflection,
      rawDelta: clone(consequence.delta),
      appliedDelta,
      balanceBefore,
      balanceAfter,
      physicalInstructions: [...consequence.physicalInstructions],
      alreadyRevealed: false,
    };

    const next = this.commit(current, (draft) => {
      if (!draft.confirmedDecision) {
        throw new GameError("HUMAN_DECISION_REQUIRED", "Hiányzó döntés.");
      }
      draft.confirmedDecision.consumedAt = revealedAt;
      draft.balance = balanceAfter;
      const outcome = {
        decisionId: decision.decisionId,
        dilemmaId: dilemma.id,
        lens: decision.lens,
        consequence: clone(consequence),
        rawDelta: clone(consequence.delta),
        appliedDelta,
        balanceBefore,
        balanceAfter,
        revealedAt,
        effectApplicationKey: decision.decisionId,
        effectApplied: true as const,
        toolExecution: {
          tool: "reveal_confirmed_consequence" as const,
          requestFingerprint: `${sessionId}:${confirmedDecisionId}:${expectedRevision}`,
          resultPayload: clone(payload),
          completedAt: revealedAt,
        },
      };
      draft.revealedOutcome = outcome;
      draft.outcomeHistory.push(outcome);
      if (!draft.completedDilemmaIds.includes(dilemma.id)) {
        draft.completedDilemmaIds.push(dilemma.id);
      }
      draft.phase = "CONSEQUENCE_REVEALED";
    });

    return { session: next, payload };
  }

  resetGame(): void {
    const current = this.requireSession();
    if (current.phase !== "GAME_COMPLETE") {
      throw new GameError("INVALID_PHASE", "Új játék csak a befejezés után indítható.");
    }
    this.store.clear();
    this.session = null;
    this.emit();
  }

  private restore(): GameSession | null {
    try {
      const loaded = this.store.load();
      if (!loaded) return null;
      assertSessionInvariants(loaded, this.catalog);
      return clone(loaded);
    } catch {
      this.store.clear();
      return null;
    }
  }

  private persistNew(session: GameSession): void {
    assertSessionInvariants(session, this.catalog);
    this.store.save(session);
    this.session = clone(session);
    this.emit();
  }

  private commit(current: GameSession, mutate: (draft: GameSession) => void): GameSession {
    const next = clone(current);
    mutate(next);
    next.stateRevision = current.stateRevision + 1;
    next.updatedAt = this.now();
    assertSessionInvariants(next, this.catalog);
    this.store.save(next);
    this.session = clone(next);
    this.emit();
    return clone(next);
  }

  private emit(): void {
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot);
  }

  private requireSession(sessionId?: string): GameSession {
    if (!this.session) throw new GameError("SESSION_NOT_FOUND", "Nincs aktív játékmenet.");
    if (sessionId && this.session.sessionId !== sessionId) {
      throw new GameError("SESSION_NOT_FOUND", "A sessionazonosító nem egyezik.");
    }
    return clone(this.session);
  }

  private requireActiveDilemma(): Dilemma {
    const dilemma = this.getActiveDilemma();
    if (!dilemma) {
      throw new GameError("DILEMMA_MISMATCH", "Nincs bemutatott aktuális dilemma.", false);
    }
    return dilemma;
  }

  private assertRevision(session: GameSession, expectedRevision: number): void {
    if (session.stateRevision !== expectedRevision) {
      throw new GameError("STALE_REVISION", "Az állapot időközben megváltozott.");
    }
  }

  private reflectionPayload(session: GameSession, alreadyPresented: boolean): ReflectionPayload {
    const selection = session.tentativeSelection;
    const presented = session.presentedReflection;
    const dilemma = this.requireActiveDilemma();
    if (!selection || !presented) {
      throw new GameError("REFLECTION_REQUIRED", "A reflexió nem található.", false);
    }
    const reflection = dilemma.lenses.find(({ lens }) => lens === selection.lens)?.reflection;
    if (!reflection) throw new GameError("DILEMMA_MISMATCH", "A reflexiós tartalom hiányzik.", false);
    return {
      tentativeSelectionId: selection.selectionId,
      reflectionId: presented.reflectionId,
      selectedLens: selection.lens,
      reflection: clone(reflection),
      alreadyPresented,
    };
  }

  private toPublicDilemma(dilemma: Dilemma): PublicDilemma {
    return {
      id: dilemma.id,
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
    };
  }
}

