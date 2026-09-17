import { describe, expect, it, vi } from "vitest";
import { Matrix4, Quaternion, Vector3 } from "three";

type AssetNode = {
  name: string;
  children?: number[];
  mesh?: number;
  translation?: number[];
  rotation?: number[];
  scale?: number[];
  matrix?: number[];
};
type Accessor = {
  bufferView: number;
  byteOffset?: number;
  componentType: number;
  count: number;
  type: string;
  min?: number[];
  max?: number[];
  sparse?: unknown;
};
type Primitive = { attributes: Record<string, number>; indices?: number; mode?: number; material?: number };
type TextureInfo = { index: number; texCoord?: number };
type Material = {
  name: string;
  pbrMetallicRoughness?: {
    baseColorFactor?: number[];
    baseColorTexture?: TextureInfo;
    metallicRoughnessTexture?: TextureInfo;
  };
  normalTexture?: TextureInfo;
  occlusionTexture?: TextureInfo;
  emissiveTexture?: TextureInfo;
};
type Gltf = {
  asset: { version: string; generator: string };
  scene: number;
  scenes: { nodes: number[] }[];
  nodes: AssetNode[];
  meshes: { name?: string; primitives: Primitive[] }[];
  materials: Material[];
  accessors: Accessor[];
  bufferViews: { buffer: number; byteLength: number; byteOffset?: number; byteStride?: number }[];
  buffers: { byteLength: number; uri?: string }[];
  extensionsRequired?: string[];
  animations?: unknown[];
  cameras?: unknown[];
  textures?: { source: number; sampler?: number }[];
  images?: { name?: string; bufferView: number; mimeType: string }[];
  samplers?: { magFilter?: number; minFilter?: number; wrapS?: number; wrapT?: number }[];
  skins?: unknown[];
};

// Vitest runs on Node, but the frontend project intentionally has no Node ambient
// types. Describe just this read-only runtime boundary instead of adding a dependency.
const { readFileSync } = await vi.importActual<{ readFileSync(path: string): Uint8Array }>("node:fs");
const { resolve } = await vi.importActual<{ resolve(...paths: string[]): string }>("node:path");
// Read the shipped binary, not a mocked loader response or a hand-written manifest.
const file = readFileSync(resolve("public/models/human-balance.glb"));
const header = new DataView(file.buffer, file.byteOffset, file.byteLength);
const jsonLength = header.getUint32(12, true);
const gltf = JSON.parse(new TextDecoder().decode(file.subarray(20, 20 + jsonLength))) as Gltf;
const binaryHeaderOffset = 20 + jsonLength;
const binaryLength = header.getUint32(binaryHeaderOffset, true);
const binaryOffset = binaryHeaderOffset + 8;
const binary = new DataView(file.buffer, file.byteOffset + binaryOffset, binaryLength);
const AXES = ["comfort", "control", "connection", "freedom", "responsibility"] as const;
const ROWS = [1.15, 0.575, 0, -0.575, -1.15];
const SEMANTIC_NAMES = ["HumanBalance", "Housing", ...AXES.flatMap((axis) => [
  `Rail_${axis}`, `Marker_${axis}`, `Zero_${axis}`, `Label_${axis}`,
])];
const COMPONENT_BYTES: Record<number, number> = { 5121: 1, 5123: 2, 5125: 4, 5126: 4 };
const TYPE_COMPONENTS: Record<string, number> = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

function node(name: string) {
  const matching = gltf.nodes.filter((candidate) => candidate.name === name);
  expect(matching, `one semantic node named ${name}`).toHaveLength(1);
  return matching[0];
}

function descendants(index: number): number[] {
  return [index, ...(gltf.nodes[index].children ?? []).flatMap(descendants)];
}

function accessorValues(accessor: Accessor): number[] {
  const view = gltf.bufferViews[accessor.bufferView];
  const size = COMPONENT_BYTES[accessor.componentType];
  const components = TYPE_COMPONENTS[accessor.type];
  const stride = view.byteStride ?? size * components;
  const start = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const result: number[] = [];
  for (let element = 0; element < accessor.count; element += 1) {
    for (let component = 0; component < components; component += 1) {
      const offset = start + element * stride + component * size;
      switch (accessor.componentType) {
        case 5121: result.push(binary.getUint8(offset)); break;
        case 5123: result.push(binary.getUint16(offset, true)); break;
        case 5125: result.push(binary.getUint32(offset, true)); break;
        case 5126: result.push(binary.getFloat32(offset, true)); break;
        default: throw new Error(`Unsupported asset component type: ${accessor.componentType}`);
      }
    }
  }
  return result;
}

function expectNoExternalPayload(value: unknown) {
  if (Array.isArray(value)) {
    value.forEach(expectNoExternalPayload);
  } else if (value !== null && typeof value === "object") {
    // No external resources, executable payload or custom game-state metadata.
    expect(Object.keys(value)).not.toContain("uri");
    expect(Object.keys(value)).not.toContain("extras");
    Object.values(value).forEach(expectNoExternalPayload);
  } else if (typeof value === "number") {
    expect(Number.isFinite(value)).toBe(true);
  }
}

function worldMatrix(current: AssetNode): Matrix4 {
  const local = current.matrix
    ? new Matrix4().fromArray(current.matrix)
    : new Matrix4().compose(
      new Vector3().fromArray(current.translation ?? [0, 0, 0]),
      new Quaternion().fromArray(current.rotation ?? [0, 0, 0, 1]),
      new Vector3().fromArray(current.scale ?? [1, 1, 1]),
    );
  const parent = gltf.nodes.find((candidate) => candidate.children?.includes(gltf.nodes.indexOf(current)));
  return parent ? worldMatrix(parent).multiply(local) : local;
}

function meshBounds(current: AssetNode) {
  expect(current.mesh).toBeDefined();
  const positions = gltf.meshes[current.mesh!].primitives
    .flatMap((primitive) => accessorValues(gltf.accessors[primitive.attributes.POSITION]));
  const minimum = [Infinity, Infinity, Infinity];
  const maximum = [-Infinity, -Infinity, -Infinity];
  const transform = worldMatrix(current);
  for (let index = 0; index < positions.length; index += 3) {
    const point = new Vector3().fromArray(positions, index).applyMatrix4(transform).toArray();
    point.forEach((value, axis) => {
      minimum[axis] = Math.min(minimum[axis], value);
      maximum[axis] = Math.max(maximum[axis], value);
    });
  }
  return { minimum, maximum, size: maximum.map((value, axis) => value - minimum[axis]) };
}

function groupBounds(current: AssetNode) {
  const meshes = descendants(gltf.nodes.indexOf(current))
    .map((index) => gltf.nodes[index]).filter((child) => child.mesh !== undefined);
  expect(meshes.length).toBeGreaterThan(0);
  const bounds = meshes.map(meshBounds);
  const minimum = [0, 1, 2].map((axis) => Math.min(...bounds.map((bound) => bound.minimum[axis])));
  const maximum = [0, 1, 2].map((axis) => Math.max(...bounds.map((bound) => bound.maximum[axis])));
  return { minimum, maximum, size: maximum.map((value, axis) => value - minimum[axis]) };
}

function materialNames(current: AssetNode) {
  expect(current.mesh).toBeDefined();
  return gltf.meshes[current.mesh!].primitives.map((primitive) => {
    expect(primitive.material).toBeDefined();
    return gltf.materials[primitive.material!].name;
  });
}

type Point2 = [number, number];

// Clip an actual decoration triangle to the protected readable face rectangle.
// Vertex-only checks would miss a diagonal triangle spanning two safe edge bands.
function readableFaceOverlap(triangle: Point2[]) {
  let polygon = triangle;
  const edges = [
    { axis: 0, limit: -4.55, sign: 1 },
    { axis: 0, limit: 4.55, sign: -1 },
    { axis: 1, limit: -1.84, sign: 1 },
    { axis: 1, limit: 1.84, sign: -1 },
  ];
  for (const { axis, limit, sign } of edges) {
    const clipped: Point2[] = [];
    for (let index = 0; index < polygon.length; index += 1) {
      const previous = polygon[(index + polygon.length - 1) % polygon.length];
      const current = polygon[index];
      const previousDistance = (previous[axis] - limit) * sign;
      const currentDistance = (current[axis] - limit) * sign;
      if ((previousDistance >= 0) !== (currentDistance >= 0)) {
        const fraction = previousDistance / (previousDistance - currentDistance);
        clipped.push([
          previous[0] + (current[0] - previous[0]) * fraction,
          previous[1] + (current[1] - previous[1]) * fraction,
        ]);
      }
      if (currentDistance >= 0) clipped.push(current);
    }
    polygon = clipped;
  }
  return Math.abs(polygon.reduce((area, point, index) => {
    const next = polygon[(index + 1) % polygon.length];
    return area + point[0] * next[1] - next[0] * point[1];
  }, 0)) / 2;
}

// A depth-parallel ray hits a triangle precisely when its XZ projection covers
// the point. Edge-on triangles are ignored. This distinguishes a real opening
// from a dark decal or a solid plate merely named "Keyhole".
function rayHitsPlate(current: AssetNode, x: number, z: number) {
  return gltf.meshes[current.mesh!].primitives.some((primitive) => {
    const position = gltf.accessors[primitive.attributes.POSITION];
    const vertices = accessorValues(position);
    const indices = primitive.indices === undefined
      ? Array.from({ length: position.count }, (_, index) => index)
      : accessorValues(gltf.accessors[primitive.indices]);
    for (let triangle = 0; triangle < indices.length; triangle += 3) {
      const [a, b, c] = indices.slice(triangle, triangle + 3).map((index) => index * 3);
      const ax = vertices[a]; const az = vertices[a + 2];
      const bx = vertices[b]; const bz = vertices[b + 2];
      const cx = vertices[c]; const cz = vertices[c + 2];
      const determinant = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
      if (Math.abs(determinant) < 1e-9) continue;
      const u = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / determinant;
      const v = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / determinant;
      if (u >= -1e-7 && v >= -1e-7 && u + v <= 1 + 1e-7) return true;
    }
    return false;
  });
}

describe("shipped Blender Human Balance asset contract", () => {
  it("is a bounded, self-contained GLB 2.0 authored by the Blender exporter", () => {
    expect(header.getUint32(0, true)).toBe(0x46546c67);
    expect(header.getUint32(4, true)).toBe(2);
    expect(header.getUint32(8, true)).toBe(file.length);
    expect(header.getUint32(16, true)).toBe(0x4e4f534a);
    expect(header.getUint32(binaryHeaderOffset + 4, true)).toBe(0x004e4942);
    expect(binaryOffset + binaryLength).toBe(file.length);
    expect(jsonLength % 4).toBe(0);
    expect(binaryLength % 4).toBe(0);
    expect(file.length).toBeLessThanOrEqual(1_200_000);
    expect(gltf.asset.version).toBe("2.0");
    expect(gltf.asset.generator).toContain("Blender");
    expect(gltf.buffers).toHaveLength(1);
    expect(gltf.buffers[0].byteLength).toBeLessThanOrEqual(binaryLength);
    expect(binaryLength - gltf.buffers[0].byteLength).toBeLessThan(4);
    expect(gltf.extensionsRequired ?? []).toEqual([]);
  });

  it("exports static presentation resources, never studio helpers, external resources or game metadata", () => {
    expect(Object.keys(gltf).sort()).toEqual([
      "accessors", "asset", "bufferViews", "buffers", "images", "materials", "meshes", "nodes", "samplers", "scene", "scenes", "textures",
    ]);
    for (const key of ["animations", "cameras", "skins"] as const) {
      expect(gltf[key]).toBeUndefined();
    }
    expect(gltf.nodes.some(({ name }) => /Presentation|NOT_EXPORTED|SOURCE_ONLY|Cutter|Manufacturing|Text|Font/i.test(name))).toBe(false);
    expect(gltf.meshes.some(({ name }) => /SOURCE_ONLY|Cutter|Manufacturing/i.test(name ?? ""))).toBe(false);
    expectNoExternalPayload(gltf);
  });

  it("embeds one bounded PNG used only as the shared housing-face base-color print", () => {
    expect(gltf.images).toHaveLength(1);
    expect(gltf.textures).toHaveLength(1);
    expect(gltf.samplers).toHaveLength(1);
    const image = gltf.images![0];
    const texture = gltf.textures![0];
    expect(image.mimeType).toBe("image/png");
    expect(Number.isInteger(image.bufferView)).toBe(true);
    const view = gltf.bufferViews[image.bufferView];
    expect(view.buffer).toBe(0);
    expect(view.byteLength).toBeGreaterThan(100);
    const imageStart = binaryOffset + (view.byteOffset ?? 0);
    const pngBytes = file.subarray(imageStart, imageStart + view.byteLength);
    expect(pngBytes).toHaveLength(view.byteLength);
    expect(Array.from(pngBytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    const png = new DataView(pngBytes.buffer, pngBytes.byteOffset, pngBytes.byteLength);
    expect(png.getUint32(8)).toBe(13);
    expect(new TextDecoder().decode(pngBytes.subarray(12, 16))).toBe("IHDR");
    expect(png.getUint32(16)).toBeGreaterThan(0);
    expect(png.getUint32(20)).toBeGreaterThan(0);
    expect(png.getUint32(16) * png.getUint32(20)).toBeLessThanOrEqual(2048 * 2048);
    expect(Array.from(pngBytes.subarray(-12))).toEqual([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
    // The new embedded print does not relax the pre-existing geometry-size budget.
    expect(file.length - view.byteLength).toBeLessThan(600_000);
    expect(texture.source).toBe(0);
    expect(texture.sampler).toBe(0);
    const printed = gltf.materials.filter((material) => material.pbrMetallicRoughness?.baseColorTexture);
    expect(printed).toHaveLength(1);
    expect(printed[0].name).toBe("Face_CityPrint");
    expect(printed[0].pbrMetallicRoughness!.baseColorTexture!.index).toBe(0);
    expect(printed[0].pbrMetallicRoughness!.baseColorTexture!.texCoord ?? 0).toBe(0);
    for (const material of gltf.materials) {
      expect(material.pbrMetallicRoughness?.metallicRoughnessTexture).toBeUndefined();
      expect(material.normalTexture).toBeUndefined();
      expect(material.occlusionTexture).toBeUndefined();
      expect(material.emissiveTexture).toBeUndefined();
    }
    const materialIndex = gltf.materials.indexOf(printed[0]);
    const owners = gltf.nodes.filter((current) => current.mesh !== undefined
      && gltf.meshes[current.mesh].primitives.some((primitive) => primitive.material === materialIndex));
    expect(owners.map(({ name }) => name).sort()).toEqual(["HousingFaceLeft", "HousingFaceRight"]);
    for (const face of owners) {
      const transform = worldMatrix(face);
      for (const primitive of gltf.meshes[face.mesh!].primitives) {
        expect(primitive.material).toBe(materialIndex);
        expect(primitive.attributes.TEXCOORD_0).toBeDefined();
        const position = gltf.accessors[primitive.attributes.POSITION];
        const uv = gltf.accessors[primitive.attributes.TEXCOORD_0];
        expect(uv.type).toBe("VEC2");
        expect(uv.componentType).toBe(5126);
        expect(uv.count).toBe(position.count);
        const positions = accessorValues(position);
        const coordinates = accessorValues(uv);
        for (let index = 0; index < position.count; index += 1) {
          const point = new Vector3().fromArray(positions, index * 3).applyMatrix4(transform);
          const u = coordinates[index * 2];
          const v = coordinates[index * 2 + 1];
          expect(u).toBeGreaterThanOrEqual(0);
          expect(u).toBeLessThanOrEqual(1);
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(1);
          expect(u).toBeCloseTo((point.x + 5) / 10, 5);
          expect(v).toBeCloseTo((point.z + 2.25) / 4.5, 5);
          expect(face.name === "HousingFaceLeft" ? u : 1 - u).toBeLessThan(0.5);
        }
      }
    }
  });

  it("exposes the root plus 21 unique, separate presentation semantic groups", () => {
    const root = node("HumanBalance");
    expect(gltf.scenes).toHaveLength(1);
    expect(gltf.scenes[gltf.scene].nodes).toEqual([gltf.nodes.indexOf(root)]);
    expect(root.children).toHaveLength(21);
    const children = root.children!.map((index) => gltf.nodes[index].name).sort();
    expect(children).toEqual(SEMANTIC_NAMES.filter((name) => name !== "HumanBalance").sort());
    for (const name of SEMANTIC_NAMES) {
      const semantic = node(name);
      expect(semantic.mesh).toBeUndefined();
      expect(semantic.children!.length).toBeGreaterThan(0);
    }
    // Every exported node belongs to exactly one branch of this one instrument.
    const reachable = descendants(gltf.nodes.indexOf(root));
    expect(reachable).toHaveLength(gltf.nodes.length);
    expect(new Set(reachable).size).toBe(gltf.nodes.length);
  });

  it("contains two thin shell assemblies separated by a real central fold gap", () => {
    const housing = node("Housing");
    expect(gltf.nodes.some(({ name }) => name === "HousingBody")).toBe(false);
    for (const side of ["Left", "Right"]) {
      const half = node(`Fold${side}`);
      expect(housing.children).toContain(gltf.nodes.indexOf(half));
      expect(half.mesh).toBeUndefined();
      const pivot = new Vector3().setFromMatrixPosition(worldMatrix(half));
      expect(pivot.x).toBeCloseTo(0, 6);
      expect(pivot.y).toBeCloseTo(0.17, 6); // Blender hinge Z becomes glTF Y.
      expect(pivot.z).toBeCloseTo(0, 6);
      const body = node(`HousingBody${side}`);
      const backplate = node(`HousingBackplate${side}`);
      const bezel = node(`HousingFrontBezel${side}`);
      const face = node(`HousingFace${side}`);
      for (const part of [body, backplate, bezel, face]) {
        expect(half.children).toContain(gltf.nodes.indexOf(part));
        expect(part.mesh).toBeDefined();
      }
      // Actual transformed binary vertices, not an authoring report or node name.
      const bodyBounds = meshBounds(body);
      expect(bodyBounds.size[0]).toBeCloseTo(4.982, 5);
      expect(bodyBounds.size[2]).toBeCloseTo(4.5, 5);
      expect(bodyBounds.size[1]).toBeCloseTo(0.32, 5);
      expect(bodyBounds.maximum[1]).toBeCloseTo(0.07, 5);
      expect(bodyBounds.minimum[1]).toBeCloseTo(-0.25, 5);
      const faceBounds = meshBounds(face);
      const rearBounds = meshBounds(backplate);
      expect(rearBounds.maximum[1]).toBeLessThan(bodyBounds.minimum[1]);
      expect(rearBounds.size[1]).toBeCloseTo(0.020, 5);
      expect(faceBounds.maximum[1]).toBeCloseTo(0.092, 5);
      expect(faceBounds.maximum[1] - rearBounds.minimum[1]).toBeCloseTo(0.363, 5);
      // The broad product silhouette must not regress into the old thick case.
      expect(groupBounds(half).size[1]).toBeLessThan(0.50);
      expect(gltf.nodes.some(({ name }) => name === `HousingAssemblySeal${side}`
        || name === `HousingRecess${side}`)).toBe(false);
    }
    const left = meshBounds(node("HousingBodyLeft"));
    const right = meshBounds(node("HousingBodyRight"));
    expect(left.maximum[0]).toBeCloseTo(-0.018, 5);
    expect(right.minimum[0]).toBeCloseTo(0.018, 5);
    expect(right.minimum[0] - left.maximum[0]).toBeCloseTo(0.036, 5);
    expect(right.maximum[0] - left.minimum[0]).toBeCloseTo(10, 5);
  });

  it("places the entire rigid title plaque on one leaf, clear of the folding axis", () => {
    const left = node("FoldLeft");
    for (const name of ["TitlePlaqueLeft", "TitlePlaqueRimLeft", "TitlePlaqueInlayLeft"]) {
      const plaque = node(name);
      expect(left.children).toContain(gltf.nodes.indexOf(plaque));
      expect(meshBounds(plaque).maximum[0]).toBeLessThan(-0.4);
      expect(meshBounds(plaque).minimum[0]).toBeGreaterThan(-4.6);
    }
    // Applied bevels trim the pointed ends slightly from the nominal 4.07.
    expect(meshBounds(node("TitlePlaqueLeft")).size[0]).toBeGreaterThan(4.05);
    expect(meshBounds(node("TitlePlaqueLeft")).size[0]).toBeLessThanOrEqual(4.07);
    expect(gltf.nodes.some(({ name }) => name === "TitlePlaqueRight")).toBe(false);
  });

  it.each([2.12, 0.2875, -2.12])("constructs a small pinned, interleaved central hinge at Blender Y=%s", (row) => {
    const index = [2.12, 0.2875, -2.12].indexOf(row);
    const housing = node("Housing");
    const pin = node(`HingePin_${index}`);
    expect(housing.children).toContain(gltf.nodes.indexOf(pin));
    const pinBounds = meshBounds(pin);
    expect((pinBounds.minimum[0] + pinBounds.maximum[0]) / 2).toBeCloseTo(0, 5);
    expect((pinBounds.minimum[1] + pinBounds.maximum[1]) / 2).toBeCloseTo(0.17, 5);
    expect((pinBounds.minimum[2] + pinBounds.maximum[2]) / 2).toBeCloseTo(-row, 5);
    expect(pinBounds.size[2]).toBeCloseTo(0.116, 5);
    expect(rayHitsPlate(pin, 0, 0), "the hinge pin has a solid cross-section").toBe(true);
    for (const side of ["Left", "Right"]) {
      const half = node(`Fold${side}`);
      const leaf = node(`HingeLeaf${side}_${index}`);
      expect(half.children).toContain(gltf.nodes.indexOf(leaf));
      const leafBounds = meshBounds(leaf);
      expect(leafBounds.size[0]).toBeCloseTo(0.110, 5);
      expect(leafBounds.size[1]).toBeCloseTo(0.012, 5);
      expect(leafBounds.size[2]).toBeCloseTo(0.108, 5);
    }
    const knuckles = ["LeftA", "Right", "LeftB"].map((part) => {
      const knuckle = node(`HingeKnuckle${part}_${index}`);
      const half = node(part.startsWith("Left") ? "FoldLeft" : "FoldRight");
      expect(half.children).toContain(gltf.nodes.indexOf(knuckle));
      const bounds = meshBounds(knuckle);
      expect(bounds.size[0]).toBeGreaterThan(pinBounds.size[0]);
      expect(bounds.size[1]).toBeGreaterThan(pinBounds.size[1]);
      expect(bounds.size[0]).toBeLessThan(0.06);
      expect(bounds.size[1]).toBeLessThan(0.06);
      expect(rayHitsPlate(knuckle, 0, 0), "a real central bore admits the hinge pin").toBe(false);
      expect(rayHitsPlate(knuckle, 0.019, 0), "metal surrounds the knuckle bore").toBe(true);
      return bounds;
    }).sort((a, b) => a.minimum[2] - b.minimum[2]);
    expect(knuckles[0].maximum[2]).toBeLessThan(knuckles[1].minimum[2]);
    expect(knuckles[1].maximum[2]).toBeLessThan(knuckles[2].minimum[2]);
  });

  it.each([0, 1])("exports rear fixing plate %s as real geometry with an open keyhole, not a source-only cutter", (index) => {
    const plate = node(`RearKeyholePlate_${index}`);
    expect(node(index === 0 ? "FoldLeft" : "FoldRight").children).toContain(gltf.nodes.indexOf(plate));
    expect(plate.mesh).toBeDefined();
    const center = new Vector3().setFromMatrixPosition(worldMatrix(plate));
    expect(center.x).toBeCloseTo(index === 0 ? -3.6 : 3.6, 5);
    expect(center.y).toBeCloseTo(-0.277, 5);
    expect(center.z).toBeCloseTo(-1.65, 5);
    expect(meshBounds(plate).size[1]).toBeCloseTo(0.012, 5);
    expect(rayHitsPlate(plate, 0, 0.036), "screw-head opening remains physically open").toBe(false);
    expect(rayHitsPlate(plate, 0, -0.07), "narrow hanging slot remains physically open").toBe(false);
    expect(rayHitsPlate(plate, 0.12, 0), "surrounding metal plate remains present").toBe(true);
  });

  it.each(AXES)("keeps %s rail, zero index and movable marker independent at the neutral position", (axis) => {
    const rowZ = -ROWS[AXES.indexOf(axis)]; // Blender +Y exports as glTF -Z.
    const rail = node(`Rail_${axis}`);
    const zero = node(`Zero_${axis}`);
    const marker = node(`Marker_${axis}`);
    for (const semantic of [rail, zero, marker]) {
      expect(semantic.translation![0]).toBeCloseTo(0.25, 6);
      expect(semantic.translation![2]).toBeCloseTo(rowZ, 6);
      expect(semantic.rotation).toBeUndefined();
      expect(semantic.scale).toBeUndefined();
      expect(semantic.matrix).toBeUndefined();
    }
    expect(rail.translation![1]).toBe(0);
    expect(zero.translation![1]).toBe(0);
    expect(marker.translation![1]).toBeCloseTo(0.100, 6);
    expect(zero.children).toHaveLength(1);
    expect(gltf.nodes[zero.children![0]].name).toBe(`ZeroIndex_${axis}`);
    const zeroRing = node(`ZeroIndex_${axis}`);
    expect(rayHitsPlate(zeroRing, 0, 0), "the zero is a physical open ring, not a solid bar").toBe(false);
    expect(rayHitsPlate(zeroRing, 0.072, 0)).toBe(true);
    expect(materialNames(zeroRing)).toEqual(["Zero_Ivory"]);
    const markerNames = marker.children!.map((index) => gltf.nodes[index].name);
    expect(markerNames).toContain(`SliderRim_${axis}`);
    expect(markerNames).toContain(`SliderBody_${axis}`);
    expect(markerNames).not.toContain(`SliderGrip_${axis}`);
    expect(marker.children).toHaveLength(4);
    expect(marker.children!.every((index) => gltf.nodes[index].mesh !== undefined)).toBe(true);
    expect(groupBounds(marker).size[1]).toBeLessThan(0.04);
    expect(materialNames(node(`SliderBody_${axis}`))).toEqual(["Presence_Cyan"]);
    expect(materialNames(node(`SliderFace_${axis}`))).toEqual(["Presence_Cyan"]);
    expect(materialNames(node(`SliderRim_${axis}`))).toEqual(["RetainedMark_Amber"]);
    expect(new Set([...rail.children!, ...zero.children!, ...marker.children!]).size)
      .toBe(rail.children!.length + zero.children!.length + marker.children!.length);
    const left = node(`RailLeft_${axis}`);
    const right = node(`RailRight_${axis}`);
    expect(rail.children).toHaveLength(2);
    expect(rail.children).toContain(gltf.nodes.indexOf(left));
    expect(rail.children).toContain(gltf.nodes.indexOf(right));
    const leftBounds = groupBounds(left);
    const rightBounds = groupBounds(right);
    expect(leftBounds.minimum[0]).toBeCloseTo(-2.5, 5);
    expect(leftBounds.maximum[0]).toBeCloseTo(-0.04, 5);
    expect(rightBounds.minimum[0]).toBeCloseTo(0.04, 5);
    expect(rightBounds.maximum[0]).toBeCloseTo(3, 5);
    expect(rightBounds.minimum[0] - leftBounds.maximum[0]).toBeCloseTo(0.08, 5);
    expect(left.children).toHaveLength(6);
    expect(right.children).toHaveLength(6);
    expect(materialNames(node(`TrackInlayLeft_${axis}`))).toEqual(["Presence_Cyan"]);
    expect(materialNames(node(`TrackInlayRight_${axis}`))).toEqual(["RetainedMark_Amber"]);
  });

  it.each(AXES)("gives %s a separate shallow hexagonal label plaque without baked text", (axis) => {
    const rowZ = -ROWS[AXES.indexOf(axis)];
    const label = node(`Label_${axis}`);
    expect(label.translation![0]).toBeCloseTo(-3.65, 6);
    expect(label.translation![1]).toBeCloseTo(0, 6);
    expect(label.translation![2]).toBeCloseTo(rowZ, 6);
    expect(label.children).toHaveLength(4);
    expect(label.children!.map((index) => gltf.nodes[index].name).sort()).toEqual([
      `LabelRim_${axis}`, `LabelFace_${axis}`, `LabelDotLeft_${axis}`, `LabelDotRight_${axis}`,
    ].sort());
    const rim = node(`LabelRim_${axis}`);
    const bounds = meshBounds(rim);
    expect(bounds.size[0]).toBeGreaterThan(1.74);
    expect(bounds.size[0]).toBeLessThanOrEqual(1.76);
    expect(bounds.size[1]).toBeCloseTo(0.016, 5);
    expect(bounds.size[2]).toBeCloseTo(0.325, 5);
    expect(rayHitsPlate(rim, 0, 0), "the central label support is solid").toBe(true);
    expect(rayHitsPlate(rim, 0.85, 0.15), "the clipped corner is not a rectangular UI tile").toBe(false);
  });

  it.each(["Left", "Right"])("keeps the batched %s perimeter decoration on its own fold-safe edge bands", (side) => {
    expect(readableFaceOverlap([[-1, -1], [1, -1], [0, 1]])).toBeCloseTo(2, 6);
    expect(readableFaceOverlap([[-4.6, 0], [0, 2], [0, 2.1]])).toBeGreaterThan(0);
    const detail = node(`PerimeterDetail${side}`);
    expect(node(`Fold${side}`).children).toContain(gltf.nodes.indexOf(detail));
    expect(detail.mesh).toBeDefined();
    expect(detail.children ?? []).toEqual([]);
    const primitives = gltf.meshes[detail.mesh!].primitives;
    expect(primitives).toHaveLength(1); // One material/draw primitive per side, not many loose ornaments.
    expect(materialNames(detail)).toEqual([side === "Left" ? "Presence_Cyan" : "RetainedMark_Amber"]);
    const transform = worldMatrix(detail);
    const primitive = primitives[0];
    const position = gltf.accessors[primitive.attributes.POSITION];
    const coordinates = accessorValues(position);
    const vertices = Array.from({ length: position.count }, (_, index) =>
      new Vector3().fromArray(coordinates, index * 3).applyMatrix4(transform));
    const tolerance = 1e-5;
    for (const vertex of vertices) {
      const x = Math.abs(vertex.x);
      const z = Math.abs(vertex.z); // Blender Y becomes glTF -Z.
      expect(vertex.y).toBeCloseTo(0.098, 5); // A shallow surface inlay, not a new raised casing.
      expect(side === "Left" ? vertex.x : -vertex.x).toBeLessThanOrEqual(-0.25 + tolerance);
      expect(x).toBeLessThanOrEqual(4.85 + tolerance);
      expect(z).toBeLessThanOrEqual(2.12 + tolerance);
      expect(x >= 4.55 - tolerance || z >= 1.84 - tolerance,
        "decoration stays outside the protected readable central face").toBe(true);
    }
    const indices = primitive.indices === undefined
      ? Array.from({ length: position.count }, (_, index) => index)
      : accessorValues(gltf.accessors[primitive.indices]);
    expect(indices.length / 3).toBeGreaterThan(10);
    for (let index = 0; index < indices.length; index += 3) {
      const triangle: Point2[] = indices.slice(index, index + 3)
        .map((vertexIndex) => [vertices[vertexIndex].x, vertices[vertexIndex].z]);
      expect(readableFaceOverlap(triangle), "no decorative triangle cuts across the readable face").toBeLessThan(1e-8);
    }
  });

  it("keeps all buffer ranges, numeric geometry and declared bounds valid and finite", () => {
    for (const view of gltf.bufferViews) {
      expect(view.buffer).toBe(0);
      expect(view.byteOffset ?? 0).toBeGreaterThanOrEqual(0);
      expect(view.byteLength).toBeGreaterThan(0);
      expect((view.byteOffset ?? 0) + view.byteLength).toBeLessThanOrEqual(gltf.buffers[0].byteLength);
    }
    for (const accessor of gltf.accessors) {
      const view = gltf.bufferViews[accessor.bufferView];
      expect(view).toBeDefined();
      const size = COMPONENT_BYTES[accessor.componentType];
      const components = TYPE_COMPONENTS[accessor.type];
      expect(size).toBeDefined();
      expect(components).toBeDefined();
      expect(accessor.sparse).toBeUndefined();
      expect(Number.isInteger(accessor.count)).toBe(true);
      expect(accessor.count).toBeGreaterThan(0);
      const stride = view.byteStride ?? size * components;
      expect((accessor.byteOffset ?? 0) + (accessor.count - 1) * stride + size * components)
        .toBeLessThanOrEqual(view.byteLength);
      const values = accessorValues(accessor);
      expect(values.every(Number.isFinite)).toBe(true);
      if (accessor.min || accessor.max) {
        expect(accessor.min).toHaveLength(components);
        expect(accessor.max).toHaveLength(components);
        expect(accessor.min!.every((minimum, index) => minimum <= accessor.max![index])).toBe(true);
        expect(values.every((value, index) => value >= accessor.min![index % components] - 1e-6
          && value <= accessor.max![index % components] + 1e-6)).toBe(true);
      }
    }
  });

  it("stays below the triangle budget and references only valid triangle indices", () => {
    let triangles = 0;
    for (const current of gltf.nodes.filter(({ mesh }) => mesh !== undefined)) {
      for (const primitive of gltf.meshes[current.mesh!].primitives) {
        expect(primitive.mode ?? 4).toBe(4);
        const position = gltf.accessors[primitive.attributes.POSITION];
        expect(position.type).toBe("VEC3");
        expect(position.min).toHaveLength(3);
        expect(position.max).toHaveLength(3);
        const indices = primitive.indices === undefined ? undefined : gltf.accessors[primitive.indices];
        const count = indices?.count ?? position.count;
        expect(count % 3).toBe(0);
        triangles += count / 3;
        if (indices) {
          expect(indices.type).toBe("SCALAR");
          expect(accessorValues(indices).every((index) => Number.isInteger(index) && index >= 0 && index < position.count)).toBe(true);
        }
      }
    }
    expect(triangles).toBeGreaterThan(0);
    expect(triangles).toBeLessThan(25_000);
  });
});
