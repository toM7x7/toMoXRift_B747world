"""Export the Sol scene for XRift; never saves or mutates the source .blend."""
import bpy, json, pathlib, struct
from mathutils import Vector
ROOT = pathlib.Path(r'D:/personal_dev/XRift/worlds/b747-experience')
OUT = ROOT / 'public/sol-main.glb'
REPORT = ROOT / 'docs/sol-scene-report.json'
OUT.parent.mkdir(parents=True, exist_ok=True)
REPORT.parent.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
original_frame = scene.frame_current
scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
objects = [o for o in scene.objects if o.type in {'MESH','FONT','CURVE','SURFACE','META'} and o.visible_get() and not o.hide_render]
excluded = [{'name':o.name,'type':o.type,'hide_render':o.hide_render,'visible':o.visible_get()} for o in scene.objects if o not in objects and o.type not in {'EMPTY','CAMERA','LIGHT'}]
for o in objects:
    if o.type != 'MESH':
        bpy.ops.object.select_all(action='DESELECT')
        o.select_set(True)
        bpy.context.view_layer.objects.active = o
        bpy.ops.object.convert(target='MESH')
        o.select_set(False)
objects = [o for o in scene.objects if o.type == 'MESH' and o.visible_get() and not o.hide_render]
def measure(frame):
    scene.frame_set(frame)
    graph = bpy.context.evaluated_depsgraph_get()
    mins = [float('inf')]*3
    maxs = [-float('inf')]*3
    triangles = 0
    by_object = []
    for obj in objects:
        e = obj.evaluated_get(graph)
        mesh = e.to_mesh()
        mesh.calc_loop_triangles()
        triangles += len(mesh.loop_triangles)
        lo = [float('inf')]*3; hi = [-float('inf')]*3
        for v in mesh.vertices:
            xyz = e.matrix_world @ v.co
            for i in range(3):
                lo[i] = min(lo[i],xyz[i]); hi[i] = max(hi[i],xyz[i])
                mins[i] = min(mins[i],xyz[i]); maxs[i] = max(maxs[i],xyz[i])
        by_object.append({'name':obj.name,'triangles':len(mesh.loop_triangles),'min':lo,'max':hi})
        e.to_mesh_clear()
    return {'frame':frame,'min_blender_xyz':mins,'max_blender_xyz':maxs,'dimensions_blender_xyz':[maxs[i]-mins[i] for i in range(3)],'triangles':triangles,'objects':by_object}
assembled = measure(1)
exploded = measure(120)
scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
background_objects = [o for o in objects if o.name in {'Distant_Grass','Distant_Runway'} or o.name.startswith('Runway_Centerline_')]
main_objects = [o for o in objects if o not in background_objects]
for o in main_objects: o.select_set(True)
bpy.context.view_layer.objects.active = objects[0]
result = bpy.ops.export_scene.gltf(filepath=str(OUT), export_format='GLB',use_selection=True,export_apply=True,export_animations=True,export_cameras=False,export_lights=False,export_yup=True,export_extras=True)
raw=OUT.read_bytes(); length=struct.unpack_from('<I',raw,12)[0]; gltf=json.loads(raw[20:20+length])
materials=[]
for m in gltf.get('materials',[]):
    materials.append({'name':m.get('name'),'alphaMode':m.get('alphaMode','OPAQUE'),'extensions':list(m.get('extensions',{}).keys())})
report={'source':bpy.data.filepath,'source_preserved':True,'original_frame':original_frame,'output':str(OUT),'bytes':len(raw),'selected_mesh_objects':len(objects),'excluded_geometry':excluded,'assembled':assembled,'engine_exploded':exploded,'gltf':{'nodes':len(gltf.get('nodes',[])),'meshes':len(gltf.get('meshes',[])),'materials':materials,'animations':[{'name':a.get('name'),'channels':len(a.get('channels',[]))} for a in gltf.get('animations',[])],'cameras':len(gltf.get('cameras',[])),'extensionsUsed':gltf.get('extensionsUsed',[])},'constraints':['glTF uses Y-up: Blender (x,y,z) maps to (x,z,-y).','Shared XRift lighting replaces source cameras/lights; exported material transparency and emissive properties retained.','Source procedural material nodes may be approximated by glTF PBR exporter.','Animation clips retained; runtime must explicitly control playback.']}
REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('SOL_EXPORT_SUCCESS',json.dumps({k:report[k] for k in ['bytes','selected_mesh_objects']},ensure_ascii=False),flush=True)

def subset_stats(selected):
    entries=[entry for entry in assembled['objects'] if entry['name'] in {o.name for o in selected}]
    lo=[min(e['min'][i] for e in entries) for i in range(3)]
    hi=[max(e['max'][i] for e in entries) for i in range(3)]
    return {'objects':len(entries),'triangles':sum(e['triangles'] for e in entries),'min_blender_xyz':lo,'max_blender_xyz':hi,'min_gltf_xyz':[lo[0],lo[2],-hi[1]],'max_gltf_xyz':[hi[0],hi[2],-lo[1]],'object_names':[e['name'] for e in entries]}
report['main']=subset_stats(main_objects)
report['background']=subset_stats(background_objects)
bpy.ops.object.select_all(action='DESELECT')
for o in background_objects: o.select_set(True)
bpy.context.view_layer.objects.active=background_objects[0]
bpy.ops.export_scene.gltf(filepath=str(OUT.parent/'sol-background.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False,export_yup=True)
collision_names={'Airport_Apron','Main_Deck_Floor','Upper_Deck_Floor','Lower_Cargo_Floor','Cockpit_Floor','Jetbridge_Walk_Floor'}
collision_objects=[o for o in objects if o.name in collision_names or (o.name.startswith('Upper_Deck_Stair_') or (o.name.startswith('Mobile_Stair_') and o.name.rsplit('_',1)[-1].isdigit()))]
bpy.ops.object.select_all(action='DESELECT')
for o in collision_objects: o.select_set(True)
bpy.context.view_layer.objects.active=collision_objects[0]
bpy.ops.export_scene.gltf(filepath=str(OUT.parent/'sol-collision.glb'),export_format='GLB',use_selection=True,export_apply=True,export_animations=False,export_cameras=False,export_lights=False,export_yup=True,export_materials='NONE')
report['collision']=subset_stats(collision_objects)
report['collision']['limitations']=['Exact original floor and stair meshes only. Outer shell, seats, railings, vehicles and terminal walls have no collision.','Upper-deck floor has no stairwell opening in original geometry; teleports are required for reliable deck changes.','Mobile stairs rise about 0.377m per step; character step-up support requires live validation.']
report['placement']={'nose_gltf':[1,0,0],'rotation_y_for_nose_positive_z':-1.5707963267948966,'ground_top_y':0,'main_deck_top_y':5.279999732971191,'upper_deck_top_y':8.005000114440918,'cargo_floor_top_y':3.2200000286102295}
report['output_files']={p.name:p.stat().st_size for p in OUT.parent.glob('sol-*.glb') if p.name!='scene.glb'}
report['source_sha256']='86B258BFCF40E990BF7736A45D79EC293C0B10626FAD56BBECD3489F44048561'
REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('SOL_ALL_EXPORTS_SUCCESS',json.dumps({'main':report['main'],'background':report['background'],'collision':report['collision'],'files':report['output_files']},ensure_ascii=False),flush=True)

# Preserve each animated module as an independent root, bake evaluated geometry,
# and combine the stationary meshes to avoid thousands of draw calls.
objects=main_objects
before={frame:measure(frame) for frame in [1,120]}
scene.frame_set(1)
graph=bpy.context.evaluated_depsgraph_get()
for obj in main_objects:
    if obj.modifiers:
        evaluated=obj.evaluated_get(graph)
        baked=bpy.data.meshes.new_from_object(evaluated,depsgraph=graph)
        obj.modifiers.clear()
        obj.data=baked
animated=set(o for o in main_objects if o.animation_data and o.animation_data.action)
groups={None:[]}
for obj in main_objects:
    ancestor=obj
    while ancestor is not None and ancestor not in animated:
        ancestor=ancestor.parent
    groups.setdefault(ancestor,[]).append(obj)
merged=[]
for ancestor,members in groups.items():
    if not members: continue
    bpy.ops.object.select_all(action='DESELECT')
    for obj in members: obj.select_set(True)
    active=ancestor if ancestor is not None else next((o for o in members if o.parent is None),members[0])
    bpy.context.view_layer.objects.active=active
    bpy.ops.object.join()
    if ancestor is None: active.name='SOL_Static_Exhibit'
    merged.append(active)
objects=merged
after={frame:measure(frame) for frame in [1,120]}
checks={}
for frame in [1,120]:
    delta=max(abs(before[frame][k][i]-after[frame][k][i]) for k in ['min_blender_xyz','max_blender_xyz'] for i in range(3))
    checks[str(frame)]={'triangle_count_unchanged':before[frame]['triangles']==after[frame]['triangles'],'maximum_bounds_delta_m':delta}
    assert checks[str(frame)]['triangle_count_unchanged'] and delta<0.001, checks
scene.frame_set(1)
bpy.ops.object.select_all(action='DESELECT')
for obj in merged: obj.select_set(True)
bpy.context.view_layer.objects.active=merged[0]
bpy.ops.export_scene.gltf(filepath=str(OUT),export_format='GLB',use_selection=True,export_apply=True,export_animations=True,export_cameras=False,export_lights=False,export_yup=True)
raw=OUT.read_bytes(); length=struct.unpack_from('<I',raw,12)[0]; optimized=json.loads(raw[20:20+length])
report['optimization']={'method':'Evaluated geometry joined by closest animated ancestor; one static mesh plus eleven animated meshes.','source_mesh_nodes':len(main_objects),'result_mesh_nodes':sum('mesh' in n for n in optimized['nodes']),'result_primitives':sum(len(m['primitives']) for m in optimized['meshes']),'animated_objects':len(animated),'shape_checks':checks}
report['bytes']=len(raw)
report['output_files']['main.glb']=len(raw)
report['gltf']={'nodes':len(optimized['nodes']),'meshes':len(optimized['meshes']),'materials':materials,'animations':[{'name':a.get('name'),'channels':len(a.get('channels',[]))} for a in optimized.get('animations',[])],'cameras':len(optimized.get('cameras',[])),'extensionsUsed':optimized.get('extensionsUsed',[])}
REPORT.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print('SOL_OPTIMIZED_SUCCESS',json.dumps(report['optimization']),flush=True)

# Apply the documented saved-viewport-color import correction reproducibly.
import runpy
runpy.run_path(str(ROOT / 'scripts/sol-restore-material-colors.py'), run_name='__main__')
