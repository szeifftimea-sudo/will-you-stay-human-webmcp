import type { CSSProperties } from "react";
import type { HumanBalance as Balance } from "../../domain/gameTypes";

const LABELS: Array<[keyof Balance, string]> = [
  ["comfort", "Kényelem"],
  ["control", "Kontroll"],
  ["connection", "Kapcsolódás"],
  ["freedom", "Szabadság"],
  ["responsibility", "Felelősség"],
];

export function HumanBalance({
  balance,
  memory = false,
  onStartNewRound,
}: {
  balance: Balance;
  memory?: boolean;
  onStartNewRound?: () => void;
}) {
  return (
    <section
      className={`human-balance${memory ? " is-memory" : " is-revealing"}`}
      aria-labelledby="balance-title"
      data-testid="human-balance"
    >
      <div className="balance-housing">
        <header>
          <div>
            <span className="balance-kicker">Embermérleg</span>
            <h2 id="balance-title">A döntés lenyomata</h2>
          </div>
          <span className="balance-note">Nem pontszám.</span>
        </header>

        <div className="balance-list">
          {LABELS.map(([key, label], index) => {
            const value = balance[key];
            const changed = value !== 0;
            return (
              <div
                className={`balance-row${changed ? " is-changing" : " is-static"}`}
                key={key}
                style={{
                  "--balance-delay": `${3000 + index * 210}ms`,
                  "--delta-delay": `${3700 + index * 210}ms`,
                  "--marker-position": `${((value + 2) / 4) * 100}%`,
                } as CSSProperties}
              >
                <span className={`balance-axis balance-axis-${key}`} aria-hidden="true" />
                <span className="balance-label">{label}</span>
                <div className="balance-track" role="img" aria-label={`${label}: ${value}`}>
                  <span className="balance-stop balance-stop-minus">−2</span>
                  <span className="balance-stop balance-stop-zero">0</span>
                  <span className="balance-stop balance-stop-plus">+2</span>
                  <span className="balance-groove" aria-hidden="true" />
                  <span className="balance-zero" aria-hidden="true" />
                  <span
                    className={`balance-marker ${value < 0 ? "negative" : value > 0 ? "positive" : "neutral"}`}
                    aria-hidden="true"
                  />
                  {changed && <span className="balance-impact" aria-hidden="true" />}
                </div>
                <strong className="balance-delta">
                  {changed ? `0 → ${value > 0 ? `+${value}` : value}` : ""}
                </strong>
              </div>
            );
          })}
        </div>

        <footer className="balance-footer">
          <p>A szavaid nálad maradtak. A határ azonban elmozdult.</p>
          {onStartNewRound && (
            <button className="primary-action balance-new-round" type="button" onClick={onStartNewRound}>
              Új döntési kört kezdek
            </button>
          )}
        </footer>
      </div>
    </section>
  );
}
