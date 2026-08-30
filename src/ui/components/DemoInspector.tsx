import { Bug, X } from "@phosphor-icons/react";
import type { WebMcpRegistrationStatus } from "../../infrastructure/webmcp/registerTools";
import type { AgentCommandPort } from "../../application/agentCommandPort";
import type { GameSession } from "../../domain/gameTypes";
import { ManualAgentControls } from "./ManualAgentControls";

interface Props {
  open: boolean;
  onClose(): void;
  registration: WebMcpRegistrationStatus;
  commands: AgentCommandPort;
  session: GameSession | null;
  onError(message: string): void;
}

export function DemoInspector({ open, onClose, registration, commands, session, onError }: Props) {
  if (!open) return null;

  return (
    <aside className="inspector" aria-label="Demo és WebMCP Inspector">
      <header>
        <div>
          <span className="inspector-kicker"><Bug size={16} aria-hidden="true" /> Demo réteg</span>
          <h2>WebMCP Inspector</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose} aria-label="Inspector bezárása">
          <X size={20} />
        </button>
      </header>

      <div className={`inspector-status status-${registration.mode}`} data-testid="webmcp-status">
        <strong>{registration.message}</strong>
        <span>{registration.registeredTools.join(" · ") || "Nincs regisztrált tool"}</span>
      </div>

      <dl className="inspector-state">
        <div><dt>Fázis</dt><dd data-testid="game-phase">{session?.phase ?? "NO_SESSION"}</dd></div>
        <div><dt>Revision</dt><dd>{session?.stateRevision ?? "—"}</dd></div>
        <div><dt>Parancshatár</dt><dd>Player UI / Agent külön</dd></div>
      </dl>

      {registration.mode !== "webmcp" && (
        <ManualAgentControls commands={commands} session={session} onError={onError} />
      )}
    </aside>
  );
}
