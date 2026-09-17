import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../../src/app/App";
import { createAppServices } from "../../src/app/bootstrap";
import { getUiGameView } from "../../src/application/queryPorts";
import { MemoryGameRepository } from "../../src/infrastructure/storage/gameRepository";
import { localizeDilemma, uiCopy } from "../../src/content/uiCopy";
import { UI_LOCALE_STORAGE_KEY } from "../../src/ui/presentationLocale";

describe("one-question dilemma presentation", () => {
  for (const locale of ["hu", "en"] as const) {
    it.each([0, 1, 2, 3])(`${locale}: dilemma %i keeps its complete copy and one progression CTA`, (round) => {
      localStorage.setItem(UI_LOCALE_STORAGE_KEY, locale);
      const services = createAppServices(new MemoryGameRepository());
      let session = services.agentCommands.enterMachineCity().session;
      // Test fixtures use the real ports; no alternative game state is introduced.
      for (let i = 0; i <= round; i++) {
        session = services.agentCommands.presentDilemma(session.sessionId, session.stateRevision).session;
        if (i === round) break;
        session = services.playerCommands.selectLens("brain");
        session = services.agentCommands.presentChoiceReflection(session.sessionId, session.tentativeSelection!.selectionId, session.stateRevision).session;
        session = services.playerCommands.acknowledgeReflection(session.presentedReflection!.reflectionId);
        session = services.playerCommands.confirmDecision();
        session = services.agentCommands.revealConfirmedConsequence(session.sessionId, session.confirmedDecision!.decisionId, session.stateRevision).session;
      }
      const expected = localizeDilemma(getUiGameView(services.engine).activeDilemma!, locale);
      const { container } = render(<App services={services} />);
      const presentation = container.querySelector<HTMLElement>(".dilemma-arrival-stage")!;
      expect(presentation).not.toBeNull();
      expect(within(presentation).getAllByRole("heading")).toHaveLength(1);
      expect(within(presentation).getByRole("heading", { name: expected.title })).toBeVisible();
      const situation = [...presentation.querySelectorAll(".situation-beats p")].map(p => p.textContent).join(" ");
      expect(situation).toBe(expected.situation);
      expect(within(presentation).getAllByRole("button")).toHaveLength(1);
      expect(within(presentation).getByRole("button", { name: uiCopy[locale].dilemma.showOptions })).toBeEnabled();
      expect(container.querySelector(".decision-grid")).toBeNull();
      expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();
      expect(container.querySelector(".outcome-stage")).toBeNull();
      expect(services.engine.getSnapshot()?.tentativeSelection).toBeNull();
      expect(services.engine.getSnapshot()?.confirmedDecision).toBeNull();
    });
  }
});
