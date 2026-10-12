import * as THREE from 'three';
import './style.css';

type Key='dist'|'h'|'f'|'rot'|'tilt'|'roll';
type State=Record<Key,number>;
type Pt={x:number;y:number;sx:number;sy:number;ok:boolean};
type V3=[number,number,number];
type Metrics=ReturnType<typeof M>;
type Check=[string,(m:Metrics)=>boolean,((m:Metrics)=>string)?];
interface Lesson{n:string;d:string;a:Partial<State>;c:Check[];sol?:(s:State)=>State}

const R=Math.PI/180,deg=(x:number)=>x/R,$=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const D:State={dist:6,h:1.6,f:35,rot:0,tilt:0,roll:0};let S:State={...D},cur=0,aid=0;const done=new Set<number>(),G:{src:string;l:number;sc:number}[]=[];
const K:[Key,string,number,number,number,string,number][]=[['dist','Distance',1,14,.1,'m',.25],['h','Height',.2,8,.05,'m',.1],['f','Focal length',14,200,1,'mm',5],['rot','Rotation',-70,70,.5,'°',1],['tilt','Tilt',-50,50,.5,'°',1],['roll','Roll',-30,30,.5,'°',1]];
const cl=(k:Key,v:number)=>{const c=K.find(x=>x[0]==k)!;return Math.min(c[3],Math.max(c[2],v))};
// ---------- scene
const vp=$('vp'),ov=$<HTMLCanvasElement>('ov'),mm=$<HTMLCanvasElement>('mm');
const rd=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});rd.setPixelRatio(Math.min(devicePixelRatio,2));$('gl').append(rd.domElement);rd.domElement.style.cssText='width:100%;height:100%;display:block';
const sc=new THREE.Scene();sc.background=new THREE.Color(0xa9d1f0);sc.fog=new THREE.Fog(0xcfe6f5,50,200);
sc.add(new THREE.HemisphereLight(0xffffff,0x6b8f5a,.95));const dl=new THREE.DirectionalLight(0xfff2d6,.8);dl.position.set(-20,30,25);sc.add(dl);
const mat=(c:number)=>new THREE.MeshLambertMaterial({color:c});
const box=(w:number,h:number,d:number,c:number,x:number,y:number,z:number,p:THREE.Object3D=sc)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);p.add(m);return m};
box(500,.1,500,0x6aa860,0,-.05,0);box(6,.1,320,0x4a4d52,0,0,-130);box(1.6,.12,320,0xb8b8b0,-3.8,.03,-130);box(1.6,.12,320,0xb8b8b0,3.8,.03,-130);
for(let z=14;z>-170;z-=6)box(.2,.02,2.5,0xffffff,0,.07,z);
box(8,5.5,6,0xe8d9b8,-9,2.75,-12);box(1.2,2.4,.1,0x6b3f26,-9,1.2,-8.95);box(1.4,1.4,.1,0x9fd0ee,-11.6,3,-8.95);box(1.4,1.4,.1,0x9fd0ee,-6.4,3,-8.95);box(1.4,1.4,.1,0x9fd0ee,-11.6,1.2,-8.95);box(1.4,1.4,.1,0x9fd0ee,-6.4,1.2,-8.95);
{const g=new THREE.Group(),r=new THREE.Mesh(new THREE.ConeGeometry(1,1.7,4),mat(0x9b4a35));r.rotation.y=Math.PI/4;r.position.y=.85;g.add(r);g.scale.set(6.2,1,4.67);g.position.set(-9,5.5,-12);sc.add(g)}
[[-7,-3],[-6,-22],[-8,-40],[-14,-28],[7,-6],[8,-20],[9,-34],[7,-52],[-7,-60],[12,-12]].forEach(([x,z])=>{const t=new THREE.Mesh(new THREE.CylinderGeometry(.25,.3,2,8),mat(0x6b4a2b));t.position.set(x,1,z);sc.add(t);const c=new THREE.Mesh(new THREE.ConeGeometry(1.8,4.5,10),mat(0x2f7a45));c.position.set(x,4.2,z);sc.add(c)});
const P=new THREE.Group();P.position.set(.9,0,0);sc.add(P);
const cy=(r:number,h:number,c:number,y:number,x:number)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,12),mat(c));m.position.set(x,y,0);P.add(m)};
cy(.08,.85,0x2f3e5a,.43,-.1);cy(.08,.85,0x2f3e5a,.43,.1);cy(.2,.65,0xc0392b,1.18,0);cy(.05,.6,0xc0392b,1.15,-.27);cy(.05,.6,0xc0392b,1.15,.27);
{const h=new THREE.Mesh(new THREE.SphereGeometry(.13,16,12),mat(0xf0c8a0));h.position.y=1.68;P.add(h);[-.045,.045].forEach(x=>{const e=new THREE.Mesh(new THREE.SphereGeometry(.015,6,6),mat(0x222222));e.position.set(x,1.7,.12);P.add(e)})}
const cam=new THREE.PerspectiveCamera(50,1.5,.1,500);
// ---------- math
function pose(s:State){cam.position.set(0,s.h,s.dist);cam.rotation.set(s.tilt*R,-s.rot*R,s.roll*R,'YXZ');cam.fov=2*Math.atan(12/s.f)/R;cam.aspect=1.5;cam.updateProjectionMatrix();cam.updateMatrixWorld(true)}
function pr(x:number,y:number,z:number):Pt{const v=new THREE.Vector3(x,y,z),c=v.clone().applyMatrix4(cam.matrixWorldInverse),p=v.project(cam);return{x:p.x,y:p.y,sx:(p.x+1)/2,sy:(1-p.y)/2,ok:c.z<0}}
function M(s:State){pose(s);const ty=Math.tan(cam.fov*R/2),tx=ty*1.5,u=new THREE.Vector3(0,1,0).applyQuaternion(cam.quaternion.clone().invert());
const hy=(x:number)=>(u.z-u.x*tx*x)/(u.y*ty),hc=[-4.6,-13.4].flatMap(x=>[0,7.2].flatMap(y=>[-8.7,-15.3].map(z=>pr(x,y,z))));
return{s,roll:deg(Math.atan2(u.x,u.y)),hy,hz:(1-hy(0))/2,head:pr(.9,1.68,0),feet:pr(.9,.05,0),vp:pr(0,0,-5e4),hin:hc.every(p=>p.ok&&Math.abs(p.x)<.97&&Math.abs(p.y)<.97)}}
function aim(t:State,p:V3,u:number,v:number,lock?:boolean){t.rot=0;t.tilt=0;for(let i=0;i<90;i++){pose(t);const q=pr(...p);t.rot+=(q.x-u)*deg(Math.atan(18/t.f))*.8;if(!lock)t.tilt+=(q.y-v)*deg(Math.atan(12/t.f))*.8}return t}
const near=(p:Pt)=>Math.min(...[1/3,2/3].flatMap(a=>[1/3,2/3].map(b=>Math.hypot(p.sx-a,p.sy-b))));
const inF=(p:Pt,m=.95)=>p.ok&&Math.abs(p.x)<m&&Math.abs(p.y)<m,H:V3=[.9,1.68,0];
const lv:Check=['Horizon is level (±1.5°)',m=>Math.abs(m.roll)<1.5,m=>m.roll.toFixed(1)+'°'];
const L:Lesson[]=[
{n:'Level horizon',d:'A tilted horizon looks accidental. Use Roll until the horizon line turns green.',a:{roll:11,tilt:-3},c:[lv],sol:s=>({...s,roll:0,tilt:-3})},
{n:'Horizon on a third',d:'Don’t cut the picture in half. Tilt the camera so the horizon sits on a third line: tilt down = more road, up = more sky.',a:{},c:[lv,['Horizon on a third line',m=>m.hz>.1&&Math.min(Math.abs(m.hz-1/3),Math.abs(m.hz-2/3))<.04,m=>Math.round(m.hz*100)+'% from top']],sol:s=>({...s,rot:0,roll:0,tilt:-deg(Math.atan(12/s.f/3))})},
{n:'Strong point',d:'Put the head on a power point — where two third-lines cross. Pan with Rotation/Tilt or drag the frame.',a:{rot:-8,tilt:4},c:[lv,['Head on a power point',m=>m.head.ok&&near(m.head)<.06,m=>m.head.ok?'off by '+Math.round(near(m.head)*100)+'%':'not in view']],sol:s=>aim({...s,dist:5,h:1.6,f:50,roll:0},H,1/3,1/3)},
{n:'Leading lines',d:'Roads pull the eye. Get the vanishing point of the road into the frame, on the centre or a third line, from a low camera.',a:{dist:10,h:3.5,tilt:-20},c:[lv,['Vanishing point in frame',m=>m.vp.ok&&inF(m.vp,.8)],['VP on centre or a third',m=>m.vp.ok&&[1/3,.5,2/3].some(a=>Math.abs(m.vp.sx-a)<.05)],['Camera low (≤ 2.5 m)',m=>m.s.h<=2.5,m=>m.s.h.toFixed(1)+' m']],sol:s=>aim({...s,dist:9,h:1,f:28,roll:0},[0,0,-5e4],0,.33)},
{n:'Vertical lines',d:'Tilting up makes buildings lean back. Keep Tilt at 0°, step back and go wide until the whole house fits. Turn Rotation toward it.',a:{dist:8,rot:-25,tilt:18},c:[lv,['Camera not tilted (±2°)',m=>Math.abs(m.s.tilt)<2,m=>m.s.tilt.toFixed(1)+'°'],['Whole house in frame',m=>m.hin]],sol:s=>aim({...s,dist:8,h:1.6,f:24,roll:0},[-9,3.5,-12],0,0,true)},
{n:'Portrait · 85mm',d:'Wide lenses stretch faces; 85mm flatters. Step back to ≥ 2.2 m, zoom to ~85mm, camera at eye level, head in the upper half.',a:{dist:1.5,f:24,h:1.2},c:[lv,['Focal length 75–100 mm',m=>m.s.f>=75&&m.s.f<=100,m=>m.s.f+' mm'],['Distance ≥ 2.2 m',m=>m.s.dist>=2.2,m=>m.s.dist.toFixed(1)+' m'],['Eye level (1.3–1.9 m)',m=>m.s.h>=1.3&&m.s.h<=1.9],['Head in upper half of frame',m=>inF(m.head,.8)&&m.head.y>.05]],sol:s=>aim({...s,dist:3,h:1.6,f:85,roll:0},H,1/3,.3)},
{n:'Low angle',d:'Shoot from knee height looking up: the subject towers against the sky. Keep the horizon below the head.',a:{},c:[['Not tilted sideways',m=>Math.abs(m.roll)<3],['Camera low (< 0.8 m)',m=>m.s.h<.8,m=>m.s.h.toFixed(2)+' m'],['Looking up (> 6°)',m=>m.s.tilt>6,m=>m.s.tilt.toFixed(0)+'°'],['Head in frame, above horizon',m=>inF(m.head,.9)&&m.head.y>m.hy(m.head.x)]],sol:s=>aim({...s,dist:4,h:.4,f:28,roll:0},H,0,.3)},
{n:'Free shooting',d:'Combine everything and take your best shot. Compare it with earlier shots in the feed.',a:{roll:4,rot:6},c:[lv,['Head on a power point, or horizon on a third',m=>(m.head.ok&&near(m.head)<.07)||(m.hz>.1&&m.hz<.9&&Math.min(Math.abs(m.hz-1/3),Math.abs(m.hz-2/3))<.04)],['Whole person in frame',m=>inF(m.head)&&inF(m.feet)]]}];
// ---------- UI
K.forEach(([k,n,a,b,s,u,bs])=>{const d=document.createElement('div');d.className='sl';d.innerHTML=`<label>${n}<b id="v${k}"></b></label><div><button data-k="${k}" data-d="${-bs}">−</button><input type="range" id="r${k}" min="${a}" max="${b}" step="${s}"><button data-k="${k}" data-d="${bs}">+</button></div>`;$('sl').append(d)});
$('sl').oninput=e=>{const t=e.target as HTMLInputElement;if(t.type=='range'){aid++;S[t.id.slice(1) as Key]=+t.value;upd()}};
$('sl').onclick=e=>{const b=(e.target as HTMLElement).closest('button');if(b){aid++;const k=b.dataset.k as Key;S[k]=cl(k,+(S[k]+ +b.dataset.d!).toFixed(2));upd()}};
L.forEach((l:Lesson,i:number)=>{const b=document.createElement('button');b.textContent=String(i+1);b.title=l.n;b.onclick=()=>load(i);$('tabs').append(b)});
function load(i:number){aid++;cur=i;S={...D,...L[i].a};$('lt').textContent=`${i+1}. ${L[i].n}`;$('ld').textContent=L[i].d;$('sol').hidden=!L[i].sol;upd()}
function go(t:State){const id=++aid,a:State={...S},t0=performance.now();(function f(n:number){if(id!=aid)return;const k=Math.min(1,(n-t0)/800),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;for(const x of Object.keys(a) as Key[])S[x]=a[x]+(t[x]-a[x])*e;upd();if(k<1)requestAnimationFrame(f)})(t0)}
$('sol').onclick=()=>go(L[cur].sol!(S));$('rs').onclick=()=>load(cur);$('nx').onclick=()=>load(cur+1);
$('sh').onclick=()=>{rd.render(sc,cam);const m=M(S),r=L[cur].c.map(c=>c[1](m));G.unshift({src:rd.domElement.toDataURL('image/jpeg',.8),l:cur+1,sc:Math.round(100*r.filter(Boolean).length/r.length)});$('feed').innerHTML=G.map((g,i)=>`<figure data-i="${i}"><img src="${g.src}" alt="Shot"><div>Lesson ${g.l} · ${g.sc}%</div></figure>`).join('')};
$('feed').onclick=e=>{const f=(e.target as HTMLElement).closest('figure');if(f){$<HTMLElement>('lb').querySelector('img')!.src=G[+f.dataset.i!].src;$('lb').style.display='flex'}};$('lb').onclick=()=>$('lb').style.display='none';
let dr:[number,number]|null=null;ov.onpointerdown=e=>{dr=[e.clientX,e.clientY];ov.setPointerCapture(e.pointerId);aid++};
ov.onpointermove=e=>{if(!dr)return;const hd=2*deg(Math.atan(18/S.f)),vd=2*deg(Math.atan(12/S.f));S.rot=cl('rot',S.rot-(e.clientX-dr[0])*hd/ov.clientWidth);S.tilt=cl('tilt',S.tilt+(e.clientY-dr[1])*vd/ov.clientHeight);dr=[e.clientX,e.clientY];upd()};
ov.onpointerup=ov.onpointercancel=()=>dr=null;
function size(){const w=vp.clientWidth,h=w/1.5;rd.setSize(w,h,false);ov.width=w;ov.height=h;upd()}addEventListener('resize',size);
function draw(m:Metrics){const W=ov.width,Hh=ov.height,c=ov.getContext('2d')!;c.clearRect(0,0,W,Hh);c.lineWidth=1;c.strokeStyle='#fff6';c.beginPath();[1/3,2/3].forEach(t=>{c.moveTo(W*t,0);c.lineTo(W*t,Hh);c.moveTo(0,Hh*t);c.lineTo(W,Hh*t)});c.stroke();
const ok=Math.abs(m.roll)<1.5;c.strokeStyle=ok?'#3ddc84':'#ffb020';c.lineWidth=2;c.setLineDash([8,6]);c.beginPath();c.moveTo(0,(1-m.hy(-1))/2*Hh);c.lineTo(W,(1-m.hy(1))/2*Hh);c.stroke();c.setLineDash([]);
if([2,7].includes(cur)){c.fillStyle='#fff9';[1/3,2/3].forEach(a=>[1/3,2/3].forEach(b=>{c.beginPath();c.arc(W*a,Hh*b,5,0,7);c.fill()}))}
const dot=(p:Pt,col:string)=>{if(p.ok){c.strokeStyle=col;c.lineWidth=2;c.beginPath();c.arc(p.sx*W,p.sy*Hh,9,0,7);c.stroke()}};
if([2,5,6,7].includes(cur))dot(m.head,'#ff5a5a');if(cur==3)dot(m.vp,'#3ddc84');
$('hud').textContent=`${S.f|0}mm · ${S.dist.toFixed(1)} m away · ${S.h.toFixed(1)} m high · FOV ${(2*deg(Math.atan(18/S.f))).toFixed(0)}°`}
function mini(){const c=mm.getContext('2d')!,k=4.6,X=(x:number)=>(x+18)*k,Z=(z:number)=>(z+26)*k;c.fillStyle='#5f9a55';c.fillRect(0,0,130,190);c.fillStyle='#555';c.fillRect(X(-3),0,6*k,190);c.fillStyle='#d9c9a3';c.fillRect(X(-13),Z(-15),8*k,6*k);c.fillStyle='#e0452b';c.beginPath();c.arc(X(.9),Z(0),3.5,0,7);c.fill();
const y=-S.rot*R,a=Math.atan2(-Math.cos(y),-Math.sin(y)),hf=Math.atan(18/S.f),cx=X(0),cz=Z(S.dist);c.fillStyle='#ffdc3c66';c.strokeStyle='#ffdc3c';c.beginPath();c.moveTo(cx,cz);c.arc(cx,cz,70,a-hf,a+hf);c.closePath();c.fill();c.stroke();c.fillStyle='#fff';c.beginPath();c.arc(cx,cz,3,0,7);c.fill()}
function upd(){const m=M(S);rd.render(sc,cam);draw(m);mini();K.forEach(([k,,,,,u])=>{$<HTMLInputElement>('r'+k).value=String(S[k]);$('v'+k).textContent=(+S[k].toFixed(2))+' '+u});
const r=L[cur].c.map(c=>c[1](m));$('ck').innerHTML=L[cur].c.map((c,i)=>`<li class="${r[i]?'ok':''}"><i>${r[i]?'✓':'○'}</i>${c[0]}${c[2]?`<small>${c[2](m)}</small>`:''}</li>`).join('');
const all=r.every(Boolean);if(all&&cur<7)done.add(cur);
$('msg').textContent=all?(cur<7?'🎉 Lesson complete — shoot it, or go to the next one.':'🎉 Great frame — press the shutter!'):`${r.filter(Boolean).length}/${r.length} requirements met`;
$('nx').hidden=!(all&&cur<7);[...$('tabs').children].forEach((b,i)=>{b.className=(i==cur?'on ':'')+(done.has(i)?'dn':'')})}
size();load(0);
