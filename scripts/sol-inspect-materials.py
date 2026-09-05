import bpy,json,pathlib
rows=[]
for m in bpy.data.materials:
 nodes=[]
 if m.node_tree:
  for n in m.node_tree.nodes:
   if n.type in {'BSDF_PRINCIPLED','OUTPUT_MATERIAL'}:
    v={}
    for key in ['Base Color','Metallic','Roughness','Alpha','Transmission Weight','Emission Color','Emission Strength']:
     if key in n.inputs:
      x=n.inputs[key].default_value
      v[key]=list(x) if hasattr(x,'__len__') else x
    nodes.append({'name':n.name,'type':n.type,'active_output':getattr(n,'is_active_output',None),'inputs':v})
 rows.append({'name':m.name,'use_nodes':m.use_nodes,'diffuse_color':list(m.diffuse_color),'metallic':m.metallic,'roughness':m.roughness,'nodes':nodes,'links':[{'from':l.from_node.name,'to':l.to_node.name,'to_socket':l.to_socket.name} for l in m.node_tree.links] if m.node_tree else []})
p=pathlib.Path(r'D:/personal_dev/XRift/worlds/b747-experience/docs/sol-material-source.json');p.write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8');print('MATERIAL_INSPECTION_DONE',len(rows))
