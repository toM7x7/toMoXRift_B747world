"""Restore saved Blender viewport RGBA to GLB; preserve binary geometry verbatim."""
import hashlib,json,pathlib,struct
root=pathlib.Path(__file__).resolve().parents[1]
source_rows=json.loads((root/'docs/sol-material-source.json').read_text(encoding='utf-8'))
colors={row['name']:row['diffuse_color'] for row in source_rows}
report_path=root/'docs/sol-scene-report.json'
report=json.loads(report_path.read_text(encoding='utf-8'))
records={}
for name in ['main','background']:
 path=root/f'public/sol-{name}.glb'; raw=path.read_bytes()
 size=struct.unpack_from('<I',raw,12)[0]; doc=json.loads(raw[20:20+size]); binary_chunks=raw[20+size:]
 for m in doc['materials']:
  rgba=colors[m['name']]
  m.setdefault('pbrMetallicRoughness',{})['baseColorFactor']=rgba
  if rgba[3]<0.999: m['alphaMode']='BLEND'
  else: m.pop('alphaMode',None)
 encoded=json.dumps(doc,ensure_ascii=False,separators=(',',':')).encode('utf-8')
 encoded+=b' '*((-len(encoded))%4)
 out=b'glTF'+struct.pack('<II',2,20+len(encoded)+len(binary_chunks))+struct.pack('<I',len(encoded))+b'JSON'+encoded+binary_chunks
 path.write_bytes(out)
 readback=path.read_bytes(); size2=struct.unpack_from('<I',readback,12)[0]
 assert readback[20+size2:]==binary_chunks
 d=json.loads(readback[20:20+size2])
 assert all(m['pbrMetallicRoughness']['baseColorFactor']==colors[m['name']] for m in d['materials'])
 records[name]={'materials':len(doc['materials']),'saved_diffuse_rgba_matches':True,'binary_geometry_and_animation_unchanged':True,'binary_sha256':hashlib.sha256(binary_chunks).hexdigest(),'bytes':len(out),'transparent_materials':[m['name'] for m in doc['materials'] if m.get('alphaMode')=='BLEND']}
 report['output_files'][name+'.glb']=len(out)
 if name=='main':
  report['bytes']=len(out)
  report['gltf']['materials']=[{'name':m['name'],'baseColorFactor':m['pbrMetallicRoughness']['baseColorFactor'],'alphaMode':m.get('alphaMode','OPAQUE'),'extensions':list(m.get('extensions',{}))} for m in d['materials']]
report['material_import_correction']={'reason':'Original generator searched node by English name Principled BSDF, but saved node is localized as プリンシプルBSDF. Actual shader and original GLB used default gray for every material.','policy':'Copy RGBA already saved in Blender material.diffuse_color into glTF baseColorFactor; use BLEND only for saved alpha below 0.999. Keep original metallic/roughness and all other shader properties. No new color was invented; source .blend was not saved.','original_glb_base_color':[0.800000011920929,0.800000011920929,0.800000011920929,1],'files':records}
report_path.write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report['material_import_correction'],ensure_ascii=False,indent=2))
