import { Brain, Hand, Heart } from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import { digitalSelectionMeaning } from "./selectionCopy";
import "./digitalSelection.css";
import {
  uiCopy,
  type LocalizedChoice,
  type UiLocale,
} from "../../content/uiCopy";
import type {
  Consequence,
  Lens,
  ReflectionContent,
} from "../../domain/gameTypes";

const ICONS = {
  brain: Brain,
  hand: Hand,
  heart: Heart,
} satisfies Record<Lens, typeof Brain>;

interface Props {
  choice: LocalizedChoice;
  selected: boolean;
  subdued: boolean;
  order?: number;
  onSelect(lens: Lens): void;
  locale: UiLocale;
}

export function LensIcon({ lens, size = 38 }: { lens: Lens; size?: number }) {
  const Icon = ICONS[lens];
  return <Icon size={size} weight="light" />;
}

export function DecisionCard({ choice, selected, subdued, order = 0, onSelect, locale }: Props) {
  const copy = uiCopy[locale];
  const framingSeparator = /[.!?…]$/.test(choice.framing) ? " " : ". ";
  const compactMeaning = locale === "en" ? digitalSelectionMeaning[choice.lens] : null;
  const accessibleName = `${choice.label} — ${compactMeaning ?? `${choice.framing}${framingSeparator}${choice.choiceText}`}${selected ? ` ${copy.choice.selectedSuffix}` : ""}`;

  return (
    <button
      className={`route-choice route-choice-${choice.lens}${selected ? " is-selected" : ""}${subdued ? " is-subdued" : ""}`}
      type="button"
      aria-label={accessibleName}
      aria-pressed={selected}
      onClick={() => onSelect(choice.lens)}
      style={{ "--deal-delay": `${300 + order * 150}ms` } as CSSProperties}
    >
      <span className="route-object" aria-hidden="true">
        <span className="route-surface-light" />
        <span className="route-beacon"><LensIcon lens={choice.lens} /></span>
        <span className="route-label">{choice.label}</span>
        <strong>{compactMeaning ?? choice.framing}</strong>
        {!compactMeaning && <small>{choice.choiceText}</small>}
        {selected && <span className="route-footprint">{copy.choice.footprint}</span>}
      </span>
      <span className="route-contact" aria-hidden="true" />
    </button>
  );
}

export type RitualCardState = "selected" | "reflection" | "stamped" | "sealed" | "outcome";

export function RitualCard({
  choice,
  state,
  reflection,
  consequence,
  locale,
}: {
  choice: LocalizedChoice;
  state: RitualCardState;
  reflection?: ReflectionContent | null;
  consequence?: Consequence | null;
  locale: UiLocale;
}) {
  const Icon = ICONS[choice.lens];
  const copy = uiCopy[locale];

  return (
    <div
      className={`ritual-card ritual-card-${choice.lens} ritual-card-${state}`}
      aria-label={`${choice.label} ${copy.cards.cardAriaLabel}, ${copy.cards.stateLabels[state]}`}
      data-testid="ritual-card"
    >
      <div className="ritual-card-object">
        <div className="ritual-card-face ritual-card-front">
          <span className="ritual-card-rim" aria-hidden="true" />
          <span className="ritual-card-icon"><Icon size={48} weight="light" aria-hidden="true" /></span>
          <span className="ritual-card-label">{choice.label}</span>
          <strong>{choice.framing}</strong>
          <small>{choice.choiceText}</small>
        </div>

        <div className="ritual-card-face ritual-card-back">
          <span className="ritual-card-rim" aria-hidden="true" />
          <strong>{reflection?.counterargument}</strong>
          <p>{reflection?.blindSpot}</p>
          <blockquote>{reflection?.question}</blockquote>
        </div>

        <div className="ritual-card-face ritual-card-result">
          <span className="ritual-card-rim" aria-hidden="true" />
          <span className="ritual-card-result-identity">
            <Icon size={24} weight="light" aria-hidden="true" />
            <strong>{choice.label}</strong>
          </span>
          <p>{consequence?.explanation}</p>
          <div className="outcome-leaves">
            <div>
              <strong>{copy.outcome.gainLabel}</strong>
              <p>{consequence?.gains.join(" ")}</p>
            </div>
            <div>
              <strong>{copy.outcome.costLabel}</strong>
              <p>{consequence?.costs.join(" ")}</p>
            </div>
          </div>
          <blockquote>{consequence?.closingReflection}</blockquote>
        </div>
        {(state === "stamped" || state === "sealed") && (
          <span className="human-seal" aria-hidden="true">
            <span>{state === "sealed" ? copy.cards.sealedSeal : copy.cards.keptSeal}</span>
          </span>
        )}
      </div>
      <span className="ritual-card-edge" aria-hidden="true" />
      <span className="ritual-card-shadow" aria-hidden="true" />
    </div>
  );
}
