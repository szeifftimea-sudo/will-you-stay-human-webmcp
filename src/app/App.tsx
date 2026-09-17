import {
  ArrowRight,
  Eye,
  SlidersHorizontal,
  SpeakerHigh,
  SpeakerSlash,
  Sparkle,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties, type RefObject } from "react";
import {
  localizeConsequence,
  localizeDilemma,
  localizeReflection,
  translateErrorMessage,
  uiCopy,
  type LocalizedDilemma,
  type UiCopy,
  type UiLocale,
} from "../content/uiCopy";
import type { Lens } from "../domain/gameTypes";
import { registerWebMcpTools, type WebMcpRegistrationStatus } from "../infrastructure/webmcp/registerTools";
import { DecisionCard, LensIcon, RitualCard } from "../ui/components/DecisionCard";
import { ReflectionScene } from "../ui/components/ReflectionScene";
import { HumanConfirmationScene } from "../ui/components/HumanConfirmationScene";
import { ConsequenceScene } from "../ui/components/ConsequenceScene";
import { BalanceResultTransition } from "../ui/components/BalanceResultTransition";
import { DemoInspector } from "../ui/components/DemoInspector";
import { HumanBalance } from "../ui/components/HumanBalance";
import { getActiveJourneyStep } from "../ui/components/JourneyMap";
import { useGameView } from "../ui/hooks/useGameView";
import {
  loadPresentationLocale,
  savePresentationLocale,
} from "../ui/presentationLocale";
import {
  createRitualSoundPort,
  type RitualSoundPort,
} from "../ui/audio/ritualSound";
import type { AppServices } from "./bootstrap";
import { LandingCity } from "../ui/landing/LandingCity";
import { PRODUCT_FROM_BALANCE, rememberBalanceReturn, shouldRestoreBalance } from "../ui/productReturn";

const INITIAL_STATUS: WebMcpRegistrationStatus = {
  mode: "registering",
  registeredTools: [],
  message: "WebMCP-képesség ellenőrzése…",
};

const BALANCE_AXIS_ORDER = [
  "comfort",
  "control",
  "connection",
  "freedom",
  "responsibility",
] as const;

export function App({ services, sound, choiceDepth: ChoiceDepth, balanceDepth, balanceLocale }: {
  services: AppServices;
  sound?: RitualSoundPort;
  /** Optional decorative renderer. It receives no commands or domain state. */
  choiceDepth?: ComponentType;
  /** Optional model renderer; native domain-driven balance remains authoritative. */
  balanceDepth?: ComponentType;
  /** Product-review presentation only; never changes the saved player language. */
  balanceLocale?: UiLocale;
}) {
  const view = useGameView(services.engine);
  const [preferredLocale, setLocale] = useState<UiLocale>(loadPresentationLocale);
  const [landingEntryReady, setLandingEntryReady] = useState(false);
  const [registration, setRegistration] = useState(INITIAL_STATUS);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [error, setError] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [awaitingStage, setAwaitingStage] = useState<"dilemma" | "guide" | "choices">("dilemma");
  const [lensGuideAcknowledged, setLensGuideAcknowledged] = useState(false);
  const [reconsidering, setReconsidering] = useState(false);
  const [outcomeStage, setOutcomeStage] = useState<"consequence" | "balance">(
    () => shouldRestoreBalance(view.session) ? "balance" : "consequence",
  );
  const locale = balanceDepth && balanceLocale && (
    view.session?.phase === "GAME_COMPLETE"
    || (view.session?.phase === "CONSEQUENCE_REVEALED" && outcomeStage === "balance")
  ) ? balanceLocale : preferredLocale;
  const [soundMuted, setSoundMuted] = useState(false);
  const gameAppRef = useRef<HTMLElement>(null);
  const stageHeadingRef = useRef<HTMLHeadingElement>(null);
  const soundRef = useRef<RitualSoundPort | null>(null);
  if (!soundRef.current) soundRef.current = sound ?? createRitualSoundPort();
  const ritualSound = soundRef.current;
  const copy = uiCopy[locale];

  useEffect(() => {
    let controller: AbortController | null = null;
    void registerWebMcpTools(document.modelContext, services.webMcpTools, setRegistration).then(
      (registered) => {
        controller = registered;
      },
    );
    return () => controller?.abort();
  }, [services.webMcpTools]);

  useEffect(() => () => ritualSound.dispose(), [ritualSound]);

  const session = view.session;
  const phase = session?.phase ?? "NO_SESSION";
  const selectedLens = session?.tentativeSelection?.lens ?? null;
  const activeDilemma = useMemo(
    () => view.activeDilemma ? localizeDilemma(view.activeDilemma, locale) : null,
    [locale, view.activeDilemma],
  );
  const selectedChoice = useMemo(
    () => activeDilemma?.choices.find(({ lens }) => lens === selectedLens) ?? null,
    [activeDilemma, selectedLens],
  );
  const localizedReflection = useMemo(
    () => view.reflection && view.activeDilemma && selectedLens
      ? localizeReflection(view.activeDilemma.id, selectedLens, view.reflection, locale)
      : null,
    [locale, selectedLens, view.activeDilemma, view.reflection],
  );
  const localizedConsequence = useMemo(
    () => session?.revealedOutcome
      ? localizeConsequence(
          session.revealedOutcome.dilemmaId,
          session.revealedOutcome.lens,
          session.revealedOutcome.consequence,
          locale,
        )
      : null,
    [locale, session?.revealedOutcome],
  );
  const selectionFeedback = selectedLens
    ? copy.choice.feedback[selectedLens]
    : copy.guide.heading;
  const activeStep = getActiveJourneyStep(phase);
  const inspectorEnabled = new URLSearchParams(window.location.search).has("inspector");

  useEffect(() => {
    if (gameAppRef.current) {
      gameAppRef.current.scrollTop = 0;
      gameAppRef.current.scrollLeft = 0;
    }
    stageHeadingRef.current?.focus({ preventScroll: true });
  }, [phase, awaitingStage, reconsidering, outcomeStage]);

  useEffect(() => {
    if (phase === "AWAITING_HUMAN_SELECTION") setAwaitingStage("dilemma");
    if (!["REFLECTION_PRESENTED", "READY_FOR_CONFIRMATION"].includes(phase)) {
      setReconsidering(false);
    }
    if (phase !== "CONSEQUENCE_REVEALED") setOutcomeStage("consequence");
  }, [phase, session?.activeDilemmaId]);

  const run = (action: () => unknown): boolean => {
    try {
      action();
      setError("");
      return true;
    } catch (caught) {
      setError(caught instanceof Error
        ? translateErrorMessage(caught.message, locale)
        : copy.app.unknownError);
      return false;
    }
  };

  const choose = (lens: Lens) => {
    if (run(() => services.playerCommands.selectLens(lens))) ritualSound.play("selection");
  };
  const enterMachineCity = () => {
    if (run(() => services.agentCommands.enterMachineCity())) ritualSound.play("futura-call");
  };
  const presentDilemma = () => {
    if (!session) return;
    if (run(() =>
      services.agentCommands.presentDilemma(session.sessionId, session.stateRevision),
    )) ritualSound.play("futura-question");
  };
  const presentReflection = () => {
    if (!session?.tentativeSelection) return;
    if (run(() =>
      services.agentCommands.presentChoiceReflection(
        session.sessionId,
        session.tentativeSelection!.selectionId,
        session.stateRevision,
      ),
    )) ritualSound.play("counterpoint");
  };
  const acknowledgeReflection = () => {
    if (!session?.presentedReflection) return;
    if (run(() => services.playerCommands.acknowledgeReflection(session.presentedReflection!.reflectionId))) {
      ritualSound.play("retention");
    }
  };
  const confirmDecision = () => {
    if (run(() => services.playerCommands.confirmDecision(reasoning))) ritualSound.play("confirmation");
  };
  const revealConsequence = () => {
    if (!session?.confirmedDecision) return;
    if (run(() =>
      services.agentCommands.revealConfirmedConsequence(
        session.sessionId,
        session.confirmedDecision!.decisionId,
        session.stateRevision,
      ),
    )) ritualSound.play("consequence");
  };
  const continueJourney = () => {
    if (!session) return;
    run(() => {
      services.agentCommands.presentDilemma(session.sessionId, session.stateRevision);
      setOutcomeStage("consequence");
      setReasoning("");
      setReconsidering(false);
    });
  };
  const showChoiceStage = () => {
    if (session?.completedDilemmaIds.length === 0 && !lensGuideAcknowledged) {
      setAwaitingStage("guide");
      return;
    }
    ritualSound.play("cards-dealt");
    setAwaitingStage("choices");
  };
  const acknowledgeLensGuide = () => {
    ritualSound.play("cards-dealt");
    setLensGuideAcknowledged(true);
    setAwaitingStage("choices");
  };
  const reconsiderDirection = () => {
    ritualSound.play("cards-dealt");
    setReconsidering(true);
  };
  const showBalance = () => {
    if (!session?.revealedOutcome) return;
    const changedBalanceAxes = BALANCE_AXIS_ORDER.flatMap((axis, index) =>
      session.balance[axis] === session.revealedOutcome!.balanceBefore[axis] ? [] : [index],
    );
    ritualSound.play("balance", { changedBalanceAxes });
    setOutcomeStage("balance");
  };
  const toggleSound = () => {
    const nextMuted = !soundMuted;
    setSoundMuted(nextMuted);
    ritualSound.setMuted(nextMuted);
    if (!nextMuted) ritualSound.play("unmute");
  };
  const restartGame = () => {
    run(() => {
      services.playerCommands.resetGame();
      setLensGuideAcknowledged(false);
      setOutcomeStage("consequence");
      setReasoning("");
      setReconsidering(false);
    });
  };
  const selectLocale = (nextLocale: UiLocale) => {
    setLocale(nextLocale);
    savePresentationLocale(nextLocale);
  };

  const isLanding = phase === "NO_SESSION";

  return (
    <main
      ref={gameAppRef}
      className={`game-app ${isLanding ? "game-app-entry" : `game-app-journey stage-${activeStep} phase-${phase.toLowerCase()} lens-${selectedLens ?? "none"}`}`}
      aria-label={copy.app.ariaLabel}
      lang={locale}
    >
      <output hidden data-testid="webmcp-status">{registration.message} {registration.registeredTools.join(" · ")}</output>
      <output hidden data-testid="game-phase">{phase}</output>
      <output hidden data-testid="journey-step">{activeStep}</output>
      <LandingCity active={isLanding} onEntryReady={setLandingEntryReady} />

      {isLanding ? (
        <section className="entry-screen" aria-labelledby="entry-title">
          <div className="language-switcher" role="group" aria-label={copy.language.selectorLabel}>
            <button type="button" aria-label={copy.language.huLabel} aria-pressed={locale === "hu"} onClick={() => selectLocale("hu")}>HU</button>
            <span aria-hidden="true">·</span>
            <button type="button" aria-label={copy.language.enLabel} aria-pressed={locale === "en"} onClick={() => selectLocale("en")}>EN</button>
          </div>
          <div className="entry-copy" inert={!landingEntryReady} data-entry-ready={landingEntryReady}>
            <h1 id="entry-title" ref={stageHeadingRef} tabIndex={-1}>{copy.landing.title}</h1>
            <p className="brand-subtitle">{copy.landing.subtitle}</p>
            <p className="tagline">{copy.landing.entryTagline}</p>

            <button className="primary-action entry-action" type="button" onClick={enterMachineCity}>
              {copy.landing.enter} <ArrowRight size={25} aria-hidden="true" />
            </button>
          </div>
        </section>
      ) : session ? (
        <div className="journey-screen">
          <FuturaStatus copy={copy} />
          <div className={`scene-event scene-event-${activeStep}`} key={phase} aria-hidden="true" />
          {phase === "REFLECTION_PRESENTED" && !reconsidering && <div className="route-disturbance" aria-hidden="true" />}

          <section className="stage" aria-live="polite">
            {phase === "MACHINE_CITY_READY" && (
              <div className="stage-card signal-card">
                <h2 ref={stageHeadingRef} tabIndex={-1}>{copy.futura.heading}</h2>
                <p>{copy.futura.body}</p>
                <button className="primary-action" type="button" onClick={presentDilemma}>
                  {copy.futura.showQuestion} <ArrowRight size={21} aria-hidden="true" />
                </button>
              </div>
            )}

            {phase === "AWAITING_HUMAN_SELECTION" && activeDilemma && awaitingStage === "dilemma" && (
              <div className="dilemma-arrival-stage">
                <header className="stage-heading">
                  <span className="stage-kicker">{copy.dilemma.arrival}</span>
                  <h2 ref={stageHeadingRef} tabIndex={-1}>{activeDilemma.title}</h2>
                  <div className="situation-beats">
                    {toSituationBeats(activeDilemma.situation).map((beat) => (
                      <p key={beat}>{beat}</p>
                    ))}
                  </div>
                  {activeDilemma.contentNotice && (
                    <p className="content-notice">{copy.dilemma.topicPrefix} {activeDilemma.contentNotice}</p>
                  )}
                </header>
                <button className="primary-action dilemma-options-action" type="button" onClick={showChoiceStage}>
                  {copy.dilemma.showOptions} <ArrowRight size={21} aria-hidden="true" />
                </button>
              </div>
            )}

            {phase === "AWAITING_HUMAN_SELECTION" && awaitingStage === "guide" && (
              <LensGuideScene copy={copy} headingRef={stageHeadingRef} onContinue={acknowledgeLensGuide} />
            )}

            {phase === "AWAITING_HUMAN_SELECTION" && activeDilemma && awaitingStage === "choices" && (
              <DirectionChoiceScene
                copy={copy}
                dilemma={activeDilemma}
                locale={locale}
                onSelect={choose}
                headingRef={stageHeadingRef}
                showHelp={session.completedDilemmaIds.length > 0}
                choiceDepth={ChoiceDepth}
              />
            )}

            {reconsidering && ["REFLECTION_PRESENTED", "READY_FOR_CONFIRMATION"].includes(phase) && activeDilemma && (
              <DirectionChoiceScene
                copy={copy}
                dilemma={activeDilemma}
                locale={locale}
                onSelect={choose}
                headingRef={stageHeadingRef}
                returning
                choiceDepth={ChoiceDepth}
              />
            )}

            {phase === "TENTATIVE_SELECTION_RECORDED" && activeDilemma && (
              <div className="direction-stage direction-stage-selected">
                <header className="stage-heading">
                  <span className="stage-kicker">{copy.choice.selectedKicker}</span>
                  <h2 ref={stageHeadingRef} tabIndex={-1}>{selectionFeedback}</h2>
                  <p>{copy.choice.selectedBody}</p>
                </header>
                <div className="decision-grid" role="group" aria-label={copy.choice.selectedGroupLabel}>
                  {activeDilemma.choices.map((choice) => (
                    <DecisionCard
                      key={choice.lens}
                      choice={choice}
                      selected={choice.lens === selectedLens}
                      subdued={choice.lens !== selectedLens}
                      order={activeDilemma.choices.findIndex(({ lens }) => lens === choice.lens)}
                      onSelect={choose}
                      locale={locale}
                    />
                  ))}
                  {ChoiceDepth && <ChoiceDepth />}
                </div>
                <button className="primary-action centered-action" type="button" onClick={presentReflection}>
                  {copy.choice.showCounterpoint} <Sparkle size={20} aria-hidden="true" />
                </button>
              </div>
            )}

            {phase === "REFLECTION_PRESENTED" && localizedReflection && selectedChoice && activeDilemma && !reconsidering && (
              <ReflectionScene choices={activeDilemma.choices} choice={selectedChoice}
                reflection={localizedReflection} copy={copy} locale={locale}
                headingRef={stageHeadingRef} onKeep={acknowledgeReflection} onReconsider={reconsiderDirection} />
            )}

            {phase === "READY_FOR_CONFIRMATION" && selectedChoice && !reconsidering && (
              <HumanConfirmationScene choice={selectedChoice} copy={copy} locale={locale}
                headingRef={stageHeadingRef} reasoning={reasoning} onReasoning={setReasoning}
                onChangeChoice={reconsiderDirection} onConfirm={confirmDecision} />
            )}

            {phase === "DECISION_CONFIRMED" && (
              <div className="sealed-stage">
                <header className="ritual-prompt">
                  <span className="stage-kicker">{copy.sealed.kicker}</span>
                  <h2 ref={stageHeadingRef} tabIndex={-1}>{selectionFeedback}</h2>
                  <p>{copy.sealed.body}</p>
                </header>
                {selectedChoice && <RitualCard choice={selectedChoice} state="sealed" locale={locale} />}
                <button className="primary-action sealed-reveal-action" type="button" onClick={revealConsequence}>
                  {copy.sealed.reveal} <Eye size={21} aria-hidden="true" />
                </button>
              </div>
            )}

            {phase === "CONSEQUENCE_REVEALED" && session.revealedOutcome && selectedChoice && localizedConsequence && outcomeStage === "consequence" && (
              <ConsequenceScene choice={selectedChoice} consequence={localizedConsequence} copy={copy}
                headingRef={stageHeadingRef} onShowBalance={showBalance} />
            )}

            {phase === "CONSEQUENCE_REVEALED" && session.revealedOutcome && outcomeStage === "balance" && (
              <BalanceResultTransition>
                <HumanBalance
                  depth={balanceDepth}
                  balance={session.balance}
                  previousBalance={session.revealedOutcome.balanceBefore}
                  companionHref={PRODUCT_FROM_BALANCE}
                  onVisitCompanion={() => rememberBalanceReturn(session)}
                  onContinue={continueJourney}
                  continueLabel={view.hasNextDilemma ? copy.balance.nextQuestion : copy.balance.endGame}
                  continueVariant={view.hasNextDilemma ? "primary" : "secondary"}
                  locale={locale}
                />
              </BalanceResultTransition>
            )}

          </section>

          {session.phase === "GAME_COMPLETE" && (
            <HumanBalance
              depth={balanceDepth}
              balance={session.balance}
              memory
              onContinue={restartGame}
              continueLabel={copy.balance.restart}
              locale={locale}
            />
          )}
        </div>
      ) : null}

      {error && <p className="error-toast" role="alert">{error}</p>}

      <button
        className="sound-toggle"
        type="button"
        aria-label={soundMuted ? copy.sound.unmute : copy.sound.mute}
        aria-pressed={!soundMuted}
        title={soundMuted ? copy.sound.unmute : copy.sound.mute}
        onClick={toggleSound}
      >
        {soundMuted
          ? <SpeakerSlash size={22} weight="regular" aria-hidden="true" />
          : <SpeakerHigh size={22} weight="regular" aria-hidden="true" />}
      </button>

      {inspectorEnabled && (
        <>
          <button className="inspector-trigger" type="button" onClick={() => setInspectorOpen(true)} aria-label="Demo és WebMCP Inspector megnyitása">
            <SlidersHorizontal size={18} aria-hidden="true" /> <span>Demo</span>
          </button>
          <DemoInspector
            open={inspectorOpen}
            onClose={() => setInspectorOpen(false)}
            registration={registration}
            commands={services.agentCommands}
            session={session}
            onError={setError}
          />
        </>
      )}
    </main>
  );
}

function FuturaStatus({ copy }: { copy: UiCopy }) {
  return (
    <div className="futura-status" aria-label={copy.futura.statusAriaLabel}>
      <span className="futura-pulse" aria-hidden="true" />
      <span>{copy.futura.status}</span>
    </div>
  );
}

function DirectionChoiceScene({
  copy,
  dilemma,
  locale,
  onSelect,
  headingRef,
  returning = false,
  showHelp = false,
  choiceDepth: ChoiceDepth,
}: {
  copy: UiCopy;
  dilemma: LocalizedDilemma;
  locale: UiLocale;
  onSelect(lens: Lens): void;
  headingRef: RefObject<HTMLHeadingElement | null>;
  returning?: boolean;
  showHelp?: boolean;
  choiceDepth?: ComponentType;
}) {
  return (
    <div className={`direction-stage${returning ? " direction-stage-returning" : ""}`}>
      <header className="stage-heading">
        <span className="stage-kicker">{dilemma.shortTitle}</span>
        <h2 ref={headingRef} tabIndex={-1}>{copy.choice.heading}</h2>
        <p>{dilemma.centralTension}</p>
      </header>
      <div className="decision-grid" role="group" aria-label={copy.choice.groupLabel}>
        {dilemma.choices.map((choice, order) => (
          <DecisionCard
            key={choice.lens}
            choice={choice}
            selected={false}
            subdued={false}
            order={order}
            onSelect={onSelect}
            locale={locale}
          />
        ))}
        {ChoiceDepth && <ChoiceDepth />}
      </div>
      {showHelp && !returning && (
        <details className="lens-help">
          <summary>{copy.choice.help}</summary>
          <LensGuideContent copy={copy} compact />
        </details>
      )}
    </div>
  );
}

function LensGuideScene({
  copy,
  headingRef,
  onContinue,
}: {
  copy: UiCopy;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onContinue(): void;
}) {
  const guideItems = (["brain", "hand", "heart"] as const).map((lens, order) => ({
    lens,
    order,
    label: copy.cards.lenses[lens].label,
    text: copy.guide.lenses[lens],
  }));

  return (
    <div className="lens-guide-stage">
      <header className="stage-heading">
        <h2 ref={headingRef} tabIndex={-1}>{copy.guide.heading}</h2>
      </header>
      <div className="lens-guide-symbols" role="list" aria-label={copy.guide.heading}>
        {guideItems.map((item) => (
          <section
            key={item.lens}
            className="lens-guide-symbol"
            role="listitem"
            aria-label={`${item.label} — ${item.text}`}
            style={{ "--guide-delay": `${240 + item.order * 170}ms` } as CSSProperties}
          >
            <span className="route-beacon" aria-hidden="true"><LensIcon lens={item.lens} /></span>
            <strong>{item.label}</strong>
            <p>{item.text}</p>
          </section>
        ))}
      </div>
      <button className="primary-action centered-action lens-guide-action" type="button" onClick={onContinue}>
        {copy.guide.continue} <ArrowRight size={21} aria-hidden="true" />
      </button>
    </div>
  );
}

function LensGuideContent({ copy, compact = false }: { copy: UiCopy; compact?: boolean }) {
  const lensGuide = (["brain", "hand", "heart"] as const).map((lens) => ({
    lens,
    ...copy.cards.lenses[lens],
  }));
  return (
    <div className={`lens-guide-list${compact ? " is-compact" : ""}`}>
      {lensGuide.map((item) => (
        <section key={item.lens} aria-label={`${item.label}: ${item.framing}`}>
          <strong>{item.label}</strong>
          <span>{item.framing}</span>
          <p>{item.choiceText}</p>
        </section>
      ))}
    </div>
  );
}

function toSituationBeats(situation: string): string[] {
  const sentences = situation.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((sentence) => sentence.trim()) ?? [];
  if (sentences.length < 2) return [situation];
  return [sentences[0], sentences.slice(1).join(" ")];
}
