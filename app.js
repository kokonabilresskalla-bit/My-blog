let THREE, OrbitControls;

const $ = id => document.getElementById(id);
const viewport = $('viewport');
let scene, camera, renderer, orbit, world, compass, needle, currentArrow, plane, normalArrow;
let mode = 'wire', current = 2, distance = 1.5, turns = 6, reverse = false, paused = false;
let compassAngle = 0, fluxB = .5, area = .2, theta = 0, draggingCompass = false;
const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(), dragPlane = new THREE.Plane(new THREE.Vector3(0,1,0),0);
const materials = [];
const mat = (color, metalness=.25, roughness=.35) => { const m = new THREE.MeshStandardMaterial({color,metalness,roughness}); materials.push(m); return m; };

async function init(){
  try {
    const [threeModule, controlsModule] = await Promise.all([import('three'), import('three/addons/controls/OrbitControls.js')]);
    THREE = threeModule;
    OrbitControls = controlsModule.OrbitControls;
    scene = new THREE.Scene(); scene.background = new THREE.Color(0x071426); scene.fog = new THREE.Fog(0x071426, 12, 28);
    camera = new THREE.PerspectiveCamera(42,1,.1,100); camera.position.set(6,5,7);
    renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    viewport.innerHTML=''; viewport.appendChild(renderer.domElement);
    orbit = new OrbitControls(camera,renderer.domElement); orbit.enableDamping=true; orbit.dampingFactor=.06; orbit.rotateSpeed=.7; orbit.zoomSpeed=.9; orbit.minDistance=3; orbit.maxDistance=16; orbit.target.set(0,0,0);
    scene.add(new THREE.HemisphereLight(0xc8edff,0x18243a,2.1));
    const key = new THREE.DirectionalLight(0xffffff,3); key.position.set(5,8,6); key.castShadow=true; scene.add(key);
    const fill = new THREE.PointLight(0x36bfff,35,16); fill.position.set(-4,2,-3); scene.add(fill);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(8,80),mat(0x0b1b30,.25,.8)); floor.rotation.x=-Math.PI/2; floor.position.y=-1.18; floor.receiveShadow=true; scene.add(floor);
    const grid = new THREE.GridHelper(12,24,0x315a7d,0x1a3551); grid.position.y=-1.16; scene.add(grid);
    world = new THREE.Group(); scene.add(world);
    renderer.domElement.addEventListener('pointerdown',onPointerDown);
    renderer.domElement.addEventListener('pointermove',onPointerMove);
    renderer.domElement.addEventListener('pointerup',onPointerUp);
    renderer.domElement.addEventListener('pointercancel',onPointerUp);
    new ResizeObserver(resize).observe(viewport); resize(); build(); animate();
  } catch(err){ console.error('3D initialization failed:', err); showError('فشل تحميل مكتبة العرض ثلاثي الأبعاد أو تشغيل WebGL. تأكد من اتصال الإنترنت، ثم افتح الصفحة في Chrome واضغط إعادة المحاولة. تفاصيل الخطأ: '+(err?.message || 'غير متاحة')); }
}
function showError(msg){ viewport.innerHTML='<div class="scene-error"><b>المعمل ثلاثي الأبعاد مش قادر يبدأ</b><span>'+msg+'</span><button onclick="location.reload()">إعادة المحاولة</button></div>'; }
function resize(){ if(!renderer)return; const w=Math.max(1,viewport.clientWidth),h=Math.max(1,viewport.clientHeight); camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h,false); }
function disposeWorld(){ while(world.children.length){const o=world.children[0];world.remove(o);o.traverse?.(n=>{n.geometry?.dispose?.();if(n.material){(Array.isArray(n.material)?n.material:[n.material]).forEach(m=>{if(!materials.includes(m))m.dispose?.()})}})} compass=needle=currentArrow=plane=normalArrow=null; }
function addLine(points,color=0x47d7ff,opacity=.72){const g=new THREE.BufferGeometry().setFromPoints(points);const l=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity}));world.add(l);return l;}
function addArrow(dir,pos,len=1,color=0x5bdfff){const a=new THREE.ArrowHelper(dir.clone().normalize(),pos,len,color,.18,.1);world.add(a);return a;}
function addSphere(pos,r,color){const m=new THREE.Mesh(new THREE.SphereGeometry(r,24,16),mat(color,.55,.25));m.position.copy(pos);m.castShadow=true;world.add(m);return m;}
function makeCompass(pos){
  compass=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.43,.43,.12,64),mat(0x1b3654,.7,.24)); body.castShadow=true; compass.add(body);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(.42,.035,12,64),mat(0x69ddff,.65,.2));rim.rotation.x=Math.PI/2;rim.position.y=.075;compass.add(rim);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;const tick=new THREE.Mesh(new THREE.BoxGeometry(.018,.018,.07),mat(0xc5e7fa));tick.position.set(Math.cos(a)*.34,.08,Math.sin(a)*.34);tick.rotation.y=-a;compass.add(tick)}
  needle=new THREE.Group();
  const north=new THREE.Mesh(new THREE.ConeGeometry(.085,.62,5),mat(0xff566d,.35,.22));north.rotation.z=-Math.PI/2;north.position.x=.29;north.castShadow=true;needle.add(north);
  const south=new THREE.Mesh(new THREE.ConeGeometry(.085,.62,5),mat(0xeaf4ff,.25,.25));south.rotation.z=Math.PI/2;south.position.x=-.29;south.castShadow=true;needle.add(south);
  compass.add(needle); compass.position.copy(pos); compass.userData.draggable=true; world.add(compass);
  const label=document.createElement('div'); label.className='drag-hint';label.textContent='اسحب البوصلة بإصبعك';viewport.appendChild(label);
}
function buildWire(){
  const rod=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,4.2,40),mat(0xe6b56c,.8,.2));rod.castShadow=true;world.add(rod);
  addSphere(new THREE.Vector3(0,2.12,0),.1,0xffcf85);addSphere(new THREE.Vector3(0,-2.12,0),.1,0xffcf85);
  currentArrow=addArrow(new THREE.Vector3(0,reverse?-1:1,0),new THREE.Vector3(0,-1.8,0),3.5,0xffbd65);
  for(let j=0;j<6;j++){const r=.48+j*.25,pts=[];for(let i=0;i<=160;i++){const a=i/160*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r))}addLine(pts,0x39caff,.25+j*.055);
    for(let k=0;k<4;k++){const a=k*Math.PI/2+j*.12;const p=new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r);const tangent=new THREE.Vector3(-Math.sin(a),0,Math.cos(a)).multiplyScalar(reverse?-1:1);addArrow(tangent,p,.23,0x62e7ff)}
  }
  compassAngle=compassAngle||0;makeCompass(new THREE.Vector3(distance*Math.cos(compassAngle),0,distance*Math.sin(compassAngle)));
}
function buildCoil(solenoid=false){
  const n=turns, radius=solenoid?.64:1.28, length=solenoid?2.8:0;
  for(let k=0;k<n;k++){const y=solenoid?(k-(n-1)/2)*(length/Math.max(1,n-1)):0,pts=[];for(let i=0;i<=180;i++){const a=i/180*Math.PI*2;pts.push(solenoid?new THREE.Vector3(Math.cos(a)*radius,y,Math.sin(a)*radius):new THREE.Vector3(Math.cos(a)*radius,Math.sin(a)*radius,0))}addLine(pts,0xffbd68,.95)}
  if(solenoid){
    // axial field lines inside and return curves outside
    for(let z=-.35;z<=.36;z+=.23){const pts=[];for(let i=0;i<=40;i++){const x=-1.55+i*3.1/40;pts.push(new THREE.Vector3(x,z,.0))}addLine(pts,0x49d9ff,.85)}
    for(let y of [-.45,.45]){const pts=[];for(let i=0;i<=100;i++){const a=i/100*Math.PI*2;pts.push(new THREE.Vector3(1.65*Math.cos(a),y,1.15*Math.sin(a)))}addLine(pts,0x49d9ff,.45)}
    makeCompass(new THREE.Vector3(0,1.7,0));
  }else{
    for(let x of [-1.65,1.65]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,.34,24),mat(0x7896b5,.65));p.position.x=x;p.rotation.z=Math.PI/2;world.add(p)}
    for(let r of [.45,.75,1.05]){const pts=[];for(let i=0;i<=120;i++){const a=i/120*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*r,Math.sin(a)*r,0))}addLine(pts,0x42d7ff,.45)}
    makeCompass(new THREE.Vector3(0,0,distance));
  }
}
function buildFlux(){
  const geo=new THREE.PlaneGeometry(2.5,1.7);
  plane=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:0x20bde8,transparent:true,opacity:.32,side:THREE.DoubleSide,metalness:.3,roughness:.3}));plane.rotation.x=-Math.PI/2;plane.castShadow=true;world.add(plane);
  const edge=new THREE.LineSegments(new THREE.EdgesGeometry(geo),new THREE.LineBasicMaterial({color:0x8beeff}));edge.rotation.x=-Math.PI/2;world.add(edge);
  normalArrow=addArrow(new THREE.Vector3(0,1,0),new THREE.Vector3(0,.04,0),1.45,0xffbd68);
  for(let x=-2;x<=2;x+=.5)for(let z=-1.5;z<=1.5;z+=.5){addArrow(new THREE.Vector3(0,1,0),new THREE.Vector3(x,1.2,z),.25,0x51d9ff)}
}
function slider(id,label,value,min,max,step,unit){return '<div class="control-group"><div class="control-top"><label for="'+id+'">'+label+'</label><output id="'+id+'-out">'+value+unit+'</output></div><input class="range" id="'+id+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'"><div class="range-labels"><span>'+min+unit+'</span><span>'+max+unit+'</span></div></div>'}
function controls(){
  if(mode==='wire')return slider('current','شدة التيار',current,.2,5,.1,' A')+slider('distance','بُعد البوصلة',distance,.7,3.5,.1,' cm')+slider('position','دوران البوصلة حول السلك',Math.round(compassAngle*180/Math.PI),0,350,5,'°');
  if(mode==='coil')return slider('current','شدة التيار',current,.2,5,.1,' A')+slider('turns','عدد اللفات',turns,1,12,1,' لفة')+slider('distance','موضع البوصلة',distance,.7,3.5,.1,' cm');
  if(mode==='solenoid')return slider('current','شدة التيار',current,.2,5,.1,' A')+slider('turns','عدد اللفات',turns,3,15,1,' لفة')+slider('distance','موضع البوصلة على المحور',distance,.7,3.5,.1,' cm');
  return slider('fluxB','كثافة الفيض B',fluxB,.05,2,.05,' T')+slider('area','مساحة السطح A',area,.05,1,.01,' m²')+slider('theta','الزاوية مع العمود على السطح',theta,0,180,1,'°');
}
function build(){
  disposeWorld(); compassAngle=Number.isFinite(compassAngle)?compassAngle:0;
  camera.position.set(6,5,7);orbit.target.set(0,0,0);
  if(mode==='wire'){buildWire();$('scene-title').textContent='تجربة أورستد: السلك المستقيم والبوصلة';$('scene-subtitle').textContent='اسحب البوصلة حول السلك أو استخدم أدوات التحكم.'}
  if(mode==='coil'){buildCoil(false);$('scene-title').textContent='المجال المغناطيسي للملف الدائري';$('scene-subtitle').textContent='راقب المجال عند مركز الملف وغيّر التيار وعدد اللفات.'}
  if(mode==='solenoid'){buildCoil(true);$('scene-title').textContent='المجال المغناطيسي للملف اللولبي';$('scene-subtitle').textContent='لاحظ المجال شبه المنتظم داخل الملف وخطوط الرجوع خارجه.'}
  if(mode==='flux'){buildFlux();$('scene-title').textContent='تجربة الفيض المغناطيسي';$('scene-subtitle').textContent='غيّر زاوية السطح ومساحته وكثافة الفيض.'}
  $('controls').innerHTML=controls();$('controls').querySelectorAll('input').forEach(el=>el.addEventListener('input',onControl));
  $('reverse').hidden=mode==='flux';updateReadout();
}
function onControl(e){
  const id=e.target.id,v=Number(e.target.value);
  if(id==='current')current=v;if(id==='distance')distance=v;if(id==='position')compassAngle=v*Math.PI/180;
  if(id==='turns')turns=v;if(id==='fluxB')fluxB=v;if(id==='area')area=v;if(id==='theta')theta=v;
  const out=$(id+'-out');if(out)out.textContent=v+(id==='current'?' A':id==='distance'?' cm':id==='position'||id==='theta'?'°':id==='fluxB'?' T':id==='area'?' m²':' لفة');
  if(id==='turns'){build();return}
  updateCompass();updateReadout();
}
function updateCompass(){
  if(!compass||!needle)return;
  if(mode==='wire'){compass.position.set(distance*Math.cos(compassAngle),0,distance*Math.sin(compassAngle));needle.rotation.y=compassAngle+(reverse?-Math.PI/2:Math.PI/2)}
  else {needle.rotation.y=reverse?Math.PI:0;if(mode==='coil')compass.position.set(0,0,distance);if(mode==='solenoid')compass.position.set(0,distance,0)}
  if(currentArrow)currentArrow.setDirection(new THREE.Vector3(0,reverse?-1:1,0));
}
function updateReadout(){
  let B=0;
  if(mode==='wire')B=2e-7*current/(distance/100);
  if(mode==='coil')B=4*Math.PI*1e-7*turns*current/(2*1.28);
  if(mode==='solenoid')B=4*Math.PI*1e-7*(turns/2.8)*current;
  const flux=fluxB*area*Math.cos(theta*Math.PI/180);
  $('field-value').textContent=mode==='flux'?flux.toFixed(4)+' Wb':(B*1e6).toFixed(2)+' μT';
  $('field-direction').textContent=mode==='flux'?'فيض خلال السطح':reverse?'اتجاه معكوس':'قاعدة اليد اليمنى';
  $('needle-value').textContent=mode==='flux'?theta+'°':mode==='wire'?Math.round((compassAngle*180/Math.PI+360)%360)+'°':reverse?'180°':'0°';
  $('current-value').textContent=mode==='flux'?'—':current.toFixed(1)+' A';
  const notes={
    wire:['إبرة البوصلة تصطف مماسيًا مع خطوط المجال الدائرية حول السلك.','وجّه إبهام اليد اليمنى مع التيار؛ التفاف الأصابع يحدد اتجاه المجال.','اسحب البوصلة حول السلك ثم اعكس التيار ولاحظ انعكاس اتجاه الإبرة.','المجال حول سلك مستقيم طويل','B = μ₀ I / 2πr'],
    coil:['المجال عند مركز الملف يكون تقريبًا على محور الملف.','مجالات اللفات تتجمع في اتجاه واحد داخل مركز الملف.','زوّد عدد اللفات أو شدة التيار وقارن شدة المجال.','المجال عند مركز ملف دائري','B = μ₀ N I / 2R'],
    solenoid:['داخل الملف خطوط المجال متوازية ومتقاربة؛ المجال شبه منتظم.','الملف اللولبي يشبه مغناطيسًا له قطبان شمالي وجنوبي.','غيّر عدد اللفات والتيار ولاحظ زيادة المجال.','المجال داخل ملف لولبي طويل','B = μ₀ n I'],
    flux:['الفيض يقيس مقدار المجال المغناطيسي المار خلال سطح.','الزاوية θ هنا بين المجال والعمود على السطح، وليست مع السطح نفسه.','اضبط الزاوية عند 0° ثم 90° ثم 180° وقارن الفيض.','الفيض المغناطيسي','Φ = B A cos θ']
  };
  const n=notes[mode];$('observe').textContent=n[0];$('explain').textContent=n[1];$('challenge').textContent=n[2];$('law-title').textContent=n[3];$('equation').textContent=n[4];
  $('law-desc').textContent=mode==='wire'?'يتناسب المجال طرديًا مع شدة التيار وعكسيًا مع البعد عن السلك.':mode==='coil'?'يزيد بزيادة عدد اللفات والتيار ويقل بزيادة نصف قطر الملف.':mode==='solenoid'?'يزيد بزيادة عدد اللفات لكل وحدة طول وشدة التيار.':'الفيض = كثافة الفيض × المساحة × جيب تمام الزاوية مع العمود.';
  $('live-note').textContent=mode==='flux'?'الفيض الحالي = B × A × cos θ. عند 90° يكون الفيض صفرًا.':'القراءة تقريبية وفق العلاقات النظرية المثالية، وتتغير لحظيًا مع أدوات التحكم.';
}
function onPointerDown(e){
  if(mode!=='wire'||!compass)return;
  const rect=renderer.domElement.getBoundingClientRect();pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObject(compass,true);
  if(hits.length){draggingCompass=true;orbit.enabled=false;renderer.domElement.setPointerCapture(e.pointerId);e.preventDefault()}
}
function onPointerMove(e){
  if(!draggingCompass)return;
  const rect=renderer.domElement.getBoundingClientRect();pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(pointer,camera);
  const p=new THREE.Vector3();if(raycaster.ray.intersectPlane(dragPlane,p)){const r=Math.hypot(p.x,p.z);if(r>.55){distance=THREE.MathUtils.clamp(r,.7,3.5);compassAngle=Math.atan2(p.z,p.x);const d=$('distance'),a=$('position');if(d){d.value=distance;$('distance-out').textContent=distance.toFixed(1)+' cm'}if(a){a.value=Math.round((compassAngle*180/Math.PI+360)%360);$('position-out').textContent=a.value+'°'}updateCompass();updateReadout()}}
}
function onPointerUp(){if(draggingCompass){draggingCompass=false;orbit.enabled=true}}
function animate(t=0){requestAnimationFrame(animate);if(!renderer)return;if(!paused&&mode==='flux'&&plane){plane.rotation.z=Math.sin(t*.00035)*theta*Math.PI/180;const d=new THREE.Vector3(Math.sin(plane.rotation.z),Math.cos(plane.rotation.z),0);normalArrow?.setDirection(d)}orbit.update();renderer.render(scene,camera)}
$('reverse').addEventListener('click',()=>{reverse=!reverse;$('reverse').textContent=reverse?'↕ رجّع اتجاه التيار':'↕ اعكس اتجاه التيار';updateCompass();updateReadout()});
$('pause').addEventListener('click',()=>{paused=!paused;$('pause').textContent=paused?'▶ استئناف الحركة':'Ⅱ إيقاف الحركة'});
$('reset-view').addEventListener('click',()=>{current=2;distance=1.5;turns=6;reverse=false;paused=false;compassAngle=0;fluxB=.5;area=.2;theta=0;$('reverse').textContent='↕ اعكس اتجاه التيار';$('pause').textContent='Ⅱ إيقاف الحركة';build()});
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t===b));mode=b.dataset.mode;build()}));
window.addEventListener('error',e=>{if(String(e.message).includes('WebGL'))showError('الجهاز أو المتصفح لا يدعم WebGL حاليًا.')});
init();