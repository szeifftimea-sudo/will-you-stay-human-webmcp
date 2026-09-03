import type { AgentCommandPort } from "../../application/agentCommandPort";
import type { GameSession } from "../../domain/gameTypes";

interface Props {
  commands: AgentCommandPort;
  session: GameSession | null;
  onError(message: string): void;
}

export function ManualAgentControls({ commands, session, onError }: Props) {
  const run = (command: () => unknown) => {
    try {
      command();
      onError("");
    } catch (error) {
      onError(error instanceof Error ? error.message : "Ismeretlen fallback hiba.");
    }
  };

  return (
    <section className="panel fallback" aria-labelledby="fallback-title">
      <div className="eyebrow">Agent-parancsút · manuális fallback</div>
      <h2 id="fallback-title">Futura technikai vezérlői</h2>
      <p>Ezek a gombok ugyanazt az AgentCommandPortot használják, mint a WebMCP-toolok.</p>
      <div className="button-row">
        {!session && (
          <button onClick={() => run(() => commands.enterMachineCity())}>Belépés a Gépvárosba</button>
        )}
        {session && ["MACHINE_CITY_READY", "CONSEQUENCE_REVEALED"].includes(session.phase) && (
          <button
            onClick={() =>
              run(() => commands.presentDilemma(session.sessionId, session.stateRevision))
            }
          >
            {session.phase === "CONSEQUENCE_REVEALED" ? "Következő kör / lezárás" : "Dilemma bemutatása"}
          </button>
        )}
        {session?.phase === "TENTATIVE_SELECTION_RECORDED" && session.tentativeSelection && (
          <button
            onClick={() =>
              run(() =>
                commands.presentChoiceReflection(
                  session.sessionId,
                  session.tentativeSelection!.selectionId,
                  session.stateRevision,
                ),
              )
            }
          >
            Futura kérdez
          </button>
        )}
        {session?.phase === "DECISION_CONFIRMED" && session.confirmedDecision && (
          <button
            onClick={() =>
              run(() =>
                commands.revealConfirmedConsequence(
                  session.sessionId,
                  session.confirmedDecision!.decisionId,
                  session.stateRevision,
                ),
              )
            }
          >
            Következmény feltárása
          </button>
        )}
      </div>
    </section>
  );
}
