import { ArrowRight } from "@phosphor-icons/react";
import type { Ref } from "react";
import type { LocalizedChoice, UiCopy } from "../../content/uiCopy";
import type { Consequence } from "../../domain/gameTypes";
import { LensIcon } from "./DecisionCard";
import "./consequenceScene.css";

/** Renders the already-revealed domain result; never computes or applies a delta. */
export function ConsequenceScene({ choice, consequence, copy, headingRef, onShowBalance }: {
  choice: LocalizedChoice;
  consequence: Consequence;
  copy: UiCopy;
  headingRef: Ref<HTMLHeadingElement>;
  onShowBalance(): void;
}) {
  return (
    <div className="consequence-resolution-scene" aria-labelledby="outcome-title">
      <article className="consequence-resolution" data-testid="consequence-resolution"
        aria-label={`${choice.label} ${copy.cards.cardAriaLabel}, ${copy.cards.stateLabels.outcome}`}>
        <header>
          <div className="consequence-record">
            <span className="consequence-direction"><LensIcon lens={choice.lens} size={26} /><strong>{choice.label}</strong></span>
            <span>{copy.sealed.kicker}</span>
          </div>
          <h2 id="outcome-title" ref={headingRef} tabIndex={-1}>{copy.outcome.heading}</h2>
        </header>
        <div className="consequence-tradeoff">
          <section aria-labelledby="consequence-gain-title">
            <h3 id="consequence-gain-title">{copy.outcome.gainLabel}</h3>
            {consequence.gains.map((gain, index) => <p key={index}>{gain}</p>)}
          </section>
          <section aria-labelledby="consequence-cost-title">
            <h3 id="consequence-cost-title">{copy.outcome.costLabel}</h3>
            {consequence.costs.map((cost, index) => <p key={index}>{cost}</p>)}
          </section>
        </div>
        <blockquote className="consequence-open-question">{consequence.closingReflection}</blockquote>
      </article>
      <button className="primary-action consequence-balance-action" type="button" onClick={onShowBalance}>
        {copy.outcome.showBalance} <ArrowRight size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
