/* Physics Studio 3D — Three.js is vendored locally under vendor/three. */
const $=id=>document.getElementById(id);
const mount=$('labCanvas');
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.domElement.id='labCanvas';mount.replaceWith(renderer.domElement);
const canvas=renderer.domElement;
const scene=new THREE.Scene();scene.background=new THREE.Color(0x081a2b);scene.fog=new THREE.Fog(0x081a2b,13,28);
const camera=new THREE.PerspectiveCamera(43,1,.1,80);
const hemi=new THREE.HemisphereLight(0xbdeaff,0x142235,2.0);scene.add(hemi);
const keyLight=new THREE.DirectionalLight(0xffffff,3.1);keyLight.position.set(5,9,6);keyLight.castShadow=true;keyLight.shadow.mapSize.set(1024,1024);keyLight.shadow.camera.left=-7;keyLight.shadow.camera.right=7;keyLight.shadow.camera.top=7;keyLight.shadow.camera.bottom=-7;scene.add(keyLight);
const rimLight=new THREE.PointLight(0x36bfff,35,18);rimLight.position.set(-5,3,-4);scene.add(rimLight);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:0x0a1b2b,roughness:.92,metalness:.05}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.65;floor.receiveShadow=true;scene.add(floor);
const grid=new THREE.GridHelper(18,36,0x24506c,0x17354c);grid.position.y=-1.63;scene.add(grid);
const root=new THREE.Group();scene.add(root);
const state={lab:'magnetism',exp:'wire',current:2,distance:1.5,turns:8,angle:0,area:.2,field:.5,voltage:6,resistance:12,mass:1,height:1,length:1,frequency:2,amplitude:1,refractive:1.5,paused:false,yaw:-.55,pitch:.32,zoom:1,drag:false,reverse:false};
let animator=()=>{};
function resize(){const w=Math.max(1,canvas.clientWidth),h=Math.max(1,canvas.clientHeight);renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();updateCamera()}
new ResizeObserver(resize).observe(canvas);window.addEventListener('resize',resize);
function updateCamera(){const radius=7.5/state.zoom,cp=Math.cos(state.pitch);camera.position.set(Math.sin(state.yaw)*radius*cp,Math.sin(state.pitch)*radius+1.0,Math.cos(state.yaw)*radius*cp);camera.lookAt(0,0,0)}
function mat(color,metalness=.25,roughness=.38,extra={}){return new THREE.MeshStandardMaterial({color,metalness,roughness,...extra})}
const copper=mat(0xc47a3a,.82,.25),gold=mat(0xe8b65c,.78,.22),steel=mat(0x91b5ca,.85,.22),dark=mat(0x18364e,.55,.32),cyan=mat(0x42d8ff,.35,.2,{emissive:0x087ba0,emissiveIntensity:.65}),red=mat(0xff526b,.28,.24,{emissive:0x6c0718,emissiveIntensity:.35}),blue=mat(0x5d9dff,.35,.24,{emissive:0x092d78,emissiveIntensity:.3}),white=mat(0xe9f5ff,.25,.25);
function add(geo,material,pos=[0,0,0],parent=root){const o=new THREE.Mesh(geo,material);o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function tube(points,material,r=.025,parent=root){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return add(new THREE.TubeGeometry(curve,Math.max(24,points.length*4),r,8,false),material,[0,0,0],parent)}
function beam(a,b,material,r=.025,parent=root){const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=new THREE.Vector3().subVectors(B,A);const m=add(new THREE.CylinderGeometry(r,r,d.length(),12),material,A.clone().add(B).multiplyScalar(.5).toArray(),parent);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return m}
function arrow(a,b,material,r=.035,parent=root){beam(a,b,material,r,parent);const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),d=new THREE.Vector3().subVectors(B,A).normalize();const head=add(new THREE.ConeGeometry(r*3,r*7,12),material,B.toArray(),parent);head.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d);return head}
function clearRoot(){while(root.children.length){const o=root.children[0];root.remove(o);o.traverse(n=>{n.geometry?.dispose?.();if(n.material){const list=Array.isArray(n.material)?n.material:[n.material];for(const m of list){if(m.userData?.owned){m.map?.dispose?.();m.dispose?.()}}}})}}
function label(text,pos,color='#dff7ff'){const c=document.createElement('canvas');c.width=256;c.height=80;const x=c.getContext('2d');x.font='bold 42px system-ui';x.textAlign='center';x.fillStyle=color;x.fillText(text,128,54);const tex=new THREE.CanvasTexture(c);const spriteMat=new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false});spriteMat.userData.owned=true;const sprite=new THREE.Sprite(spriteMat);sprite.position.set(...pos);sprite.scale.set(1.2,.38,1);root.add(sprite)}
function compass(pos=[1.7,-.15,0]){
 const g=new THREE.Group();g.position.set(...pos);root.add(g);
 add(new THREE.CylinderGeometry(.68,.7,.16,64),dark,[0,0,0],g);
 const rim=add(new THREE.TorusGeometry(.66,.055,12,64),gold,[0,.1,0],g);rim.rotation.x=Math.PI/2;
 add(new THREE.CylinderGeometry(.59,.59,.025,64),mat(0x8bb5c9,.35,.16,{transparent:true,opacity:.52}),[0,.095,0],g);
 for(let i=0;i<60;i++){const a=i*Math.PI/30,r=i%5===0?.53:.56,len=i%5===0?.13:.06;beam([Math.cos(a)*r,.12,Math.sin(a)*r],[Math.cos(a)*(r-len),.12,Math.sin(a)*(r-len)],i%5===0?white:steel,.009,g)}
 const needle=new THREE.Group();needle.position.y=.16;g.add(needle);
 const north=add(new THREE.ConeGeometry(.105,.72,4),red,[.0,0,.36],needle);north.rotation.x=Math.PI/2;
 const south=add(new THREE.ConeGeometry(.105,.72,4),blue,[0,0,-.36],needle);south.rotation.x=-Math.PI/2;
 add(new THREE.SphereGeometry(.105,24,16),gold,[0,.035,0],needle);
 add(new THREE.SphereGeometry(.045,16,12),white,[0,.105,0],needle);
 for(const [t,z] of [['N',-.76],['S',.76]]){const c=document.createElement('canvas');c.width=128;c.height=128;const q=c.getContext('2d');q.font='bold 78px system-ui';q.textAlign='center';q.fillStyle=t==='N'?'#ff7085':'#d7eaff';q.fillText(t,64,88);const spriteTex=new THREE.CanvasTexture(c),spriteMat=new THREE.SpriteMaterial({map:spriteTex,transparent:true});spriteMat.userData.owned=true;const s=new THREE.Sprite(spriteMat);s.position.set(0,.14,z);s.scale.set(.28,.28,1);g.add(s)}
 const glassMat=new THREE.MeshPhysicalMaterial({color:0xbcefff,transparent:true,opacity:.16,roughness:.08,metalness:.1,clearcoat:1,clearcoatRoughness:.05});glassMat.userData.owned=true;add(new THREE.CylinderGeometry(.6,.6,.018,64),glassMat,[0,.25,0],g);
 return needle;
}
function ring(radius,y,material){const o=add(new THREE.TorusGeometry(radius,.025,10,96),material,[0,y,0]);o.rotation.x=Math.PI/2;return o}
function labBase(w=3.8,d=2.6){const g=new THREE.Group();g.position.y=-1.48;root.add(g);add(new THREE.BoxGeometry(w,.14,d),dark,[0,0,0],g);add(new THREE.BoxGeometry(w-.12,.025,d-.12),steel,[0,.083,0],g);for(const x of [-1,1])for(const z of [-1,1])add(new THREE.CylinderGeometry(.055,.07,.1,16),gold,[x*(w/2-.16),-.12,z*(d/2-.16)],g);return g}
function labStand(x=-.8){const g=new THREE.Group();g.position.set(x,-1.3,0);root.add(g);add(new THREE.BoxGeometry(.9,.13,.68),dark,[0,0,0],g);add(new THREE.BoxGeometry(.72,.025,.5),steel,[0,.08,0],g);add(new THREE.CylinderGeometry(.055,.065,2.65,20),steel,[0,1.42,0],g);add(new THREE.CylinderGeometry(.12,.12,.1,20),gold,[0,2.78,0],g);beam([0,1.25,0],[.85,1.25,0],steel,.05,g);return g}
function supply(){const g=new THREE.Group();g.position.set(-2,-.72,.18);root.add(g);add(new THREE.BoxGeometry(.9,.58,.55),mat(0x263f58,.5,.3),[0,0,0],g);add(new THREE.BoxGeometry(.62,.2,.025),mat(0x07111d,.2,.15),[0,.12,.29],g);const c=document.createElement('canvas');c.width=192;c.height=64;const x=c.getContext('2d');x.fillStyle='#07111d';x.fillRect(0,0,192,64);x.fillStyle='#61f5cf';x.font='bold 34px monospace';x.fillText(state.current.toFixed(1)+' A',12,44);const tex=new THREE.CanvasTexture(c),m=new THREE.SpriteMaterial({map:tex,transparent:true});m.userData.owned=true;const s=new THREE.Sprite(m);s.position.set(0,.13,.32);s.scale.set(.5,.17,1);g.add(s);for(const x of [-.24,.24])add(new THREE.CylinderGeometry(.06,.06,.06,20),gold,[x,-.13,.3],g)}
function resistor(){const g=new THREE.Group();g.position.set(0,-.45,0);root.add(g);beam([-.7,0,0],[-.3,0,0],steel,.025,g);beam([.3,0,0],[.7,0,0],steel,.025,g);const body=add(new THREE.CylinderGeometry(.14,.14,.62,24),mat(0xd7d2c0,.12,.35),[0,0,0],g);body.rotation.z=Math.PI/2;for(let i=0;i<4;i++){const b=add(new THREE.TorusGeometry(.145,.018,8,20),[gold,red,blue,gold][i],[-.19+i*.125,0,0],g);b.rotation.y=Math.PI/2}}
function buildScene(){
 clearRoot();animator=()=>{};
 const exp=state.exp;
 if(exp==='wire'){
  labBase();labStand(-.1);supply();
  add(new THREE.CylinderGeometry(.075,.075,3.5,32),copper,[.75,.05,0]);
  add(new THREE.CylinderGeometry(.12,.12,.08,32),gold,[.75,1.82,0]);add(new THREE.CylinderGeometry(.12,.12,.08,32),gold,[.75,-1.72,0]);
  tube([[-1.55,-.72,.18],[-.9,-.72,.18],[-.5,-.72,.18],[-.5,1.82,.18],[.75,1.82,.18]],red,.035);
  tube([[.75,-1.72,.18],[-.5,-1.72,.18],[-.5,-.72,.18]],blue,.035);
  arrow([.75,-1.45,0],[.75,1.5,0],state.reverse?blue:red,.04);
  for(let r=.45;r<2.05;r+=.38){const pts=[];for(let i=0;i<=100;i++){const a=i/100*Math.PI*2;pts.push([.75+Math.cos(a)*r,0,Math.sin(a)*r])}tube(pts,cyan,.012);for(let i=0;i<4;i++){const a=i*Math.PI/2+.3;arrow([.75+Math.cos(a)*r,0,Math.sin(a)*r],[.75+Math.cos(a+.13)*r,0,Math.sin(a+.13)*r],cyan,.018)}}
  const needle=compass([.75+Math.max(.9,Math.min(2.0,state.distance*.38)),.0,0]);needle.rotation.y=Math.atan2(state.current/Math.max(.3,state.distance),1.4)*(state.reverse?-1:1);
  label('تجربة أورستد',[.4,2.25,0]);
 }else if(exp==='coil'||exp==='solenoid'){
  labBase();labStand(-1.25);labStand(1.25);
  const n=Math.max(3,Math.min(24,state.turns));
  for(let k=0;k<(exp==='coil'?1:n);k++){const y=exp==='coil'?0:(k/(n-1)-.5)*2.8,pts=[];for(let j=0;j<=100;j++){const a=j/100*Math.PI*2;pts.push([Math.cos(a)*1.05,y,Math.sin(a)*1.05])}tube(pts,copper,.035)}
  for(let y=-1;y<=1;y+=.38)arrow([0,y,-.5],[0,y,.55],cyan,.025);
  const needle=compass([1.75,.05,0]);needle.rotation.y=.2;tube([[-1.25,1.1,0],[0,1.1,0],[1.25,1.1,0]],red,.03);tube([[1.25,-1.2,0],[0,-1.2,0],[-1.25,-1.2,0]],blue,.03);
  label(exp==='coil'?'ملف دائري':'ملف لولبي',[0,2.0,0]);
 }else if(exp==='flux'){
  const fluxMat=new THREE.MeshPhysicalMaterial({color:0x50cfff,transparent:true,opacity:.3,side:THREE.DoubleSide,metalness:.15,roughness:.2,clearcoat:1});fluxMat.userData.owned=true;const plane=add(new THREE.PlaneGeometry(2.8,1.9),fluxMat,[0,0,0]);plane.rotation.x=Math.PI/2-state.angle*Math.PI/180;
  const edgeGeom=new THREE.EdgesGeometry(new THREE.BoxGeometry(2.82,.025,1.92));const edgeMat=new THREE.LineBasicMaterial({color:0xe7f8ff});edgeMat.userData.owned=true;const edge=new THREE.LineSegments(edgeGeom,edgeMat);edge.rotation.x=Math.PI/2-state.angle*Math.PI/180;root.add(edge);
  for(let x=-2;x<=2;x+=.6)arrow([x,-.8,-1.4],[x,.8,-1.4],cyan,.022);
  const normal=new THREE.Vector3(0,1,0).applyAxisAngle(new THREE.Vector3(1,0,0),state.angle*Math.PI/180);arrow([0,0,0],normal.clone().multiplyScalar(1.7).toArray(),gold,.04);label('سطح الفيض',[0,1.9,0]);
 }else if(exp==='pendulum'){
  labBase(3.2,2.2);labStand(0);
  const pivot=add(new THREE.SphereGeometry(.12,24,16),gold,[0,1.6,0]);
  const arm=new THREE.Group();arm.position.set(0,1.6,0);root.add(arm);beam([0,0,0],[0,-1.8,0],steel,.025,arm);add(new THREE.SphereGeometry(.24,32,24),gold,[0,-1.8,0],arm);
  animator=t=>{if(!state.paused)arm.rotation.z=Math.sin(t*2.1)*.42};
  beam([-.7,1.6,0],[.7,1.6,0],steel,.035);
 }else if(exp==='projectile'){
  const v=state.voltage,a=state.angle*Math.PI/180,T=2*v*Math.sin(a)/9.81,pts=[];for(let i=0;i<=80;i++){const t=T*i/80;pts.push([v*Math.cos(a)*t/3,(v*Math.sin(a)*t-4.905*t*t)/3,0])}tube(pts,cyan,.035);add(new THREE.SphereGeometry(.13,24,16),gold,[0,0,0]);beam([-.5,-1.45,0],[.5,-1.45,0],steel,.035);
 }else if(exp==='incline'){
  const a=state.angle*Math.PI/180,plane=add(new THREE.BoxGeometry(3,.12,1.6),dark,[-.15,-.45,0]);plane.rotation.z=a;beam([-1.55,-1.4,0],[1.45*Math.cos(a)-.1,1.45*Math.sin(a)-1.4,0],gold,.045);add(new THREE.BoxGeometry(.45,.45,.45),gold,[-.5,-.5,0]).rotation.z=a;
  arrow([-.5,-.5,0],[-.5,-1.4,0],red,.025);
 }else if(exp==='ohm'||exp==='series'){
  labBase(4.8,2.5);supply();
  const pts=[[-1.8,.45,0],[-.9,.45,0],[-.9,-.45,0],[.9,-.45,0],[.9,.45,0],[1.8,.45,0]];for(let i=0;i<pts.length-1;i++)beam(pts[i],pts[i+1],cyan,.035);
  resistor();add(new THREE.CylinderGeometry(.22,.22,.2,32),red,[-1.8,.45,0]);add(new THREE.CylinderGeometry(.22,.22,.2,32),blue,[1.8,.45,0]);arrow([-.3,.9,0],[.6,.9,0],gold,.035);
 }else if(exp==='reflection'||exp==='refraction'){
  const opticMat=new THREE.MeshStandardMaterial({color:0x18466a,transparent:true,opacity:.3,side:THREE.DoubleSide});opticMat.userData.owned=true;add(new THREE.PlaneGeometry(4,3),opticMat,[0,-.6,0]);
  beam([-2,0,0],[2,0,0],white,.025);beam([0,-1.6,0],[0,1.6,0],steel,.012);
  const a=state.angle*Math.PI/180;beam([-1.7,1.5,0],[0,0,0],gold,.035);
  if(exp==='reflection')beam([0,0,0],[1.7,1.5,0],gold,.035);else beam([0,0,0],[1.3,-Math.sin(a)/state.refractive*1.7,0],cyan,.035);
 }else if(exp==='wave'){
  const pts=[];for(let x=-3;x<=3;x+=.06)pts.push([x,Math.sin(x*state.frequency)*state.amplitude,0]);tube(pts,cyan,.04);
  beam([-3.2,0,0],[3.2,0,0],steel,.012);
 }
}
function loop(){const t=performance.now()/1000;if(!state.paused)animator(t);renderer.render(scene,camera);requestAnimationFrame(loop)}
const labs=[
{id:'magnetism',name:'المغناطيسية',icon:'🧲',desc:'المجال المغناطيسي والفيض والبوصلة',items:[['wire','السلك المستقيم','قاعدة اليد اليمنى'],['coil','الملف الدائري','المجال عند المركز'],['solenoid','الملف اللولبي','المجال داخل الملف'],['flux','الفيض المغناطيسي','تأثير الزاوية والمساحة']]},
{id:'mechanics',name:'الميكانيكا',icon:'⚙️',desc:'الحركة والقوى والطاقة',items:[['pendulum','البندول البسيط','الزمن الدوري'],['projectile','المقذوفات','مسار الحركة'],['incline','المستوى المائل','تحليل القوى']]},
{id:'electricity',name:'الكهرباء',icon:'⚡',desc:'الدوائر وقانون أوم',items:[['ohm','قانون أوم','الجهد والتيار والمقاومة'],['series','توصيل المقاومات','توالي وتوازي']]},
{id:'optics',name:'البصريات',icon:'🔦',desc:'الانعكاس والانكسار والعدسات',items:[['reflection','انعكاس الضوء','زاوية السقوط والانعكاس'],['refraction','انكسار الضوء','قانون سنيل']]},
{id:'waves',name:'الموجات',icon:'〰️',desc:'التردد والطول الموجي والسعة',items:[['wave','الموجة المستعرضة','خصائص الموجات']]}
];
const expInfo={
wire:['تجربة أورستد','مرّر تيارًا في سلك وشاهد المجال الدائري وانحراف إبرة البوصلة.','B = μ₀ I / 2πr'],
coil:['الملف الدائري','غيّر عدد اللفات وشدة التيار ولاحظ المجال عند مركز الملف.','B = μ₀ N I / 2R'],
solenoid:['الملف اللولبي','استكشف المجال شبه المنتظم داخل الملف وتأثير عدد اللفات.','B = μ₀ n I'],
flux:['الفيض المغناطيسي','أدر السطح بالنسبة للمجال ولاحظ تغير الفيض خلاله.','Φ = B A cos θ'],
pendulum:['البندول البسيط','غيّر طول الخيط وشاهد أثره على الزمن الدوري.','T = 2π √(L/g)'],
projectile:['حركة المقذوفات','غيّر زاوية الإطلاق والسرعة الابتدائية واستكشف المسار.','x = v₀ cos(θ)t'],
incline:['المستوى المائل','غيّر زاوية الميل والكتلة ولاحظ مركبات الوزن.','F∥ = mg sin(θ)'],
ohm:['قانون أوم','غيّر الجهد أو المقاومة وتابع شدة التيار في الدائرة.','V = I R'],
series:['توصيل المقاومات','قارن المقاومة المكافئة في التوالي والتوازي.','Rₛ = R₁ + R₂'],
reflection:['انعكاس الضوء','حرّك الشعاع الساقط ولاحظ تساوي زاويتي السقوط والانعكاس.','θᵢ = θᵣ'],
refraction:['انكسار الضوء','غيّر معامل الانكسار وزاوية السقوط وشاهد انحراف الشعاع.','n₁ sin(θ₁) = n₂ sin(θ₂)'],
wave:['الموجات المستعرضة','غيّر التردد والسعة وشاهد شكل الموجة لحظيًا.','v = f λ']
};
let activeLab='magnetism';
function renderNav(){
 $('labNav').innerHTML=labs.map(l=>'<button class="lab-link '+(l.id===activeLab?'selected':'')+'" data-lab="'+l.id+'"><span>'+l.icon+'</span><span><b>'+l.name+'</b><small>'+l.desc+'</small></span></button>').join('');
 $('labNav').querySelectorAll('button').forEach(b=>b.onclick=()=>{activeLab=b.dataset.lab;state.lab=activeLab;state.exp=labs.find(x=>x.id===activeLab).items[0][0];renderAll()});
}
function renderCatalog(){
 const lab=labs.find(x=>x.id===activeLab);
 $('catalogTitle').textContent=lab.name;$('catalogDesc').textContent=lab.desc;
 $('experimentGrid').innerHTML=lab.items.map((it,i)=>'<button class="experiment-tile '+(state.exp===it[0]?'chosen':'')+'" data-exp="'+it[0]+'"><span class="tile-num">'+String(i+1).padStart(2,'0')+'</span><b>'+it[1]+'</b><small>'+it[2]+'</small><span class="tile-arrow">←</span></button>').join('');
 $('experimentGrid').querySelectorAll('button').forEach(b=>b.onclick=()=>{state.exp=b.dataset.exp;renderAll()});
}
function controls(){
 const common={
wire:[['current','شدة التيار','A',.2,8,.1],['distance','بعد البوصلة','cm',.5,5,.1]],
coil:[['current','شدة التيار','A',.2,8,.1],['turns','عدد اللفات','لفة',1,20,1]],
solenoid:[['current','شدة التيار','A',.2,8,.1],['turns','عدد اللفات','لفة',3,30,1]],
flux:[['field','كثافة الفيض','T',.05,2,.05],['area','مساحة السطح','m²',.05,1,.01],['angle','الزاوية مع العمود','°',0,180,1]],
pendulum:[['length','طول الخيط','m',.2,3,.05],['mass','كتلة الثقل','kg',.1,3,.1]],
projectile:[['voltage','سرعة الإطلاق','m/s',5,35,1],['angle','زاوية الإطلاق','°',10,80,1]],
incline:[['angle','زاوية الميل','°',5,60,1],['mass','الكتلة','kg',.5,10,.5]],
ohm:[['voltage','فرق الجهد','V',1,24,.5],['resistance','المقاومة','Ω',1,100,1]],
series:[['resistance','المقاومة R₁','Ω',1,100,1],['mass','المقاومة R₂','Ω',1,100,1]],
reflection:[['angle','زاوية السقوط','°',0,80,1]],
refraction:[['angle','زاوية السقوط','°',0,80,1],['refractive','معامل الانكسار','n',1.1,2.5,.05]],
wave:[['frequency','التردد','Hz',.5,8,.1],['amplitude','السعة','cm',.2,2,.1]]
 }[state.exp]||[];
 $('controlPanel').innerHTML=common.map(([id,label,unit,min,max,step])=>'<label class="control"><span>'+label+' <output id="o_'+id+'">'+state[id]+ ' '+unit+'</output></span><input type="range" id="c_'+id+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+state[id]+'"><small><i>'+min+'</i><i>'+max+' '+unit+'</i></small></label>').join('');
 common.forEach(([id,label,unit])=>$('c_'+id).oninput=e=>{state[id]=+e.target.value;$('o_'+id).textContent=state[id]+' '+unit;updateReadout();draw()});
}
function renderAll(){
 renderNav();renderCatalog();controls();
 const info=expInfo[state.exp];$('experimentTitle').textContent=info[0];$('experimentIntro').textContent=info[1];$('equation').textContent=info[2];
 $('reverseCurrent').hidden=!['wire','coil','solenoid'].includes(state.exp);
 $('pauseMotion').textContent=state.paused?'استئناف الحركة':'إيقاف الحركة';
 updateReadout();draw();
}
function updateReadout(){
 let val='—',unit='',secondary='';
 switch(state.exp){
 case'wire':val=(.2*state.current/(state.distance/100)).toFixed(2);unit='μT';secondary='المجال يقل بزيادة البعد عن السلك';
 break;
 case'coil':val=(.628*state.turns*state.current).toFixed(2);unit='μT تقريبًا';secondary='المجال يتناسب طرديًا مع NI';
 break;
 case'solenoid':val=(.449*state.turns*state.current).toFixed(2);unit='μT تقريبًا';secondary='المجال الداخلي شبه منتظم';
 break;
 case'flux':val=(state.field*state.area*Math.cos(state.angle*Math.PI/180)).toFixed(4);unit='Wb';secondary='الفيض أعظمي عند θ = 0°';
 break;
 case'pendulum':val=(2*Math.PI*Math.sqrt(state.length/9.81)).toFixed(3);unit='s';secondary='الزمن الدوري لا يعتمد على الكتلة في النموذج المثالي';
 break;
 case'projectile':val=(state.voltage**2*Math.sin(2*state.angle*Math.PI/180)/9.81).toFixed(2);unit='m';secondary='المدى الأفقي النظري';
 break;
 case'incline':val=(state.mass*9.81*Math.sin(state.angle*Math.PI/180)).toFixed(2);unit='N';secondary='مركبة الوزن الموازية للمستوى';
 break;
 case'ohm':val=(state.voltage/state.resistance).toFixed(3);unit='A';secondary='التيار = الجهد ÷ المقاومة';
 break;
 case'series':val=(state.resistance+state.mass).toFixed(2);unit='Ω';secondary='المقاومة المكافئة في التوالي';
 break;
 case'reflection':val=state.angle.toFixed(0);unit='°';secondary='زاوية الانعكاس تساوي زاوية السقوط';
 break;
 case'refraction':val=(Math.asin(Math.sin(state.angle*Math.PI/180)/state.refractive)*180/Math.PI).toFixed(2);unit='°';secondary='زاوية الانكسار في الوسط الثاني';
 break;
 case'wave':val=(state.frequency*2).toFixed(2);unit='m/s*';secondary='سرعة افتراضية عند λ = 2 m';
 }
 $('resultValue').textContent=val+' '+unit;$('resultHint').textContent=secondary;
}
function draw(){buildScene();updateCamera();renderer.render(scene,camera)}
$('reverseCurrent').onclick=()=>{state.reverse=!state.reverse;draw()};
$('pauseMotion').onclick=()=>{state.paused=!state.paused;$('pauseMotion').textContent=state.paused?'استئناف الحركة':'إيقاف الحركة'};
$('zoomIn').onclick=()=>{state.zoom=Math.min(1.8,state.zoom*1.12);draw()};
$('zoomOut').onclick=()=>{state.zoom=Math.max(.65,state.zoom/1.12);draw()};
$('resetScene').onclick=()=>{state.yaw=-.35;state.pitch=.22;state.zoom=1;renderAll()};
canvas.addEventListener('pointerdown',e=>{state.drag=true;state.px=e.clientX;state.py=e.clientY;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!state.drag)return;state.yaw+=(e.clientX-state.px)*.008;state.pitch=Math.max(-1.1,Math.min(1.1,state.pitch+(e.clientY-state.py)*.006));state.px=e.clientX;state.py=e.clientY;updateCamera();renderer.render(scene,camera)});
canvas.addEventListener('pointerup',()=>state.drag=false);canvas.addEventListener('pointercancel',()=>state.drag=false);
renderAll();resize();if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});loop();
