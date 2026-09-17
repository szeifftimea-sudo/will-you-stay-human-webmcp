import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "../../src/app/App";
import { createAppServices } from "../../src/app/bootstrap";
import { uiCopy } from "../../src/content/uiCopy";
import { ZERO_BALANCE } from "../../src/domain/gameTypes";
import { MemoryGameRepository } from "../../src/infrastructure/storage/gameRepository";
import type { RitualSoundPort } from "../../src/ui/audio/ritualSound";
import { UI_LOCALE_STORAGE_KEY } from "../../src/ui/presentationLocale";
import { ChoiceDepthLayer } from "../../src/ui/tabletop/ChoiceDepthLayer";

const webgl = vi.hoisted(() => ({
  renderer: vi.fn(function unavailableWebGl() {
    throw new Error("WebGL context could not be created");
  }),
}));

// Keep real Three colors, geometry and scene code; only WebGL initialization fails.
vi.mock("three", async (importOriginal) => ({
  ...await importOriginal<typeof import("three")>(),
  WebGLRenderer: webgl.renderer,
}));

let paletteStyle: HTMLStyleElement;

function click(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("ChoiceDepthLayer WebGL initialization fallback", () => {
  beforeEach(() => {
    webgl.renderer.mockClear();
    // jsdom does not inherit custom properties from :root. Give the actual grid
    // the application palette so the real effect reaches WebGL initialization.
    paletteStyle = document.createElement("style");
    paletteStyle.textContent = `.decision-grid {
      --petrol-deep: #02090c;
      --choice-neutral: #d7e8e7;
      --choice-highlight: #f4a666;
      --cyan: #68d4e8;
    }`;
    document.head.append(paletteStyle);
  });

  afterEach(() => {
    paletteStyle.remove();
  });

  it.each(["hu", "en"] as const)("preserves the %s native choices and game state when WebGL throws", (locale) => {
    localStorage.setItem(UI_LOCALE_STORAGE_KEY, locale);
    const copy = uiCopy[locale];
    const services = createAppServices(new MemoryGameRepository());
    const sound: RitualSoundPort = { play: vi.fn(), setMuted: vi.fn(), dispose: vi.fn() };
    const app = render(<App services={services} sound={sound} />);
    click(copy.landing.enter);
    click(copy.futura.showQuestion);
    click(copy.dilemma.showOptions);
    click(copy.guide.continue);

    const grid = screen.getByRole("group", { name: copy.choice.groupLabel });
    const buttons = within(grid).getAllByRole("button");
    const originalHtml = buttons.map((button) => button.outerHTML);
    const originalNames = buttons.map((button) => button.getAttribute("aria-label")!);
    const beforeDepth = services.engine.getSnapshot();
    const originalSoundCount = vi.mocked(sound.play).mock.calls.length;
    expect(buttons).toHaveLength(3);

    expect(() => app.rerender(
      <App services={services} sound={sound} choiceDepth={ChoiceDepthLayer} />,
    )).not.toThrow();

    expect(getComputedStyle(grid).getPropertyValue("--petrol-deep").trim()).toBe("#02090c");
    expect(webgl.renderer).toHaveBeenCalledExactlyOnceWith({
      alpha: true, antialias: true, powerPreference: "low-power",
    });
    const failedLayer = within(grid).getByTestId("choice-depth-layer");
    expect(failedLayer).toHaveAttribute("aria-hidden", "true");
    expect(failedLayer).toBeEmptyDOMElement();
    expect(grid.querySelector("canvas")).toBeNull();
    expect(grid).not.toHaveClass("has-choice-depth");
    expect(within(grid).getAllByRole("button")).toEqual(buttons);
    expect(buttons.map((button) => button.outerHTML)).toEqual(originalHtml);
    expect(services.engine.getSnapshot()).toEqual(beforeDepth);
    expect(sound.play).toHaveBeenCalledTimes(originalSoundCount);

    buttons.forEach((button, index) => {
      expect(button).toHaveAccessibleName(originalNames[index]);
      expect(button).toBeVisible();
      expect(button).toBeEnabled();
      button.focus();
      expect(button).toHaveFocus();
    });

    // Removing and retrying the optional decoration also leaves the cards and
    // domain snapshot unchanged, even though neither initialization succeeded.
    expect(() => app.rerender(<App services={services} sound={sound} />)).not.toThrow();
    expect(screen.queryByTestId("choice-depth-layer")).not.toBeInTheDocument();
    expect(() => app.rerender(
      <App services={services} sound={sound} choiceDepth={ChoiceDepthLayer} />,
    )).not.toThrow();
    expect(webgl.renderer).toHaveBeenCalledTimes(2);
    expect(within(grid).getAllByRole("button")).toEqual(buttons);
    expect(buttons.map((button) => button.outerHTML)).toEqual(originalHtml);
    expect(services.engine.getSnapshot()).toEqual(beforeDepth);

    fireEvent.click(buttons[0]);
    const selected = services.engine.getSnapshot()!;
    expect(selected.phase).toBe("TENTATIVE_SELECTION_RECORDED");
    expect(selected.tentativeSelection).toMatchObject({ lens: "brain", provenance: "PLAYER_UI" });
    expect(selected.presentedReflection).toBeNull();
    expect(selected.confirmedDecision).toBeNull();
    expect(selected.revealedOutcome).toBeNull();
    expect(selected.outcomeHistory).toEqual([]);
    expect(selected.balance).toEqual(ZERO_BALANCE);
    expect(sound.play).toHaveBeenCalledTimes(originalSoundCount + 1);
    expect(sound.play).toHaveBeenLastCalledWith("selection");
    const selectedGrid = screen.getByRole("group", { name: copy.choice.selectedGroupLabel });
    expect(selectedGrid).not.toHaveClass("has-choice-depth");
    expect(within(selectedGrid).getAllByRole("button")).toHaveLength(3);
    expect(within(selectedGrid).getByRole("button", {
      name: `${originalNames[0]} ${copy.choice.selectedSuffix}`,
    })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByTestId("human-balance")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: copy.confirmation.confirm })).not.toBeInTheDocument();

    expect(() => app.unmount()).not.toThrow();
    expect(services.engine.getSnapshot()).toEqual(selected);
    expect(sound.dispose).toHaveBeenCalledTimes(1);
  });
});
