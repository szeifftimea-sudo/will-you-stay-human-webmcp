import {
  ArrowLeft,
  ArrowRight,
  Broadcast,
  Eye,
  Fingerprint,
  NotePencil,
  SealCheck,
  SlidersHorizontal,
  Sparkle,
} from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import type { Lens, PublicDilemma } from "../domain/gameTypes";
import { registerWebMcpTools, type WebMcpRegistrationStatus } from "../infrastructure/webmcp/registerTools";
import { DecisionCard, RitualCard } from "../ui/components/DecisionCard";
import { DemoInspector } from "../ui/components/DemoInspector";
import { HumanBalance } from "../ui/components/HumanBalance";
import { getActiveJourneyStep } from "../ui/components/JourneyMap";
import { useGameView } from "../ui/hooks/useGameView";
import type { AppServices } from "./bootstrap";

const INITIAL_STATUS: WebMcpRegistrationStatus = {
  mode: "registering",
  registeredTools: [],
  message: "WebMCP-képesség ellenőrzése…",
};

const LENS_NAMES: Record<Lens, string> = {
  brain: "AGY",
  hand: "KÉZ",
  heart: "SZÍV",
};

const SELECTION_REACTIONS: Record<Lens, { title: string; body: string }> = {
  brain: {
    title: "AGY-at választottál.",
    body: "Futura vázlatot készít, de te szerkeszted és küldöd el. Mielőtt döntesz, nézd meg, mit kockáztatsz vele.",
  },
  hand: {
    title: "KÉZ-et választottál.",
    body: "Futura megírja és elküldi a bocsánatkérést. Mielőtt döntesz, nézd meg, mit adsz át vele együtt.",
  },
  heart: {
    title: "SZÍV-et választottál.",
    body: "Te írod és küldöd el; Futura csak kérdez. Mielőtt döntesz, nézd meg, mit nem garantál a saját hangod.",
  },
};

const CONFIRMATION_SUMMARIES: Record<Lens, string> = {
  brain: "AGY – Futura vázlatot készít, de te szerkeszted és küldöd el.",
  hand: "KÉZ – Futura megírja és elküldi helyetted.",
  heart: "SZÍV – Te írod és küldöd; Futura csak kérdez.",
};

export function App({ services }: { services: AppServices }) {
  const view = useGameView(services.engine);
  const [registration, setRegistration] = useState(INITIAL_STATUS);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [error, setError] = useState("");
  const [reasoning, setReasoning] = useState("");
  const [awaitingStage, setAwaitingStage] = useState<"dilemma" | "choices">("dilemma");
  const [reconsidering, setReconsidering] = useState(false);
  const [outcomeStage, setOutcomeStage] = useState<"consequence" | "balance">("consequence");
  const gameAppRef = useRef<HTMLElement>(null);
  const stageHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let controller: AbortController | null = null;
    void registerWebMcpTools(document.modelContext, services.webMcpTools, setRegistration).then(
      (registered) => {
        controller = registered;
      },
    );
    return () => controller?.abort();
  }, [services.webMcpTools]);

  const session = view.session;
  const phase = session?.phase ?? "NO_SESSION";
  const selectedLens = session?.tentativeSelection?.lens ?? null;
  const selectedChoice = useMemo(
    () => view.activeDilemma?.choices.find(({ lens }) => lens === selectedLens) ?? null,
    [selectedLens, view.activeDilemma],
  );
  const selectedLabel = selectedLens ? LENS_NAMES[selectedLens] : null;
  const keepDirectionLabel = selectedLens && selectedLabel
    ? `Megtartom ${selectedLens === "brain" ? "az" : "a"} ${selectedLabel} irányt`
    : "Megtartom ezt az irányt";
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

  const run = (action: () => unknown) => {
    try {
      action();
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ismeretlen játékmenet-hiba.");
    }
  };

  const choose = (lens: Lens) => run(() => services.playerCommands.selectLens(lens));
  const enterMachineCity = () => run(() => services.agentCommands.enterMachineCity());
  const presentDilemma = () => {
    if (!session) return;
    run(() => services.agentCommands.presentDilemma(session.sessionId, session.stateRevision));
  };
  const presentReflection = () => {
    if (!session?.tentativeSelection) return;
    run(() =>
      services.agentCommands.presentChoiceReflection(
        session.sessionId,
        session.tentativeSelection!.selectionId,
        session.stateRevision,
      ),
    );
  };
  const acknowledgeReflection = () => {
    if (!session?.presentedReflection) return;
    run(() => services.playerCommands.acknowledgeReflection(session.presentedReflection!.reflectionId));
  };
  const confirmDecision = () => run(() => services.playerCommands.confirmDecision(reasoning));
  const resetGame = () => run(() => services.playerCommands.resetGame());
  const revealConsequence = () => {
    if (!session?.confirmedDecision) return;
    run(() =>
      services.agentCommands.revealConfirmedConsequence(
        session.sessionId,
        session.confirmedDecision!.decisionId,
        session.stateRevision,
      ),
    );
  };
  const beginNewDemoRound = () => {
    if (!session) return;
    run(() => {
      // A single-dilemma slice az existing GAME_COMPLETE transitionön keresztül zár,
      // majd a meglévő player reset parancsot használja. Új domainátmenet nem jön létre.
      services.agentCommands.presentDilemma(session.sessionId, session.stateRevision);
      services.playerCommands.resetGame();
      setOutcomeStage("consequence");
      setReasoning("");
    });
  };

  const isLanding = phase === "NO_SESSION";

  return (
    <main
      ref={gameAppRef}
      className={`game-app ${isLanding ? "game-app-entry" : `game-app-journey stage-${activeStep} phase-${phase.toLowerCase()} lens-${selectedLens ?? "none"}`}`}
      aria-label="Ember maradsz? — Szív a gépben"
    >
      <output hidden data-testid="webmcp-status">{registration.message} {registration.registeredTools.join(" · ")}</output>
      <output hidden data-testid="game-phase">{phase}</output>
      <output hidden data-testid="journey-step">{activeStep}</output>

      {isLanding ? (
        <section className="entry-screen" aria-labelledby="entry-title">
          <div className="entry-copy">
            <p className="brand-overline">Interaktív döntésjáték</p>
            <h1 id="entry-title" ref={stageHeadingRef} tabIndex={-1}>Ember<br />maradsz?</h1>
            <p className="brand-subtitle">Szív a gépben</p>
            <div className="signal-rule" aria-hidden="true"><span /></div>
            <p className="tagline">A gép javasol. Te döntesz.<br />A mérleg emlékszik.</p>

            <div className="futura-intro">
              <span>Futura</span>
              <p>A Gépváros készen áll.<br />A döntés irányát csak te jelölheted ki.</p>
            </div>

            <button className="primary-action entry-action" type="button" onClick={enterMachineCity}>
              Belépek a Gépvárosba <ArrowRight size={25} aria-hidden="true" />
            </button>
          </div>
        </section>
      ) : session ? (
        <div className="journey-screen">
          <FuturaStatus />
          <div className={`scene-event scene-event-${activeStep}`} key={phase} aria-hidden="true" />
          {phase === "REFLECTION_PRESENTED" && !reconsidering && <div className="route-disturbance" aria-hidden="true" />}

          <section className="stage" aria-live="polite">
            {phase === "MACHINE_CITY_READY" && (
              <div className="stage-card signal-card">
                <span className="stage-kicker"><Broadcast size={17} aria-hidden="true" /> Futura kapcsolódva</span>
                <h2 ref={stageHeadingRef} tabIndex={-1}>Hoztam neked egy kérdést.</h2>
                <p>Megmutathatom a lehetőségeket és a következményeket. A határt azonban csak te húzhatod meg.</p>
                <button className="primary-action" type="button" onClick={presentDilemma}>
                  Mutasd a kérdést <ArrowRight size={21} aria-hidden="true" />
                </button>
              </div>
            )}

            {phase === "AWAITING_HUMAN_SELECTION" && view.activeDilemma && awaitingStage === "dilemma" && (
              <div className="dilemma-arrival-stage">
                <header className="stage-heading">
                  <span className="stage-kicker">Dilemma érkezett a Gépvárosból</span>
                  <h2 ref={stageHeadingRef} tabIndex={-1}>{view.activeDilemma.title}</h2>
                  <div className="situation-beats">
                    <p>Megbántottál valakit, de azóta nem válaszoltál.</p>
                    <p>Futura ismeri a beszélgetés előzményeit, és felajánlja, hogy megírja – akár el is küldi – helyetted a bocsánatkérést.</p>
                  </div>
                </header>
                <button className="primary-action dilemma-options-action" type="button" onClick={() => setAwaitingStage("choices")}>
                  Megnézem a lehetőségeket <ArrowRight size={21} aria-hidden="true" />
                </button>
              </div>
            )}

            {phase === "AWAITING_HUMAN_SELECTION" && view.activeDilemma && awaitingStage === "choices" && (
              <DirectionChoiceScene dilemma={view.activeDilemma} onSelect={choose} headingRef={stageHeadingRef} />
            )}

            {reconsidering && ["REFLECTION_PRESENTED", "READY_FOR_CONFIRMATION"].includes(phase) && view.activeDilemma && (
              <DirectionChoiceScene
                dilemma={view.activeDilemma}
                onSelect={choose}
                headingRef={stageHeadingRef}
                returning
              />
            )}

            {phase === "TENTATIVE_SELECTION_RECORDED" && view.activeDilemma && (
              <div className="direction-stage direction-stage-selected">
                <header className="stage-heading">
                  <span className="stage-kicker">Kijelölt irány · még nem végleges</span>
                  <h2 ref={stageHeadingRef} tabIndex={-1}>{selectedLens ? SELECTION_REACTIONS[selectedLens].title : ""}</h2>
                  <p>{selectedLens ? SELECTION_REACTIONS[selectedLens].body : ""}</p>
                </header>
                <div className="decision-grid" role="group" aria-label="Kijelölt döntési irány módosítása">
                  {view.activeDilemma.choices.map((choice) => (
                    <DecisionCard
                      key={choice.lens}
                      choice={choice}
                      selected={choice.lens === selectedLens}
                      subdued={choice.lens !== selectedLens}
                      order={view.activeDilemma!.choices.findIndex(({ lens }) => lens === choice.lens)}
                      onSelect={choose}
                    />
                  ))}
                </div>
                <button className="primary-action centered-action" type="button" onClick={presentReflection}>
                  Megfordítom a kártyát <Sparkle size={20} aria-hidden="true" />
                </button>
              </div>
            )}

            {phase === "REFLECTION_PRESENTED" && view.reflection && !reconsidering && (
              <div className="reflection-stage">
                <header className="ritual-prompt">
                  <span className="stage-kicker">Futura ellenpontja</span>
                  <h2 id="reflection-title" ref={stageHeadingRef} tabIndex={-1}>Maradsz ennél az iránynál?</h2>
                </header>
                {selectedChoice && (
                  <RitualCard choice={selectedChoice} state="reflection" reflection={view.reflection} />
                )}
                <div className="ritual-actions decision-action-block" aria-label="Döntés az ellenpont után">
                  <button className="primary-action" type="button" onClick={acknowledgeReflection}>
                    {keepDirectionLabel} <SealCheck size={20} aria-hidden="true" />
                  </button>
                  <button className="secondary-action" type="button" onClick={() => setReconsidering(true)}>
                    <ArrowLeft size={20} aria-hidden="true" /> Másik irányt választok
                  </button>
                </div>
              </div>
            )}

            {phase === "READY_FOR_CONFIRMATION" && !reconsidering && (
              <div className="confirmation-stage">
                <div className="threshold-signal" aria-hidden="true">
                  <Broadcast size={22} weight="light" />
                  <span>Futura itt megáll</span>
                </div>
                {selectedChoice && <RitualCard choice={selectedChoice} state="stamped" />}
                <article className="confirmation-card note-slip" aria-labelledby="confirmation-title">
                  <span className="stage-kicker"><NotePencil size={17} aria-hidden="true" /> Végleges emberi küszöb</span>
                  <h2 id="confirmation-title" ref={stageHeadingRef} tabIndex={-1}>Te mondod ki a végső szót.</h2>
                  <p className="confirmation-summary">{selectedLens ? CONFIRMATION_SUMMARIES[selectedLens] : ""}</p>
                  <label htmlFor="decision-reasoning">
                    Mit fogsz mindenképp a saját szavaiddal megírni? <span>(nem kötelező)</span>
                  </label>
                  <textarea
                    id="decision-reasoning"
                    maxLength={500}
                    value={reasoning}
                    onChange={(event) => setReasoning(event.target.value)}
                    aria-label="Mit fogsz mindenképp a saját szavaiddal megírni? Nem kötelező."
                  />
                  <div className="confirmation-actions" aria-label="Végleges emberi döntés">
                    <button className="primary-action confirm-action" type="button" onClick={confirmDecision}>
                      Vállalom ezt a döntést <Fingerprint size={20} aria-hidden="true" />
                    </button>
                    <button className="secondary-action" type="button" onClick={() => setReconsidering(true)}>
                      <ArrowLeft size={20} aria-hidden="true" /> Másik irányt választok
                    </button>
                  </div>
                </article>
              </div>
            )}

            {phase === "DECISION_CONFIRMED" && (
              <div className="sealed-stage">
                <header className="ritual-prompt">
                  <span className="stage-kicker">Emberi döntés rögzítve</span>
                  <h2 ref={stageHeadingRef} tabIndex={-1}>{selectedLabel ? `${selectedLabel} irányt választottad.` : "A döntésed rögzítve."}</h2>
                  <p>A végső szó nálad marad. A következmény még rejtve van.</p>
                </header>
                {selectedChoice && <RitualCard choice={selectedChoice} state="sealed" />}
                <button className="primary-action sealed-reveal-action" type="button" onClick={revealConsequence}>
                  Felfedem a lenyomatot <Eye size={21} aria-hidden="true" />
                </button>
              </div>
            )}

            {phase === "CONSEQUENCE_REVEALED" && session.revealedOutcome && outcomeStage === "consequence" && (
              <div className="outcome-stage" aria-labelledby="outcome-title">
                <h2 id="outcome-title" ref={stageHeadingRef} tabIndex={-1}>Ezt nyerted. Ezt adtad át.</h2>
                {selectedChoice && (
                  <RitualCard
                    choice={selectedChoice}
                    state="outcome"
                    consequence={session.revealedOutcome.consequence}
                  />
                )}
                <button className="primary-action outcome-close-action" type="button" onClick={() => setOutcomeStage("balance")}>
                  Megnézem a döntés lenyomatát <ArrowRight size={20} aria-hidden="true" />
                </button>
              </div>
            )}

            {phase === "CONSEQUENCE_REVEALED" && session.revealedOutcome && outcomeStage === "balance" && (
              <div className="balance-stage" aria-live="polite">
                <HumanBalance balance={session.balance} onStartNewRound={beginNewDemoRound} />
              </div>
            )}

            {phase === "GAME_COMPLETE" && (
              <div className="stage-card complete-card">
                <span className="decision-seal is-stamped" aria-hidden="true"><Fingerprint size={54} weight="thin" /></span>
                <span className="stage-kicker">A döntésed nyomot hagyott</span>
                <h2 ref={stageHeadingRef} tabIndex={-1}>A kör véget ért</h2>
                <p>Ez nem pontszám. Ez a döntésed lenyomata.</p>
                <strong>A mérleg emlékszik.</strong>
                <button className="primary-action complete-action" type="button" onClick={resetGame}>
                  Új döntési kört kezdek <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
            )}
          </section>

          {session.phase === "GAME_COMPLETE" && <HumanBalance balance={session.balance} memory />}
        </div>
      ) : null}

      {error && <p className="error-toast" role="alert">{error}</p>}

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

function FuturaStatus() {
  return (
    <div className="futura-status" aria-label="Futura kapcsolódási állapota">
      <span className="futura-pulse" aria-hidden="true" />
      <span>FUTURA KAPCSOLÓDVA</span>
    </div>
  );
}

function DirectionChoiceScene({
  dilemma,
  onSelect,
  headingRef,
  returning = false,
}: {
  dilemma: PublicDilemma;
  onSelect(lens: Lens): void;
  headingRef: RefObject<HTMLHeadingElement | null>;
  returning?: boolean;
}) {
  return (
    <div className={`direction-stage${returning ? " direction-stage-returning" : ""}`}>
      <header className="stage-heading">
        <span className="stage-kicker">{returning ? "Új irányhoz új Ellenpont érkezik" : "Bocsánatkérés egy megbántott embernek"}</span>
        <h2 ref={headingRef} tabIndex={-1}>Mit bíznál Futurára?</h2>
        {returning && <p>Választhatsz másik határt. A korábbi reflexió érvényét veszti.</p>}
      </header>
      <div className="decision-grid" role="group" aria-label="Mit bíznál Futurára? Válassz egy döntési irányt.">
        {dilemma.choices.map((choice, order) => (
          <DecisionCard
            key={choice.lens}
            choice={choice}
            selected={false}
            subdued={false}
            order={order}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
