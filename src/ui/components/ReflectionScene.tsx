import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import type { Ref } from "react";
import type { LocalizedChoice, UiCopy, UiLocale } from "../../content/uiCopy";
import type { ReflectionContent } from "../../domain/gameTypes";
import { LensIcon } from "./DecisionCard";
import "./reflectionScene.css";

/** Presentation only: both actions delegate to the existing human command handlers. */
export function ReflectionScene({ choices, choice, reflection, copy, locale, headingRef, onKeep, onReconsider }: {
  choices: LocalizedChoice[];
  choice: LocalizedChoice;
  reflection: ReflectionContent;
  copy: UiCopy;
  locale: UiLocale;
  headingRef: Ref<HTMLHeadingElement>;
  onKeep(): void;
  onReconsider(): void;
}) {
  return (
    <div className="reflection-focus-scene">
      <div className="reflection-context">
        <div className="reflection-directions" aria-label={copy.choice.selectedGroupLabel}>
          {choices.map(({ lens, label }) => (
            <span key={lens} className={lens === choice.lens ? "is-current" : "is-background"}
              aria-label={lens === choice.lens ? `${label} ${copy.choice.selectedSuffix}` : label}>
              <LensIcon lens={lens} size={24} />
              <span>{label}</span>
            </span>
          ))}
        </div>
        <span className="reflection-unfinalized">{copy.choice.selectedKicker}</span>
      </div>
      <article className="reflection-message" data-testid="reflection-message"
        aria-label={`${choice.label} ${copy.cards.cardAriaLabel}, ${copy.cards.stateLabels.reflection}`}>
        <header>
          <span className="reflection-speaker">{copy.counterpoint.kicker}</span>
          <h2 id="reflection-title" ref={headingRef} tabIndex={-1}>{copy.counterpoint.heading}</h2>
        </header>
        <div className="reflection-words" lang={locale}>
          <p className="reflection-premise">{reflection.counterargument}</p>
          <p>{reflection.blindSpot}</p>
          <blockquote>{reflection.question}</blockquote>
        </div>
      </article>
      <div className="reflection-human-actions" role="group" aria-label={copy.counterpoint.actionsLabel}>
        <button className="primary-action" type="button" onClick={onKeep}>
          {copy.counterpoint.keep[choice.lens]} <ArrowRight size={20} aria-hidden="true" />
        </button>
        <button className="secondary-action" type="button" onClick={onReconsider}>
          <ArrowLeft size={20} aria-hidden="true" /> {copy.counterpoint.reconsider}
        </button>
      </div>
    </div>
  );
}
