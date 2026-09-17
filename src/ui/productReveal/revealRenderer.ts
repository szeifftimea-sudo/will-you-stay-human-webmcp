import * as T from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { clamp01, ease, revealClipTime, revealPose, type RevealStep } from "./revealSequence";
import { reviewShot, PRODUCT_SHOTS } from "./revealShots";
import { createMachineCity } from "./machineCity";
import { fitProductFrame } from "./revealFraming";

function required(root: T.Object3D, name: string) {
  const object = root.getObjectByName(name);
  if (!object) throw new Error(`Product asset node missing: ${name}`);
  return object;
}

export async function createRevealRenderer(host: HTMLElement, onSettled: () => void) {
  const shot = reviewShot(window.location.search);
  const scene = new T.Scene();
  scene.background = new T.Color("#061014");
  const fog = new T.FogExp2("#061014", .014);
  scene.fog = fog;
  const camera = new T.PerspectiveCamera(35, 1, .1, 180);
  camera.up.set(0, 0, 1);
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const studio = new RoomEnvironment();
  const pmrem = new T.PMREMGenerator(renderer);
  const reflection = pmrem.fromScene(studio, .04);
  scene.environment = reflection.texture;
  scene.environmentIntensity = .24;
  studio.dispose(); pmrem.dispose();
  host.appendChild(renderer.domElement);
  const ambient = new T.HemisphereLight(0xc7e5e9, 0x101923, 1.1);
  ambient.position.set(0, 0, 20); scene.add(ambient);
  const key = new T.DirectionalLight(0xe4f3f7, 3.2);
  key.position.set(-5, -7, 12); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, {left:-15,right:15,top:15,bottom:-15,near:1,far:45});
  key.shadow.bias = -.00025; key.shadow.normalBias = .02;
  key.shadow.intensity = .72;
  key.shadow.radius = 4;
  scene.add(key);
  const rim = new T.DirectionalLight(0x68d4e8, 2.0); rim.position.set(8, 5, 7); scene.add(rim);
  const warm = new T.DirectionalLight(0xf4a666, 1.6); warm.position.set(-8, 4, 4); scene.add(warm);
  const floor = new T.Mesh(new T.PlaneGeometry(500,500), new T.MeshLambertMaterial({color:0x091218}));
  floor.position.z = -.06; floor.receiveShadow = true; scene.add(floor);

  const city = createMachineCity(); scene.add(city);
  const cityMaterials=new Set<T.Material>();
  city.traverse(object=>{if(object instanceof T.Mesh) {
    for(const mat of Array.isArray(object.material)?object.material:[object.material]) cityMaterials.add(mat);
  }});

  let mixer: T.AnimationMixer | undefined;
  let frame = 0, disposed = false, loaded = false;
  const resources = new Set<T.Object3D>([scene]);
  function cleanup() {
    disposed = true; cancelAnimationFrame(frame); observer.disconnect(); motion.removeEventListener("change", preferenceChanged);
    mixer?.stopAllAction();
    if (mixer) mixer.uncacheRoot(mixer.getRoot());
    const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>(), textures = new Set<T.Texture>();
    for (const root of resources) root.traverse((object) => {
      if (object instanceof T.Mesh || object instanceof T.Line) {
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material)?object.material:[object.material]) {
          materials.add(material);
          for (const value of Object.values(material)) if (value instanceof T.Texture) textures.add(value);
        }
      }
    });
    geometries.forEach((g)=>g.dispose()); materials.forEach((m)=>m.dispose()); textures.forEach((t)=>t.dispose());
    reflection.dispose(); renderer.dispose(); renderer.domElement.remove();
  }
  const observer = new ResizeObserver(() => { resize(); requestRender(); });
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  function preferenceChanged() { if (motion.matches) { position = target; moving = false; onSettled(); } requestRender(); }
  motion.addEventListener("change", preferenceChanged);
  let position = shot?.pose ?? 0, startPosition = 0, target: RevealStep = 0, startTime = 0, moving = false;
  let settledTime=performance.now(), drift=0;
  function resize() {
    const {width,height} = host.getBoundingClientRect();
    renderer.setSize(width,height,false); camera.aspect = width/Math.max(1,height); camera.updateProjectionMatrix();
  }
  observer.observe(host); resize();
  const loader = new GLTFLoader();
  let asset;
  try {
    asset = await loader.loadAsync("/models/product-reveal-animated.glb");
  } catch (error) { cleanup(); throw error; }
  asset.scene.rotation.x=Math.PI/2;
  scene.add(asset.scene); resources.add(asset.scene);
  if (asset.animations.length !== 1) { cleanup(); throw new Error("Blender product reveal clip missing"); }
  const product = required(asset.scene,"RevealPackaging");
  const rig = required(asset.scene,"ProductRevealRig");
  mixer = new T.AnimationMixer(asset.scene);
  const action = mixer.clipAction(asset.animations[0]);
  action.setLoop(T.LoopOnce,1); action.clampWhenFinished=true; action.play();
  host.dataset.animationSource="Blender / product-reveal-animated.glb";
  // Foil, print and outlined lettering sit fractions of a millimetre above stock.
  // Let solid parts cast contact shadows; avoid shadow-map acne on printed layers.
  scene.traverse((object)=> { if(object instanceof T.Mesh) {
    object.castShadow=/HousingBody|HousingBackplate|LidTop|LidSkirt|BaseWall|SliderBody|Cradle/.test(object.name);
    object.receiveShadow=/InsertFloor|BoardRestPad|MarkerTray|BaseFloor/.test(object.name);
  } });
  floor.receiveShadow=true;
  const boxMaterials = new Set<T.Material>();
  product.traverse((object) => {
    if (object instanceof T.Mesh) {
      object.material = Array.isArray(object.material) ? object.material.map(m=>m.clone()) : object.material.clone();
      for (const material of Array.isArray(object.material)?object.material:[object.material]) {
        material.transparent=true; boxMaterials.add(material);
      }
    }
  });
  const focus=new T.Vector3();
  const projected = new T.Vector3();
  function protectCopySpace() {
    if (shot || position < .82) return;
    const station = Math.round(position);
    const weight = ease(1 - Math.abs(position - station) / .18);
    if (weight <= 0 || station < 1) return;
    const root = host.parentElement!;
    const copy = root.querySelector<HTMLElement>(".product-reveal__copy")!.getBoundingClientRect();
    const controls = root.querySelector<HTMLElement>(".product-reveal__controls")!.getBoundingClientRect();
    const viewport = host.getBoundingClientRect();
    const width = viewport.width, height = viewport.height, gap = 24;
    const sideCopy = station === 1 && width > 600;
    const safe = {
      left: sideCopy ? copy.right - viewport.left + gap : width * .06,
      right: width * .94,
      top: sideCopy ? 58 : copy.bottom - viewport.top + gap,
      bottom: controls.top - viewport.top - gap,
    };
    if (safe.right <= safe.left || safe.bottom <= safe.top) return;
    const bounds = {left:Infinity,top:Infinity,right:-Infinity,bottom:-Infinity};
    scene.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    rig.traverseVisible(object => {
      if (!(object instanceof T.Mesh)) return;
      const mats = Array.isArray(object.material) ? object.material : [object.material];
      if (mats.every(mat => !mat.visible || mat.opacity < .01)) return;
      if (!object.geometry.boundingBox) object.geometry.computeBoundingBox();
      const box = object.geometry.boundingBox!;
      for (let i=0;i<8;i++) {
        projected.set(i&1?box.max.x:box.min.x,i&2?box.max.y:box.min.y,i&4?box.max.z:box.min.z)
          .applyMatrix4(object.matrixWorld).project(camera);
        const x=(projected.x+1)*width/2, y=(1-projected.y)*height/2;
        bounds.left=Math.min(bounds.left,x);bounds.right=Math.max(bounds.right,x);
        bounds.top=Math.min(bounds.top,y);bounds.bottom=Math.max(bounds.bottom,y);
      }
    });
    if (!Number.isFinite(bounds.left)) return;
    const fit = fitProductFrame(bounds,safe);
    const scale = 1+(fit.scale-1)*weight;
    // Scale/translate projection, not the object: hinges, materials and clip stay intact.
    const shiftX=((fit.scale-1)+2*fit.x/width)*weight;
    const shiftY=((1-fit.scale)-2*fit.y/height)*weight;
    const matrix=camera.projectionMatrix.elements;
    matrix[0]*=scale;matrix[5]*=scale;
    matrix[8]=matrix[8]*scale-shiftX;matrix[9]=matrix[9]*scale-shiftY;
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }
  const views = [
    {pose:0,camera:[11,-25,13],look:[0,25,9]},
    {pose:.55,camera:[8,-18,7.5],look:[0,2,3.4]},
    {pose:1,camera:[11,-14,8.5],look:[-1.4,0,3.25]},
    PRODUCT_SHOTS.opening,
    {pose:2,camera:[4,-15.5,21.5],look:[-2.1,0,1.5]},
    {pose:2.08,camera:[2,-8,10],look:[0,-1.1,1.8]},
    {...PRODUCT_SHOTS.folded,pose:2.18,look:[0,.6,3.5]},
    {pose:2.48,camera:[-.4,-6.6,8],look:[-.1,-.25,3.3]},
    {pose:2.72,camera:[2,-8,12.4],look:[0,-1.2,2]},
    {pose:3,camera:[1.8,-10,16.7],look:[0,-1.5,1.7]},
  ].map(s=>({...s,camera:new T.Vector3(...s.camera),look:new T.Vector3(...s.look)}));
  function paint() {
    const pose=revealPose(position);
    scene.environmentIntensity=.26;
    ambient.intensity=1.4-.65*ease(position);
    // All physical object transforms come from Blender's sampled clip.
    // Camera and lighting are presentation-only; there is no domain state here.
    action.paused=false;
    mixer!.setTime(revealClipTime(position));
    const next=views.findIndex(view=>view.pose>position);
    const index=next<0?views.length-2:Math.max(0,next-1);
    const a=views[index], b=views[index+1], blend=ease((position-a.pose)/(b.pose-a.pose));
    camera.position.lerpVectors(a.camera,b.camera,blend); focus.lerpVectors(a.look,b.look,blend);
    if(!moving && !shot && !motion.matches) {
      // A short dolly/orbit, not an endless spinning product or looping effect.
      camera.position.x+=drift*(position===0?-1.4:position===1?-.75:.35);
      camera.position.y+=drift*(position===0?1.8:.35);
    }
    if(shot) {camera.position.set(...shot.camera);focus.set(...shot.look);}
    if(camera.aspect<1.55) camera.position.sub(focus).multiplyScalar(1.55/camera.aspect).add(focus);
    camera.lookAt(focus);
    camera.updateProjectionMatrix();
    city.visible=position<.98;
    cityMaterials.forEach(mat=>{mat.opacity=1-ease((position-.25)/.7);});
    scene.fog = fog;
    fog.density=.014-.008*ease(position);
    rig.visible=position>.08;
    product.visible=pose.boardUnfold<1;
    boxMaterials.forEach(material=> {material.opacity=1-pose.boardUnfold;});
    protectCopySpace();
    // Slightly stronger grazing key reveals the bevel and hinge without neon bloom.
    key.intensity=3.2-ease(position)*1.0;
    rim.intensity=2-ease(position)*.8;
    warm.intensity=1.6-ease(position)*.8;
    renderer.render(scene,camera);
    host.dataset.drawCalls=String(renderer.info.render.calls);
    host.dataset.triangles=String(renderer.info.render.triangles);
    host.dataset.pose=position.toFixed(3);
  }
  function tick(now: number) {
    frame=0; if(disposed || !loaded) return;
    if(moving) {
    const duration=target===3?5000:target===2?2600:target===0?900:1600;
      const progress=clamp01((now-startTime)/duration);
      position=startPosition+(target-startPosition)*progress;
      if(progress===1) {moving=false;settledTime=now;onSettled();}
    }
    drift=ease((now-settledTime)/4500);
    paint(); if(moving || (!shot&&!motion.matches&&drift<1)) requestRender();
  }
  function requestRender() { if(!frame&&!disposed) frame=requestAnimationFrame(tick); }
  loaded = true; settledTime=performance.now(); paint(); requestRender();
  return {
    go(step: RevealStep) {
      target=step; startPosition=position;startTime=performance.now();settledTime=startTime;drift=0;
      if(motion.matches||step===0) {position=step;moving=false;paint();onSettled();}
      else {moving=true;requestRender();}
    }, dispose:cleanup,
  };
}
