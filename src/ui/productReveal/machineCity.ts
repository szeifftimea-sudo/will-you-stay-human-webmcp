import * as T from "three";

/** Architectural set, only for the product presentation. No gameplay state. */
export function createMachineCity() {
  const city = new T.Group();
  city.name = "MachineCityArchitecturalSet";
  const stone = new T.MeshStandardMaterial({color:0x435965,metalness:.38,roughness:.39,transparent:true});
  const trim = new T.MeshStandardMaterial({color:0x597683,metalness:.62,roughness:.3,transparent:true});
  const cyan = new T.MeshBasicMaterial({color:0x3c8797,transparent:true});
  const amber = new T.MeshBasicMaterial({color:0xa8753c,transparent:true});
  const masses: T.Matrix4[] = [], ribs: T.Matrix4[] = [], windows: T.Matrix4[] = [], warm: T.Matrix4[] = [];
  const dummy = new T.Object3D();
  const block = (list:T.Matrix4[],x:number,y:number,z:number,w:number,d:number,h:number) => {
    dummy.position.set(x,y,z);dummy.scale.set(w,d,h);dummy.updateMatrix();list.push(dummy.matrix.clone());
  };
  // Setbacks, vertical fins and deep window reveals give Art Deco towers real relief.
  const tower = (x:number,y:number,w:number,d:number,h:number,seed:number) => {
    block(masses,x,y,.32,w+1,d+1,.64);
    for(let tier=0;tier<4;tier++) {
      const tw=w*(1-tier*.16),td=d*(1-tier*.14),th=h*[.52,.24,.16,.08][tier];
      const bottom=h*[0,.52,.76,.92][tier];
      block(masses,x,y,bottom+th/2,tw,td,th);
      block(ribs,x,y,bottom+th-.06,tw+.12,td+.12,.12);
      for(let col=0;col<5;col++) {
        const px=x+(col-2)*tw/5;
        block(ribs,px,y-td/2-.04,bottom+th/2,.055,.11,th);
        for(let row=0;row<Math.floor(th/.52);row++) {
          if((row*7+col*3+seed)%6===0) continue;
          block((seed+col)%5===0?warm:windows,px+tw/13,y-td/2-.055,bottom+.25+row*.52,tw/14,.025,.17);
        }
      }
      for(let col=0;col<4;col++) {
        const py=y+(col-1.5)*td/4;
        block(ribs,x+tw/2+.03,py,bottom+th/2,.08,.06,th);
        for(let row=0;row<Math.floor(th/.7);row++)
          block(windows,x+tw/2+.05,py+.13,bottom+.3+row*.7,.02,.15,.16);
      }
    }
    block(ribs,x,y,h+.5,.09,.09,1);
  };
  for(let row=0;row<6;row++) for(let lane=0;lane<3;lane++) for(const side of [-1,1]) {
    const seed=row*17+lane*7+(side+1);
    tower(side*(8+lane*5)+(row%2)*.8,7+row*8,3.1+lane*.3,3.6,7+(seed%11)*1.1,seed);
  }
  tower(2,32,6,5,27,31);
  // Elevated transit viaducts connect towers, with real supports and warm edge lines.
  for(const y of [14,30,46]) {
    block(masses,0,y,3.8,20,.95,.28);
    block(ribs,0,y-.5,4.04,20,.06,.3);
    block(warm,0,y-.535,4.15,20,.025,.025);
    for(const x of [-6,6]) block(masses,x,y,1.85,.38,.7,3.7);
  }
  const geometry=new T.BoxGeometry(1,1,1);
  for(const [mat,matrices] of [[stone,masses],[trim,ribs],[cyan,windows],[amber,warm]] as const) {
    const mesh=new T.InstancedMesh(geometry,mat,matrices.length);
    matrices.forEach((matrix,index)=>mesh.setMatrixAt(index,matrix));
    mesh.computeBoundingSphere();city.add(mesh);
  }
  for(const y of [19,38]) for(const [r,width,mat] of [[6.7,.24,trim],[6.4,.025,cyan],[7,.025,amber]] as const) {
    const arc=new T.Mesh(new T.TorusGeometry(r,width,8,80,Math.PI),mat);
    arc.rotation.x=Math.PI/2;arc.position.set(0,y,0);city.add(arc);
  }
  for(const side of [-1,1]) {
    const curve=new T.CatmullRomCurve3(Array.from({length:14},(_,i)=>new T.Vector3(side*(2+Math.sin(i*.43)*1.7),i*4-12,.03)));
    city.add(new T.Mesh(new T.TubeGeometry(curve,100,.025,5,false),side<0?cyan:amber));
  }
  return city;
}
