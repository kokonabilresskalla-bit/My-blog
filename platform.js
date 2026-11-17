/* Physics Studio: self-contained interactive simulations. No CDN or third-party runtime. */
const $=id=>document.getElementById(id);
const canvas=$('labCanvas'),ctx=canvas.getContext('2d');
const state={lab:'magnetism',exp:'wire',current:2,distance:1.5,turns:8,angle:0,area:.2,field:.5,voltage:6,resistance:12,mass:1,height:1,length:1,frequency:2,amplitude:1,refractive:1.5,paused:false,yaw:-.35,pitch:.22,zoom:1,drag:false};
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
function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,1.7);canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));ctx.setTransform(d,0,0,d,0,0)}
new ResizeObserver(resize).observe(canvas);resize();
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
function project(x,y,z=0){
 const w=canvas.clientWidth,h=canvas.clientHeight;
 const c=Math.cos(state.yaw),s=Math.sin(state.yaw),cp=Math.cos(state.pitch),sp=Math.sin(state.pitch);
 const xx=x*c-z*s,zz=x*s+z*c,yy=y*cp-zz*sp,depth=y*sp+zz*cp;
 const k=Math.min(w,h)*.48*state.zoom/(5+depth*.18);
 return [w/2+xx*k,h*.54-yy*k];
}
function line3(a,b,color='#62dfff',width=2){const p=project(...a),q=project(...b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);ctx.stroke()}
function circle3(x,y,z,r,color,fill=false){const p=project(x,y,z),edge=project(x+r,y,z),rad=Math.max(2,Math.hypot(edge[0]-p[0],edge[1]-p[1]));ctx.beginPath();ctx.arc(p[0],p[1],rad,0,Math.PI*2);ctx.strokeStyle=color;ctx.lineWidth=2;if(fill){ctx.fillStyle=color;ctx.fill()}else ctx.stroke()}
function arrow3(a,b,color='#ffb96d',width=3){line3(a,b,color,width);const p=project(...a),q=project(...b),ang=Math.atan2(q[1]-p[1],q[0]-p[0]),sz=9;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(...q);ctx.lineTo(q[0]-sz*Math.cos(ang-.45),q[1]-sz*Math.sin(ang-.45));ctx.lineTo(q[0]-sz*Math.cos(ang+.45),q[1]-sz*Math.sin(ang+.45));ctx.closePath();ctx.fill()}
function compass(x,y,z,angle){
 const p=project(x,y,z),scale=Math.min(canvas.clientWidth,canvas.clientHeight)*.09*state.zoom;
 const g=ctx.createRadialGradient(p[0]-scale*.25,p[1]-scale*.3,scale*.04,p[0],p[1],scale);
 g.addColorStop(0,'#f7ffff');g.addColorStop(.22,'#b7d9e8');g.addColorStop(.7,'#315c78');g.addColorStop(1,'#10263d');
 ctx.save();ctx.shadowColor='#59dcff';ctx.shadowBlur=18;ctx.fillStyle=g;ctx.strokeStyle='#9eeaff';ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(...p,scale,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();
 for(let i=0;i<36;i++){const a=i*Math.PI/18,r1=scale*.79,r2=scale*(i%3===0?.94:.87);ctx.strokeStyle=i%3===0?'#e6faff':'#8fb8cd';ctx.lineWidth=i%3===0?1.8:1;ctx.beginPath();ctx.moveTo(p[0]+Math.cos(a)*r1,p[1]+Math.sin(a)*r1);ctx.lineTo(p[0]+Math.cos(a)*r2,p[1]+Math.sin(a)*r2);ctx.stroke()}
 ctx.save();ctx.translate(...p);ctx.rotate(angle);
 ctx.shadowColor='#ff526b';ctx.shadowBlur=12;
 ctx.fillStyle='#ff526b';ctx.beginPath();ctx.moveTo(0,-scale*.72);ctx.lineTo(-scale*.12,0);ctx.lineTo(0,scale*.08);ctx.lineTo(scale*.12,0);ctx.closePath();ctx.fill();
 ctx.shadowBlur=0;ctx.fillStyle='#e6f4ff';ctx.beginPath();ctx.moveTo(0,scale*.72);ctx.lineTo(-scale*.12,0);ctx.lineTo(0,scale*.08);ctx.lineTo(scale*.12,0);ctx.closePath();ctx.fill();
 ctx.fillStyle='#f9ffff';ctx.beginPath();ctx.arc(0,0,scale*.085,0,Math.PI*2);ctx.fill();ctx.restore();
 ctx.fillStyle='#ff9eae';ctx.font='bold 12px system-ui';ctx.textAlign='center';ctx.fillText('N',p[0],p[1]-scale*1.08);
}
function draw(){
 const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
 const bg=ctx.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#102e4a');bg.addColorStop(1,'#061426');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 for(let i=-5;i<=5;i++){line3([i,-1.3,-5],[i,-1.3,5],'#234763',.7);line3([-5,-1.3,i],[5,-1.3,i],'#234763',.7)}
 const t=performance.now()/1000;
 if(state.exp==='wire'){
  line3([0,-2,0],[0,2,0],'#f0bd79',7);arrow3([0,-1.7,0],[0,1.7,0],'#ffbf72',3);
  for(let r=.5;r<2.1;r+=.32){for(let j=0;j<100;j++){const a=j/100*Math.PI*2,b=(j+1)/100*Math.PI*2;line3([Math.cos(a)*r,0,Math.sin(a)*r],[Math.cos(b)*r,0,Math.sin(b)*r],'#38c9ff',1.2)}}
  compass(state.distance*.35,0,0,t*.2);
 }else if(['coil','solenoid'].includes(state.exp)){
  const n=state.exp==='coil'?state.turns:state.turns;
  for(let k=0;k<n;k++){const y=state.exp==='coil'?0:(k/(n-1)-.5)*2.8,pts=100;for(let j=0;j<pts;j++){const a=j/pts*Math.PI*2,b=(j+1)/pts*Math.PI*2;line3([Math.cos(a)*.9,y,Math.sin(a)*.9],[Math.cos(b)*.9,y,Math.sin(b)*.9],'#f4bd78',2)}}
  for(let y=-1;y<=1;y+=.35)arrow3([0,y,-.2],[0,y,.8],'#49d9ff',1.5);compass(1.6,0,0,t*.18);
 }else if(state.exp==='flux'){
  const a=state.angle*Math.PI/180;const pts=[[-1.4,0,-.9],[1.4,0,-.9],[1.4,0,.9],[-1.4,0,.9]];
  for(let i=0;i<4;i++)line3(pts[i],[pts[(i+1)%4][0],pts[(i+1)%4][1]*Math.cos(a)-pts[(i+1)%4][2]*Math.sin(a),pts[(i+1)%4][1]*Math.sin(a)+pts[(i+1)%4][2]*Math.cos(a)],'#8eeaff',2);
  arrow3([0,0,0],[0,1.4*Math.cos(a),1.4*Math.sin(a)],'#ffbd72',3);
  for(let x=-2;x<=2;x+=.5)for(let z=-1;z<=1;z+=.5)arrow3([x,-.4,z],[x,.5,z],'#46cfff',1);
 }else if(state.exp==='pendulum'){
  const ang=Math.sin(t*2)*.35;line3([0,1.8,0],[Math.sin(ang)*1.8,1.8-Math.cos(ang)*1.8,0],'#e8f5ff',2);circle3(Math.sin(ang)*1.8,1.8-Math.cos(ang)*1.8,0,.22,'#ffbf75',true);line3([-.7,1.8,0],[.7,1.8,0],'#7fa8c4',3);
 }else if(state.exp==='projectile'){
  const v=state.voltage,ang=state.angle*Math.PI/180,T=2*v*Math.sin(ang)/9.81;let prev=null;
  for(let i=0;i<=80;i++){const tt=T*i/80,x=v*Math.cos(ang)*tt/3,y=(v*Math.sin(ang)*tt-4.905*tt*tt)/3;if(y>=0){if(prev)line3(prev,[x,y,0],'#54d9ff',2);prev=[x,y,0]}}
  arrow3([0,0,0],[.7,.5,0],'#ffbd72',3);
 }else if(state.exp==='incline'){
  const a=state.angle*Math.PI/180;line3([-2,-1,0],[2*Math.cos(a)-2,2*Math.sin(a)-1,0],'#d6e9f6',4);line3([-2,-1,0],[2,-1,0],'#8aa8c0',2);circle3(-.2*Math.cos(a),-.2*Math.sin(a),0,.25,'#ffbd72',true);arrow3([0,0,0],[Math.sin(a),-Math.cos(a),0],'#ffbd72',3);
 }else if(['ohm','series'].includes(state.exp)){
  const pts=[[-1.6,.6,0],[-.8,.6,0],[-.8,-.5,0],[.8,-.5,0],[.8,.6,0],[1.6,.6,0]];
  for(let i=0;i<pts.length-1;i++)line3(pts[i],pts[i+1],'#64dfff',3);
  line3([-.35,-.5,0],[.35,-.5,0],'#ffbd72',6);circle3(-1.6,.6,0,.18,'#ffbd72',true);circle3(1.6,.6,0,.18,'#ffbd72',true);
  arrow3([-.1,.85,0],[.65,.85,0],'#8affc8',2);
 }else if(['reflection','refraction'].includes(state.exp)){
  line3([-2,0,0],[2,0,0],'#d2f1ff',3);line3([0,-1.5,0],[0,1.5,0],'#7da2be',1.5);
  const a=state.angle*Math.PI/180;arrow3([-1.7,1.5,0],[0,0,0],'#ffbf72',3);
  if(state.exp==='reflection')arrow3([0,0,0],[1.7,1.5,0],'#ffbf72',3);
  else arrow3([0,0,0],[1.4,-Math.sin(a)/state.refractive*1.5,0],'#5fe2ff',3);
 }else if(state.exp==='wave'){
  let prev=null;for(let x=-3;x<=3;x+=.05){const p=[x,Math.sin(x*state.frequency+t*2)*state.amplitude,0];if(prev)line3(prev,p,'#58d9ff',2);prev=p}
 }
 ctx.fillStyle='#c3eaff';ctx.font='12px system-ui';ctx.textAlign='left';ctx.fillText('اسحب لتدوير النموذج  •  استخدم زري التكبير',14,h-16);
}
function loop(){if(!state.paused)draw();requestAnimationFrame(loop)}
$('reverseCurrent').onclick=()=>{state.yaw+=Math.PI;draw()};
$('pauseMotion').onclick=()=>{state.paused=!state.paused;$('pauseMotion').textContent=state.paused?'استئناف الحركة':'إيقاف الحركة'};
$('zoomIn').onclick=()=>{state.zoom=Math.min(1.8,state.zoom*1.12);draw()};
$('zoomOut').onclick=()=>{state.zoom=Math.max(.65,state.zoom/1.12);draw()};
$('resetScene').onclick=()=>{state.yaw=-.35;state.pitch=.22;state.zoom=1;renderAll()};
canvas.addEventListener('pointerdown',e=>{state.drag=true;state.px=e.clientX;state.py=e.clientY;canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!state.drag)return;state.yaw+=(e.clientX-state.px)*.008;state.pitch=Math.max(-1.1,Math.min(1.1,state.pitch+(e.clientY-state.py)*.006));state.px=e.clientX;state.py=e.clientY;draw()});
canvas.addEventListener('pointerup',()=>state.drag=false);canvas.addEventListener('pointercancel',()=>state.drag=false);
renderAll();loop();
