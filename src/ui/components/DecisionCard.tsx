import { Brain, Hand, Heart } from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import type {
  Consequence,
  Lens,
  PublicDilemma,
  ReflectionContent,
} from "../../domain/gameTypes";

const ICONS = {
  brain: Brain,
  hand: Hand,
  heart: Heart,
} satisfies Record<Lens, typeof Brain>;

interface Props {
  choice: PublicDilemma["choices"][number];
  selected: boolean;
  subdued: boolean;
  order?: number;
  onSelect(lens: Lens): void;
}

export function DecisionCard({ choice, selected, subdued, order = 0, onSelect }: Props) {
  const Icon = ICONS[choice.lens];
  const accessibleName = `${choice.label} — ${choice.framing}. ${choice.choiceText}${selected ? " Kijelölve." : ""}`;

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
        <span className="route-beacon"><Icon size={38} weight="light" /></span>
        <span className="route-label">{choice.label}</span>
        <strong>{choice.framing}</strong>
        <small>{choice.choiceText}</small>
        {selected && <span className="route-footprint">Te állsz itt</span>}
      </span>
      <span className="route-contact" aria-hidden="true" />
    </button>
  );
}

export type RitualCardState = "selected" | "reflection" | "stamped" | "sealed" | "outcome";

const STATE_LABELS: Record<RitualCardState, string> = {
  selected: "kijelölve",
  reflection: "ellenpont feltárva",
  stamped: "emberileg megtartva",
  sealed: "végleg megerősítve",
  outcome: "következmény feltárva",
};

export function RitualCard({
  choice,
  state,
  reflection,
  consequence,
}: {
  choice: PublicDilemma["choices"][number];
  state: RitualCardState;
  reflection?: ReflectionContent | null;
  consequence?: Consequence | null;
}) {
  const Icon = ICONS[choice.lens];

  return (
    <div
      className={`ritual-card ritual-card-${choice.lens} ritual-card-${state}`}
      aria-label={`${choice.label} döntési kártya, ${STATE_LABELS[state]}`}
      data-testid="ritual-card"
    >
      <div className="ritual-card-object">
        <div className="ritual-card-face ritual-card-front">
          <span className="ritual-card-rim" aria-hidden="true" />
          <span className="ritual-card-icon"><Icon size={48} weight="light" aria-hidden="true" /></span>
          <span className="ritual-card-label">{choice.label}</span>
          <strong>{choice.framing}</strong>
          <small>{choice.choiceText}</small>
          {(state === "stamped" || state === "sealed") && (
            <span className="human-seal" aria-hidden="true">
              <span>{state === "sealed" ? "LEZÁRVA" : "MEGTARTVA"}</span>
            </span>
          )}
        </div>

        <div className="ritual-card-face ritual-card-back">
          <span className="ritual-card-rim" aria-hidden="true" />
          <span className="ritual-card-back-kicker">Futura ellenpontja</span>
          <strong>{reflection?.counterargument}</strong>
          <p>{reflection?.blindSpot}</p>
          <blockquote>{reflection?.question}</blockquote>
        </div>

        <div className="ritual-card-face ritual-card-result">
          <span className="ritual-card-rim" aria-hidden="true" />
          <span className="ritual-card-back-kicker">A döntés lenyomata · {choice.label}</span>
          <p>{consequence?.explanation}</p>
          <div className="outcome-leaves">
            <div>
              <strong>Ezt nyerted</strong>
              <p>{consequence?.gains.join(" ")}</p>
            </div>
            <div>
              <strong>Ezt adtad át</strong>
              <p>{consequence?.costs.join(" ")}</p>
            </div>
          </div>
          <blockquote>{consequence?.closingReflection}</blockquote>
        </div>
      </div>
      <span className="ritual-card-edge" aria-hidden="true" />
      <span className="ritual-card-shadow" aria-hidden="true" />
    </div>
  );
}
