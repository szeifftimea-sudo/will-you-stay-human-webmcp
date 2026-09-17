import { describe, expect, it } from "vitest";
import { AnimationClip, AnimationMixer, Group, LoopOnce, Object3D, VectorKeyframeTrack } from "three";
import { createProductBalanceProjection, PRODUCT_BALANCE_AXES, PRODUCT_RAIL_STEP } from "../../src/ui/productReveal/productBalance";
import { productCameraDistanceScale } from "../../src/ui/productReveal/cityFraming";

describe("physical companion result projection", () => {
  it.each([
    [1, 1, -1, 0, 0], [2, -1, -1, 1, -1], [-1, 1, 1, 0, 2], [-2, 2, -2, 2, -2],
  ])("projects the five persisted values %j without changing the Blender seating animation", (...values) => {
    const root = new Group();
    for (const axis of PRODUCT_BALANCE_AXES) {
      const marker = new Group(); marker.name = `Marker_${axis}`;
      const rim = new Object3D(); rim.name = `rim_${axis}`; rim.position.y = .08;
      marker.add(rim); root.add(marker);
    }
    const balance = Object.fromEntries(PRODUCT_BALANCE_AXES.map((axis, i) => [axis, values[i]])) as Record<typeof PRODUCT_BALANCE_AXES[number], number>;
    const original = JSON.stringify(balance);
    const project = createProductBalanceProjection(root, balance);
    const mixer = new AnimationMixer(root);
    const clip = new AnimationClip("seating", 6, PRODUCT_BALANCE_AXES.map(axis =>
      new VectorKeyframeTrack(`Marker_${axis}.position`, [0, 6], [-1.8, .43, 2.56, .25, 1.7, 0])));
    const action = mixer.clipAction(clip); action.setLoop(LoopOnce, 1); action.clampWhenFinished = true; action.play();
    for (const position of [3, 3, 0, 2, 3, 3]) {
      action.paused = false; mixer.setTime(position === 3 ? 6 : 0); project(position);
      root.updateMatrixWorld(true);
      PRODUCT_BALANCE_AXES.forEach((axis, i) => {
        const marker = root.getObjectByName(`Marker_${axis}`)!;
        const offset = root.getObjectByName(`ResultOffset_${axis}`)!;
        expect(marker.position.x).toBeCloseTo(position === 3 ? .25 : -1.8);
        expect(offset.position.x).toBeCloseTo(position === 3 ? values[i] * PRODUCT_RAIL_STEP : 0);
        expect(root.getObjectByName(`rim_${axis}`)!.position.y).toBe(.08);
      });
    }
    expect(JSON.stringify(balance)).toBe(original);
  });
  it("keeps neutral markers when there is no game", () => {
    const root = new Group();
    PRODUCT_BALANCE_AXES.forEach(axis => { const marker = new Group(); marker.name = `Marker_${axis}`; root.add(marker); });
    createProductBalanceProjection(root, null)(3);
    PRODUCT_BALANCE_AXES.forEach(axis => expect(root.getObjectByName(`ResultOffset_${axis}`)!.position.x).toBe(0));
  });
});

describe("city and product framing", () => {
  it.each([319 / 905, 390 / 844, 790 / 512, 1920 / 1080])("keeps the intro city inside the camera frustum at aspect %s", aspect => {
    expect(productCameraDistanceScale(aspect, 0)).toBe(1);
    expect(productCameraDistanceScale(aspect, 1)).toBeCloseTo(Math.max(1, 1.55 / aspect));
    expect(productCameraDistanceScale(aspect, .4)).toBeLessThanOrEqual(productCameraDistanceScale(aspect, 1));
  });
});
