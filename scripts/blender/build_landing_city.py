"""Landing-only architectural set. Editable Blender source and web GLB.

No product-reveal assets, game state or gameplay objects are read or modified.
Coordinates are metres, Z-up; the web renderer restores Z-up after glTF export.
"""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[2]
random.seed(73)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
materials = {}
def material(name, color, metal=.4, rough=.4, emission=0):
    mat=bpy.data.materials.new(name); mat.diffuse_color=(*color,1); mat.use_nodes=True
    bs=mat.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*color,1)
    bs.inputs['Metallic'].default_value=metal; bs.inputs['Roughness'].default_value=rough
    if emission:
        bs.inputs['Emission Color'].default_value=(*color,1)
        bs.inputs['Emission Strength'].default_value=emission
    materials[name]=mat
material('Graphite',(.032,.059,.071),.65,.37)
material('Facade',(.065,.11,.13),.55,.38)
material('DarkGlass',(.014,.043,.061),.75,.22)
material('EdgeMetal',(.15,.22,.25),.75,.3)
material('Cyan',(.09,.62,.76),.25,.3,2)
material('WindowBlue',(.10,.30,.37),.2,.35,.8)
material('Amber',(.95,.40,.10),.3,.3,1.6)
material('WarmWindow',(.65,.40,.18),.2,.4,.8)
material('Road',(.009,.024,.032),.12,.58)
buffers={name:([],[]) for name in materials}
def block(name, pos, size):
    vertices,faces=buffers[name]; off=len(vertices)
    x,y,z=pos; a,b,c=[s/2 for s in size]
    vertices.extend([(x+dx*a,y+dy*b,z+dz*c) for dx,dy,dz in
                     [(-1,-1,-1),(1,-1,-1),(1,1,-1),(-1,1,-1),(-1,-1,1),(1,-1,1),(1,1,1),(-1,1,1)]])
    faces.extend([tuple(off+i for i in f) for f in [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]])

def line(name, points, radius=.035):
    curve=bpy.data.curves.new(name+'Architecture','CURVE');curve.dimensions='3D'
    curve.bevel_depth=radius;curve.bevel_resolution=2;curve.resolution_u=16
    spline=curve.splines.new('POLY');spline.points.add(len(points)-1)
    for p,co in zip(spline.points,points):p.co=(*co,1)
    obj=bpy.data.objects.new(name+'Line',curve);bpy.context.collection.objects.link(obj);obj.data.materials.append(materials[name])
    return obj

def tower(x,y,w,d,h,hero=False):
    block('Graphite',(x,y,1),(w+1.3,d+1.3,2))
    block('DarkGlass',(x,y,h*.36),(w,d,h*.72))
    for tier,scale in enumerate([1,.79,.58,.36]):
        z=h*(.72+tier*.085)
        block('DarkGlass',(x,y,z),(w*scale,d*scale,h*.16))
        block('EdgeMetal',(x,y,z-h*.08),(w*scale+.15,d*scale+.15,.11))
        for rib in [-.45,-.22,0,.22,.45]:
            block('Facade',(x+w*scale*rib,y-d*scale/2-.07,z),(.075,.16,h*.16))
            block('Facade',(x+w*scale/2+.06,y+d*scale*rib,z),(.15,.075,h*.16))
        for level in range(3):
            for dx in [-.33,-.11,.11,.33]:
                block('WindowBlue',(x+w*scale*dx,y-d*scale/2-.025,z-h*.05+level*h*.044),(.065,.035,.17))
    for dx in [-.46,-.30,0,.30,.46]:
        block('Facade',(x+w*dx,y-d/2-.08,h*.36),(.11,.22,h*.7))
    for side in [-1,1]:
        block('EdgeMetal',(x+side*w*.48,y,h*.36),(.09,d+.13,h*.7))
        for dy in ([-.36,-.12,.12,.36] if y<0 else []):
            block('Facade',(x+side*(w/2+.05),y+d*dy,h*.36),(.13,.07,h*.7))
    floors=int(h*.7/.62)
    for j in range(2,floors):
        z=j*.62
        for i in range(5):
            if random.random()<.39:continue
            shade='WarmWindow' if random.random()<.20 else 'WindowBlue'
            block(shade,(x+(i-2)*w*.16,y-d/2-.025,z),(w*.042,.045,.16))
        for i in range(4):
            if random.random()<.5:continue
            for side in ([-1,1] if y<0 else [1]):
                block('WindowBlue',(x+side*(w/2+.025),y+(i-1.5)*d*.19,z),(.045,d*.045,.16))
    block('EdgeMetal',(x,y,h*1.10),(.12,.12,h*.16))
    for side in [-1,1]:
        block('Facade',(x+side*w*.12,y,h*1.03),(.09,.22,h*.16))
    if hero:
        for dx in [-.30,0,.30]:
            line('Cyan',[(x+w*dx,y-d/2-.22,2),(x+w*dx,y-d/2-.22,h*.77)],.025)
        line('Amber',[(x-w*.4,y-d/2-.25,1),(x+w*.4,y-d/2-.25,1)],.045)

# Layered skyline around a clear central approach, rather than a navigable world.
for row,y in enumerate([6,17,29,43,59]):
    for col,x in enumerate([-25,-17,-10,10,18,27]):
        if row==0 and x<0: continue  # breathing room behind the HTML title
        w=random.uniform(3.2,5.3);d=random.uniform(3.5,5.2)
        h=random.uniform(10,23)+(row*1.2)
        tower(x+random.uniform(-1,1),y,w,d,h)
tower(1.5,36,7.5,7.5,32,True)
tower(11,28,5.4,6,24,True)

# Near / middle / distant architecture: actual geometry supplies parallax.
# The left-hand title pocket remains open; the near right tower frames the view.
tower(18,-7,6,7,29,True)
tower(-18,-3,5,6,22)
for x,y in [(-12,13),(13,17),(-15,34),(17,40)]:
    block('Graphite',(x,y,2),(4,6,4))
    for inset in range(3):
        block('EdgeMetal',(x,y-3.03,1+inset*.65),(3.4,.08,.08))
    line('Amber',[(x-1.5,y-3.1,.65),(x+1.5,y-3.1,.65)],.026)
for x in [-7.5,8.5]:
    for y in [-8,4,17,31]:
        block('Graphite',(x,y,.72),(.28,.48,1.44))
        block('EdgeMetal',(x,y,1.48),(.46,.58,.12))
        block('Cyan' if x<0 else 'Amber',(x,y-.245,1.1),(.16,.04,.48))

# Pedestrian approach, grooves and two luminous transit ribbons.
block('Road',(0,14,-.36),(70,130,.6))
for y in range(-26,40,3):
    block('EdgeMetal',(1,y,-.045),(12,.055,.035))
for x in [-5,7]:
    block('Graphite',(x,7,.09),(.24,62,.32))
    line('Cyan' if x<0 else 'Amber',[(x,-24,.26),(x,38,.26)],.035)
# Inlaid approach seams and a lowered street beside the raised pedestrian deck.
block('Graphite',(1,3,-.25),(12,60,.45))
for x in [-3,-1,1,3,5]:
    line('EdgeMetal',[(x,-24,.01),(x,34,.01)],.012)
for y in [-12,-3,7,18,30]:
    for x in [-4.3,6.3]:
        block('Cyan' if x<0 else 'Amber',(x,y,.02),(.08,1.5,.035))
for side in [-1,1]:
    points=[]
    for i in range(100):
        t=i/99; y=-23+t*83
        x=side*(8+3.5*math.sin(t*math.pi*1.6))
        z=.4+2.4*math.sin(t*math.pi*.8)
        points.append((x,y,z))
    line('Graphite',points,.32)
    line('Cyan' if side<0 else 'Amber',[(x,y,z+.30) for x,y,z in points],.038)
    for i in [15,30,45,60,75,90]:
        x,y,z=points[i];block('Facade',(x,y,z/2),(.35,.45,z))

# Three dimensional monumental gateway and elevated bridges.
for y,r in [(1,11),(15,9)]:
    for delta,mat,thickness in [(0,'Graphite',.38),(.48,'EdgeMetal',.08),(-.28,'Amber',.025)]:
        line(mat,[(1+(r+delta)*math.cos(i*math.pi/80),y,1+(r+delta)*math.sin(i*math.pi/80)) for i in range(81)],thickness)
    for x in [1-r,1+r]: block('Graphite',(x,y,.5),(.8,1.8,1))
for y,z in [(20,5.6),(46,9)]:
    block('Graphite',(1,y,z),(23,1.3,.38))
    for x in range(-10,13,2):block('Facade',(x,y,z+.55),(.065,1.2,1))
    for offset in [-.63,.63]:line('Cyan', [(-10,y+offset,z+.95),(12,y+offset,z+.95)],.018)

for name,(vertices,faces) in buffers.items():
    if not vertices: continue
    mesh=bpy.data.meshes.new(name+'Mesh');mesh.from_pydata(vertices,[],faces);mesh.update()
    obj=bpy.data.objects.new('City_'+name,mesh);bpy.context.collection.objects.link(obj);obj.data.materials.append(materials[name])
    if name == 'Graphite':
        bevel=obj.modifiers.new('Architectural edge chamfers','BEVEL');bevel.width=.055;bevel.segments=2
        bevel.affect='EDGES'
        bpy.context.view_layer.objects.active=obj;bpy.ops.object.modifier_apply(modifier=bevel.name)


scene=bpy.context.scene
scene.world.color=(.025,.04,.05)
bpy.ops.object.camera_add(location=(7,-29,8))
camera=bpy.context.object;camera.name='LandingCamera';camera.rotation_euler=(Vector((0,26,12))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=33;scene.camera=camera
for name,loc,power,color,size in [('CoolKey',(2,-5,30),8000,(.45,.75,1),22),('WarmRim',(-20,26,19),10000,(1,.48,.19),18)]:
    bpy.ops.object.light_add(type='AREA',location=loc);light=bpy.context.object;light.name=name;light.data.energy=power;light.data.color=color;light.data.shape='DISK';light.data.size=size
    light.rotation_euler=(Vector((0,20,6))-light.location).to_track_quat('-Z','Y').to_euler()
scene.render.engine='BLENDER_EEVEE';scene.render.resolution_x=1280;scene.render.resolution_y=800;scene.render.resolution_percentage=100
scene['purpose']='Online game landing only; decorative architecture; no game commands.'
for folder in ['assets/blender','public/models','docs/evidence/landing-machine-city']:(ROOT/folder).mkdir(parents=True,exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/blender/machine-city-landing-depth.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/models/machine-city-landing-depth.glb'),export_format='GLB',export_cameras=False,export_lights=False,export_yup=True,export_apply=True)
report={'source':'machine-city-landing-depth.blend','glbBytes':(ROOT/'public/models/machine-city-landing-depth.glb').stat().st_size,'operations':['Stepped architectural shells','Chamfered facade edges','Recessed window strips','Dimensional gateway arches','Raised transit ribbons and bridge structures','Near-field framing towers for camera parallax','Raised approach with inlaid seams and physical lamps','Material-separated joined geometry','glTF export without runtime lights/camera']}
(ROOT/'docs/evidence/landing-machine-city/asset-depth-report.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report))
