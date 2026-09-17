/** Review bookmarks in the same Blender clip; not additional journey states. */
type Point = readonly [number, number, number];
export type ProductShot = { pose: number; camera: Point; look: Point; title: string };
export const PRODUCT_SHOTS: Record<string, ProductShot> = {
  closed: { pose: 1, camera: [8,-14,9.3], look: [1,0,3.7], title: "01 · Closed box" },
  opening: { pose: 1.68, camera: [8,-13,13], look: [-1,0,1.4], title: "02 · Lift-off lid" },
  insert: { pose: 2, camera: [3,-7.5,12], look: [0,-1.5,.6], title: "03 · Insert and five markers" },
  folded: { pose: 2, camera: [5,-6,10.5], look: [0,.6,.7], title: "04 · Folded Human Balance" },
  hinge: { pose: 2.64, camera: [-.2,-3,3.8], look: [-.45,-1.224,2.23], title: "05 · The fold" },
  hero: { pose: 3, camera: [1,-9,12], look: [0,-1.65,1.6], title: "06 · Unfolded Human Balance" },
};
export function reviewShot(search: string) {
  const key = new URLSearchParams(search).get("shot");
  return key && Object.hasOwn(PRODUCT_SHOTS,key) ? PRODUCT_SHOTS[key] : undefined;
}
