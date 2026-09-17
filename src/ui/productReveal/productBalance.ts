import { Group, type Object3D } from "three";
import type { HumanBalance } from "../../domain/gameTypes";
import { revealPose } from "./revealSequence";

export const PRODUCT_BALANCE_AXES = ["comfort", "control", "connection", "freedom", "responsibility"] as const;
// Distance between adjacent engraved values in the shipped Blender asset.
export const PRODUCT_RAIL_STEP = 1.35;

/** Offset the marker visuals inside the animated nodes, so the original
 * pocket-to-board choreography and replay remain intact and cannot drift. */
export function createProductBalanceProjection(root: Object3D, balance: HumanBalance | null) {
  const offsets = PRODUCT_BALANCE_AXES.map(axis => {
    const marker = root.getObjectByName(`Marker_${axis}`);
    if (!marker) throw new Error(`Product marker missing: ${axis}`);
    const offset = new Group();
    offset.name = `ResultOffset_${axis}`;
    for (const child of [...marker.children]) offset.add(child);
    marker.add(offset);
    return offset;
  });
  return (position: number) => {
    const seating = revealPose(position).markers;
    offsets.forEach((offset, i) => {
      offset.position.x = (balance?.[PRODUCT_BALANCE_AXES[i]] ?? 0) * PRODUCT_RAIL_STEP * seating[i];
    });
  };
}
