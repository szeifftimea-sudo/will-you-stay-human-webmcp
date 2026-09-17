import { describe, expect, it, vi } from "vitest";
const {readFileSync}=await vi.importActual<{readFileSync(path:string):Uint8Array}>("node:fs");
const bytes=readFileSync("public/models/machine-city-landing-depth.glb");
const jsonLength=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(12,true);
const gltf=JSON.parse(new TextDecoder().decode(bytes.subarray(20,20+jsonLength)));
describe("separate Blender landing asset",()=>{
  it("never overlays the complete journey illustration on the landing city",()=>{
    const css=new TextDecoder().decode(readFileSync("src/ui/landing/landingCity.css"));
    expect(css).toContain('/assets/landing-human-original.png');
    expect(css).not.toContain('/assets/landing-human-cutout.png');
    expect(css).not.toContain('/assets/machine-city-journey.png');
    const png=readFileSync("public/assets/landing-human-original.png");
    expect(png[25]).toBe(6); // PNG RGBA: source pixels with hand-traced alpha only.
  });
  it("ships geometry and materials, not a flat background or a product asset",()=>{
    const names=gltf.nodes.map((n:{name:string})=>n.name);
    expect(names).toContain("City_Graphite");expect(names).toContain("City_DarkGlass");
    expect(names.some((n:string)=>/Visitor/.test(n))).toBe(false);
    expect(names.some((n:string)=>n.includes("Architecture")||n.includes("Line"))).toBe(true);
    expect(names.some((n:string)=>/Balance|Marker|Packaging/.test(n))).toBe(false);
    expect(gltf.images??[]).toHaveLength(0);
    expect(gltf.meshes.length).toBeGreaterThan(10);
    expect(bytes.length).toBeLessThan(6_000_000);
    expect(gltf.materials.map((m:{name:string})=>m.name)).toEqual(expect.arrayContaining(["Cyan","Amber","Graphite"]));
  });
});
