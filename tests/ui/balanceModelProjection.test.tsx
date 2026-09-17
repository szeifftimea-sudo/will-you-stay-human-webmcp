import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { App } from "../../src/app/App";
import { createAppServices } from "../../src/app/bootstrap";
import { uiCopy } from "../../src/content/uiCopy";
import { MemoryGameRepository } from "../../src/infrastructure/storage/gameRepository";
import { UI_LOCALE_STORAGE_KEY } from "../../src/ui/presentationLocale";
import { BalanceModelLayer } from "../../src/ui/tabletop/BalanceModelLayer";

const mocked = vi.hoisted(() => ({ renderer: vi.fn(), load: vi.fn() }));
vi.mock("three", async (importOriginal) => ({
  ...await importOriginal<typeof import("three")>(),
  WebGLRenderer: mocked.renderer,
}));
vi.mock("three/addons/loaders/GLTFLoader.js", () => ({
  GLTFLoader: class { loadAsync = mocked.load; },
}));

const AXES = ["comfort", "control", "connection", "freedom", "responsibility"] as const;
const MARKER_CYAN = 0x68d4e8;
const SCALE_AMBER = 0xf4a666;
type NativeBox = { left: number; top: number; width: number; height: number; parent: HTMLElement | null };
let now: number;
let nextFrame: number;
let frames: Map<number, FrameRequestCallback>;
let reducedMotion: boolean;
let resolveModel: (model: { scene: THREE.Group }) => void;
let lastScene: THREE.Scene;
let lastCamera: THREE.Camera;
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
let dimensions: Map<HTMLElement, NativeBox>;
let nativePalette: HTMLStyleElement;

function modelFixture() {
  const scene = new THREE.Group();
  const sharedMaterial = new THREE.MeshStandardMaterial({ color: 0x78999a });
  const names = ["Housing", ...AXES.flatMap((axis) => [`RailLeft_${axis}`, `RailRight_${axis}`, `Zero_${axis}`, `Marker_${axis}`, `Label_${axis}`])];
  for (const name of names) {
    const group = new THREE.Group();
    group.name = name;
    if (name === "Housing") {
      // The imported model's local Y becomes presentation Z. Its hinge is
      // deliberately taller than the two actual track-mounting leaf faces.
      for (const [side, x] of [["Left", -0.51], ["Right", 0.51]] as const) {
        const fold = new THREE.Group();
        fold.name = `Fold${side}`;
        fold.position.y = 0.07;
        const face = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.06, 1), sharedMaterial);
        face.name = `HousingFace${side}`;
        face.position.x = x;
        face.position.y = -fold.position.y;
        fold.add(face);
        group.add(fold);
      }
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.9, 16), sharedMaterial);
      hinge.name = "HingeBarrel";
      hinge.rotation.x = Math.PI / 2;
      hinge.position.y = 0.025;
      group.add(hinge);
      scene.add(group);
      continue;
    }
    const material = name.startsWith("Marker_")
      ? new THREE.MeshStandardMaterial({ color: MARKER_CYAN })
      : name.startsWith("Zero_")
        ? new THREE.MeshStandardMaterial({ color: SCALE_AMBER })
        : sharedMaterial;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(2, 0.4, 1), material);
    mesh.name = name.startsWith("Marker_") ? `SliderRim_${name.slice("Marker_".length)}` : `${name}_body`;
    group.add(mesh);
    scene.add(group);
  }
  return { scene };
}

function setBox(element: HTMLElement, box: NativeBox) {
  dimensions.set(element, box);
  for (const [attribute, key] of [["offsetLeft", "left"], ["offsetTop", "top"], ["offsetWidth", "width"], ["offsetHeight", "height"], ["offsetParent", "parent"]] as const) {
    Object.defineProperty(element, attribute, { configurable: true, get: () => dimensions.get(element)![key] });
  }
  element.getBoundingClientRect = () => {
    const current = dimensions.get(element)!;
    let x = current.left; let y = current.top; let parent = current.parent;
    while (parent && dimensions.has(parent)) {
      const parentBox = dimensions.get(parent)!;
      x += parentBox.left; y += parentBox.top; parent = parentBox.parent;
    }
    return new DOMRect(x, y, current.width, current.height);
  };
}

// jsdom does not perform CSS layout. These are measured-layout inputs to the
// renderer, not a substitute outcome computation or a browser screenshot test.
function setNativeLayout() {
  const instrument = screen.getByTestId("human-balance");
  const housing = instrument.querySelector<HTMLElement>(".balance-housing")!;
  const stage = instrument.querySelector<HTMLElement>(".balance-object-stage")!;
  const layer = screen.getByTestId("balance-model-layer");
  const list = instrument.querySelector<HTMLElement>(".balance-list")!;
  setBox(stage, { left: 0, top: 70, width: 704, height: 370, parent: null });
  setBox(housing, { left: 0, top: 0, width: 704, height: 370, parent: stage });
  setBox(layer, { left: -18, top: -18, width: 740, height: 476, parent: housing });
  setBox(housing.querySelector("header")!, { left: 24, top: 24, width: 656, height: 60, parent: housing });
  setBox(instrument.querySelector("footer")!, { left: 24, top: 468, width: 656, height: 50, parent: instrument });
  setBox(list, { left: 24, top: 100, width: 656, height: 240, parent: housing });
  for (const [index, row] of Array.from(list.querySelectorAll<HTMLElement>(".balance-row")).entries()) {
    const track = row.querySelector<HTMLElement>(".balance-track")!;
    setBox(row, { left: 0, top: index * 44, width: 656, height: 44, parent: list });
    setBox(row.querySelector(".balance-label")!, { left: 22, top: 0, width: 126, height: 44, parent: row });
    setBox(track, { left: 180, top: 0, width: 350, height: 31, parent: row });
    setBox(row.querySelector(".balance-groove")!, { left: 0, top: 17, width: 350, height: 8, parent: track });
    setBox(row.querySelector(".balance-zero")!, { left: 175, top: 12, width: 2, height: 18, parent: track });
    setBox(row.querySelector(".balance-marker")!, {
      left: parseFloat(row.style.getPropertyValue("--marker-position")) / 100 * 350,
      top: 21, width: 25, height: 25, parent: track,
    });
  }
  return { instrument, housing, layer, stage };
}

function prepareOriginalBalance({ memory = false } = {}) {
  localStorage.setItem(UI_LOCALE_STORAGE_KEY, "en");
  const repository = new MemoryGameRepository();
  const services = createAppServices(repository);
  // Domain setup for this renderer regression. It is not live human/agent proof.
  let session = services.agentCommands.enterMachineCity().session;
  for (let round = 0; round < (memory ? 4 : 1); round += 1) {
    session = services.agentCommands.presentDilemma(session.sessionId, session.stateRevision).session;
    session = services.playerCommands.selectLens("heart");
    session = services.agentCommands.presentChoiceReflection(session.sessionId, session.tentativeSelection!.selectionId, session.stateRevision).session;
    session = services.playerCommands.acknowledgeReflection(session.presentedReflection!.reflectionId);
    session = services.playerCommands.confirmDecision();
    session = services.agentCommands.revealConfirmedConsequence(session.sessionId, session.confirmedDecision!.decisionId, session.stateRevision).session;
  }
  if (memory) services.agentCommands.presentDilemma(session.sessionId, session.stateRevision);
  const snapshot = services.engine.getSnapshot()!;
  const save = vi.spyOn(repository, "save");
  const commands = [services.agentCommands, services.playerCommands].flatMap((port) =>
    Object.keys(port).map((key) => vi.spyOn(port as unknown as Record<string, (...args: unknown[]) => unknown>, key)),
  );
  const sound = { play: vi.fn(), setMuted: vi.fn(), dispose: vi.fn() };
  const view = render(<App services={services} sound={sound} balanceDepth={BalanceModelLayer} />);
  if (!memory) fireEvent.click(screen.getByRole("button", { name: uiCopy.en.outcome.showBalance }));
  const layout = setNativeLayout();
  const tracks = within(layout.instrument).getAllByRole("img");
  const names = tracks.map((track) => track.getAttribute("aria-label"));
  const button = within(layout.instrument).getByRole("button", { name: memory ? uiCopy.en.balance.restart : uiCopy.en.balance.nextQuestion });
  const assertPresentationOnly = () => {
    expect(services.engine.getSnapshot()).toEqual(snapshot);
    expect(repository.load()).toEqual(snapshot);
    expect(save).not.toHaveBeenCalled();
    commands.forEach((command) => expect(command).not.toHaveBeenCalled());
    expect(within(layout.instrument).getAllByRole("img")).toEqual(tracks);
    expect(tracks.map((track) => track.getAttribute("aria-label"))).toEqual(names);
    expect(tracks).toHaveLength(5);
    expect(within(layout.instrument).getAllByRole("button")).toEqual([button]);
    expect(layout.housing.contains(button)).toBe(false);
    expect(layout.stage.contains(button)).toBe(false);
    expect(button.closest("footer")!.parentElement).toBe(layout.instrument);
    expect(layout.stage.nextElementSibling).toBe(button.closest("footer"));
    for (const axis of AXES) {
      expect(within(layout.instrument).getByRole("img", { name: `${uiCopy.en.balance.axes[axis]}: ${snapshot.balance[axis]}` })).toBeVisible();
    }
    button.focus();
    expect(button).toHaveFocus();
  };
  return { ...layout, view, assertPresentationOnly };
}

async function advanceFrames(count: number) {
  for (let index = 0; index < count; index += 1) {
    await advanceTime(16);
  }
}

async function advanceTime(milliseconds: number) {
  await act(async () => {
    now += milliseconds;
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(now));
  });
}

async function finishLoading(settle = true) {
  await act(async () => { resolveModel(modelFixture()); });
  await advanceFrames(1);
  expect(screen.getByTestId("balance-model-layer")).toHaveAttribute("data-model-status", "ready");
  if (settle) await advanceTime(8000);
}

function fittedGroup(name: string) {
  const imported = lastScene.getObjectByName(name);
  expect(imported, `loaded model part ${name}`).toBeDefined();
  expect(imported!.parent).not.toBeNull();
  return imported!.parent!;
}

describe("successful Blender renderer follows the native balance geometry", () => {
  beforeEach(() => {
    now = 100;
    nextFrame = 0;
    frames = new Map();
    dimensions = new Map();
    reducedMotion = false;
    vi.spyOn(performance, "now").mockImplementation(() => now);
    vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; }));
    vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => frames.delete(id)));
    vi.stubGlobal("ResizeObserver", class { observe = vi.fn(); disconnect = vi.fn(); });
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      get matches() { return reducedMotion; }, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })));
    renderer = {
      domElement: document.createElement("canvas"),
      setPixelRatio: vi.fn(), setClearColor: vi.fn(), setSize: vi.fn(),
      render: vi.fn((scene: THREE.Scene, camera: THREE.Camera) => { lastScene = scene; lastCamera = camera; }),
      dispose: vi.fn(), forceContextLoss: vi.fn(), shadowMap: { enabled: false, type: 0 },
      info: { render: { calls: 18, triangles: 216 } },
    };
    mocked.renderer.mockReset().mockImplementation(function createRenderer() { return renderer; });
    mocked.load.mockReset().mockReturnValue(new Promise<{ scene: THREE.Group }>((resolve) => { resolveModel = resolve; }));
    nativePalette = document.createElement("style");
    nativePalette.textContent = ".balance-marker.negative { border-color: rgb(183, 100, 83); } .balance-marker.positive { border-color: rgb(101, 199, 182); } .balance-marker.neutral { border-color: rgb(242, 238, 229); }";
    document.head.append(nativePalette);
  });

  afterEach(() => {
    cleanup();
    nativePalette.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders five independent markers at HTML-derived positions without changing accessible values or domain state", async () => {
    const app = prepareOriginalBalance();
    app.assertPresentationOnly();
    await finishLoading();
    expect(app.housing).toHaveClass("has-balance-model");
    expect(renderer.domElement).toHaveAttribute("aria-hidden", "true");
    expect(renderer.domElement.parentElement).toBe(app.stage);
    expect(lastScene).toBeInstanceOf(THREE.Scene);
    expect(lastCamera).toBeInstanceOf(THREE.Camera);
    expect(renderer.setSize).toHaveBeenCalledWith(740, 476);
    expect(mocked.load).toHaveBeenCalledExactlyOnceWith("/models/human-balance.glb");

    const nativeMarkers = Array.from(app.instrument.querySelectorAll<HTMLElement>(".balance-marker"));
    const nativeZeros = Array.from(app.instrument.querySelectorAll<HTMLElement>(".balance-zero"));
    const markerMaterials: THREE.Material[] = [];
    const beforePositions = AXES.map((axis, index) => {
      const marker = fittedGroup(`Marker_${axis}`);
      const zero = fittedGroup(`Zero_${axis}`);
      const source = dimensions.get(nativeMarkers[index])!;
      const origin = dimensions.get(nativeZeros[index])!;
      expect(marker.position.x - zero.position.x).toBeCloseTo(source.left - origin.left);
      expect(marker.position.y - zero.position.y).toBeCloseTo(-(source.top - origin.top - origin.height / 2));
      expect([...marker.position, ...marker.scale].every(Number.isFinite)).toBe(true);
      const rim = lastScene.getObjectByName(`SliderRim_${axis}`) as THREE.Mesh;
      markerMaterials.push(rim.material as THREE.Material);
      // Product markers retain their asset's fixed cyan, even when the original
      // HTML carries differing positive/negative/neutral presentation classes.
      expect((rim.material as THREE.MeshStandardMaterial).color.equals(new THREE.Color(MARKER_CYAN))).toBe(true);
      return marker.position.clone();
    });
    expect(new Set(markerMaterials).size).toBe(5);
    expect(new Set(nativeMarkers.map((marker) => getComputedStyle(marker).borderTopColor)).size).toBeGreaterThan(1);

    // Simulate the geometry already produced by native marker animation/layout.
    // No result is recomputed and no new balance value is supplied to the model.
    nativeMarkers.forEach((marker, index) => { dimensions.get(marker)!.left += (index + 1) * 3; });
    fireEvent(window, new Event("resize"));
    await advanceFrames(1);
    AXES.forEach((axis, index) => {
      expect(fittedGroup(`Marker_${axis}`).position.x - beforePositions[index].x).toBeCloseTo((index + 1) * 3);
    });
    app.assertPresentationOnly();
    app.view.unmount();
    expect(frames.size).toBe(0);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
  });

  it("disposes the city print texture shared by both leaf faces exactly once on unmount", async () => {
    const app = prepareOriginalBalance();
    const model = modelFixture();
    const texture = new THREE.Texture();
    const disposeTexture = vi.spyOn(texture, "dispose");
    const faceMaterial = new THREE.MeshStandardMaterial({ map: texture });
    for (const side of ["Left", "Right"]) {
      (model.scene.getObjectByName(`HousingFace${side}`) as THREE.Mesh).material = faceMaterial;
    }
    await act(async () => { resolveModel(model); });
    await advanceFrames(1);
    expect(app.layer).toHaveAttribute("data-model-status", "ready");
    expect(disposeTexture).not.toHaveBeenCalled();
    app.assertPresentationOnly();
    app.view.unmount();
    expect(disposeTexture).toHaveBeenCalledTimes(1);
  });

  it("keeps two rail sections at the physical fold seam without treating the hinge as numeric zero", async () => {
    const app = prepareOriginalBalance();
    await finishLoading();
    const body = fittedGroup("Housing");
    for (const axis of AXES) {
      const left = fittedGroup(`RailLeft_${axis}`);
      const right = fittedGroup(`RailRight_${axis}`);
      const zero = fittedGroup(`Zero_${axis}`);
      // Each fixture's native X extent is 2. The renderer scales these real
      // Three meshes to the measured left/right portions of the HTML rail.
      const leftEdgeAtSeam = left.position.x + left.scale.x;
      const rightEdgeAtSeam = right.position.x - right.scale.x;
      expect(left).not.toBe(right);
      expect(left.scale.x).toBeGreaterThan(0);
      expect(right.scale.x).toBeGreaterThan(0);
      expect(rightEdgeAtSeam).toBeGreaterThan(leftEdgeAtSeam);
      expect(rightEdgeAtSeam - leftEdgeAtSeam).toBeCloseTo(dimensions.get(app.housing)!.width * 0.0036);
      expect((leftEdgeAtSeam + rightEdgeAtSeam) / 2).toBeCloseTo(body.position.x);
      expect(zero.position.x).not.toBeCloseTo(body.position.x);
    }
    app.assertPresentationOnly();
  });

  it("projects five label plaques and five static scale rings per axis while keeping zero centered on the native scale", async () => {
    const app = prepareOriginalBalance();
    await finishLoading();
    const rows = Array.from(app.instrument.querySelectorAll<HTMLElement>(".balance-row"));
    for (const [index, axis] of AXES.entries()) {
      const row = rows[index];
      const label = dimensions.get(row.querySelector<HTMLElement>(".balance-label")!)!;
      const track = dimensions.get(row.querySelector<HTMLElement>(".balance-track")!)!;
      const nativeZero = dimensions.get(row.querySelector<HTMLElement>(".balance-zero")!)!;
      const nativeRail = dimensions.get(row.querySelector<HTMLElement>(".balance-groove")!)!;
      const plaque = fittedGroup(`Label_${axis}`);
      const zero = fittedGroup(`Zero_${axis}`);
      expect(plaque.position.x - zero.position.x).toBeCloseTo(label.left + label.width / 2 - track.left - nativeZero.left);
      expect(plaque.position.y - zero.position.y).toBeCloseTo(-(label.top + label.height / 2 - track.top - nativeZero.top - nativeZero.height / 2));
      expect([...plaque.position, ...plaque.scale].every(Number.isFinite)).toBe(true);

      // The renderer reuses the imported ring meshes: no new result values are
      // stored in these fixed scale divisions or in the label plaque geometry.
      const rings = zero.parent!.children
        .filter((group) => group.children[0]?.name === `Zero_${axis}`)
        .sort((left, right) => left.position.x - right.position.x);
      expect(rings).toHaveLength(5);
      for (const [position, ring] of rings.entries()) {
        expect(ring.position.x - zero.position.x).toBeCloseTo(nativeRail.left + nativeRail.width * position / 4 - nativeZero.left);
        expect(ring.position.y).toBeCloseTo(zero.position.y);
        const mesh = ring.getObjectByName(`Zero_${axis}_body`) as THREE.Mesh;
        const color = (mesh.material as THREE.MeshStandardMaterial).color;
        expect(color.equals(new THREE.Color(position < 2 ? MARKER_CYAN : SCALE_AMBER))).toBe(true);
      }
    }
    // The selected branch's unchanged Freedom axis is exactly at numeric zero.
    expect(fittedGroup("Marker_freedom").position.x).toBeCloseTo(fittedGroup("Zero_freedom").position.x);
    app.assertPresentationOnly();
  });

  it("seats both leaf faces beneath the tracks instead of anchoring the protruding hinge tip", async () => {
    const app = prepareOriginalBalance();
    await finishLoading();
    const housing = fittedGroup("Housing");
    const product = housing.parent!;
    lastScene.updateMatrixWorld(true);
    const worldToProduct = product.matrixWorld.clone().invert();
    const productBounds = (name: string) => {
      const part = lastScene.getObjectByName(name)!;
      expect(part, `loaded physical component ${name}`).toBeDefined();
      const bounds = new THREE.Box3();
      part.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        node.geometry.computeBoundingBox();
        const localToProduct = worldToProduct.clone().multiply(node.matrixWorld);
        bounds.union(node.geometry.boundingBox!.clone().applyMatrix4(localToProduct));
      });
      return bounds;
    };
    // Inspect genuine mesh bounds after fitting, independent of the shared
    // camera/CSS tilt. A taller hinge must not sink the leaf mounting surface.
    const leftFace = productBounds("HousingFaceLeft");
    const rightFace = productBounds("HousingFaceRight");
    const hinge = productBounds("HingeBarrel");
    expect(leftFace.max.z).toBeCloseTo(-2);
    expect(rightFace.max.z).toBeCloseTo(-2);
    expect(hinge.max.z - leftFace.max.z).toBeGreaterThan(10);
    expect(productBounds("Housing").max.z).toBeCloseTo(hinge.max.z);
    for (const axis of AXES) {
      expect(fittedGroup(`RailLeft_${axis}`).position.z - leftFace.max.z).toBeCloseTo(4);
      expect(fittedGroup(`RailRight_${axis}`).position.z - rightFace.max.z).toBeCloseTo(4);
    }
    app.assertPresentationOnly();
  });

  it("can change the shared presentation tilt without moving native values or dispatching game commands", async () => {
    const app = prepareOriginalBalance();
    await finishLoading();
    const groups = AXES.map((axis) => fittedGroup(`Marker_${axis}`));
    const positions = groups.map((group) => group.position.clone());
    const commonProjection = groups[0].parent!;
    expect(groups.every((group) => group.parent === commonProjection)).toBe(true);
    const previousRotation = commonProjection.quaternion.clone();
    const currentAngle = parseFloat(getComputedStyle(app.housing).getPropertyValue("--balance-view-x")) || 0;
    app.housing.style.setProperty("--balance-view-x", `${currentAngle + 3}deg`);
    fireEvent(window, new Event("resize"));
    await advanceFrames(1);
    expect(commonProjection.quaternion.equals(previousRotation)).toBe(false);
    groups.forEach((group, index) => expect(group.position.equals(positions[index])).toBe(true));
    expect(lastCamera.projectionMatrix.elements.every(Number.isFinite)).toBe(true);
    app.assertPresentationOnly();
  });

  it("restores the same native HTML after context loss and can render again without commands or a second GLB load", async () => {
    const app = prepareOriginalBalance();
    await finishLoading();
    const lost = new Event("webglcontextlost", { cancelable: true });
    fireEvent(renderer.domElement, lost);
    expect(lost.defaultPrevented).toBe(true);
    expect(app.layer).toHaveAttribute("data-model-status", "context-lost");
    expect(app.layer).toHaveStyle({ visibility: "hidden" });
    expect(renderer.domElement).toHaveStyle({ visibility: "hidden" });
    expect(app.housing).not.toHaveClass("has-balance-model");
    expect(frames.size).toBe(0);
    app.assertPresentationOnly();
    fireEvent(renderer.domElement, new Event("webglcontextrestored"));
    await advanceFrames(1);
    expect(app.layer).toHaveAttribute("data-model-status", "ready");
    expect(renderer.domElement).toHaveStyle({ visibility: "visible" });
    expect(app.housing).toHaveClass("has-balance-model");
    expect(mocked.load).toHaveBeenCalledTimes(1);
    app.assertPresentationOnly();
  });

  it("unfolds both real leaves with their attached objects once, without restarting on resize", async () => {
    const app = prepareOriginalBalance();
    app.instrument.style.animationDelay = "0ms";
    await finishLoading(false);
    const left = lastScene.getObjectByName("FoldLeft")!;
    const right = lastScene.getObjectByName("FoldRight")!;
    const initialAngle = Number(app.layer.dataset.foldAngle);
    expect(initialAngle).toBeGreaterThan(.1);
    expect(left.rotation.z).toBeCloseTo(-initialAngle);
    expect(right.rotation.z).toBeCloseTo(initialAngle);
    expect(Number(app.stage.style.getPropertyValue("--balance-push"))).toBeLessThan(1);
    const rail = fittedGroup("RailLeft_comfort");
    const initialRailMatrix = rail.matrix.clone();

    await advanceTime(400);
    const midAngle = Number(app.layer.dataset.foldAngle);
    expect(midAngle).toBeGreaterThan(0);
    expect(midAngle).toBeLessThan(initialAngle);
    expect(rail.matrix.equals(initialRailMatrix)).toBe(false);
    fireEvent(window, new Event("resize"));
    await advanceFrames(1);
    expect(Number(app.layer.dataset.foldAngle)).toBeLessThan(midAngle);
    expect(Number(app.layer.dataset.foldProgress)).toBeGreaterThan(.4);

    await advanceTime(900);
    expect(left.rotation.z).toBeCloseTo(0);
    expect(right.rotation.z).toBeCloseTo(0);
    expect(app.layer.dataset.foldProgress).toBe("1");
    expect(app.stage.style.getPropertyValue("--balance-push")).toBe("1");
    expect(app.housing.style.getPropertyValue("--balance-content-opacity")).toBe("1");
    // All independently fitted pieces return to exactly their native flat
    // transforms: repeated fold frames and resize do not accumulate drift.
    for (const name of ["RailLeft_comfort", "RailRight_comfort", "Label_comfort", "Marker_comfort", "Zero_comfort"]) {
      const group = fittedGroup(name);
      const flat = new THREE.Matrix4().compose(group.position, group.quaternion, group.scale);
      group.matrix.elements.forEach((value, index) => expect(value).toBeCloseTo(flat.elements[index], 8));
    }
    await advanceTime(8000);
    expect(frames.size).toBe(0);
    fireEvent(window, new Event("resize"));
    await advanceFrames(1);
    expect(Number(app.layer.dataset.foldAngle)).toBe(0);
    expect(app.stage.style.getPropertyValue("--balance-push")).toBe("1");
    expect(mocked.load).toHaveBeenCalledTimes(1);
    app.assertPresentationOnly();
  });

  it("focuses only moving native axes, keeps unchanged axes quiet and then returns to idle", async () => {
    const app = prepareOriginalBalance();
    await finishLoading(false);
    const rows = Array.from(app.instrument.querySelectorAll<HTMLElement>(".balance-row"));
    expect(rows[0]).toHaveClass("is-changing");
    expect(rows[3]).toHaveClass("is-static");
    expect(rows.every((row) => !row.hasAttribute("data-model-focus"))).toBe(true);

    await advanceTime(3000);
    expect(rows[0]).toHaveAttribute("data-model-focus", "true");
    expect(rows[3]).not.toHaveAttribute("data-model-focus");
    app.assertPresentationOnly();
    await advanceTime(400);
    expect(rows[1]).toHaveAttribute("data-model-focus", "true");
    expect(rows[3]).not.toHaveAttribute("data-model-focus");
    await advanceTime(8000);
    expect(rows.every((row) => !row.hasAttribute("data-model-focus"))).toBe(true);
    expect(frames.size).toBe(0);
    const count = renderer.render.mock.calls.length;
    await advanceFrames(30);
    expect(renderer.render).toHaveBeenCalledTimes(count);
    app.assertPresentationOnly();
  });

  it("uses the native reveal animation clock when a model arrives after the opening already finished", async () => {
    const app = prepareOriginalBalance();
    const nativeReveal = {
      animationName: "balance-emerge-compact", currentTime: 3100,
      effect: { getTiming: () => ({ delay: 1900 }) },
    };
    app.instrument.getAnimations = () => [nativeReveal as unknown as Animation];
    await finishLoading(false);
    // Only 16 ms have passed on the mocked mount clock, but the real animation
    // has already passed 1900 + 900 ms: loading must not re-open the object.
    expect(app.layer.dataset.foldProgress).toBe("1");
    expect(Number(app.layer.dataset.foldAngle)).toBe(0);
    expect(app.stage.style.getPropertyValue("--balance-push")).toBe("1");
    expect(app.housing.style.getPropertyValue("--balance-content-opacity")).toBe("1");
    fireEvent(window, new Event("resize"));
    await advanceFrames(1);
    expect(Number(app.layer.dataset.foldAngle)).toBe(0);
    app.assertPresentationOnly();
  });

  it("renders the native final values in reduced-motion mode and stops requesting idle frames", async () => {
    reducedMotion = true;
    const app = prepareOriginalBalance();
    await finishLoading(false);
    expect(lastScene.getObjectByName("FoldLeft")!.rotation.z).toBeCloseTo(0);
    expect(lastScene.getObjectByName("FoldRight")!.rotation.z).toBeCloseTo(0);
    expect(fittedGroup("Housing").parent!.scale.toArray()).toEqual([1, 1, 1]);
    expect(app.stage.style.getPropertyValue("--balance-push")).toBe("1");
    expect(app.housing.style.getPropertyValue("--balance-content-opacity")).toBe("1");
    await advanceFrames(30);
    expect(renderer.render).toHaveBeenCalled();
    expect(frames.size).toBe(0);
    const renderCount = renderer.render.mock.calls.length;
    await advanceFrames(30);
    expect(renderer.render).toHaveBeenCalledTimes(renderCount);
    expect(app.layer).toHaveAttribute("data-model-status", "ready");
    app.assertPresentationOnly();
  });

  it("keeps the final GAME_COMPLETE memory flat without replaying folding or camera motion", async () => {
    const app = prepareOriginalBalance({ memory: true });
    expect(app.instrument).toHaveClass("is-memory");
    await finishLoading(false);
    const left = lastScene.getObjectByName("FoldLeft")!;
    const right = lastScene.getObjectByName("FoldRight")!;
    const product = fittedGroup("Housing").parent!;
    expect(left.rotation.z).toBeCloseTo(0);
    expect(right.rotation.z).toBeCloseTo(0);
    expect(product.scale.toArray()).toEqual([1, 1, 1]);
    expect(app.stage.style.getPropertyValue("--balance-push")).toBe("1");
    expect(app.housing.style.getPropertyValue("--balance-content-opacity")).toBe("1");
    await advanceTime(450);
    expect(left.rotation.z).toBeCloseTo(0);
    expect(right.rotation.z).toBeCloseTo(0);
    expect(product.scale.toArray()).toEqual([1, 1, 1]);
    expect(app.stage.style.getPropertyValue("--balance-push")).toBe("1");
    await advanceTime(8000);
    expect(frames.size).toBe(0);
    app.assertPresentationOnly();
  });

  it("does not restart idle RAF when the decorative sibling canvas changes its own style", async () => {
    reducedMotion = true;
    const app = prepareOriginalBalance();
    await finishLoading();
    await advanceFrames(30);
    expect(frames.size).toBe(0);
    const renderCount = renderer.render.mock.calls.length;

    // Use the real MutationObserver and prove delivery, not just an absence of
    // frames before the microtask that previously self-scheduled another draw.
    const delivered: MutationRecord[] = [];
    const witness = new MutationObserver((records) => delivered.push(...records));
    witness.observe(app.instrument, { subtree: true, attributes: true, attributeFilter: ["style"] });
    try {
      await act(async () => {
        renderer.domElement.style.visibility = "hidden";
        renderer.domElement.style.visibility = "visible";
        await Promise.resolve();
      });
      expect(delivered.some((record) => record.target === renderer.domElement && record.attributeName === "style")).toBe(true);
      expect(frames.size).toBe(0);
      await advanceFrames(30);
      expect(renderer.render).toHaveBeenCalledTimes(renderCount);
      expect(frames.size).toBe(0);
      app.assertPresentationOnly();
    } finally {
      witness.disconnect();
    }
  });
});
