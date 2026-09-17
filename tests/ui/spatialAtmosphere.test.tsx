import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { createAppServices } from "../../src/app/bootstrap";
import { uiCopy } from "../../src/content/uiCopy";
import { MemoryGameRepository } from "../../src/infrastructure/storage/gameRepository";
import { UI_LOCALE_STORAGE_KEY } from "../../src/ui/presentationLocale";
import { SpatialChoicesApp } from "../../src/ui/tabletop/SpatialChoicesApp";

vi.mock("../../src/ui/tabletop/ChoiceDepthLayer", () => ({ ChoiceDepthLayer: () => <div aria-hidden="true" /> }));
vi.mock("../../src/ui/tabletop/BalanceModelLayer", () => ({ BalanceModelLayer: () => <div aria-hidden="true" /> }));

describe("journey atmosphere is presentation-only and opt-in", () => {
  beforeEach(() => localStorage.setItem(UI_LOCALE_STORAGE_KEY, "en"));

  it("never wraps or changes the original interface", () => {
    const { container } = render(<App services={createAppServices(new MemoryGameRepository())} />);
    expect(container.querySelector(".spatial-journey")).toBeNull();
  });

  it("uses existing phase and balance classes through all four rounds, without a second state machine", () => {
    const services = createAppServices(new MemoryGameRepository());
    const { container } = render(<SpatialChoicesApp services={services} />);
    const main = () => container.querySelector(".spatial-journey > .game-app")!;
    const click = (name: string) => fireEvent.click(screen.getByRole("button", { name }));
    const copy = uiCopy.en;
    expect(main()).toHaveClass("game-app-entry");
    click(copy.landing.enter);
    expect(main()).toHaveClass("phase-machine_city_ready");
    click(copy.futura.showQuestion);

    for (let round = 0; round < 4; round += 1) {
      expect(main()).toHaveClass("phase-awaiting_human_selection");
      click(copy.dilemma.showOptions);
      if (round === 0) click(copy.guide.continue);
      fireEvent.click(screen.getByRole("button", { name: /^MIND —/ }));
      expect(main()).toHaveClass("phase-tentative_selection_recorded");
      click(copy.choice.showCounterpoint);
      expect(main()).toHaveClass("phase-reflection_presented");
      click(copy.counterpoint.keep.brain);
      click(copy.confirmation.confirm);
      expect(main()).toHaveClass("phase-decision_confirmed");
      click(copy.sealed.reveal);
      expect(main()).toHaveClass("phase-consequence_revealed");
      expect(main().querySelector(".human-balance")).toBeNull();
      const beforeDisplay = services.engine.getSnapshot();
      click(copy.outcome.showBalance);
      expect(main().querySelector(".human-balance.is-foldable.is-revealing")).not.toBeNull();
      expect(services.engine.getSnapshot()).toEqual(beforeDisplay);
      expect(beforeDisplay!.outcomeHistory).toHaveLength(round + 1);
      if (round < 3) click(copy.balance.nextQuestion);
      else click(copy.balance.endGame);
    }

    expect(main()).toHaveClass("phase-game_complete");
    expect(main().querySelector(".human-balance.is-foldable.is-memory")).not.toBeNull();
    const completed = services.engine.getSnapshot();
    act(() => { window.dispatchEvent(new Event("resize")); });
    expect(services.engine.getSnapshot()).toEqual(completed);
    expect(completed!.outcomeHistory).toHaveLength(4);
    expect(screen.getByRole("button", { name: copy.balance.restart })).toBeVisible();
  });
});
