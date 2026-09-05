"""Export Astra exhibit without saving or changing the source .blend.
Run: blender --background --disable-autoexec SOURCE --python scripts/astra-export.py
"""
import bpy, json, math, hashlib, time, sys
from pathlib import Path
from mathutils import Matrix, Vector
ROOT=Path(r"D:/personal_dev/XRift/worlds/b747-experience")
OUT=ROOT/"public/exhibits/astra"
OUT.mkdir(parents=True,exist_ok=True)
REPORT={"source":bpy.data.filepath,"source_sha256":hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest(),"default_hidden":["15 | Airframe structure","F17 | Landing gear - 18 wheels"],"notes":["Source file is read only; all evaluation and conversion are in memory.","Camera and light objects are excluded; original shader-independent geometry and font geometry are retained.","Distant 1800m airfield separated as background.glb to avoid overlap in side by side exhibition.","Glass Fresnel plus transparent mix cannot translate exactly to glTF; preserved Principled color/roughness with alpha 0.28 for museum glass, opaque flight glass."],"exports":[]}
# Translate the unsupported Fresnel/mix output to a glTF-compatible approximation.
for mat in bpy.data.materials:
    if not mat.node_tree: continue
    nodes=mat.node_tree.nodes
    if not any(n.type=="MIX_SHADER" for n in nodes):continue
    bs=next((n for n in nodes if n.type=="BSDF_PRINCIPLED"),None)
    out=next((n for n in nodes if n.type=="OUTPUT_MATERIAL"),None)
    if bs and out:
        mat.node_tree.links.new(bs.outputs["BSDF"],out.inputs["Surface"])
        bs.inputs["Alpha"].default_value=1.0 if "FLIGHT OPAQUE" in mat.name else 0.28
        if hasattr(mat,"surface_render_method"):mat.surface_render_method="DITHERED"

def hidden_collections(scene):
    hidden=set()
    def visit(c,parent=False):
        h=parent or c.hide_render or c.hide_viewport
        if h:hidden.add(c)
        for child in c.children:visit(child,h)
    visit(scene.collection)
    return hidden

def collect(scene):
    bpy.context.window.scene=scene
    scene.frame_set(1)
    bpy.context.view_layer.update()
    graph=bpy.context.evaluated_depsgraph_get()
    hidden=hidden_collections(scene)
    entries=[]
    seen=set()
    for inst in graph.object_instances:
        ob=inst.object.original
        if ob.type not in {"MESH","CURVE","FONT","SURFACE"}:continue
        if not inst.show_self or ob.hide_render or ob.hide_viewport:continue
        if ob.users_collection and all(c in hidden for c in ob.users_collection):continue
        if not inst.is_instance and ob.hide_get():continue
        if inst.is_instance and inst.parent and (inst.parent.original.hide_render or inst.parent.original.hide_get()):continue
        key=(ob.as_pointer(),tuple(round(v,7) for row in inst.matrix_world for v in row))
        if key in seen:continue
        seen.add(key)
        anchor=None
        if not inst.is_instance:
            p=ob
            while p:
                if p.animation_data and p.animation_data.action:anchor=p;break
                p=p.parent
        mesh=bpy.data.meshes.new_from_object(inst.object,preserve_all_data_layers=True,depsgraph=graph)
        if not len(mesh.polygons):bpy.data.meshes.remove(mesh);continue
        for i,m in enumerate(mesh.materials):
            if m and m.is_evaluated:mesh.materials[i]=m.original
        entries.append({"source":ob,"mesh":mesh,"matrix":inst.matrix_world.copy(),"anchor":anchor,"instance":inst.is_instance})
    return entries

def is_background(e):return any(c.name.startswith("64 |") for c in e["source"].users_collection)
def is_collision(e):
    n=e["source"].name.lower()
    return e["source"].type=="MESH" and not is_background(e) and not any(word in n for word in ("roller","rail","edging","safety edge","post","nosing","lamp")) and any(word in n for word in ("apron |","floor","open viewing deck","mezzanine","tread","landing","ramp","walkway","threshold","lift platform"))

def export(scene,entries,name,animated=True):
    target=bpy.data.scenes.new("XRift export "+name)
    target.render.fps=scene.render.fps;target.frame_start=1;target.frame_end=scene.frame_end
    bpy.context.window.scene=target
    anchors={}
    def anchor_copy(ob):
        if ob in anchors:return anchors[ob]
        cp=bpy.data.objects.new(ob.name,None);target.collection.objects.link(cp);anchors[ob]=cp
        cp.matrix_basis=ob.matrix_basis.copy();cp.matrix_parent_inverse=ob.matrix_parent_inverse.copy()
        if ob.parent:cp.parent=anchor_copy(ob.parent)
        if animated and ob.animation_data and ob.animation_data.action:
            cp.animation_data_create();cp.animation_data.action=ob.animation_data.action
            if hasattr(ob.animation_data,"action_slot"):cp.animation_data.action_slot=ob.animation_data.action_slot
        return cp
    groups={}
    lo=[math.inf]*3;hi=[-math.inf]*3
    triangles=0;vertices=0
    for e in entries:
        me=e["mesh"].copy()
        source=e["source"];anchor=e["anchor"] if animated else None
        world=e["matrix"]
        for corner in source.bound_box:
            v=world@Vector(corner)
            for i in range(3):lo[i]=min(lo[i],v[i]);hi[i]=max(hi[i],v[i])
        me.calc_loop_triangles();triangles+=len(me.loop_triangles);vertices+=len(me.vertices)
        cp=bpy.data.objects.new(source.name,me);target.collection.objects.link(cp)
        cp.matrix_world=anchor.matrix_world.inverted()@world if anchor else world
        groups.setdefault(anchor,[]).append(cp)
    # Join static meshes within each independently animated rigid group.
    for anchor,objects in groups.items():
        bpy.ops.object.select_all(action="DESELECT")
        for ob in objects:ob.select_set(True)
        bpy.context.view_layer.objects.active=objects[0]
        bpy.ops.object.join()
        result=objects[0];result.name=(anchor.name+" geometry") if anchor else name+" static scene"
        if anchor:result.parent=anchor_copy(anchor)
    target.frame_set(1);bpy.context.view_layer.update()
    path=OUT/(name+".glb")
    bpy.ops.export_scene.gltf(filepath=str(path),export_format="GLB",use_active_scene=True,export_cameras=False,export_lights=False,export_extras=False,export_animations=animated,export_animation_mode="SCENE",export_anim_scene_split_object=False,export_frame_range=True,export_force_sampling=True,export_optimize_animation_size=True,export_apply=False,export_yup=True,export_skins=False,export_morph=False,export_shared_accessors=True)
    result={"name":name,"path":str(path),"bytes":path.stat().st_size,"source_mesh_objects_including_instances":len(entries),"evaluated_triangles":triangles,"evaluated_vertices":vertices,"export_mesh_objects":sum(o.type=="MESH" for o in target.objects),"animated_anchors":len(anchors),"bounds_blender_z_up":{"min":lo,"max":hi},"bounds_gltf_y_up":{"min":[lo[0],lo[2],-hi[1]],"max":[hi[0],hi[2],-lo[1]]},"frames":[1,scene.frame_end],"fps":scene.render.fps}
    REPORT["exports"].append(result)
    (ROOT/"docs/astra-export-report.json").write_text(json.dumps(REPORT,ensure_ascii=False,indent=2),encoding="utf-8")
    print("ASTRA_EXPORT",json.dumps(result),flush=True)
    bpy.context.window.scene=scene
    for ob in list(target.objects):bpy.data.objects.remove(ob,do_unlink=True)
    bpy.data.scenes.remove(target)
main=bpy.data.scenes["747 | Open Air Museum"]
if "--collision-only" in sys.argv:
    REPORT=json.loads((ROOT/"docs/astra-export-report.json").read_text(encoding="utf-8"))
    REPORT["exports"]=[e for e in REPORT["exports"] if e["name"]!="collision"]
    collision=[e for e in collect(main) if is_collision(e)]
    REPORT["collision_sources"]=[e["source"].name for e in collision]
    export(main,collision,"collision",False)
else:
    entries=collect(main)
    export(main,[e for e in entries if not is_background(e)],"main")
    export(main,[e for e in entries if is_background(e)],"background",False)
    collision=[e for e in entries if is_collision(e)]
    REPORT["collision_sources"]=[e["source"].name for e in collision]
    export(main,collision,"collision",False)
    flight=bpy.data.scenes["02 | Flight demonstration"]
    export(flight,collect(flight),"flight")

REPORT["source_sha256_after"]=hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest()
(ROOT/"docs/astra-export-report.json").write_text(json.dumps(REPORT,ensure_ascii=False,indent=2),encoding="utf-8")
print("ASTRA_COMPLETE",flush=True)
