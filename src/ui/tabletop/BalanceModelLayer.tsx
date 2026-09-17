import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { balanceAxisIsActive, balanceMotionAt } from "./balanceMotion";
import "./balanceModel.css";

const AXES = ["comfort", "control", "connection", "freedom", "responsibility"] as const;
const MODEL_URL = "/models/human-balance.glb";
type Part = { group: THREE.Group; size: THREE.Vector3; faceInset: number };

/**
 * Pure presentation: the Blender meshes follow the existing native balance's
 * measured tracks and animated markers. There are no commands, scores, deltas,
 * identifiers or an independent outcome state machine in this renderer.
 */
export function BalanceModelLayer() {
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = hostRef.current;
    const housing = host?.parentElement;
    const balance = housing?.closest(".human-balance");
    if (!host || !housing || !balance) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      host.dataset.modelStatus = "unavailable";
      return;
    }
    const started = performance.now();
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.domElement.setAttribute("aria-hidden", "true");
    // Canvas is a sibling of the HTML housing: its real camera and the HTML's
    // CSS lens share one projection, rather than tilting an already-flat image.
    renderer.domElement.className = "balance-model-canvas";
    const objectStage = housing.closest<HTMLElement>(".balance-object-stage") ?? housing;
    objectStage.append(renderer.domElement);
    const scene = new THREE.Scene();
    const product = new THREE.Group();
    scene.add(product);
    // The instrument is ~1500 CSS units from the lens. A close-to-zero near
    // plane wastes depth precision and makes its fine assembled layers fight.
    const camera = new THREE.PerspectiveCamera(35, 1, 100, 3000);
    const fill = new THREE.HemisphereLight(0xf0f2f2, 0x68757b, 0.85);
    const key = new THREE.DirectionalLight(0xf5f3ed, 2.4);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.radius = 4;
    key.shadow.bias = 0.0002;
    key.shadow.normalBias = 0.45;
    const rim = new THREE.DirectionalLight(0xd3e5e8, 2.0);
    scene.add(fill, key, key.target, rim, rim.target);
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShadowMaterial({ opacity: 0.34, depthWrite: false }));
    shadowPlane.receiveShadow = true;
    product.add(shadowPlane);
    const parts = new Map<string, Part>();
    let foldLeft: THREE.Object3D | undefined;
    let foldRight: THREE.Object3D | undefined;
    const flatLeftInverse = new THREE.Matrix4();
    const flatRightInverse = new THREE.Matrix4();
    const leftFold = new THREE.Matrix4();
    const rightFold = new THREE.Matrix4();
    const productInverse = new THREE.Matrix4();
    let disposed = false;
    let failed = false;
    let loaded = false;
    let frame = 0;
    let trackUntil = 0;
    let width = 0;
    let height = 0;
    const renderTimes: number[] = [];
    const frameIntervals: number[] = [];
    let previousFrame = 0;

    const restoreHtml = () => {
      housing.classList.remove("has-balance-model");
      housing.style.removeProperty("--balance-content-opacity");
      objectStage.style.removeProperty("--balance-push");
      housing.querySelectorAll<HTMLElement>("[data-model-focus]").forEach((row) => { delete row.dataset.modelFocus; });
      host.style.visibility = "hidden";
      renderer.domElement.style.visibility = "hidden";
    };
    const free = (object: THREE.Object3D) => {
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      const textures = new Set<THREE.Texture>();
      object.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        geometries.add(child.geometry);
        (Array.isArray(child.material) ? child.material : [child.material]).forEach((material) => materials.add(material));
      });
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => {
        if (material instanceof THREE.MeshStandardMaterial && material.map) textures.add(material.map);
        material.dispose();
      });
      textures.forEach((texture) => texture.dispose());
    };
    const fit = (name: string, rect: DOMRect, bounds: DOMRect, depth: number, fixedHeight?: number) => {
      const part = parts.get(name);
      if (!part) return;
      const objectHeight = fixedHeight ?? rect.height;
      const scaleX = rect.width / part.size.x;
      part.group.scale.set(scaleX, objectHeight / part.size.y, Math.min(scaleX, objectHeight / part.size.y));
      part.group.position.set(rect.left - bounds.left + rect.width / 2 - width / 2, height / 2 - (rect.top - bounds.top + rect.height / 2), depth);
      // Rebuild the un-folded baseline even when its presentation matrix is
      // controlled explicitly, so resize cannot accumulate an old transform.
      part.group.updateMatrix();
    };
    // Native HTML owns the layout and marker animation. Only its local visual
    // coordinates are projected; the parent emergence still moves both layers.
    const localRect = (element: HTMLElement, centered = false) => {
      let x = 0; let y = 0;
      let current: HTMLElement | null = element;
      while (current && current !== housing) {
        x += current.offsetLeft; y += current.offsetTop;
        current = current.offsetParent as HTMLElement | null;
      }
      return new DOMRect(x - (centered ? element.offsetWidth / 2 : 0), y - (centered ? element.offsetHeight / 2 : 0), element.offsetWidth, element.offsetHeight);
    };
    const timeMs = (value: string, fallback: number) => {
      const numeric = Number.parseFloat(value);
      return Number.isFinite(numeric) ? numeric * (value.trim().endsWith("ms") ? 1 : 1000) : fallback;
    };
    const nativeAnimation = (element: Element, name: string) => element.getAnimations?.().find((animation) =>
      "animationName" in animation && String(animation.animationName).startsWith(name));
    const revealClock = (now: number) => {
      const animation = nativeAnimation(balance, "balance-emerge");
      const currentTime = animation?.currentTime;
      return {
        elapsedMs: typeof currentTime === "number" ? currentTime : now - started,
        revealDelayMs: Number(animation?.effect?.getTiming().delay) || timeMs(getComputedStyle(balance).animationDelay, 1900),
      };
    };
    const draw = (now: number) => {
      const bounds = new DOMRect(host.offsetLeft, host.offsetTop, host.offsetWidth, host.offsetHeight);
      if (!bounds.width || !bounds.height) return;
      const nextWidth = Math.ceil(bounds.width);
      const nextHeight = Math.ceil(bounds.height);
      const style = getComputedStyle(housing);
      const lens = Number.parseFloat(style.getPropertyValue("--balance-lens")) || 1500;
      const angle = (property: string) => THREE.MathUtils.degToRad(Number.parseFloat(style.getPropertyValue(property)) || 0);
      product.rotation.set(-angle("--balance-view-x"), angle("--balance-view-y"), -angle("--balance-view-z"), "XYZ");
      product.position.set(nextWidth / 2, nextHeight / 2, 0);
      camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(nextHeight / (2 * lens)));
      camera.aspect = nextWidth / nextHeight;
      camera.position.set(nextWidth / 2, nextHeight / 2, lens);
      camera.updateProjectionMatrix();
      if (width !== nextWidth || height !== nextHeight) {
        width = nextWidth; height = nextHeight;
        // Match the CSS footprint as well as the high-DPI drawing buffer;
        // intrinsic canvas pixels must not enlarge the object over its labels.
        renderer.setSize(width, height);
        key.position.set(width * 0.22, height + 180, 1000);
        key.target.position.set(width / 2, height / 2, 0);
        rim.position.set(width + 200, -120, 160);
        rim.target.position.set(width / 2, height / 2, 0);
        const span = Math.max(width, height);
        Object.assign(key.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: 1600 });
        key.shadow.camera.updateProjectionMatrix();
      }
      const bodyRect = new DOMRect(0, 0, housing.offsetWidth, housing.offsetHeight);
      const body = parts.get("Housing");
      const bodyDepth = body ? body.size.z * Math.min(bodyRect.width / body.size.x, bodyRect.height / body.size.y) : 30;
      // The hinge protrudes above the leaves. Anchor the actual face, not the
      // highest hinge point, so tracks remain seated on the physical surface.
      const bodyScale = body ? Math.min(bodyRect.width / body.size.x, bodyRect.height / body.size.y) : 1;
      fit("Housing", bodyRect, bounds, -bodyDepth / 2 - 2 + (body?.faceInset ?? 0) * bodyScale);
      shadowPlane.scale.set(bodyRect.width + 64, bodyRect.height + 64, 1);
      shadowPlane.position.set(3, -5, -bodyDepth - 5);
      const rows = housing.querySelectorAll<HTMLElement>(".balance-row");
      const clock = revealClock(now);
      const memory = balance.classList.contains("is-memory");
      const unfolding = balanceMotionAt(clock.elapsedMs, { revealDelayMs: clock.revealDelayMs, reducedMotion: motion.matches, memory });
      objectStage.style.setProperty("--balance-push", String(unfolding.pushScale));
      housing.style.setProperty("--balance-content-opacity", String(unfolding.contentOpacity));
      host.dataset.foldAngle = String(unfolding.foldRadians);
      host.dataset.foldProgress = String(unfolding.progress);
      rows.forEach((row, index) => {
        const axis = AXES[index];
        const groove = row.querySelector<HTMLElement>(".balance-groove");
        const marker = row.querySelector<HTMLElement>(".balance-marker");
        const zero = row.querySelector<HTMLElement>(".balance-zero");
        const label = row.querySelector<HTMLElement>(".balance-label");
        if (!axis || !groove || !marker || !zero) return;
        const rail = localRect(groove);
        // Two physical rail sections meet at the housing's hinge, not at the
        // numerical zero. HTML alone still supplies every marker position.
        const seam = bodyRect.width / 2;
        const gap = bodyRect.width * 0.0036;
        fit(`RailLeft_${axis}`, new DOMRect(rail.left, rail.top, Math.max(1, seam - gap / 2 - rail.left), rail.height), bounds, 2, 12);
        fit(`RailRight_${axis}`, new DOMRect(seam + gap / 2, rail.top, Math.max(1, rail.right - seam - gap / 2), rail.height), bounds, 2, 12);
        const zeroRect = localRect(zero);
        const centeredZero = new DOMRect(zeroRect.left - zeroRect.width / 2, zeroRect.top, zeroRect.width, zeroRect.height);
        fit(`Zero_${axis}`, centeredZero, bounds, 5);
        // Static scale marks reuse the real Blender ring. Only the moving
        // marker follows the domain-driven HTML; these rings encode no result.
        for (const fraction of [0, .25, .75, 1]) {
          fit(`Stop_${axis}_${fraction}`, new DOMRect(rail.left + rail.width * fraction - zeroRect.width / 2, zeroRect.top, zeroRect.width, zeroRect.height), bounds, 5);
        }
        fit(`Marker_${axis}`, localRect(marker, true), bounds, 7);
        if (label) fit(`Label_${axis}`, localRect(label), bounds, 1);
        const slide = nativeAnimation(marker, "marker-slide");
        const slideTiming = slide?.effect?.getTiming();
        const currentTime = slide?.currentTime;
        const focused = balanceAxisIsActive(
          typeof currentTime === "number" ? currentTime : clock.elapsedMs,
          slideTiming?.delay ?? timeMs(getComputedStyle(row).getPropertyValue("--balance-delay"), 3000 + index * 210),
          typeof slideTiming?.duration === "number" ? slideTiming.duration : 680,
          { changing: row.classList.contains("is-changing"), reducedMotion: motion.matches, memory },
        );
        // data-* is intentionally outside the observer's class/style filter.
        // A focus frame therefore cannot keep the render loop awake forever.
        if (focused) row.dataset.modelFocus = "true";
        else delete row.dataset.modelFocus;
      });
      if (foldLeft && foldRight) {
        // Use the real exported hinge pivots, not a whole-panel imitation.
        // The derived transforms also carry the separately fitted rail halves,
        // labels and markers with the matching leaf. Matrix multiplication
        // preserves the housing's nonuniform fit without introducing drift.
        foldLeft.rotation.z = 0;
        foldRight.rotation.z = 0;
        product.updateMatrixWorld(true);
        flatLeftInverse.copy(foldLeft.matrixWorld).invert();
        flatRightInverse.copy(foldRight.matrixWorld).invert();
        productInverse.copy(product.matrixWorld).invert();
        const hinge = product.worldToLocal(foldLeft.getWorldPosition(new THREE.Vector3()));
        foldLeft.rotation.z = unfolding.foldRadians ? -unfolding.foldRadians : 0;
        foldRight.rotation.z = unfolding.foldRadians;
        product.updateMatrixWorld(true);
        leftFold.copy(productInverse).multiply(foldLeft.matrixWorld).multiply(flatLeftInverse).multiply(product.matrixWorld);
        rightFold.copy(productInverse).multiply(foldRight.matrixWorld).multiply(flatRightInverse).multiply(product.matrixWorld);
        for (const [name, part] of parts) {
          if (name === "Housing") continue;
          const left = name.startsWith("RailLeft_") || (!name.startsWith("RailRight_") && part.group.position.x < hinge.x);
          part.group.matrix.premultiply(left ? leftFold : rightFold);
          part.group.matrixWorldNeedsUpdate = true;
        }
      }
      renderer.render(scene, camera);
      housing.classList.add("has-balance-model");
      host.style.visibility = "visible";
      renderer.domElement.style.visibility = "visible";
      host.dataset.modelStatus = "ready";
      host.dataset.drawCalls = String(renderer.info.render.calls);
      host.dataset.triangles = String(renderer.info.render.triangles);
    };
    const reportTiming = () => {
      const sorted = [...renderTimes].sort((a, b) => a - b);
      host.dataset.sampleFrames = String(sorted.length);
      host.dataset.cpuFrameP95Ms = (sorted[Math.floor((sorted.length - 1) * .95)] ?? 0).toFixed(2);
      host.dataset.meanFrameIntervalMs = (frameIntervals.reduce((sum, value) => sum + value, 0) / (frameIntervals.length || 1)).toFixed(2);
    };
    const tick = (now: number) => {
      frame = 0;
      if (disposed || failed || !loaded || document.hidden) return;
      if (previousFrame && now - previousFrame < 200) frameIntervals.push(now - previousFrame);
      previousFrame = now;
      const start = performance.now();
      try { draw(now); } catch { failed = true; host.dataset.modelStatus = "unavailable"; restoreHtml(); return; }
      renderTimes.push(performance.now() - start);
      if (renderTimes.length > 600) renderTimes.shift();
      if (frameIntervals.length > 600) frameIntervals.shift();
      if (now < trackUntil) frame = requestAnimationFrame(tick);
      else { previousFrame = 0; reportTiming(); }
    };
    const schedule = (duration = 6500) => {
      if (disposed || failed || !loaded || document.hidden) return;
      trackUntil = Math.max(trackUntil, performance.now() + (motion.matches ? 80 : duration));
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onResize = () => schedule(300);
    const onAnimation = () => schedule();
    const onContextLost = (event: Event) => {
      event.preventDefault(); failed = true; cancelAnimationFrame(frame); frame = 0;
      host.dataset.modelStatus = "context-lost"; restoreHtml();
    };
    const onContextRestored = () => { failed = false; schedule(); };
    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; previousFrame = 0; }
      else schedule();
    };
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(housing);
    const mutationObserver = new MutationObserver((records) => {
      if (records.some((record) => record.target !== host && record.target !== housing && record.target !== objectStage && record.target !== renderer.domElement)) schedule();
    });
    mutationObserver.observe(balance, { attributes: true, childList: true, subtree: true, attributeFilter: ["class", "style"] });
    balance.addEventListener("animationstart", onAnimation);
    balance.addEventListener("animationend", onAnimation);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onResize);
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);

    void new GLTFLoader().loadAsync(MODEL_URL).then((gltf) => {
      if (disposed) { free(gltf.scene); return; }
      // Convert glTF axes to the native HTML plane before the shared camera tilt.
      gltf.scene.rotation.x = Math.PI / 2;
      scene.add(gltf.scene);
      gltf.scene.updateMatrixWorld(true);
      const names = ["Housing", ...AXES.flatMap((axis) => [`RailLeft_${axis}`, `RailRight_${axis}`, `Zero_${axis}`, `Marker_${axis}`, `Label_${axis}`])];
      for (const name of names) {
        const node = gltf.scene.getObjectByName(name);
        if (!node) { free(gltf.scene); throw new Error(`Missing model part: ${name}`); }
        scene.attach(node);
        const box = new THREE.Box3().setFromObject(node);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const face = name === "Housing" ? node.getObjectByName("HousingFaceLeft") : null;
        const faceInset = face ? Math.max(0, box.max.z - new THREE.Box3().setFromObject(face).max.z) : 0;
        node.position.sub(center);
        const group = new THREE.Group();
        group.matrixAutoUpdate = name === "Housing";
        group.add(node);
        node.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = /HousingBody|Slider|LabelPlaque|TitlePlaque/.test(child.name);
            child.receiveShadow = /HousingFace/.test(child.name);
            if (/Slider(Rim|Grip)_/.test(child.name)) child.material = child.material.clone();
          }
        });
        product.add(group);
        parts.set(name, { group, size, faceInset });
      }
      foldLeft = parts.get("Housing")?.group.getObjectByName("FoldLeft");
      foldRight = parts.get("Housing")?.group.getObjectByName("FoldRight");
      if (!foldLeft || !foldRight) throw new Error("Missing physical balance fold pivots");
      for (const axis of AXES) {
        const zero = parts.get(`Zero_${axis}`)!;
        for (const fraction of [0, .25, .75, 1]) {
          const group = zero.group.clone(true);
          group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              const material = (child.material as THREE.MeshStandardMaterial).clone();
              material.color.set(fraction < .5 ? 0x68d4e8 : 0xf4a666);
              child.material = material;
            }
          });
          product.add(group);
          parts.set(`Stop_${axis}_${fraction}`, { group, size: zero.size.clone(), faceInset: 0 });
        }
      }
      scene.remove(gltf.scene);
      free(gltf.scene);
      loaded = true;
      host.dataset.loadMs = (performance.now() - started).toFixed(2);
      schedule();
    }).catch(() => {
      if (!disposed) { failed = true; host.dataset.modelStatus = "unavailable"; restoreHtml(); }
    });
    return () => {
      disposed = true; cancelAnimationFrame(frame);
      resizeObserver.disconnect(); mutationObserver.disconnect();
      balance.removeEventListener("animationstart", onAnimation);
      balance.removeEventListener("animationend", onAnimation);
      window.removeEventListener("resize", onResize); window.removeEventListener("scroll", onResize, true);
      document.removeEventListener("visibilitychange", onVisibility); motion.removeEventListener("change", onResize);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
      restoreHtml(); free(scene); key.dispose(); rim.dispose(); fill.dispose();
      renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
    };
  }, []);
  return <div className="balance-model-layer" data-testid="balance-model-layer" ref={hostRef} aria-hidden="true" />;
}
