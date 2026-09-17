"""Real presentation-only packaging details, reusing the existing city artwork.

Called from the separate reveal authoring scene. Never edits gameplay assets.
"""
import math
import random
import bpy
from mathutils import Vector

def detail_product(base, lid, left, markers):
    collection = bpy.context.scene.collection
    def material(name, color, metallic, roughness):
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        p = mat.node_tree.nodes.get('Principled BSDF')
        p.inputs['Base Color'].default_value = (*color, 1)
        p.inputs['Metallic'].default_value = metallic
        p.inputs['Roughness'].default_value = roughness
        return mat
    graphite = material('Reveal_SoftTouchGraphite', (.018,.029,.036), .12,.48)
    lining = material('Reveal_MicrofiberInsert', (.012,.020,.023), .0,.84)
    cyan = material('Reveal_CyanFoil', (.14,.66,.81), .72,.27)
    amber = material('Reveal_AmberFoil', (.90,.38,.13), .78,.28)
    edge = material('Reveal_PaperEdge', (.05,.075,.083), .20,.43)
    ribbonmat = material('Reveal_WovenRibbon', (.035,.073,.083), .15,.60)
    puck = material('Reveal_AnodizedMarker', (.015,.22,.29), .65,.32)
    puckface = material('Reveal_SatinMarkerFace', (.004,.12,.18), .60,.32)
    # Presentation lighting must reveal the body without turning graphite grey.
    for name in ('Housing_DarkPetrol','Edge_IvoryMetal','Backplate_DarkPetrol'):
        if name in bpy.data.materials:
            p=bpy.data.materials[name].node_tree.nodes.get('Principled BSDF')
            p.inputs['Base Color'].default_value=(.014,.024,.030,1)
            p.inputs['Metallic'].default_value=.38
            p.inputs['Roughness'].default_value=.40

    # Embedded micro-normal map: actual PBR texture, also supported by glTF.
    rng = random.Random(84)
    image=bpy.data.images.new('Packaging micrograin normal',width=128,height=128)
    image.colorspace_settings.name='Non-Color'
    pixels=[]
    for _ in range(128*128):
        pixels.extend((.5+rng.uniform(-.045,.045),.5+rng.uniform(-.035,.035),1,1))
    image.pixels.foreach_set(pixels)
    image.pack()
    for mat in (graphite,lining,ribbonmat):
        nodes=mat.node_tree.nodes
        tex=nodes.new('ShaderNodeTexImage'); tex.image=image
        normal=nodes.new('ShaderNodeNormalMap');normal.inputs['Strength'].default_value=.24 if mat!=lining else .6
        mat.node_tree.links.new(tex.outputs['Color'],normal.inputs['Color'])
        mat.node_tree.links.new(normal.outputs['Normal'],nodes.get('Principled BSDF').inputs['Normal'])

    def mesh(name, verts, faces, parent, mat, bevel=0):
        data=bpy.data.meshes.new(name); data.from_pydata(verts,[],faces);data.update()
        obj=bpy.data.objects.new(name,data);collection.objects.link(obj);obj.parent=parent
        obj.data.materials.append(mat)
        if bevel:
            mod=obj.modifiers.new('Soft manufactured edge','BEVEL');mod.width=bevel;mod.segments=4
            obj.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL')
        return obj
    def box(name, size, at, parent, mat, bevel=.02):
        bpy.ops.mesh.primitive_cube_add(size=1,location=at)
        obj=bpy.context.object;obj.name=name;obj.dimensions=size
        bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
        obj.parent=parent;obj.data.materials.clear();obj.data.materials.append(mat)
        if bevel:
            mod=obj.modifiers.new('Soft manufactured edge','BEVEL');mod.width=bevel;mod.segments=5
            obj.modifiers.new('Weighted surface normals','WEIGHTED_NORMAL')
        return obj
    def path(name, points, parent, mat, radius=.008):
        data=bpy.data.curves.new(name,'CURVE');data.dimensions='3D';data.bevel_depth=radius;data.bevel_resolution=3
        poly=data.splines.new('POLY');poly.points.add(len(points)-1)
        for p,co in zip(poly.points,points):p.co=(*co,1)
        obj=bpy.data.objects.new(name,data);collection.objects.link(obj);obj.parent=parent;obj.data.materials.append(mat)
        bpy.ops.object.select_all(action='DESELECT');obj.select_set(True);bpy.context.view_layer.objects.active=obj
        bpy.ops.object.convert(target='MESH');obj.select_set(False)
        return obj
    def rounded(w,h,z,r=.18):
        pts=[]
        for x,y,a in ((w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)):
            for j in range(13):
                t=math.radians(a+j*90/12)
                pts.append((x+math.cos(t)*r,y+math.sin(t)*r,z))
        return pts+[pts[0]]
    def print_plane(name,verts,uvs,parent,mat):
        obj=mesh(name,verts,[(0,1,2,3)],parent,mat)
        uv=obj.data.uv_layers.new()
        for loop,p in zip(uv.data,uvs):loop.uv=p
        return obj

    # Existing shell geometry gets a small extra bevel and tactile soft-touch stock.
    for obj in [*base.children_recursive,*lid.children_recursive]:
        if obj.type!='MESH':continue
        if any(key in obj.name for key in ('BaseFloor','BaseWall','LidTop','LidSkirt')):
            obj.data.materials.clear();obj.data.materials.append(graphite)
            mod=obj.modifiers.new('Paper wrapped radius','BEVEL');mod.width=.022;mod.segments=4
            obj.modifiers.new('Weighted wrapped normals','WEIGHTED_NORMAL')
        if any(key in obj.name for key in ('Cradle','MarkerTray','InsertFloor','BoardRestPad')):
            obj.data.materials.clear();obj.data.materials.append(lining)

    # Layered cover edge and registering foil contours, just above the printed face.
    path('LidWrappedEdge',rounded(6.08,7.33,1.52,.12),lid,edge,.016)
    path('CoverOuterFoil',rounded(5.78,7.00,1.568,.21),lid,amber,.008)
    path('CoverInnerFoil',rounded(5.63,6.86,1.57,.30),lid,cyan,.004)
    for sign in (-1,1):
        for corner in (-1,1):
            # Art-deco stepped corner motif rather than gears or bright neon.
            x,y=sign*2.68,corner*3.19
            path('FoilCorner',[(x-sign*.42,y,1.574),(x-sign*.13,y,1.574),(x,y-corner*.13,1.574),(x,y-corner*.52,1.574)],lid,cyan if sign<0 else amber,.009)
            for i in range(3):
                box('FoilRegistration',(.032,.032,.005),(x-sign*(.25+i*.11),y-corner*.10,1.572),lid,amber,.005)
    # Visible telescoping seam and inside wrap lip: real rings, not a screen border.
    path('BaseWrapSeam',rounded(5.92,7.17,.76,.12),base,edge,.012)
    path('InnerRimFoil',rounded(5.65,6.89,1.315,.14),base,amber,.009)

    city=bpy.data.materials['OriginalMachineCityPrint']
    # Side and upper-end printing uses the exact cover illustration and palette.
    for side in (-1,1):
        x=side*3.062
        verts=[(x,-3.50,.85),(x,3.50,.85),(x,3.50,1.41),(x,-3.50,1.41)]
        if side<0:verts.reverse()
        print_plane('CitySpinePrint',verts,[(0,.05),(1,.05),(1,.42),(0,.42)],lid,city)
        for z,mat in ((.865,cyan),(1.405,amber)):
            path('SpineFoil',[(x,-3.38,z),(x,3.38,z)],lid,mat,.007)
    print_plane('CityTopEndPrint',[(-2.86,3.687,.84),(2.86,3.687,.84),(2.86,3.687,1.42),(-2.86,3.687,1.42)],[(0,.05),(1,.05),(1,.42),(0,.42)],lid,city)
    for z,mat in ((.86,cyan),(1.40,amber)):
        path('TopEndFoil',[(-2.80,3.694,z),(2.80,3.694,z)],lid,mat,.007)
    # Side identity, reusing the already approved outlined front title.
    for source,at,scale in [('CoverTitleOne',(3.072,-2.25,1.20),.22),('CoverTitleTwo',(3.072,-.35,1.20),.22)]:
        obj=bpy.data.objects[source].copy();obj.data=obj.data.copy();obj.name='SpineTitle'
        collection.objects.link(obj);obj.parent=lid;obj.rotation_mode='XYZ'
        obj.location=at;obj.rotation_euler=(math.pi/2,0,math.pi/2);obj.scale=(scale,scale,scale)

    # Five genuinely separate recessed cups with rounded lips and felt pads.
    for i in range(5):
        x,y=-1.8+i*.9,-2.56
        pts=[(x+.22*math.cos(j*math.tau/48),y+.22*math.sin(j*math.tau/48),.407) for j in range(49)]
        path(f'MarkerPocketLip_{i}',pts,base,edge,.018)
        bpy.ops.mesh.primitive_cylinder_add(vertices=48,radius=.207,depth=.045,location=(x,y,.32))
        obj=bpy.context.object;obj.name=f'MarkerFeltPad_{i}';obj.parent=base;obj.data.materials.append(lining)
        # Notch into the tray gives a finger access gap next to each piece.
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,radius=.12,location=(x,y-.20,.46))
        cutter=bpy.context.object
        tray=bpy.data.objects['MarkerTray'];mod=tray.modifiers.new('Finger access','BOOLEAN');mod.object=cutter;mod.operation='DIFFERENCE'
        bpy.context.view_layer.objects.active=tray;bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.data.objects.remove(cutter,do_unlink=True)
    # Satin lifting ribbon extends from beneath the board into the free insert strip.
    ribbon=mesh('LiftingRibbon',[(-.19,-1.45,.25),(.19,-1.45,.25),(.19,-2.05,.45),(-.19,-2.05,.45)],[(0,1,2,3)],base,ribbonmat)
    solid=ribbon.modifiers.new('Woven ribbon thickness','SOLIDIFY');solid.thickness=.012
    # Tonal city print on the folded board's visible rear skin; the gameplay asset is untouched.
    rear_mat=bpy.data.materials['Face_CityPrint'].copy();rear_mat.name='Reveal_RearCityPrint'
    nodes=rear_mat.node_tree.nodes;shader=nodes.get('Principled BSDF');tex=next(n for n in nodes if n.type=='TEX_IMAGE')
    rear_mat.node_tree.links.new(tex.outputs['Color'],shader.inputs['Base Color'])
    rear=print_plane('FoldedRearCityPrint',[(-4.78,1.73,-.287),(-.22,1.73,-.287),(-.22,-2.00,-.287),(-4.78,-2.00,-.287)],[(0,1),(.48,1),(.48,0),(0,0)],None,rear_mat)
    bpy.context.view_layer.update()
    world=rear.matrix_world.copy();rear.parent=left;rear.matrix_world=world
    # Rear label remains above the printed skin instead of being hidden behind it.
    for name in ('RearIdentity','RearEdition'):
        bpy.data.objects[name].location.z=-.296
    for i,(obj,_,_) in enumerate(markers):
        # A tangible anodized puck, not a glowing white UI dot. The radius still
        # fits the existing rail and recess; only the reveal derivative changes.
        for child in obj.children_recursive:
            if child.type!='MESH': continue
            if child.name.startswith('SliderBody_'):
                child.scale.z*=2.4;child.location.z=.040
                child.data.materials.clear();child.data.materials.append(puck)
            if child.name.startswith('SliderFace_'):
                child.location.z=.080
                child.data.materials.clear();child.data.materials.append(puckface)
            if child.name.startswith('SliderRim_'):
                child.location.z=.077
                child.data.materials.clear();child.data.materials.append(amber)
        path(f'MarkerProductRim_{i}',[(.134*math.cos(j*math.tau/40),.134*math.sin(j*math.tau/40),.080) for j in range(41)],obj,amber,.005)
        for j in range(20):
            angle=j*math.tau/20
            grip=box(f'MarkerGrip_{i}_{j}',(.009,.009,.035),(.134*math.cos(angle),.134*math.sin(angle),.042),obj,puck,.002)
            grip.rotation_euler.z=angle
    # Turned metal at the existing hinge, with the same pivot and fold clearance.
    for obj in bpy.data.objects:
        if obj.type=='MESH' and obj.name.startswith(('HingeKnuckle','HingePin')):
            obj.data.materials.clear();obj.data.materials.append(edge)
    # Micrograin needs real UVs on imported solids as well as on new meshes.
    for obj in bpy.data.objects:
        if obj.type=='MESH' and not obj.data.uv_layers and any(m in (graphite,lining,ribbonmat) for m in obj.data.materials):
            uv=obj.data.uv_layers.new(name='Material grain')
            for polygon in obj.data.polygons:
                axes=sorted(range(3),key=lambda a:abs(polygon.normal[a]))[:2]
                for li in polygon.loop_indices:
                    co=obj.data.vertices[obj.data.loops[li].vertex_index].co
                    uv.data[li].uv=(co[axes[0]]*3,co[axes[1]]*3)
    return {'details':['wrapped shell bevel','layered lid edge','cyan/amber foil corners','printed side and top end','lined insert','five lipped recesses','finger notches','lifting ribbon','rear city print'], 'materialTexture':'Packaging micrograin normal'}
