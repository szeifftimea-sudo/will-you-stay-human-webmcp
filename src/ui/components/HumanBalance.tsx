import type { HumanBalance as Balance } from "../../domain/gameTypes";

const LABELS: Array<[keyof Balance, string]> = [
  ["comfort", "Kényelem"],
  ["control", "Kontroll"],
  ["connection", "Kapcsolódás"],
  ["freedom", "Szabadság"],
  ["responsibility", "Felelősség"],
];

export function HumanBalance({ balance }: { balance: Balance }) {
  return (
    <section className="panel" aria-labelledby="balance-title">
      <div className="eyebrow">Közös állapot</div>
      <h2 id="balance-title">Embermérleg</h2>
      <div className="balance-list">
        {LABELS.map(([key, label]) => (
          <div className="balance-row" key={key}>
            <span>{label}</span>
            <div className="balance-track" aria-label={`${label}: ${balance[key]}`}>
              <span className="balance-zero" />
              <span
                className={`balance-marker ${balance[key] < 0 ? "negative" : "positive"}`}
                style={{ left: `${((balance[key] + 2) / 4) * 100}%` }}
              />
            </div>
            <strong>{balance[key] > 0 ? `+${balance[key]}` : balance[key]}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

