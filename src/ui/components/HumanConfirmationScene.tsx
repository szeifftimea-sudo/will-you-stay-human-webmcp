import { ArrowLeft, Fingerprint } from "@phosphor-icons/react";
import type { Ref } from "react";
import type { LocalizedChoice, UiCopy, UiLocale } from "../../content/uiCopy";
import { LensIcon } from "./DecisionCard";
import { digitalSelectionMeaning } from "./selectionCopy";
import "./humanConfirmation.css";

/** No effects, timers or commands: only the explicit button delegates confirmation. */
export function HumanConfirmationScene({ choice, copy, locale, headingRef, reasoning, onReasoning, onChangeChoice, onConfirm }: {
  choice: LocalizedChoice;
  copy: UiCopy;
  locale: UiLocale;
  headingRef: Ref<HTMLHeadingElement>;
  reasoning: string;
  onReasoning(value: string): void;
  onChangeChoice(): void;
  onConfirm(): void;
}) {
  return (
    <div className="human-confirmation-scene">
      <article className="human-confirmation-moment" aria-labelledby="confirmation-title" data-testid="human-confirmation">
        <header>
          <div className="human-confirmation-status">
            <span>{copy.confirmation.threshold}</span>
            <span className="human-confirmation-pending">{copy.choice.selectedKicker}</span>
          </div>
          <h2 id="confirmation-title" ref={headingRef} tabIndex={-1}>{copy.confirmation.heading}</h2>
        </header>
        <div className="human-confirmation-direction" aria-label={`${choice.label} ${copy.choice.selectedSuffix}`}>
          <span className="human-confirmation-icon" aria-hidden="true"><LensIcon lens={choice.lens} size={34} /></span>
          <strong>{choice.label}</strong>
          <p>{locale === "en" ? digitalSelectionMeaning[choice.lens] : choice.framing}</p>
        </div>
        <div className="human-confirmation-note">
          <label htmlFor="decision-reasoning">
            {copy.confirmation.reasonLabel} <span>{copy.confirmation.reasonOptional}</span>
          </label>
          <textarea id="decision-reasoning" maxLength={500} value={reasoning}
            onChange={(event) => onReasoning(event.target.value)} aria-label={copy.confirmation.reasonAriaLabel} />
        </div>
        <div className="human-confirmation-actions" role="group" aria-label={copy.confirmation.actionsLabel}>
          <button className="secondary-action" type="button" onClick={onChangeChoice}>
            <ArrowLeft size={20} aria-hidden="true" /> {copy.confirmation.changeChoice}
          </button>
          <button className="primary-action" type="button" onClick={onConfirm}>
            {copy.confirmation.confirm} <Fingerprint size={21} aria-hidden="true" />
          </button>
        </div>
      </article>
    </div>
  );
}
