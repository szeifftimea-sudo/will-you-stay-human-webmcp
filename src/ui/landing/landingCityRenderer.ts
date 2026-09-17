import * as T from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { landingIntro } from "./landingIntro";

export async function createLandingCity(host: HTMLElement, onEntryReady: () => void = () => {}) {
  const renderer = new T.WebGLRenderer({ antialias:true, powerPreference:"low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
  renderer.info.autoReset=false;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  const scene=new T.Scene();scene.background=new T.Color("#041017");
  scene.fog=new T.FogExp2("#163641",.016);
  const studio=new RoomEnvironment(), pmrem=new T.PMREMGenerator(renderer);
  const environment=pmrem.fromScene(studio,.06);studio.dispose();pmrem.dispose();
  scene.environment=environment.texture;scene.environmentIntensity=.22;
  const camera=new T.PerspectiveCamera(43,1,.1,180);camera.up.set(0,0,1);
  scene.add(new T.HemisphereLight(0x9dcfdf,0x061014,.75));
  const key=new T.DirectionalLight(0x92d3e7,3.4);key.position.set(-16,-9,27);key.target.position.set(0,19,4);scene.add(key,key.target);
  key.castShadow=true;key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-42,right:42,top:42,bottom:-42,near:1,far:110});
  key.shadow.bias=-.0003;key.shadow.normalBias=.08;
  const amber=new T.DirectionalLight(0xf4a666,2.8);amber.position.set(25,30,12);scene.add(amber);
  const fill=new T.DirectionalLight(0xb8e0ee,.7);fill.position.set(15,-30,10);scene.add(fill);
  const composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new T.Vector2(790,512),.3,.65,1.1);composer.addPass(bloom);
  const output=new OutputPass();composer.addPass(output);
  let asset: Awaited<ReturnType<GLTFLoader["loadAsync"]>>;
  try { asset=await new GLTFLoader().loadAsync("/models/machine-city-landing-depth.glb"); }
  catch(error) { environment.dispose();composer.dispose();bloom.dispose();output.dispose();renderer.dispose();throw error; }
  asset.scene.rotation.x=Math.PI/2;scene.add(asset.scene);
  asset.scene.traverse(object=>{if(object instanceof T.Mesh){object.castShadow=true;object.receiveShadow=true;}});
  for(const [x,y,color] of [[-6,-4,0x40c9e5],[7,10,0xf4a666],[-6,24,0x40c9e5]]) {
    const pool=new T.PointLight(color,110,19,2);pool.position.set(x,y,2);scene.add(pool);
  }
  // Atmospheric horizon, not an image: architecture stays genuinely spatial.
  const sky=new T.Mesh(new T.SphereGeometry(145,24,12),new T.ShaderMaterial({
    side:T.BackSide,depthWrite:false,
    vertexShader:"varying vec3 direction; void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
    fragmentShader:"varying vec3 direction; void main(){float horizon=pow(1.0-clamp(normalize(direction).z,0.0,1.0),5.0);gl_FragColor=vec4(mix(vec3(.002,.006,.01),vec3(.026,.074,.092),horizon),1.0);}",
  }));scene.add(sky);
  host.appendChild(renderer.domElement);
  host.dataset.asset="Blender / machine-city-landing-depth.glb";
  const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
  const started=performance.now();
  let frame=0,disposed=false,entryShown=false,px=0,py=0,targetX=0,targetY=0;
  function resize() {
    const {width,height}=host.getBoundingClientRect();
    renderer.setSize(width,height,false);composer.setSize(width,height);
    camera.aspect=width/Math.max(height,1);camera.updateProjectionMatrix();request();
  }
  function request() {if(!disposed&&!document.hidden&&!frame)frame=requestAnimationFrame(tick);}
  function tick(now:number) {
    frame=0;if(disposed)return;
    const intro=landingIntro(now-started,motion.matches);
    host.style.setProperty("--human-preview-opacity",String(intro.humanOpacity));
    host.dataset.copyStage=String(intro.copyStage);
    host.dataset.intro=intro.entryReady?"entry":intro.humanOpacity>0?"human":"city";
    if(intro.entryReady&&!entryShown){entryShown=true;onEntryReady();}
    const progress=motion.matches?1:Math.min(1,(now-started)/12000);
    const glide=progress*progress*(3-2*progress);
    px+=(targetX-px)*.035;py+=(targetY-py)*.035;
    if(motion.matches){px=0;py=0;}
    camera.position.set(8.1-glide*1.8+px*.55,-32+glide*5,7.5+glide*.5+py*.25);
    camera.lookAt(camera.aspect<1?3:-2,28,12);
    renderer.info.reset();composer.render();
    // Buildings and lights are static; camera motion needs no shadow-map rerender.
    renderer.shadowMap.autoUpdate=false;
    host.dataset.drawCalls=String(renderer.info.render.calls);
    host.dataset.triangles=String(renderer.info.render.triangles);
    if(!motion.matches&&(progress<1||Math.abs(px-targetX)+Math.abs(py-targetY)>.002))request();
  }
  const section=host.parentElement!;
  function pointer(event:PointerEvent){
    if(motion.matches||event.pointerType!=="mouse")return;
    const rect=host.getBoundingClientRect();targetX=(event.clientX-rect.left)/rect.width-.5;targetY=(event.clientY-rect.top)/rect.height-.5;request();
  }
  function leave(){targetX=0;targetY=0;request();}
  function visibility(){if(document.hidden){cancelAnimationFrame(frame);frame=0;}else request();}
  const observer=new ResizeObserver(resize);observer.observe(host);
  section.addEventListener("pointermove",pointer);section.addEventListener("pointerleave",leave);
  motion.addEventListener("change",request);document.addEventListener("visibilitychange",visibility);resize();
  return {dispose(){
    disposed=true;cancelAnimationFrame(frame);observer.disconnect();
    section.removeEventListener("pointermove",pointer);section.removeEventListener("pointerleave",leave);
    motion.removeEventListener("change",request);document.removeEventListener("visibilitychange",visibility);
    const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>();
    scene.traverse(object=>{if(object instanceof T.Mesh){geometries.add(object.geometry);for(const mat of Array.isArray(object.material)?object.material:[object.material])materials.add(mat);}});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
    environment.dispose();bloom.dispose();output.dispose();composer.dispose();renderer.dispose();renderer.domElement.remove();
  }};
}
