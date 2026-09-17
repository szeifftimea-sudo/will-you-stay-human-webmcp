import { describe, expect, it, vi } from "vitest";
import { revealClipTime } from "../../src/ui/productReveal/revealSequence";
import { PRODUCT_SHOTS, reviewShot } from "../../src/ui/productReveal/revealShots";
import { AnimationClip, AnimationMixer, Group, LoopOnce, QuaternionKeyframeTrack, Vector3, VectorKeyframeTrack } from "three";
import { createProductBalanceProjection, PRODUCT_BALANCE_AXES, PRODUCT_RAIL_STEP } from "../../src/ui/productReveal/productBalance";

// Check the actual shipped clip, not just the authoring report or a mocked renderer.
const { readFileSync } = await vi.importActual<{readFileSync(path:string):Uint8Array}>("node:fs");
const bytes = readFileSync("public/models/product-reveal-animated.glb");
const binary = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
const jsonLength = binary.getUint32(12,true);
const gltf = JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+jsonLength)));
const binStart = 20+jsonLength+8;
const animation = gltf.animations[0];
function values(index: number): number[][] {
  const a=gltf.accessors[index], view=gltf.bufferViews[a.bufferView];
  const width=({SCALAR:1,VEC3:3,VEC4:4} as Record<string,number>)[a.type];
  expect(a.componentType).toBe(5126);
  return Array.from({length:a.count},(_,i)=>Array.from({length:width},(_,j)=>
    binary.getFloat32(binStart+(view.byteOffset??0)+(a.byteOffset??0)+i*(view.byteStride??width*4)+j*4,true)));
}
function track(name: string, path: string) {
  const c=animation.channels.find((c: {target:{node:number,path:string}})=>
    gltf.nodes[c.target.node].name===name && c.target.path===path);
  expect(c,`${name}.${path} is a real Blender animation channel`).toBeDefined();
  const sampler=animation.samplers[c.sampler];
  return {times:values(sampler.input).flat(),samples:values(sampler.output)};
}

describe("Blender-authored product reveal",()=> {
  it("places real GLB marker groups on the engraved values after the actual shipped clip", () => {
    const nodes = gltf.nodes.map((node: {name: string; translation?: number[]; rotation?: number[]; scale?: number[]}) => {
      const group = new Group(); group.name = node.name;
      if (node.translation) group.position.fromArray(node.translation);
      if (node.rotation) group.quaternion.fromArray(node.rotation);
      if (node.scale) group.scale.fromArray(node.scale);
      return group;
    });
    gltf.nodes.forEach((node: {children?: number[]}, index: number) => node.children?.forEach(child => nodes[index].add(nodes[child])));
    const root = new Group(); gltf.scenes[gltf.scene ?? 0].nodes.forEach((index: number) => root.add(nodes[index]));
    const tracks = animation.channels.map((channel: {target: {node: number; path: string}; sampler: number}) => {
      const sampler = animation.samplers[channel.sampler];
      const property = {translation:"position",rotation:"quaternion",scale:"scale"}[channel.target.path]!;
      const Track = property === "quaternion" ? QuaternionKeyframeTrack : VectorKeyframeTrack;
      return new Track(`${nodes[channel.target.node].name}.${property}`, values(sampler.input).flat(), values(sampler.output).flat());
    });
    const balance = {comfort:1,control:1,connection:-1,freedom:0,responsibility:0};
    const project = createProductBalanceProjection(root, balance);
    const mixer = new AnimationMixer(root);
    const action = mixer.clipAction(new AnimationClip("actual GLB clip", 6, tracks));
    action.setLoop(LoopOnce, 1); action.clampWhenFinished = true; action.play();
    mixer.setTime(6); project(3); root.updateMatrixWorld(true);
    PRODUCT_BALANCE_AXES.forEach(axis => {
      const marker = root.getObjectByName(`ResultOffset_${axis}`)!.getWorldPosition(new Vector3());
      const zero = root.getObjectByName(`Zero_${axis}`)!.getWorldPosition(new Vector3());
      expect(marker.x - zero.x).toBeCloseTo(balance[axis] * PRODUCT_RAIL_STEP, 5);
    });
    const zero = gltf.nodes.find((node: {name: string}) => node.name === "ScaleConvenience0");
    const one = gltf.nodes.find((node: {name: string}) => node.name === "ScaleConvenience+1");
    expect(one.translation[0] - zero.translation[0]).toBeCloseTo(PRODUCT_RAIL_STEP, 5);
  });
  it("exports manufactured packaging details and a textured PBR finish",()=> {
    const names=gltf.nodes.map((n:{name:string})=>n.name);
    for(const name of ["LidWrappedEdge","CoverOuterFoil","CoverInnerFoil","CitySpinePrint","CityTopEndPrint","BaseWrapSeam","LiftingRibbon","FoldedRearCityPrint"]) expect(names).toContain(name);
    for(let i=0;i<5;i++) {
      expect(names).toContain(`MarkerPocketLip_${i}`);
      expect(names).toContain(`MarkerFeltPad_${i}`);
      expect(names).toContain(`MarkerGrip_${i}_0`);
    }
    for(const name of ["Reveal_AnodizedMarker","Reveal_SatinMarkerFace"])
      expect(gltf.materials.some((m:{name:string})=>m.name===name)).toBe(true);
    for(const name of ["Reveal_SoftTouchGraphite","Reveal_MicrofiberInsert","Reveal_WovenRibbon"]) {
      const material=gltf.materials.find((m:{name:string})=>m.name===name);
      expect(material.normalTexture).toBeDefined();
    }
  });
  it("provides six real clip review bookmarks, not gameplay states",()=> {
    expect(Object.keys(PRODUCT_SHOTS)).toHaveLength(6);
    for(const shot of Object.values(PRODUCT_SHOTS)) {
      expect(shot.pose).toBeGreaterThanOrEqual(1);expect(shot.pose).toBeLessThanOrEqual(3);
      expect(shot.camera).not.toEqual(shot.look);
    }
    expect(reviewShot("?product=reveal&shot=hinge")).toBe(PRODUCT_SHOTS.hinge);
    expect(reviewShot("?shot=toString")).toBeUndefined();
    expect(reviewShot("")).toBeUndefined();
  });
  it("ships one six-second clip with actual animated hinges, lid and five markers",()=> {
    expect(gltf.animations).toHaveLength(1);
    expect(animation.name).toBe("ProductReveal");
    for(const name of ["ProductRevealRig","RevealBalance","BoxLid",
      ...["comfort","control","connection","freedom","responsibility"].map(a=>`Marker_${a}`)]) {
      const t=track(name,"translation");
      expect(t.times[0]).toBe(0);expect(t.times.at(-1)).toBeCloseTo(6);
      expect(t.samples[0]).not.toEqual(t.samples.at(-1));
    }
    for(const name of ["FoldLeft","FoldRight"]) {
      const t=track(name,"rotation");
      expect(t.samples[0]).not.toEqual(t.samples.at(-1));
      // Both leaves stay folded while the box opens and the object clears its walls.
      const untilClear=t.times.findIndex(t=>t>=3.2);
      expect(t.samples[untilClear]).toEqual(t.samples[0]);
    }
  });
  it("maps only the existing presentation steps to the clip, including replay boundaries",()=> {
    expect(revealClipTime(0)).toBe(0);expect(revealClipTime(1)).toBe(0);
    expect(revealClipTime(2)).toBe(1.8);expect(revealClipTime(3)).toBe(6);
    expect(revealClipTime(-1)).toBe(0);expect(revealClipTime(4)).toBe(6);
  });
  it("releases the lift-off lid with a restrained tilt and lands it flat",()=> {
    const lid=track("BoxLid","rotation");
    expect(lid.samples.some(s=>Math.abs(s[0])+Math.abs(s[1])+Math.abs(s[2])>.01)).toBe(true);
    lid.samples.at(-1)!.forEach((value,index)=>expect(value).toBeCloseTo(lid.samples[0][index],7));
  });
  it("keeps scale labels and rails parented to their own folding leaf",()=> {
    const descendants=(index:number):string[]=>[gltf.nodes[index].name,
      ...(gltf.nodes[index].children??[]).flatMap(descendants)];
    const left=descendants(gltf.nodes.findIndex((n:{name:string})=>n.name==="FoldLeft"));
    const right=descendants(gltf.nodes.findIndex((n:{name:string})=>n.name==="FoldRight"));
    expect(left).toContain("PrintLeft");expect(right).toContain("PrintRight");
    for(const axis of ["comfort","control","connection","freedom","responsibility"]) {
      expect(left).toContain(`RailLeft_${axis}`);expect(right).toContain(`RailRight_${axis}`);
    }
  });
});
