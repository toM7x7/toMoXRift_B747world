import hashlib,json,pathlib,struct
root=pathlib.Path(r'D:/personal_dev/XRift/worlds/b747-experience')
report_path=root/'docs/sol-scene-report.json'
report=json.loads(report_path.read_text(encoding='utf-8'))
def load(p):
    b=p.read_bytes(); assert b[:4]==b'glTF'; assert struct.unpack_from('<I',b,8)[0]==len(b)
    n=struct.unpack_from('<I',b,12)[0]
    return json.loads(b[20:20+n])
source=pathlib.Path(report['source'])
checks={'source_sha256_unchanged':hashlib.sha256(source.read_bytes()).hexdigest().upper()==report['source_sha256'],'files':{}}
original=load(pathlib.Path(r'D:/personal_dev/blender/B747_GPT-5.6Sol/exports/B747_Airport_Experience.glb'))
for name in ['main','background','collision']:
    p=root/f'public/exhibits/sol/{name}.glb'; d=load(p); a=d.get('accessors',[])
    triangles=sum(a[prim['indices']]['count']//3 for node in d['nodes'] if 'mesh' in node for prim in d['meshes'][node['mesh']]['primitives'])
    entry={'bytes':p.stat().st_size,'mesh_nodes':sum('mesh' in n for n in d['nodes']),'triangles':triangles,'triangles_match_source':triangles==report[name]['triangles'],'animations':len(d.get('animations',[])),'cameras':len(d.get('cameras',[])),'no_external_buffers':all('uri' not in b for b in d.get('buffers',[])),'no_lights':'KHR_lights_punctual' not in d.get('extensionsUsed',[])}
    if name=='main':
        original_materials={m['name']:m for m in original['materials']}
        current_materials={m['name']:m for m in d['materials']}
        saved_colors={row['name']:row['diffuse_color'] for row in json.loads((root/'docs/sol-material-source.json').read_text(encoding='utf-8'))}
        entry['saved_blender_diffuse_colors_equal']=all(material['pbrMetallicRoughness']['baseColorFactor']==saved_colors[name] for name,material in current_materials.items())
        entry['materials_moved_to_background']=sorted(set(original_materials)-set(current_materials))
        assert entry['saved_blender_diffuse_colors_equal']
        entry['animation_durations_seconds']={anim.get('name'):max(a[s['input']]['max'][0] for s in anim['samplers']) for anim in d.get('animations',[])}
    assert entry['triangles_match_source'] and entry['cameras']==0 and entry['no_external_buffers'] and entry['no_lights'],entry
    checks['files'][name]=entry
assert checks['source_sha256_unchanged']
report['final_binary_validation']=checks
report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(checks,ensure_ascii=False,indent=2))
