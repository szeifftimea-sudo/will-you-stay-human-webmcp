import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./choiceDepth.css";

interface Palette {
  deep: THREE.Color;
  neutral: THREE.Color;
  highlight: THREE.Color;
  cyan: THREE.Color;
}

interface CardBody {
  button: HTMLElement;
  surface: HTMLElement;
  mesh: THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshStandardMaterial[]>;
  shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.ShadowMaterial>;
  sourcePositions: Float32Array;
  width: number;
  height: number;
}

const THICKNESS = 18;
const BEVEL = 1.8;
const FRONT_Z = THICKNESS + BEVEL;
const FULL_DEPTH = THICKNESS + BEVEL * 2;

function paletteFrom(element: HTMLElement): Palette | null {
  const style = getComputedStyle(element);
  const values = ["--petrol-deep", "--choice-neutral", "--choice-highlight", "--cyan"]
    .map((name) => style.getPropertyValue(name).trim());
  if (values.some((value) => !value)) return null;
  return {
    deep: new THREE.Color(values[0]),
    neutral: new THREE.Color(values[1]),
    highlight: new THREE.Color(values[2]),
    cyan: new THREE.Color(values[3]),
  };
}

function cardGeometry(width: number, height: number, radius: number, depth = THICKNESS, bevel = BEVEL) {
  const r = Math.min(radius, width / 2, height / 2);
  const shape = new THREE.Shape();
  shape.moveTo(r, 0);
  shape.lineTo(width - r, 0);
  shape.quadraticCurveTo(width, 0, width, r);
  shape.lineTo(width, height - r);
  shape.quadraticCurveTo(width, height, width - r, height);
  shape.lineTo(r, height);
  shape.quadraticCurveTo(0, height, 0, height - r);
  shape.lineTo(0, r);
  shape.quadraticCurveTo(0, 0, r, 0);
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 5,
    steps: 1,
  });
}

function numberPair(value: string): [number, number] {
  const parts = value.split(" ").map(Number.parseFloat);
  return [parts[0] || 0, parts[1] || 0];
}

/** Project the existing HTML face, including its own perspective, into its DOM rect. */
function faceProjection(body: CardBody, style: CSSStyleDeclaration, buttonStyle: CSSStyleDeclaration) {
  const matrix = new DOMMatrixReadOnly(style.transform === "none" ? undefined : style.transform);
  const [originX, originY] = numberPair(style.transformOrigin);
  const [perspectiveX, perspectiveY] = numberPair(buttonStyle.perspectiveOrigin);
  const perspective = Number.parseFloat(buttonStyle.perspective);

  const project = (x: number, y: number): [number, number] => {
    const localX = x - originX;
    const localY = y - originY;
    const transformedX = matrix.m11 * localX + matrix.m21 * localY + matrix.m41 + originX;
    const transformedY = matrix.m12 * localX + matrix.m22 * localY + matrix.m42 + originY;
    const transformedZ = matrix.m13 * localX + matrix.m23 * localY + matrix.m43;
    const factor = Number.isFinite(perspective) && perspective > 0
      ? perspective / (perspective - transformedZ)
      : 1;
    return [
      perspectiveX + (body.surface.offsetLeft + transformedX - perspectiveX) * factor,
      perspectiveY + (body.surface.offsetTop + transformedY - perspectiveY) * factor,
    ];
  };

  const corners = [project(0, 0), project(body.width, 0), project(0, body.height), project(body.width, body.height)];
  const left = Math.min(...corners.map(([x]) => x));
  const top = Math.min(...corners.map(([, y]) => y));
  const width = Math.max(...corners.map(([x]) => x)) - left;
  const height = Math.max(...corners.map(([, y]) => y)) - top;
  return { project, left, top, width, height };
}

function filteredColor(color: THREE.Color, filter: string) {
  const brightness = Number.parseFloat(filter.match(/brightness\(([\d.]+)\)/)?.[1] ?? "1");
  const saturation = Number.parseFloat(filter.match(/saturate\(([\d.]+)\)/)?.[1] ?? "1");
  const luminance = color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
  return color.lerp(new THREE.Color().setRGB(luminance, luminance, luminance), 1 - Math.min(saturation, 1))
    .multiplyScalar(brightness);
}

/** Decorative geometry only: the original DecisionCard buttons remain the entire UI. */
export function ChoiceDepthLayer() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const grid = host?.parentElement;
    if (!host || !grid) return;
    const palette = paletteFrom(grid);
    if (!palette) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      // The unchanged HTML, including its CSS edge and contact shadow, is the fallback.
      return;
    }

    renderer.setClearColor(palette.deep, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const canvas = renderer.domElement;
    canvas.setAttribute("aria-hidden", "true");
    host.append(canvas);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, 0.1, 1500);
    camera.position.z = 900;
    const fill = new THREE.AmbientLight(palette.neutral, 1.3);
    const light = new THREE.DirectionalLight(palette.neutral.clone().lerp(palette.cyan, 0.12), 2.2);
    light.castShadow = true;
    light.shadow.mapSize.set(2048, 2048);
    light.shadow.bias = -0.00015;
    light.shadow.normalBias = 0.35;
    scene.add(fill, light, light.target);

    // A shared physical ledge, not another UI surface. Its tilted top receives
    // the very same panel meshes' shadows; all interaction remains in HTML.
    const supportMaterial = new THREE.MeshStandardMaterial({
      color: palette.deep.clone().lerp(palette.neutral, 0.035),
      metalness: 0.38,
      roughness: 0.52,
      transparent: true,
    });
    const supportEdgeMaterial = new THREE.MeshStandardMaterial({
      color: palette.deep.clone().lerp(palette.neutral, 0.085),
      metalness: 0.48,
      roughness: 0.44,
      transparent: true,
    });
    const support = new THREE.Mesh(cardGeometry(1, 72, 8, 12, 2), [supportMaterial, supportEdgeMaterial]);
    support.rotation.x = THREE.MathUtils.degToRad(63);
    support.receiveShadow = true;
    support.castShadow = true;
    support.frustumCulled = false;
    support.visible = false;
    scene.add(support);
    let supportWidth = 0;

    const shadowGeometry = new THREE.PlaneGeometry(1, 1);
    const bodies: CardBody[] = [];
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let disposed = false;
    let available = true;
    let frame = 0;
    let trackUntil = 0;
    let viewportWidth = 0;
    let viewportHeight = 0;

    const restoreHtml = () => {
      grid.classList.remove("has-choice-depth");
      host.style.visibility = "hidden";
    };

    const clearBody = (body: CardBody) => {
      scene.remove(body.mesh, body.shadow);
      body.mesh.geometry.dispose();
      body.mesh.material.forEach((material) => material.dispose());
      body.shadow.material.dispose();
    };

    const syncBodies = () => {
      const buttons = Array.from(grid.querySelectorAll<HTMLElement>(":scope > .route-choice"));
      for (let index = bodies.length - 1; index >= 0; index -= 1) {
        if (!buttons.includes(bodies[index].button)) {
          resizeObserver.unobserve(bodies[index].button);
          resizeObserver.unobserve(bodies[index].surface);
          clearBody(bodies[index]);
          bodies.splice(index, 1);
        }
      }
      for (const button of buttons) {
        if (bodies.some((body) => body.button === button)) continue;
        const surface = button.querySelector<HTMLElement>(".route-object");
        if (!surface) continue;
        const width = Math.max(surface.offsetWidth, 1);
        const height = Math.max(surface.offsetHeight, 1);
        const geometry = cardGeometry(width, height, Number.parseFloat(getComputedStyle(surface).borderRadius) || 0);
        // The native translucent face is the only visible front. The cap stays in
        // the shadow depth pass, which does not inherit visual material opacity.
        const face = new THREE.MeshStandardMaterial({ color: palette.deep, transparent: true, opacity: 0, depthWrite: false });
        const edge = new THREE.MeshStandardMaterial({ color: palette.deep, roughness: 0.44, metalness: 0.4, transparent: true });
        const mesh = new THREE.Mesh(geometry, [face, edge]);
        mesh.castShadow = true;
        mesh.frustumCulled = false;
        const shadow = new THREE.Mesh(shadowGeometry, new THREE.ShadowMaterial({ color: palette.deep, opacity: 0.32, depthWrite: false }));
        shadow.receiveShadow = true;
        shadow.renderOrder = -1;
        scene.add(mesh, shadow);
        bodies.push({ button, surface, mesh, shadow, sourcePositions: new Float32Array(geometry.getAttribute("position").array), width, height });
        resizeObserver.observe(button);
        resizeObserver.observe(surface);
      }
    };

    const draw = () => {
      const bounds = host.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const width = Math.ceil(bounds.width);
      const height = Math.ceil(bounds.height);
      if (width !== viewportWidth || height !== viewportHeight) {
        viewportWidth = width;
        viewportHeight = height;
        renderer.setSize(width, height, false);
        camera.right = width;
        camera.top = height;
        camera.updateProjectionMatrix();
        light.position.set(width / 2 - 260, height / 2 + 320, 650);
        light.target.position.set(width / 2, height / 2, 0);
        const span = Math.max(width, height) * 0.72 + 100;
        Object.assign(light.shadow.camera, { left: -span, right: span, top: span, bottom: -span, near: 1, far: 2000 });
        light.shadow.camera.updateProjectionMatrix();
      }

      syncBodies();
      let supportLeft = Infinity;
      let supportRight = -Infinity;
      let supportBottom = -Infinity;
      let supportOpacity = 0;
      for (const body of bodies) {
        const rect = body.surface.getBoundingClientRect();
        const style = getComputedStyle(body.surface);
        const buttonStyle = getComputedStyle(body.button);
        const opacity = Number.parseFloat(buttonStyle.opacity) * Number.parseFloat(style.opacity);
        body.mesh.visible = body.shadow.visible = rect.width > 0 && rect.height > 0 && opacity > 0.005;
        if (!body.mesh.visible) continue;
        supportLeft = Math.min(supportLeft, rect.left - bounds.left);
        supportRight = Math.max(supportRight, rect.right - bounds.left);
        supportBottom = Math.max(supportBottom, rect.bottom - bounds.top);
        supportOpacity = Math.max(supportOpacity, opacity);

        const localWidth = Math.max(body.surface.offsetWidth, 1);
        const localHeight = Math.max(body.surface.offsetHeight, 1);
        if (localWidth !== body.width || localHeight !== body.height) {
          body.mesh.geometry.dispose();
          body.mesh.geometry = cardGeometry(localWidth, localHeight, Number.parseFloat(style.borderRadius) || 0);
          body.sourcePositions = new Float32Array(body.mesh.geometry.getAttribute("position").array);
          body.width = localWidth;
          body.height = localHeight;
        }

        const projection = faceProjection(body, style, buttonStyle);
        const scaleX = rect.width / Math.max(projection.width, 1);
        const scaleY = rect.height / Math.max(projection.height, 1);
        const sizeScale = rect.width / body.width;
        const positions = body.mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
        for (let index = 0; index < positions.count; index += 1) {
          const offset = index * 3;
          const z = body.sourcePositions[offset + 2] - FRONT_Z;
          const depth = -z / FULL_DEPTH;
          const [x, y] = projection.project(body.sourcePositions[offset], body.height - body.sourcePositions[offset + 1]);
          positions.setXYZ(
            index,
            rect.left - bounds.left + (x - projection.left) * scaleX + depth * 9 * sizeScale,
            height - (rect.top - bounds.top + (y - projection.top) * scaleY + depth * 17 * sizeScale),
            z * sizeScale,
          );
        }
        positions.needsUpdate = true;
        body.mesh.geometry.computeVertexNormals();

        const currentColor = new THREE.Color(buttonStyle.color);
        const filter = `${buttonStyle.filter} ${style.filter}`;
        body.mesh.material[1].color.copy(filteredColor(palette.deep.clone().lerp(currentColor, 0.18), filter));
        body.mesh.material[1].opacity = opacity;
        const selected = body.button.classList.contains("is-selected");
        body.shadow.material.opacity = (selected ? 0.46 : 0.36) * opacity;
        body.shadow.scale.set(rect.width + 100, rect.height + 100, 1);
        body.shadow.position.set(rect.left - bounds.left + rect.width / 2 + 12, height - (rect.top - bounds.top + rect.height / 2 + 20), -(selected ? 46 : 32) * sizeScale);
      }

      support.visible = Number.isFinite(supportLeft) && supportRight > supportLeft;
      if (support.visible) {
        const nextSupportWidth = Math.round(supportRight - supportLeft + 28);
        if (supportWidth !== nextSupportWidth) {
          support.geometry.dispose();
          support.geometry = cardGeometry(nextSupportWidth, 72, 8, 12, 2);
          support.geometry.translate(-nextSupportWidth / 2, -36, -6);
          supportWidth = nextSupportWidth;
        }
        support.position.set((supportLeft + supportRight) / 2, height - supportBottom - 12, -48);
        supportMaterial.opacity = supportEdgeMaterial.opacity = supportOpacity;
      }

      renderer.render(scene, camera);
      host.style.visibility = "visible";
      grid.classList.add("has-choice-depth");
    };

    const tick = (now: number) => {
      frame = 0;
      if (disposed || !available || document.hidden) return;
      try {
        draw();
      } catch {
        available = false;
        restoreHtml();
        return;
      }
      if (now < trackUntil) frame = requestAnimationFrame(tick);
    };

    // Follow only finite native transitions/deals. There is no idle render loop.
    const schedule = (duration = 850) => {
      if (disposed || !available || document.hidden) return;
      trackUntil = Math.max(trackUntil, performance.now() + (motion.matches ? 40 : duration));
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onNativeMotion = (event: Event) => {
      if (!(event.target instanceof Element) || !event.target.closest(".route-choice")) return;
      schedule(event.type.endsWith("end") || event.type.endsWith("cancel") ? 40 : 900);
    };
    const onResize = () => schedule(900);
    const onScroll = () => schedule(40);
    const onMotionPreference = () => {
      if (motion.matches) trackUntil = 0;
      schedule();
    };
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else schedule(1400);
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      available = false;
      cancelAnimationFrame(frame);
      frame = 0;
      restoreHtml();
    };
    const onContextRestored = () => {
      available = true;
      schedule(1400);
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(host);
    resizeObserver.observe(grid);
    const mutationObserver = new MutationObserver((records) => {
      // Ignore our readiness class/visibility changes, which must not restart RAF.
      if (records.some((record) => record.target !== host && (record.type === "childList" || record.target !== grid))) schedule(1400);
    });
    mutationObserver.observe(grid, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style", "aria-pressed"] });
    const ancestorObserver = new MutationObserver(() => schedule(1400));
    for (const ancestor of [grid.parentElement, grid.closest(".game-app")]) {
      if (ancestor) ancestorObserver.observe(ancestor, { attributes: true, attributeFilter: ["class", "style", "lang"] });
    }
    const nativeEvents = ["pointerover", "pointerout", "focusin", "focusout", "animationstart", "animationend", "animationcancel", "transitionrun", "transitionend", "transitioncancel"];
    nativeEvents.forEach((name) => grid.addEventListener(name, onNativeMotion));
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("visibilitychange", onVisibility);
    motion.addEventListener("change", onMotionPreference);
    document.fonts?.addEventListener("loadingdone", onResize);
    void document.fonts?.ready.then(() => { if (!disposed) schedule(200); });
    schedule(1400);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      ancestorObserver.disconnect();
      nativeEvents.forEach((name) => grid.removeEventListener(name, onNativeMotion));
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("visibilitychange", onVisibility);
      motion.removeEventListener("change", onMotionPreference);
      document.fonts?.removeEventListener("loadingdone", onResize);
      restoreHtml();
      bodies.forEach(clearBody);
      shadowGeometry.dispose();
      support.geometry.dispose();
      supportMaterial.dispose();
      supportEdgeMaterial.dispose();
      light.dispose();
      fill.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, []);

  return <div ref={hostRef} className="choice-depth-layer" data-testid="choice-depth-layer" aria-hidden="true" />;
}
