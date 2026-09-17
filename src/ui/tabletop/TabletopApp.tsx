import { useEffect, useRef, useState } from "react";
import type { AppServices } from "../../app/bootstrap";
import {
  localizeConsequence, localizeDilemma, localizeReflection,
  translateErrorMessage, uiCopy, type UiLocale,
} from "../../content/uiCopy";
import { LENSES, ZERO_BALANCE, type HumanBalance, type Lens } from "../../domain/gameTypes";
import { registerWebMcpTools, type WebMcpRegistrationStatus } from "../../infrastructure/webmcp/registerTools";
import { LensIcon } from "../components/DecisionCard";
import { useGameView } from "../hooks/useGameView";
import { loadPresentationLocale, savePresentationLocale } from "../presentationLocale";
import { TabletopScene } from "./TabletopScene";
import "./tabletop.css";

const AXES = Object.keys(ZERO_BALANCE) as Array<keyof HumanBalance>;
const signed = (value: number) => value > 0 ? `+${value}` : String(value);

/** Experimental presentation only. All mutations go through the existing ports. */
export function TabletopApp({ services }: { services: AppServices }) {
  const view = useGameView(services.engine);
  const [locale, setLocale] = useState<UiLocale>(loadPresentationLocale);
  const [arrivalStage, setArrivalStage] = useState<"dilemma" | "guide" | "choices">("dilemma");
  const [guideSeen, setGuideSeen] = useState(false);
  const [reconsidering, setReconsidering] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [reasoning, setReasoning] = useState("");
  const [error, setError] = useState("");
  const [registration, setRegistration] = useState<WebMcpRegistrationStatus | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const copy = uiCopy[locale];
  const session = view.session;
  const phase = session?.phase ?? "NO_SESSION";
  const selectedLens = session?.tentativeSelection?.lens ?? null;
  const dilemma = view.activeDilemma ? localizeDilemma(view.activeDilemma, locale) : null;
  const reflection = view.reflection && dilemma && selectedLens
    ? localizeReflection(dilemma.id, selectedLens, view.reflection, locale) : null;
  const outcome = session?.revealedOutcome;
  const consequence = outcome
    ? localizeConsequence(outcome.dilemmaId, outcome.lens, outcome.consequence, locale) : null;
  const returning = reconsidering && ["REFLECTION_PRESENTED", "READY_FOR_CONFIRMATION"].includes(phase);
  const selectable = Boolean(dilemma) && (
    (phase === "AWAITING_HUMAN_SELECTION" && arrivalStage === "choices") ||
    phase === "TENTATIVE_SELECTION_RECORDED" || returning
  );
  const showBalance = phase === "GAME_COMPLETE" || (phase === "CONSEQUENCE_REVEALED" && balanceOpen);

  useEffect(() => {
    let disposed = false;
    let controller: AbortController | null = null;
    // Let StrictMode's discarded effect finish before registering the same five tools.
    void Promise.resolve().then(async () => {
      if (disposed) return;
      const registered = await registerWebMcpTools(document.modelContext, services.webMcpTools,
        (status) => { if (!disposed) setRegistration(status); });
      if (disposed) registered?.abort();
      else controller = registered;
    });
    return () => { disposed = true; controller?.abort(); };
  }, [services.webMcpTools]);

  useEffect(() => {
    setArrivalStage("dilemma");
    setBalanceOpen(false);
    setReconsidering(false);
    setReasoning("");
  }, [session?.activeDilemmaId]);

  useEffect(() => {
    if (panelRef.current) panelRef.current.scrollTop = 0;
    headingRef.current?.focus({ preventScroll: true });
  }, [phase, arrivalStage, returning, balanceOpen]);

  function run(action: () => unknown) {
    try { action(); setError(""); }
    catch (caught) {
      setError(caught instanceof Error ? translateErrorMessage(caught.message, locale) : copy.app.unknownError);
    }
  }
  function selectLens(lens: Lens) {
    if (!selectable) return;
    run(() => { services.playerCommands.selectLens(lens); setReconsidering(false); setReasoning(""); });
  }
  function presentDilemma() {
    if (!session) return;
    run(() => services.agentCommands.presentDilemma(session.sessionId, session.stateRevision));
  }
  function presentReflection() {
    if (!session?.tentativeSelection) return;
    run(() => services.agentCommands.presentChoiceReflection(
      session.sessionId, session.tentativeSelection!.selectionId, session.stateRevision,
    ));
  }
  function revealConsequence() {
    if (!session?.confirmedDecision) return;
    run(() => services.agentCommands.revealConfirmedConsequence(
      session.sessionId, session.confirmedDecision!.decisionId, session.stateRevision,
    ));
  }

  let heading: string = copy.landing.title;
  if (phase === "MACHINE_CITY_READY") heading = copy.futura.heading;
  else if (phase === "AWAITING_HUMAN_SELECTION") {
    heading = arrivalStage === "dilemma" ? dilemma?.title ?? ""
      : arrivalStage === "guide" ? copy.guide.heading : copy.choice.heading;
  } else if (returning) heading = copy.choice.heading;
  else if (phase === "TENTATIVE_SELECTION_RECORDED") heading = selectedLens ? copy.choice.feedback[selectedLens] : copy.choice.heading;
  else if (phase === "REFLECTION_PRESENTED") heading = copy.counterpoint.heading;
  else if (phase === "READY_FOR_CONFIRMATION") heading = copy.confirmation.heading;
  else if (phase === "DECISION_CONFIRMED") heading = copy.sealed.kicker;
  else if (phase === "CONSEQUENCE_REVEALED") heading = balanceOpen ? copy.balance.kicker : copy.outcome.heading;
  else if (phase === "GAME_COMPLETE") heading = copy.balance.kicker;

  return (
    <main className="tabletop-app" data-testid="tabletop-app" data-phase={phase} lang={locale} aria-label={copy.app.ariaLabel}>
      <header className="tabletop-header">
        <span>3D · Phase 1–2</span>
        <span className="tabletop-mode" role="status">
          {registration?.mode === "webmcp" ? "WebMCP · 5/5"
            : registration?.mode === "error" ? "WebMCP · error"
            : locale === "hu" ? "Technikai próba · kézi agentlépések" : "Technical prototype · manual agent steps"}
        </span>
        <div role="group" aria-label={copy.language.selectorLabel}>
          {(["hu", "en"] as const).map((language) => (
            <button type="button" key={language} aria-label={copy.language[`${language}Label`]}
              aria-pressed={locale === language} onClick={() => { setLocale(language); savePresentationLocale(language); }}>
              {language.toUpperCase()}
            </button>
          ))}
        </div>
      </header>
      <div className="tabletop-layout">
        <div className="tabletop-world">
          <TabletopScene
            balance={session?.balance ?? ZERO_BALANCE}
            previousBalance={showBalance ? outcome?.balanceBefore : undefined}
            selectedLens={selectedLens}
            selectable={selectable}
            availableLenses={dilemma?.choices.map(({ lens }) => lens) ?? [...LENSES]}
            showBalance={showBalance}
            labels={{ brain: copy.cards.lenses.brain.label, hand: copy.cards.lenses.hand.label, heart: copy.cards.lenses.heart.label }}
            axisLabels={copy.balance.axes}
            onSelect={selectLens}
          />
          <p className="tabletop-world-caption">{showBalance ? copy.balance.note : copy.landing.entryTagline}</p>
        </div>
        <section className="tabletop-panel" aria-labelledby="tabletop-heading">
          <div className="tabletop-reading" ref={panelRef}>
            {dilemma && !showBalance && <p className="tabletop-eyebrow">{dilemma.shortTitle}</p>}
            <h1 id="tabletop-heading" tabIndex={-1} ref={headingRef}>{heading}</h1>
            {error && <p role="alert">{error}</p>}

            {phase === "NO_SESSION" && <>
              <p>{copy.landing.subtitle}</p><p>{copy.landing.entryTagline}</p>
            </>}
            {phase === "MACHINE_CITY_READY" && <>
              <p>{copy.futura.body}</p>
            </>}
            {phase === "AWAITING_HUMAN_SELECTION" && arrivalStage === "dilemma" && dilemma && <>
              <p>{dilemma.situation}</p>
              {dilemma.contentNotice && <p>{copy.dilemma.topicPrefix} {dilemma.contentNotice}</p>}
            </>}
            {phase === "AWAITING_HUMAN_SELECTION" && arrivalStage === "guide" && <>
              <ul className="tabletop-guide">
                {LENSES.map((lens) => <li key={lens}><LensIcon lens={lens} size={28} /><div><strong>{copy.cards.lenses[lens].label}</strong><p>{copy.guide.lenses[lens]}</p></div></li>)}
              </ul>
            </>}

            {selectable && <>
              <p>{phase === "TENTATIVE_SELECTION_RECORDED" ? copy.choice.selectedBody : copy.choice.instruction}</p>
              <div className="tabletop-choices" role="group" aria-label={copy.choice.groupLabel}>
                {dilemma?.choices.map(({ lens }) => {
                  const card = copy.cards.lenses[lens];
                  return <button type="button" key={lens} aria-pressed={selectedLens === lens}
                    aria-label={`${card.label} — ${card.framing}`} onClick={() => selectLens(lens)}>
                    <LensIcon lens={lens} size={28} /><span><strong>{card.label} — {card.framing}</strong><small>{card.choiceText}</small></span>
                  </button>;
                })}
              </div>
            </>}

            {phase === "REFLECTION_PRESENTED" && !returning && reflection && selectedLens && <>
              <p className="tabletop-eyebrow">{copy.counterpoint.kicker} · {copy.cards.lenses[selectedLens].label}</p>
              <p>{reflection.counterargument}</p><p>{reflection.blindSpot}</p><blockquote>{reflection.question}</blockquote>
            </>}
            {phase === "READY_FOR_CONFIRMATION" && !returning && <>
              <p className="tabletop-eyebrow">{copy.confirmation.threshold}</p>
              <label htmlFor="tabletop-reasoning">{copy.confirmation.reasonLabel}<small>{copy.confirmation.reasonOptional}</small></label>
              <textarea id="tabletop-reasoning" maxLength={500} value={reasoning} onChange={(event) => setReasoning(event.target.value)} aria-label={copy.confirmation.reasonAriaLabel} />
            </>}
            {phase === "DECISION_CONFIRMED" && <>
              {selectedLens && <p>{copy.choice.feedback[selectedLens]}</p>}
              <p>{copy.sealed.body}</p>
            </>}
            {phase === "CONSEQUENCE_REVEALED" && !balanceOpen && consequence && <>
              <h2>{copy.outcome.gainLabel}</h2><p>{consequence.gains.join(" ")}</p>
              <h2>{copy.outcome.costLabel}</h2><p>{consequence.costs.join(" ")}</p>
              <blockquote>{consequence.closingReflection}</blockquote>
            </>}
            {showBalance && session && <>
              <p>{copy.balance.heading}</p>
              <dl className="tabletop-values" aria-label={copy.balance.kicker}>
                {AXES.map((axis) => <div key={axis} data-testid={`tabletop-axis-${axis}`}>
                  <dt>{copy.balance.axes[axis]}</dt>
                  <dd>{signed(session.balance[axis])} {outcome && phase !== "GAME_COMPLETE" && <small>Δ {signed(outcome.appliedDelta[axis])}</small>}</dd>
                </div>)}
              </dl>
              <p>{phase === "GAME_COMPLETE" ? copy.balance.gameComplete : copy.balance.roundMemory}</p>
            </>}
          </div>
          {/* Controls have their own flow row: neither long copy nor the canvas can hide the human boundary. */}
          <div className="tabletop-actions">
            {phase === "NO_SESSION" && <button className="tt-primary" type="button" onClick={() => run(() => services.agentCommands.enterMachineCity())}>{copy.landing.enter}</button>}
            {phase === "MACHINE_CITY_READY" && <button className="tt-primary" type="button" onClick={presentDilemma}>{copy.futura.showQuestion}</button>}
            {phase === "AWAITING_HUMAN_SELECTION" && arrivalStage === "dilemma" && <button className="tt-primary" type="button" onClick={() => setArrivalStage(!guideSeen && session?.completedDilemmaIds.length === 0 ? "guide" : "choices")}>{copy.dilemma.showOptions}</button>}
            {phase === "AWAITING_HUMAN_SELECTION" && arrivalStage === "guide" && <button className="tt-primary" type="button" onClick={() => { setGuideSeen(true); setArrivalStage("choices"); }}>{copy.guide.continue}</button>}
            {phase === "TENTATIVE_SELECTION_RECORDED" && <button className="tt-primary" type="button" onClick={presentReflection}>{copy.choice.showCounterpoint}</button>}
            {phase === "REFLECTION_PRESENTED" && !returning && selectedLens && <button className="tt-primary" type="button" onClick={() => run(() => services.playerCommands.acknowledgeReflection(session!.presentedReflection!.reflectionId))}>{copy.counterpoint.keep[selectedLens]}</button>}
            {phase === "READY_FOR_CONFIRMATION" && !returning && <button className="tt-primary" type="button" onClick={() => run(() => services.playerCommands.confirmDecision(reasoning))}>{copy.confirmation.confirm}</button>}
            {["REFLECTION_PRESENTED", "READY_FOR_CONFIRMATION"].includes(phase) && !returning && <button className="tt-secondary" type="button" onClick={() => setReconsidering(true)}><span aria-hidden="true">← </span>{copy.counterpoint.reconsider}</button>}
            {phase === "DECISION_CONFIRMED" && <button className="tt-primary" type="button" onClick={revealConsequence}>{copy.sealed.reveal}</button>}
            {phase === "CONSEQUENCE_REVEALED" && !balanceOpen && <button className="tt-primary" type="button" onClick={() => setBalanceOpen(true)}>{copy.outcome.showBalance}</button>}
            {phase === "CONSEQUENCE_REVEALED" && balanceOpen && <button className="tt-primary" type="button" onClick={presentDilemma}>{view.hasNextDilemma ? copy.balance.nextQuestion : copy.balance.endGame}</button>}
            {phase === "GAME_COMPLETE" && <button className="tt-primary" type="button" onClick={() => run(() => { services.playerCommands.resetGame(); setGuideSeen(false); })}>{copy.balance.restart}</button>}
          </div>
        </section>
      </div>
    </main>
  );
}
