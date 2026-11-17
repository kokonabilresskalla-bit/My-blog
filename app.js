/* Self-contained 3D-style physics lab. No CDN, imports, or external runtime libraries. */
const $ = id => document.getElementById(id);
const viewport = $('viewport');
let canvas, ctx, W=900, H=560, yaw=.72, pitch=.42, zoom=1, dragging=false, lastX=0,lastY=0;
let mode='wire', current=2, distance=1.5, turns=6, reverse=false, paused=false, compassAngle=0, fluxB=.5, area=.2, theta=0;
let anim=0, lastTime=0, fluxTilt=0, experimentData=null;
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const V=(x,y,z)=>({x,y,z});
function init(){
  try{
    canvas=document.createElement('canvas');canvas.id='lab-canvas';canvas.setAttribute('aria-label','مشهد ثلاثي الأبعاد تفاعلي للمغناطيسية');
    viewport.innerHTML='';viewport.appendChild(canvas);ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw new Error('Canvas 2D غير مدعوم في المتصفح');
    resize();new ResizeObserver(resize).observe(viewport);
    canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);canvas.addEventListener('wheel',wheel,{passive:false});
    build();animate(0);
  }catch(e){showError('تعذر تشغيل الرسم التفاعلي على هذا المتصفح. '+(e.message||''));}
}
function showError(msg){viewport.innerHTML='<div class="scene-error"><b>المعمل مش قادر يبدأ</b><span>'+msg+'</span><button onclick="location.reload()">إعادة المحاولة</button></div>'}
function resize(){if(!canvas)return;const r=viewport.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);W=Math.max(320,r.width);H=Math.max(300,r.height||560);canvas.width=Math.round(W*d);canvas.height=Math.round(H*d);canvas.style.width='100%';canvas.style.height='100%';ctx.setTransform(d,0,0,d,0,0)}
function rotate(p){
  const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
  const x=p.x*cy-p.z*sy,z=p.x*sy+p.z*cy,y=p.y*cp-z*sp,depth=p.y*sp+z*cp;
  return {x,y,depth};
}
function project(p){
  const q=rotate(p),f=Math.min(W,H)*1.08,scale=f/(f+q.depth*zoom*1.6+5);
  return {x:W/2+q.x*scale*zoom*1.7,y:H*.52-q.y*scale*zoom*1.7,scale,depth:q.depth};
}
let shapes=[];
function line(a,b,color='#48d9ff',width=2,alpha=1){shapes.push({type:'line',a,b,color,width,alpha,depth:(rotate(a).depth+rotate(b).depth)/2})}
function poly(points,color,width=2,alpha=1,close=false,fill=null){for(let i=1;i<points.length;i++)line(points[i-1],points[i],color,width,alpha);if(close&&points.length>2){line(points[points.length-1],points[0],color,width,alpha);if(fill)shapes.push({type:'fill',points,color:fill,depth:points.reduce((s,p)=>s+rotate(p).depth,0)/points.length})}}
function dot(p,r,color){shapes.push({type:'dot',p,r,color,depth:rotate(p).depth})}
function ring(center,r,axis='y',color='#48d9ff',alpha=.7,width=2,segments=96){
  const pts=[];for(let i=0;i<=segments;i++){const a=i/segments*TAU;pts.push(axis==='y'?V(center.x+Math.cos(a)*r,center.y,center.z+Math.sin(a)*r):axis==='z'?V(center.x+Math.cos(a)*r,center.y+Math.sin(a)*r,center.z):V(center.x,center.y+Math.cos(a)*r,center.z+Math.sin(a)*r))}
  poly(pts,color,width,alpha);
}
function arrow(a,b,color='#ffbd65',width=3){
  line(a,b,color,width,1);const p=project(b),q=project(a),dx=p.x-q.x,dy=p.y-q.y,l=Math.hypot(dx,dy)||1,ux=dx/l,uy=dy/l,s=10;
  const p1={x:p.x-ux*s-uy*s*.55,y:p.y-uy*s+ux*s*.55},p2={x:p.x-ux*s+uy*s*.55,y:p.y-uy*s-ux*s*.55};
  shapes.push({type:'head',p,p1,p2,color,depth:rotate(b).depth});
}
function sphere(p,r,color){dot(p,r,color)}
function compass(p,angle){
  // Compass base and needle are drawn in the horizontal plane.
  ring(p,.43,'y','#78dfff',.95,3,64);ring(p,.37,'y','#284b6b',.9,2,64);
  for(let i=0;i<16;i++){const a=i*TAU/16;line(V(p.x+Math.cos(a)*.34,p.y+.025,p.z+Math.sin(a)*.34),V(p.x+Math.cos(a)*.40,p.y+.025,p.z+Math.sin(a)*.40),'#c9eaff',1,.85)}
  const dir=V(Math.cos(angle),0,Math.sin(angle)),mid=V(p.x,p.y+.06,p.z);
  arrow(mid,V(p.x+dir.x*.32,p.y+.06,p.z+dir.z*.32),'#ff596f',3);
  arrow(mid,V(p.x-dir.x*.28,p.y+.06,p.z-dir.z*.28),'#e7f5ff',2);
  dot(V(p.x,p.y+.08,p.z),.045,'#f3fbff');
}
function addGrid(){
  for(let i=-5;i<=5;i++){line(V(i,-1.2,-5),V(i,-1.2,5),'#24415c',1,.48);line(V(-5,-1.2,i),V(5,-1.2,i),'#24415c',1,.48)}
  ring(V(0,-1.18,0),.08,'y','#58c8e8',.5,1,24);
}
function makeScene(){
  shapes=[];addGrid();
  if(mode==='wire'){
    line(V(0,-2.1,0),V(0,2.1,0),'#d6a96d',13,1);sphere(V(0,2.12,0),.1,'#ffda9b');sphere(V(0,-2.12,0),.1,'#ffda9b');
    arrow(V(0,-1.7,0),V(0,1.8*(reverse?-1:1),0),'#ffc36b',4);
    for(let j=0;j<7;j++){const r=.48+j*.25;ring(V(0,0,0),r,'y',j%2?'#36aee0':'#4de2ff',.26+j*.065,1.7,100);for(let k=0;k<4;k++){const a=k*Math.PI/2+j*.13,sgn=reverse?-1:1;const p=V(Math.cos(a)*r,0,Math.sin(a)*r),q=V(p.x-Math.sin(a)*.17*sgn,0,p.z+Math.cos(a)*.17*sgn);arrow(p,q,'#75eaff',1.5)}}
    compass(V(distance*Math.cos(compassAngle),0,distance*Math.sin(compassAngle)),compassAngle+(reverse?-Math.PI/2:Math.PI/2));
  }else if(mode==='coil'){
    for(let i=0;i<turns;i++){const a=i/turns*TAU;const pts=[];for(let j=0;j<=120;j++){const t=j/120*TAU;pts.push(V(Math.cos(t)*1.25,Math.sin(t)*1.25,0))}poly(pts,'#ffc16c',2.3,.85)}
    for(let r of [.4,.72,1.04])ring(V(0,0,0),r,'z','#48dfff',.45,1.8);
    arrow(V(0,0,-.1),V(0,0,reverse?-1.5:1.5),'#ffbd65',3);
    compass(V(0,0,distance),reverse?Math.PI:0);
  }else if(mode==='solenoid'){
    const n=turns,len=2.8;
    for(let i=0;i<n;i++){const y=(i/(n-1)-.5)*len,pts=[];for(let j=0;j<=100;j++){const a=j/100*TAU;pts.push(V(Math.cos(a)*.68,y,Math.sin(a)*.68))}poly(pts,'#ffc16c',2,.9)}
    for(let z=-.42;z<=.43;z+=.21){const pts=[];for(let i=0;i<=40;i++)pts.push(V(-1.6+i*3.2/40,z,0));poly(pts,'#4bdfff',2,.8)}
    for(let y of [-.45,.45]){const pts=[];for(let i=0;i<=100;i++){const a=i/100*TAU;pts.push(V(1.72*Math.cos(a),y,1.18*Math.sin(a)))}poly(pts,'#4bdfff',1.7,.5)}
    arrow(V(0,-1.25,0),V(0,1.25*(reverse?-1:1),0),'#ffbd65',3);
    compass(V(0,distance,0),reverse?Math.PI:0);
  }else{
    const a=theta*Math.PI/180+fluxTilt;
    const pts=[V(-1.3,0,-.9),V(1.3,0,-.9),V(1.3,0,.9),V(-1.3,0,.9)];
    const rot=p=>V(p.x, p.z*Math.sin(a),p.z*Math.cos(a));
    const surface=pts.map(rot);poly(surface,'#83eaff',2,.95,true,'rgba(40,190,230,.18)');
    for(let x=-2;x<=2;x+=.5)for(let z=-1.5;z<=1.5;z+=.5){arrow(V(x,1.1,z),V(x,1.42,z),'#50dfff',1.2)}
    const normal=rot(V(0,1.3,0));arrow(V(0,0,0),normal,'#ffbd65',3);
  }
}
function drawBackground(){
  const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#071629');g.addColorStop(1,'#091f35');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  for(let i=0;i<65;i++){const x=(i*173)%W,y=(i*97)%H;ctx.fillStyle='rgba(115,205,255,.16)';ctx.fillRect(x,y,1.3,1.3)}
}
function render(){
  drawBackground();makeScene();shapes.sort((a,b)=>b.depth-a.depth);
  for(const s of shapes){ctx.save();ctx.globalAlpha=s.alpha??1;ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineCap='round';ctx.lineJoin='round';
    if(s.type==='line'){const a=project(s.a),b=project(s.b);ctx.lineWidth=Math.max(.7,s.width*(a.scale+b.scale)/2);ctx.shadowColor=s.color;ctx.shadowBlur=s.width>2?8:3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
    else if(s.type==='dot'){const p=project(s.p),r=Math.max(2,s.r*p.scale*1.7);ctx.shadowColor=s.color;ctx.shadowBlur=12;const gr=ctx.createRadialGradient(p.x-r*.3,p.y-r*.3,1,p.x,p.y,r);gr.addColorStop(0,'#ffffff');gr.addColorStop(.25,s.color);gr.addColorStop(1,s.color);ctx.fillStyle=gr;ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fill()}
    else if(s.type==='head'){const p=s.p,p1=s.p1,p2=s.p2;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);ctx.closePath();ctx.fill()}
    else if(s.type==='fill'){const pts=s.points.map(project);ctx.fillStyle=s.color;ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();ctx.fill()}
    ctx.restore();
  }
  // Small orientation marker
  ctx.fillStyle='rgba(204,235,255,.75)';ctx.font='12px sans-serif';ctx.fillText('اسحب لتدوير المشهد  ·  عجلة/تقريب للتحكم في المسافة',16,H-18);
}
function animate(t){if(!paused&&mode==='flux')fluxTilt=Math.sin(t*.00035)*theta*Math.PI/180*.25;render();anim=requestAnimationFrame(animate)}
function pointerDown(e){dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)}
function pointerMove(e){if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;yaw+=dx*.008;pitch=clamp(pitch+dy*.007,-1.25,1.25)}
function pointerUp(){dragging=false}
function wheel(e){e.preventDefault();zoom=clamp(zoom*(e.deltaY>0?.92:1.08),.65,1.8)}
function slider(id,label,value,min,max,step,unit){return '<div class="control-group"><div class="control-top"><label for="'+id+'">'+label+'</label><output id="'+id+'-out">'+value+unit+'</output></div><input class="range" id="'+id+'" type="range" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'"><div class="range-labels"><span>'+min+unit+'</span><span>'+max+unit+'</span></div></div>'}
function controls(){
 if(mode==='wire')return slider('current','شدة التيار',current,.2,5,.1,' A')+slider('distance','بُعد البوصلة',distance,.7,3.5,.1,' cm')+slider('position','دوران البوصلة حول السلك',Math.round(compassAngle*180/Math.PI),0,350,5,'°');
 if(mode==='coil')return slider('current','شدة التيار',current,.2,5,.1,' A')+slider('turns','عدد اللفات',turns,1,12,1,' لفة')+slider('distance','موضع البوصلة',distance,.7,3.5,.1,' cm');
 if(mode==='solenoid')return slider('current','شدة التيار',current,.2,5,.1,' A')+slider('turns','عدد اللفات',turns,3,15,1,' لفة')+slider('distance','موضع البوصلة على المحور',distance,.7,3.5,.1,' cm');
 return slider('fluxB','كثافة الفيض B',fluxB,.05,2,.05,' T')+slider('area','مساحة السطح A',area,.05,1,.01,' m²')+slider('theta','الزاوية مع العمود على السطح',theta,0,180,1,'°');
}
function build(){
 $('controls').innerHTML=controls();$('controls').querySelectorAll('input').forEach(el=>el.addEventListener('input',onControl));
 $('reverse').hidden=mode==='flux';$('scene-title').textContent=({wire:'تجربة أورستد: السلك المستقيم والبوصلة',coil:'المجال المغناطيسي للملف الدائري',solenoid:'المجال المغناطيسي للملف اللولبي',flux:'تجربة الفيض المغناطيسي'})[mode];
 $('scene-subtitle').textContent=({wire:'غيّر التيار واسحب المشهد وراقب خطوط المجال الدائرية.',coil:'غيّر عدد اللفات والتيار ولاحظ المجال عند مركز الملف.',solenoid:'لاحظ المجال شبه المنتظم داخل الملف وخطوط الرجوع خارجه.',flux:'غيّر الزاوية والمساحة وكثافة الفيض وشاهد السطح في الفراغ.'})[mode];
 updateReadout();render();
}
function onControl(e){
 const id=e.target.id,v=Number(e.target.value);
 if(id==='current')current=v;if(id==='distance')distance=v;if(id==='position')compassAngle=v*Math.PI/180;if(id==='turns')turns=v;if(id==='fluxB')fluxB=v;if(id==='area')area=v;if(id==='theta')theta=v;
 const out=$(id+'-out');if(out)out.textContent=v+(id==='current'?' A':id==='distance'?' cm':id==='position'||id==='theta'?'°':id==='fluxB'?' T':id==='area'?' m²':' لفة');
 updateReadout();render();
}
function updateReadout(){
 let B=0;if(mode==='wire')B=2e-7*current/(distance/100);if(mode==='coil')B=4*Math.PI*1e-7*turns*current/(2*1.25);if(mode==='solenoid')B=4*Math.PI*1e-7*(turns/2.8)*current;
 const flux=fluxB*area*Math.cos(theta*Math.PI/180);
 $('field-value').textContent=mode==='flux'?flux.toFixed(4)+' Wb':(B*1e6).toFixed(2)+' μT';
 $('field-direction').textContent=mode==='flux'?'فيض خلال السطح':reverse?'اتجاه معكوس':'قاعدة اليد اليمنى';
 $('needle-value').textContent=mode==='flux'?theta+'°':mode==='wire'?Math.round((compassAngle*180/Math.PI+360)%360)+'°':reverse?'180°':'0°';
 $('current-value').textContent=mode==='flux'?'—':current.toFixed(1)+' A';
 const n=experimentData?.[mode];
 if(n){$('observe').textContent=n.observe;$('explain').textContent=n.explain;$('challenge').textContent=n.challenge;$('law-title').textContent=n.title;$('equation').textContent=n.equation;$('law-desc').textContent=n.description;}
 $('live-note').textContent=mode==='flux'?'الفيض الحالي = B × A × cos θ. عند 90° يكون الفيض صفرًا.':'القراءة تقريبية وفق العلاقات النظرية المثالية، وتتغير لحظيًا مع أدوات التحكم.';
}
$('reverse').addEventListener('click',()=>{reverse=!reverse;$('reverse').textContent=reverse?'↕ رجّع اتجاه التيار':'↕ اعكس اتجاه التيار';updateReadout();render()});
$('pause').addEventListener('click',()=>{paused=!paused;$('pause').textContent=paused?'▶ استئناف الحركة':'Ⅱ إيقاف الحركة'});
$('reset-view').addEventListener('click',()=>{current=2;distance=1.5;turns=6;reverse=false;paused=false;compassAngle=0;fluxB=.5;area=.2;theta=0;yaw=.72;pitch=.42;zoom=1;$('reverse').textContent='↕ اعكس اتجاه التيار';$('pause').textContent='Ⅱ إيقاف الحركة';build()});
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t===b));mode=b.dataset.mode;build()}));
fetch('./data/experiments.json').then(r=>{if(!r.ok)throw new Error('تعذر تحميل بيانات التجارب');return r.json()}).then(data=>{experimentData=data;updateReadout()}).catch(err=>console.warn('Using built-in labels; data file unavailable:',err));
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(err=>console.warn('Offline mode unavailable:',err));}
init();