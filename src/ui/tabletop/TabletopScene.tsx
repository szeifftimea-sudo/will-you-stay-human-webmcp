import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { LENSES, type HumanBalance, type Lens } from "../../domain/gameTypes";

export interface TabletopSceneProps {
  balance: HumanBalance;
  previousBalance?: HumanBalance;
  selectedLens: Lens | null;
  selectable: boolean;
  availableLenses: Lens[];
  showBalance: boolean;
  labels: Record<Lens, string>;
  axisLabels: Record<keyof HumanBalance, string>;
  onSelect(lens: Lens): void;
}

const AXES: Array<keyof HumanBalance> = [
  "comfort", "control", "connection", "freedom", "responsibility",
];

// These presentation anchors are intentionally independent of dilemmas and outcomes.
// A future model can replace the meshes beneath them without changing the controller.
const LENS_ANCHORS: Record<Lens, [number, number, number]> = {
  brain: [-2.85, 0.17, -2.55],
  hand: [0, 0.17, -2.55],
  heart: [2.85, 0.17, -2.55],
};
const RAIL_CENTER = 1.5;
const RAIL_STEP = 0.95;
const markerPosition = (value: number) => RAIL_CENTER + value * RAIL_STEP;
const displayValue = (value: number) => value > 0 ? `+${value}` : `${value}`;

interface SceneHandle {
  update(props: TabletopSceneProps): void;
  dispose(): void;
}

interface TextLabel {
  sprite: THREE.Sprite;
  setText(text: string): void;
}

interface Motion {
  object: THREE.Object3D;
  axis: "x" | "y";
  from: number;
  to: number;
}

function createScene(
  host: HTMLDivElement,
  initialProps: TabletopSceneProps,
  onUnavailable: () => void,
): SceneHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "tabletop-scene-canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%;touch-action:pan-y";

  const scene = new THREE.Scene();
  scene.name = "tabletop_scene";
  const camera = new THREE.OrthographicCamera(-6, 6, 6, -6, 0.1, 60);
  camera.name = "tabletop_fixed_camera";
  camera.position.set(0, 13, 10.8);
  camera.lookAt(0, 0, 0.25);

  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  try {
    const keepGeometry = <T extends THREE.BufferGeometry>(geometry: T): T => {
      geometries.add(geometry);
      return geometry;
    };
    const keepMaterial = <T extends THREE.Material>(material: T): T => {
      materials.add(material);
      return material;
    };
    const surface = (color: number, metalness = 0, roughness = 0.7) =>
      keepMaterial(new THREE.MeshStandardMaterial({ color, metalness, roughness }));
    const block = (
      parent: THREE.Object3D,
      name: string,
      dimensions: [number, number, number],
      position: [number, number, number],
      material: THREE.Material,
    ) => {
      const mesh = new THREE.Mesh(keepGeometry(new THREE.BoxGeometry(...dimensions)), material);
      mesh.name = name;
      mesh.position.set(...position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    const createLabel = (name: string, text: string, width: number, height: number): TextLabel => {
      const canvas = document.createElement("canvas");
      canvas.height = 192;
      canvas.width = Math.round(canvas.height * width / height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas labels are unavailable");
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      textures.add(texture);
      const material = keepMaterial(new THREE.SpriteMaterial({ map: texture, depthWrite: false }));
      const sprite = new THREE.Sprite(material);
      sprite.name = name;
      sprite.scale.set(width, height, 1);
      let previousText: string | undefined;
      const setText = (nextText: string) => {
        if (previousText === nextText) return;
        previousText = nextText;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#f2eee5";
        context.textAlign = "center";
        context.textBaseline = "middle";
        const fontFamily = '"Avenir Next", "Segoe UI", Arial, sans-serif';
        context.font = `500 156px ${fontFamily}`;
        const fontSize = Math.min(156, 156 * (canvas.width - 24) / Math.max(context.measureText(nextText).width, 1));
        context.font = `500 ${fontSize}px ${fontFamily}`;
        context.fillText(nextText, canvas.width / 2, canvas.height / 2 + 3, canvas.width - 24);
        texture.needsUpdate = true;
      };
      setText(text);
      return { sprite, setText };
    };

    const iconTexture = (lens: Lens) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 256;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas icons are unavailable");
      context.strokeStyle = "#173036";
      context.lineWidth = 10;
      context.lineCap = "round";
      context.lineJoin = "round";
      context.beginPath();
      if (lens === "brain") {
        context.moveTo(127, 67);
        context.bezierCurveTo(107, 38, 70, 48, 69, 76);
        context.bezierCurveTo(43, 82, 42, 112, 57, 125);
        context.bezierCurveTo(41, 150, 59, 177, 79, 175);
        context.bezierCurveTo(83, 205, 117, 210, 128, 185);
        context.bezierCurveTo(143, 210, 174, 203, 179, 176);
        context.bezierCurveTo(205, 174, 213, 145, 198, 126);
        context.bezierCurveTo(217, 103, 203, 78, 183, 76);
        context.bezierCurveTo(181, 48, 144, 38, 128, 67);
        context.lineTo(128, 185);
        context.moveTo(76, 101);
        context.quadraticCurveTo(107, 97, 101, 127);
        context.moveTo(80, 160);
        context.quadraticCurveTo(82, 139, 103, 146);
        context.moveTo(180, 101);
        context.quadraticCurveTo(149, 97, 155, 127);
        context.moveTo(176, 160);
        context.quadraticCurveTo(174, 139, 153, 146);
      } else if (lens === "heart") {
        context.moveTo(128, 202);
        context.bezierCurveTo(108, 182, 50, 143, 50, 100);
        context.bezierCurveTo(50, 49, 103, 38, 128, 82);
        context.bezierCurveTo(153, 38, 206, 49, 206, 100);
        context.bezierCurveTo(206, 143, 148, 182, 128, 202);
        context.closePath();
      } else {
        context.moveTo(85, 145);
        context.lineTo(85, 89);
        context.bezierCurveTo(85, 68, 108, 68, 108, 89);
        context.lineTo(108, 128);
        context.lineTo(108, 61);
        context.bezierCurveTo(108, 40, 132, 40, 132, 61);
        context.lineTo(132, 126);
        context.lineTo(132, 71);
        context.bezierCurveTo(132, 49, 156, 49, 156, 71);
        context.lineTo(156, 133);
        context.lineTo(156, 94);
        context.bezierCurveTo(156, 73, 180, 73, 180, 94);
        context.lineTo(180, 151);
        context.bezierCurveTo(180, 194, 161, 207, 130, 207);
        context.bezierCurveTo(101, 207, 91, 196, 73, 173);
        context.lineTo(52, 146);
        context.bezierCurveTo(38, 128, 54, 112, 69, 126);
        context.lineTo(85, 145);
      }
      context.stroke();
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.add(texture);
      return texture;
    };

    scene.add(new THREE.HemisphereLight(0xd7edf2, 0x22383c, 2.1));
    const keyLight = new THREE.DirectionalLight(0xffecd3, 4.2);
    keyLight.position.set(-4, 10, 1);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.left = keyLight.shadow.camera.bottom = -7;
    keyLight.shadow.camera.right = keyLight.shadow.camera.top = 7;
    keyLight.shadow.normalBias = 0.045;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0x93d6de, 1.2);
    fillLight.position.set(5, 4, -6);
    scene.add(fillLight);

    const tabletop = new THREE.Group();
    tabletop.name = "table_anchor";
    scene.add(tabletop);
    const wood = surface(0x182326, 0.15, 0.76);
    const boardEdge = surface(0x20383c, 0.25, 0.55);
    const boardSurface = surface(0x122b30, 0.05, 0.92);
    const brass = surface(0x9b7f5a, 0.65, 0.45);
    block(tabletop, "table_solid", [11.3, 0.5, 10.5], [0, -0.62, 0.15], wood);
    const board = new THREE.Group();
    board.name = "board_anchor";
    tabletop.add(board);
    block(board, "board_base", [9.9, 0.34, 9], [0, -0.05, 0.15], boardEdge);
    block(board, "board_playing_surface", [9.57, 0.07, 8.67], [0, 0.14, 0.15], boardSurface);
    for (const x of [-4.73, 4.73]) {
      block(board, `board_inlay_${x < 0 ? "left" : "right"}`, [0.025, 0.01, 8.35], [x, 0.19, 0.15], brass);
    }
    for (const z of [-4.02, 4.32]) {
      block(board, `board_inlay_${z < 0 ? "back" : "front"}`, [9.46, 0.01, 0.025], [0, 0.19, z], brass);
    }

    const tokenGeometry = keepGeometry(new THREE.CylinderGeometry(0.89, 0.89, 0.42, 48));
    const rimGeometry = keepGeometry(new THREE.CylinderGeometry(0.97, 0.97, 0.1, 48));
    const iconGeometry = keepGeometry(new THREE.CircleGeometry(0.72, 48));
    const socketGeometry = keepGeometry(new THREE.RingGeometry(1.06, 1.085, 48));
    const pickTargets: THREE.Object3D[] = [];
    const tokens = LENSES.map((lens) => {
      const anchor = new THREE.Group();
      anchor.name = `lens_anchor_${lens}`;
      anchor.userData.lens = lens;
      anchor.position.set(...LENS_ANCHORS[lens]);
      board.add(anchor);
      const tokenMaterial = surface(0xd7ddd1, 0.3, 0.36);
      const ringMaterial = surface(0x788a86, 0.7, 0.35);
      const body = new THREE.Mesh(tokenGeometry, tokenMaterial);
      body.name = `lens_token_${lens}`;
      body.position.y = 0.31;
      body.castShadow = body.receiveShadow = true;
      anchor.add(body);
      const rim = new THREE.Mesh(rimGeometry, ringMaterial);
      rim.name = `lens_rim_${lens}`;
      rim.position.y = 0.065;
      rim.castShadow = true;
      anchor.add(rim);
      const icon = new THREE.Mesh(iconGeometry, keepMaterial(new THREE.MeshBasicMaterial({
        map: iconTexture(lens), transparent: true, depthWrite: false,
      })));
      icon.name = `lens_icon_${lens}`;
      icon.rotation.x = -Math.PI / 2;
      icon.position.y = 0.524;
      anchor.add(icon);
      const label = createLabel(`lens_label_${lens}`, initialProps.labels[lens], 2.15, 0.5);
      label.sprite.position.set(0, 0.25, 1.23);
      anchor.add(label.sprite);
      const socket = new THREE.Mesh(socketGeometry, brass);
      socket.name = `lens_socket_${lens}`;
      socket.rotation.x = -Math.PI / 2;
      socket.position.set(LENS_ANCHORS[lens][0], 0.183, LENS_ANCHORS[lens][2]);
      board.add(socket);
      pickTargets.push(anchor);
      return { lens, anchor, label, tokenMaterial, ringMaterial };
    });

    const balanceGroup = new THREE.Group();
    balanceGroup.name = "balance_anchor";
    board.add(balanceGroup);
    const grooveMaterial = surface(0x020d11, 0.2, 0.8);
    const tickMaterial = surface(0x76928f, 0.25, 0.7);
    const markerMaterial = surface(0xdeb881, 0.5, 0.34);
    const markerGeometry = keepGeometry(new THREE.CylinderGeometry(0.165, 0.21, 0.19, 24));
    const markerCapGeometry = keepGeometry(new THREE.CylinderGeometry(0.07, 0.07, 0.015, 24));
    const rails = AXES.map((axis, index) => {
      const anchor = new THREE.Group();
      anchor.name = `balance_axis_anchor_${axis}`;
      anchor.position.set(0, 0, -0.1 + index * 0.94);
      balanceGroup.add(anchor);
      const label = createLabel(`balance_axis_label_${axis}`, initialProps.axisLabels[axis], 3.15, 0.5);
      label.sprite.position.set(-2.82, 0.34, 0.06);
      anchor.add(label.sprite);
      block(anchor, `balance_rail_${axis}`, [4.18, 0.045, 0.105], [RAIL_CENTER, 0.19, 0], grooveMaterial);
      for (let value = -2; value <= 2; value++) {
        const x = markerPosition(value);
        block(anchor, `balance_tick_${axis}_${value}`, [0.025, 0.018, 0.29], [x, 0.225, 0], tickMaterial);
        const tickLabel = createLabel(`balance_tick_label_${axis}_${value}`, displayValue(value), 0.43, 0.29);
        tickLabel.sprite.position.set(x, 0.25, 0.3);
        anchor.add(tickLabel.sprite);
      }
      const marker = new THREE.Group();
      marker.name = `balance_marker_anchor_${axis}`;
      marker.position.set(markerPosition(initialProps.previousBalance?.[axis] ?? initialProps.balance[axis]), 0.32, 0);
      const markerBody = new THREE.Mesh(markerGeometry, markerMaterial);
      markerBody.name = `balance_marker_${axis}`;
      markerBody.castShadow = true;
      marker.add(markerBody);
      const markerCap = new THREE.Mesh(markerCapGeometry, grooveMaterial);
      markerCap.position.y = 0.104;
      marker.add(markerCap);
      anchor.add(marker);
      const value = createLabel(`balance_value_${axis}`, displayValue(initialProps.balance[axis]), 0.6, 0.48);
      value.sprite.position.set(4.16, 0.34, 0.06);
      anchor.add(value.sprite);
      return { axis, marker, label, value };
    });

    let props = initialProps;
    let disposed = false;
    let contextLost = false;
    let frame = 0;
    let hoveredLens: Lens | null = null;
    let lastShowBalance = false;
    let motionStarted = 0;
    let motions: Motion[] = [];
    const motionQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    const draw = (now: number) => {
      frame = 0;
      if (disposed || contextLost) return;
      const progress = motionQuery?.matches ? 1 : Math.min((now - motionStarted) / 360, 1);
      const eased = 1 - (1 - progress) ** 3;
      motions.forEach(({ object, axis, from, to }) => { object.position[axis] = from + (to - from) * eased; });
      try {
        renderer.render(scene, camera);
      } catch {
        contextLost = true;
        onUnavailable();
        return;
      }
      if (motions.length && progress < 1) frame = requestAnimationFrame(draw);
      else motions = [];
    };
    const invalidate = () => {
      if (!frame && !disposed && !contextLost) frame = requestAnimationFrame(draw);
    };
    const update = (nextProps: TabletopSceneProps) => {
      props = nextProps;
      const nextMotions: Motion[] = [];
      const move = (object: THREE.Object3D, axis: "x" | "y", to: number) => {
        if (Math.abs(object.position[axis] - to) < 0.001 || motionQuery?.matches) {
          object.position[axis] = to;
        } else nextMotions.push({ object, axis, from: object.position[axis], to });
      };
      if (!props.selectable || (hoveredLens && !props.availableLenses.includes(hoveredLens))) hoveredLens = null;
      tokens.forEach(({ lens, anchor, label, tokenMaterial, ringMaterial }) => {
        const available = props.availableLenses.includes(lens);
        const selected = props.selectedLens === lens;
        const hovered = hoveredLens === lens;
        label.setText(props.labels[lens]);
        label.sprite.material.opacity = available ? 1 : 0.45;
        tokenMaterial.color.setHex(available ? 0xd7ddd1 : 0x687c79);
        tokenMaterial.emissive.setHex(selected ? 0x2b1d0d : hovered ? 0x182727 : 0x000000);
        ringMaterial.color.setHex(selected ? 0xd8a76a : 0x788a86);
        move(anchor, "y", LENS_ANCHORS[lens][1] + (selected ? 0.34 : hovered ? 0.12 : 0));
      });
      balanceGroup.visible = props.showBalance;
      rails.forEach(({ axis, marker, label, value }) => {
        label.setText(props.axisLabels[axis]);
        value.setText(displayValue(props.balance[axis]));
        if (props.showBalance && !lastShowBalance && props.previousBalance) {
          marker.position.x = markerPosition(props.previousBalance[axis]);
        }
        move(marker, "x", markerPosition(props.balance[axis]));
      });
      lastShowBalance = props.showBalance;
      motions = nextMotions;
      motionStarted = performance.now();
      renderer.domElement.style.cursor = hoveredLens ? "pointer" : "default";
      invalidate();
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const hitLens = (event: PointerEvent) => {
      if (!props.selectable || contextLost) return null;
      const rect = renderer.domElement.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pickTargets, true)[0];
      let object: THREE.Object3D | null = hit?.object ?? null;
      while (object) {
        const lens = object.userData.lens as Lens | undefined;
        if (lens && props.availableLenses.includes(lens)) return lens;
        object = object.parent;
      }
      return null;
    };
    const onPointerMove = (event: PointerEvent) => {
      const lens = hitLens(event);
      if (lens === hoveredLens) return;
      hoveredLens = lens;
      update(props);
    };
    const onPointerLeave = () => {
      if (hoveredLens === null) return;
      hoveredLens = null;
      update(props);
    };
    let pointerDown: { x: number; y: number; lens: Lens | null } | null = null;
    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary) return;
      pointerDown = { x: event.clientX, y: event.clientY, lens: hitLens(event) };
    };
    const onPointerUp = (event: PointerEvent) => {
      const start = pointerDown;
      pointerDown = null;
      if (!start || !event.isPrimary || event.button !== 0) return;
      const lens = hitLens(event);
      if (lens && lens === start.lens && Math.hypot(event.clientX - start.x, event.clientY - start.y) < 8) {
        props.onSelect(lens);
      }
    };
    const onPointerCancel = () => { pointerDown = null; onPointerLeave(); };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      onUnavailable();
    };
    const resize = () => {
      if (disposed) return;
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height, false);
      const aspect = width / height;
      const visibleHeight = Math.max(9.55, 11.9 / aspect);
      camera.left = -visibleHeight * aspect / 2;
      camera.right = visibleHeight * aspect / 2;
      camera.top = visibleHeight / 2;
      camera.bottom = -visibleHeight / 2;
      camera.updateProjectionMatrix();
      invalidate();
    };

    const canvas = renderer.domElement;
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);
    canvas.addEventListener("webglcontextlost", onContextLost);
    motionQuery?.addEventListener("change", invalidate);
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(host);
    window.addEventListener("resize", resize);
    host.appendChild(canvas);
    resize();
    update(initialProps);

    return {
      update,
      dispose() {
        disposed = true;
        if (frame) cancelAnimationFrame(frame);
        observer?.disconnect();
        window.removeEventListener("resize", resize);
        motionQuery?.removeEventListener("change", invalidate);
        canvas.removeEventListener("pointermove", onPointerMove);
        canvas.removeEventListener("pointerleave", onPointerLeave);
        canvas.removeEventListener("pointerdown", onPointerDown);
        canvas.removeEventListener("pointerup", onPointerUp);
        canvas.removeEventListener("pointercancel", onPointerCancel);
        canvas.removeEventListener("webglcontextlost", onContextLost);
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((material) => material.dispose());
        textures.forEach((texture) => texture.dispose());
        keyLight.shadow.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
        canvas.remove();
      },
    };
  } catch (error) {
    // Initialization can fail after WebGL creation (for example when canvas
    // text is disabled), so dispose partially created GPU resources as well.
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((material) => material.dispose());
    textures.forEach((texture) => texture.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    throw error;
  }
}

export function TabletopScene(props: TabletopSceneProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const propsRef = useRef(props);
  const [unavailable, setUnavailable] = useState(false);
  propsRef.current = props;

  useEffect(() => {
    if (!hostRef.current) return;
    try {
      sceneRef.current = createScene(hostRef.current, propsRef.current, () => setUnavailable(true));
      setUnavailable(false);
    } catch {
      setUnavailable(true);
    }
    return () => {
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  useEffect(() => { sceneRef.current?.update(props); }, [props]);

  return (
    <div className="tabletop-scene" data-render-status={unavailable ? "unavailable" : "webgl"}
      style={{ position: "relative", width: "100%", height: "100%", minHeight: 300 }}>
      <div ref={hostRef} style={{ position: "absolute", inset: 0 }} />
      {unavailable && (
        <p className="tabletop-scene-fallback" role="status" style={{ padding: 24 }}>
          The 3D table is unavailable in this browser. You can still play using the controls.
        </p>
      )}
    </div>
  );
}
