import { useEffect, useMemo, useState } from "react";
import type { Lens } from "../domain/gameTypes";
import { registerWebMcpTools, type WebMcpRegistrationStatus } from "../infrastructure/webmcp/registerTools";
import { HumanBalance } from "../ui/components/HumanBalance";
import { ManualAgentControls } from "../ui/components/ManualAgentControls";
import { useGameView } from "../ui/hooks/useGameView";
import type { AppServices } from "./bootstrap";

const INITIAL_STATUS: WebMcpRegistrationStatus = {
  mode: "registering",
  registeredTools: [],
  message: "WebMCP-képesség ellenőrzése…",
};

export function App({ services }: { services: AppServices }) {
  const view = useGameView(services.engine);
  const [registration, setRegistration] = useState(INITIAL_STATUS);
  const [error, setError] = useState("");
  const [reasoning, setReasoning] = useState("");

  useEffect(() => {
    let controller: AbortController | null = null;
    void registerWebMcpTools(document.modelContext, services.webMcpTools, setRegistration).then(
      (registered) => {
        controller = registered;
      },
    );
    return () => controller?.abort();
  }, [services.webMcpTools]);

  const selectedLens = view.session?.tentativeSelection?.lens ?? null;
  const selectedLabel = useMemo(
    () => view.activeDilemma?.choices.find(({ lens }) => lens === selectedLens)?.label ?? null,
    [selectedLens, view.activeDilemma],
  );

  const playerAction = (action: () => unknown) => {
    try {
      action();
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Ismeretlen játékosi hiba.");
    }
  };

  const choose = (lens: Lens) => playerAction(() => services.playerCommands.selectLens(lens));
  const session = view.session;
  const showChoices = Boolean(
    session &&
      view.activeDilemma &&
      [
        "AWAITING_HUMAN_SELECTION",
        "TENTATIVE_SELECTION_RECORDED",
        "REFLECTION_PRESENTED",
        "READY_FOR_CONFIRMATION",
      ].includes(session.phase),
  );

  return (
    <main>
      <header className="hero">
        <div>
          <div className="eyebrow">Magyar WebMCP technikai spike</div>
          <h1>Ember maradsz?</h1>
          <p>Futura mozgathatja a rendszert. A döntési irányt csak te jelölheted és erősítheted meg.</p>
        </div>
        <div className={`status status-${registration.mode}`} data-testid="webmcp-status">
          <strong>WebMCP</strong>
          <span>{registration.message}</span>
          <small>{registration.registeredTools.join(" · ") || "Nincs regisztrált tool"}</small>
        </div>
      </header>

      <section className="state-strip" aria-live="polite">
        <span>Fázis</span>
        <strong data-testid="game-phase">{session?.phase ?? "NO_SESSION"}</strong>
        <span>Revision</span>
        <strong>{session?.stateRevision ?? "—"}</strong>
      </section>

      <div className="layout">
        <div className="game-column">
          {!session && (
            <section className="panel empty-state">
              <div className="eyebrow">A Gépváros még csendes</div>
              <h2>Futura hívására vár</h2>
              <p>Indítsd az agentfolyamatot WebMCP-ből vagy az alábbi manuális fallbackből.</p>
            </section>
          )}

          {view.activeDilemma && (
            <section className="panel dilemma" aria-labelledby="dilemma-title">
              <div className="eyebrow">Futura hívása</div>
              <h2 id="dilemma-title">{view.activeDilemma.title}</h2>
              <p className="call-prompt">{view.activeDilemma.callPrompt}</p>
              <p>{view.activeDilemma.situation}</p>
              <blockquote>{view.activeDilemma.automationPromise}</blockquote>
              <p className="tension">{view.activeDilemma.centralTension}</p>
            </section>
          )}

          {showChoices && view.activeDilemma && (
            <section className="panel" aria-labelledby="choices-title">
              <div className="eyebrow">Játékos-parancsút</div>
              <h2 id="choices-title">Melyik irányt jelölöd ki?</h2>
              <div className="choice-grid">
                {view.activeDilemma.choices.map((choice) => (
                  <button
                    className={`choice ${selectedLens === choice.lens ? "selected" : ""}`}
                    aria-pressed={selectedLens === choice.lens}
                    key={choice.lens}
                    onClick={() => choose(choice.lens)}
                  >
                    <strong>{choice.label}</strong>
                    <span>{choice.framing}</span>
                    <small>{choice.choiceText}</small>
                  </button>
                ))}
              </div>
              {session?.phase === "TENTATIVE_SELECTION_RECORDED" && (
                <p className="hint">{selectedLabel} kijelölve. Most Futura csak ehhez kérhet reflexiót.</p>
              )}
            </section>
          )}

          {view.reflection && session && ["REFLECTION_PRESENTED", "READY_FOR_CONFIRMATION"].includes(session.phase) && (
            <section className="panel reflection" aria-labelledby="reflection-title">
              <div className="eyebrow">Futura ellenpontja · {selectedLabel}</div>
              <h2 id="reflection-title">Állj meg egy pillanatra</h2>
              <p><strong>Ellenérv:</strong> {view.reflection.counterargument}</p>
              <p><strong>Vakfolt:</strong> {view.reflection.blindSpot}</p>
              <p><strong>Másodlagos következmény:</strong> {view.reflection.secondaryConsequence}</p>
              <blockquote>{view.reflection.question}</blockquote>
              {session.phase === "REFLECTION_PRESENTED" && session.presentedReflection && (
                <div className="button-row">
                  <button
                    onClick={() =>
                      playerAction(() =>
                        services.playerCommands.acknowledgeReflection(
                          session.presentedReflection!.reflectionId,
                        ),
                      )
                    }
                  >
                    Megtartom ezt az irányt
                  </button>
                  <span className="hint">Vagy jelölj ki fent másik irányt.</span>
                </div>
              )}
            </section>
          )}

          {session?.phase === "READY_FOR_CONFIRMATION" && (
            <section className="panel confirmation" aria-labelledby="confirmation-title">
              <div className="eyebrow">Kizárólag emberi kontrollpont</div>
              <h2 id="confirmation-title">Véglegesíted a {selectedLabel} irányt?</h2>
              <label>
                Opcionális indoklás
                <textarea
                  maxLength={500}
                  value={reasoning}
                  onChange={(event) => setReasoning(event.target.value)}
                />
              </label>
              <button
                className="confirm"
                onClick={() => playerAction(() => services.playerCommands.confirmDecision(reasoning))}
              >
                Döntésem végleges megerősítése
              </button>
            </section>
          )}

          {session?.phase === "DECISION_CONFIRMED" && (
            <section className="panel waiting">
              <div className="eyebrow">Emberi döntés rögzítve</div>
              <h2>A következmény még rejtve van</h2>
              <p>Futura most már meghívhatja a reveal toolt; a választást továbbra sem ő hozta létre.</p>
            </section>
          )}

          {session?.revealedOutcome && session.phase === "CONSEQUENCE_REVEALED" && (
            <section className="panel outcome" aria-labelledby="outcome-title">
              <div className="eyebrow">Következmény feltárva · egyszer alkalmazva</div>
              <h2 id="outcome-title">Mit nyertél, és mit adtál át?</h2>
              <p>{session.revealedOutcome.consequence.explanation}</p>
              <div className="tradeoffs">
                <div><strong>Nyereség</strong><ul>{session.revealedOutcome.consequence.gains.map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div><strong>Ár</strong><ul>{session.revealedOutcome.consequence.costs.map((item) => <li key={item}>{item}</li>)}</ul></div>
              </div>
              <blockquote>{session.revealedOutcome.consequence.closingReflection}</blockquote>
            </section>
          )}

          {session?.phase === "GAME_COMPLETE" && (
            <section className="panel outcome">
              <div className="eyebrow">Technikai spike vége</div>
              <h2>A játékkör lezárult</h2>
              <p>Az ideiglenes egyetlen dilemma következménye perzisztálva és egyszer alkalmazva marad.</p>
            </section>
          )}

          {error && <p className="error" role="alert">{error}</p>}

          {registration.mode !== "webmcp" && (
            <ManualAgentControls
              commands={services.agentCommands}
              session={session}
              onError={setError}
            />
          )}
        </div>

        <HumanBalance balance={session?.balance ?? { comfort: 0, control: 0, connection: 0, freedom: 0, responsibility: 0 }} />
      </div>
    </main>
  );
}

