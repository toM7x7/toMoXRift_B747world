import { readFile } from 'node:fs/promises';
import { Group, Raycaster, Vector3, DoubleSide } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const exhibits = [
 {id:'sol',x:300,angle:-Math.PI/2,points:[[300,5.6,0],[300,8.35,12],[300,8.35,27],[320,0.3,112]]},
 {id:'astra',x:600,angle:Math.PI/2,points:[[600,5.6,7.65],[600,8.35,13.78],[599.98,8.35,26.95],[620,0.3,62]]},
];
let failures=0;
for (const exhibit of exhibits) {
 const bytes=await readFile(new URL(`../public/exhibits/${exhibit.id}/collision.glb`,import.meta.url));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 const group = new Group(); group.position.x=exhibit.x; group.rotation.y=exhibit.angle; group.add(gltf.scene); group.updateMatrixWorld(true);
 gltf.scene.traverse(node=>{ if(node.isMesh){ const mats=Array.isArray(node.material)?node.material:[node.material]; for(const mat of mats) mat.side=DoubleSide; } });
 for(const point of exhibit.points){
   const probes=[];
   for(const [dx,dz] of [[0,0],[.25,0],[-.25,0],[0,.25],[0,-.25]]) {
    const ray=new Raycaster(new Vector3(point[0]+dx,point[1],point[2]+dz),new Vector3(0,-1,0),0,100);
    const hit=ray.intersectObject(group,true)[0];
    const pass=!!hit&&hit.distance<0.7;
    if(!pass) failures++;
    probes.push({offset:[dx,dz],floorY:hit?.point.y,drop:hit?.distance,mesh:hit?.object.name,pass});
   }
   console.log(JSON.stringify({exhibit:exhibit.id,point,probes}));
 }
}
process.exitCode=failures?1:0;
