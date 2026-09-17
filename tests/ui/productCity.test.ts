import { describe, expect, it } from "vitest";
import * as T from "three";
import { createMachineCity } from "../../src/ui/productReveal/machineCity";

describe("presentation-only Machine City",()=> {
  it("builds dimensional architectural relief with batched windows, not a wallpaper",()=> {
    const city=createMachineCity();
    const batches=city.children.filter((o):o is T.InstancedMesh=>o instanceof T.InstancedMesh);
    expect(batches).toHaveLength(4);
    expect(batches[0].count).toBeGreaterThan(150);
    expect(batches[2].count).toBeGreaterThan(1000);
    const bounds=new T.Box3().setFromObject(city).getSize(new T.Vector3());
    expect(bounds.x).toBeGreaterThan(30);
    expect(bounds.y).toBeGreaterThan(50);
    expect(bounds.z).toBeGreaterThan(25);
    for(const batch of batches) expect((batch.material as T.MeshStandardMaterial).map).toBeNull();
    const geometry=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();
    city.traverse(o=>{if(o instanceof T.Mesh){geometry.add(o.geometry);materials.add(o.material);}});
    geometry.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
  });
});
