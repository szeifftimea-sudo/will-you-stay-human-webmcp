import type { ComponentType, CSSProperties } from "react";
import { uiCopy, type UiLocale } from "../../content/uiCopy";
import type { HumanBalance as Balance } from "../../domain/gameTypes";

export function HumanBalance({
  balance,
  previousBalance,
  memory = false,
  onContinue,
  continueLabel,
  continueVariant = "primary",
  locale,
  depth: Depth,
  companionHref = "/product",
  onVisitCompanion,
}: {
  balance: Balance;
  previousBalance?: Balance;
  memory?: boolean;
  onContinue?: () => void;
  continueLabel?: string;
  continueVariant?: "primary" | "secondary";
  locale: UiLocale;
  depth?: ComponentType;
  companionHref?: string;
  onVisitCompanion?: () => void;
}) {
  const copy = uiCopy[locale];
  const labels = Object.entries(copy.balance.axes) as Array<[keyof Balance, string]>;
  const rows = (
        <div className="balance-list">
          {labels.map(([key, label], index) => {
            const value = balance[key];
            const previousValue = previousBalance?.[key] ?? value;
            const changed = previousValue !== value;
            return (
              <div
                className={`balance-row${changed ? " is-changing" : " is-static"}`}
                key={key}
                style={{
                  "--balance-delay": `${3000 + index * 210}ms`,
                  "--delta-delay": `${3700 + index * 210}ms`,
                  "--marker-start-position": `${((previousValue + 2) / 4) * 100}%`,
                  "--marker-position": `${((value + 2) / 4) * 100}%`,
                } as CSSProperties}
              >
                <span className={`balance-axis balance-axis-${key}`} aria-hidden="true" />
                <span className="balance-label">{label}</span>
                <div className="balance-track" role="img" aria-label={`${label}: ${value}`}>
                  <span className="balance-stop balance-stop-minus">−2</span>
                  {Depth && <span className="balance-stop balance-stop-minus-one">−1</span>}
                  <span className="balance-stop balance-stop-zero">0</span>
                  {Depth && <span className="balance-stop balance-stop-plus-one">+1</span>}
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
                  {changed
                    ? `${previousValue > 0 ? `+${previousValue}` : previousValue} → ${value > 0 ? `+${value}` : value}`
                    : ""}
                </strong>
              </div>
            );
          })}
        </div>
  );
  const showCompanion = Boolean(Depth) && !memory;
  const continueButton = onContinue && continueLabel && (
    <button className={`${continueVariant}-action balance-new-round`} type="button" onClick={onContinue}>
      {continueLabel}
    </button>
  );
  const footer = (
        <footer className={`balance-footer${showCompanion ? " has-companion-link" : ""}`}>
          <p>
            {memory
              ? copy.balance.gameComplete
              : copy.balance.roundMemory}
          </p>
          {showCompanion ? (
            <div className="balance-result-actions">
              {continueButton}
              <a className="secondary-action balance-companion-link" href={companionHref} onClick={onVisitCompanion}>
                {copy.balance.physicalCompanion}
              </a>
            </div>
          ) : continueButton}
        </footer>
  );
  return (
    <section
      className={`human-balance${Depth ? " is-foldable" : ""}${memory ? " is-memory" : " is-revealing"}`}
      aria-labelledby="balance-title"
      data-testid="human-balance"
    >
      {Depth ? (
        <>
          <header className="balance-context">
            <h2 id="balance-title">{copy.balance.heading}</h2>
            <span className="balance-note">{copy.balance.note}</span>
          </header>
          <div className="balance-object-stage">
            <div className="balance-housing">
              <Depth />
              <header className="balance-product-title">
                <span className="balance-kicker">{copy.balance.kicker}</span>
              </header>
              {rows}
            </div>
          </div>
          {footer}
        </>
      ) : (
      <div className="balance-housing">
        <header>
          <div>
            <span className="balance-kicker">{copy.balance.kicker}</span>
            <h2 id="balance-title">{copy.balance.heading}</h2>
          </div>
          <span className="balance-note">{copy.balance.note}</span>
        </header>
        {rows}
        {footer}
      </div>
      )}
    </section>
  );
}
