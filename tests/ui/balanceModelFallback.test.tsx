import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { uiCopy } from "../../src/content/uiCopy";
import { HumanBalance } from "../../src/ui/components/HumanBalance";
import { BalanceModelLayer } from "../../src/ui/tabletop/BalanceModelLayer";

const webgl = vi.hoisted(() => ({ renderer: vi.fn(), load: vi.fn() }));

// Keep the genuine Three geometry, material, scene and disposal implementations.
vi.mock("three", async (importOriginal) => ({
  ...await importOriginal<typeof import("three")>(),
  WebGLRenderer: webgl.renderer,
}));
vi.mock("three/addons/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class { loadAsync = webgl.load; },
}));

const current = { comfort: -1, control: 1, connection: 1, freedom: 0, responsibility: 2 };
let renderer: {
  domElement: HTMLCanvasElement;
  setPixelRatio: ReturnType<typeof vi.fn>;
  setClearColor: ReturnType<typeof vi.fn>;
  setSize: ReturnType<typeof vi.fn>;
  render: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
  forceContextLoss: ReturnType<typeof vi.fn>;
  shadowMap: { enabled: boolean; type: number };
  info: { render: { calls: number; triangles: number } };
};
let disconnect: ReturnType<typeof vi.fn>;

describe("Blender balance keeps the accessible HTML when model rendering is unavailable", () => {
  beforeEach(() => {
    renderer = {
      domElement: document.createElement("canvas"),
      setPixelRatio: vi.fn(), setClearColor: vi.fn(), setSize: vi.fn(), render: vi.fn(),
      dispose: vi.fn(), forceContextLoss: vi.fn(),
      shadowMap: { enabled: false, type: 0 },
      info: { render: { calls: 0, triangles: 0 } },
    };
    webgl.renderer.mockReset().mockImplementation(function rendererStub() { return renderer; });
    webgl.load.mockReset();
    disconnect = vi.fn();
    vi.stubGlobal("ResizeObserver", class {
      observe = vi.fn();
      disconnect = disconnect;
    });
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(["hu", "en"] as const)("WebGL constructor failure leaves the %s values and continuation intact", (locale) => {
    webgl.renderer.mockImplementation(function unavailableRenderer() { throw new Error("WebGL not supported"); });
    const onContinue = vi.fn();
    const view = render(<HumanBalance
      balance={current} locale={locale} onContinue={onContinue}
      continueLabel={uiCopy[locale].balance.nextQuestion}
    />);
    const instrument = screen.getByTestId("human-balance");
    const axes = within(instrument).getAllByRole("img");
    const originalAxes = axes.map((axis) => axis.outerHTML);
    const button = within(instrument).getByRole("button", { name: uiCopy[locale].balance.nextQuestion });
    const originalButtonCopy = button.textContent;
    expect(button.closest("footer")!.parentElement).toBe(instrument.querySelector(".balance-housing"));

    view.rerender(<HumanBalance
      balance={current} locale={locale} onContinue={onContinue}
      continueLabel={uiCopy[locale].balance.nextQuestion} depth={BalanceModelLayer}
    />);

    expect(webgl.renderer).toHaveBeenCalledExactlyOnceWith({ alpha: true, antialias: true, powerPreference: "low-power" });
    expect(webgl.load).not.toHaveBeenCalled();
    expect(screen.getByTestId("balance-model-layer")).toHaveAttribute("data-model-status", "unavailable");
    expect(screen.getByTestId("balance-model-layer")).toHaveAttribute("aria-hidden", "true");
    expect(instrument.querySelector(".balance-housing")).not.toHaveClass("has-balance-model");
    expect(instrument.querySelector("canvas")).toBeNull();
    const currentAxes = within(instrument).getAllByRole("img");
    expect(currentAxes.map((axis) => {
      // The spatial instrument intentionally adds the two intermediate ticks.
      // Every pre-existing value, accessible name and marker remains identical.
      expect(Array.from(axis.querySelectorAll(".balance-stop"), (tick) => tick.textContent)).toEqual(["−2", "−1", "0", "+1", "+2"]);
      const comparable = axis.cloneNode(true) as HTMLElement;
      comparable.querySelectorAll(".balance-stop-minus-one, .balance-stop-plus-one").forEach((tick) => tick.remove());
      return comparable.outerHTML;
    })).toEqual(originalAxes);
    expect(currentAxes).toHaveLength(5);
    const externalButton = within(instrument).getByRole("button", { name: uiCopy[locale].balance.nextQuestion });
    expect(within(instrument).getAllByRole("button")).toEqual([externalButton]);
    expect(externalButton.textContent).toBe(originalButtonCopy);
    expect(externalButton.closest(".balance-housing")).toBeNull();
    expect(externalButton.closest("footer")!.parentElement).toBe(instrument);
    expect(externalButton.closest("footer")!.previousElementSibling).toHaveClass("balance-object-stage");
    externalButton.focus();
    expect(externalButton).toHaveFocus();
    fireEvent.click(externalButton);
    expect(onContinue).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(renderer.dispose).not.toHaveBeenCalled();
  });

  it("GLB loading failure does not hide or replace any native label, marker or CTA", async () => {
    webgl.load.mockRejectedValueOnce(new Error("The GLB could not be loaded"));
    const onContinue = vi.fn();
    const view = render(<HumanBalance
      balance={current} locale="en" onContinue={onContinue}
      continueLabel={uiCopy.en.balance.nextQuestion} depth={BalanceModelLayer}
    />);
    await waitFor(() => expect(screen.getByTestId("balance-model-layer")).toHaveAttribute("data-model-status", "unavailable"));
    expect(webgl.load).toHaveBeenCalledExactlyOnceWith("/models/human-balance.glb");
    const instrument = screen.getByTestId("human-balance");
    const housing = instrument.querySelector(".balance-housing")!;
    expect(housing).not.toHaveClass("has-balance-model");
    expect(screen.getByTestId("balance-model-layer")).toHaveStyle({ visibility: "hidden" });
    for (const [axis, label] of Object.entries(uiCopy.en.balance.axes)) {
      expect(within(instrument).getByRole("img", { name: `${label}: ${current[axis as keyof typeof current]}` })).toBeVisible();
    }
    expect(instrument.querySelectorAll(".balance-marker")).toHaveLength(5);
    expect(instrument.querySelectorAll(".balance-zero")).toHaveLength(5);
    const button = within(instrument).getByRole("button", { name: uiCopy.en.balance.nextQuestion });
    expect(housing.contains(button)).toBe(false);
    expect(button.closest("footer")!.parentElement).toBe(instrument);
    expect(button.closest("footer")!.previousElementSibling).toHaveClass("balance-object-stage");
    button.focus();
    expect(button).toHaveFocus();
    fireEvent.click(button);
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(renderer.render).not.toHaveBeenCalled();
    view.unmount();
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(renderer.forceContextLoss).toHaveBeenCalledTimes(1);
    expect(renderer.domElement.isConnected).toBe(false);
  });

  it("frees a GLB that resolves after unmount without resurrecting the canvas", async () => {
    let resolveModel!: (gltf: { scene: THREE.Group }) => void;
    webgl.load.mockReturnValueOnce(new Promise<{ scene: THREE.Group }>((resolve) => { resolveModel = resolve; }));
    const view = render(<HumanBalance balance={current} locale="en" depth={BalanceModelLayer} />);
    expect(webgl.load).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);

    const scene = new THREE.Group();
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial();
    const disposeGeometry = vi.spyOn(geometry, "dispose");
    const disposeMaterial = vi.spyOn(material, "dispose");
    scene.add(new THREE.Mesh(geometry, material));
    await act(async () => { resolveModel({ scene }); });
    expect(disposeGeometry).toHaveBeenCalledTimes(1);
    expect(disposeMaterial).toHaveBeenCalledTimes(1);
    expect(renderer.render).not.toHaveBeenCalled();
    expect(renderer.domElement.isConnected).toBe(false);
    expect(screen.queryByTestId("balance-model-layer")).not.toBeInTheDocument();
  });
});
