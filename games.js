/* Circuit Arcade — touch-first educational circuit builder */
(()=>{
const host=document.getElementById('circuitArcade');if(!host)return;
const $=s=>host.querySelector(s);
const missions={
series:{title:'مهمة التوالي',desc:'ركّب البطارية والمفتاح واللمبة والمقاومتين في مسار واحد.',slots:[['source','البطارية'],['switch','المفتاح'],['lamp','اللمبة'],['r1','R₁'],['r2','R₂']],parts:[['battery','🔋','بطارية 12V'],['switch','⏻','مفتاح'],['lamp','💡','لمبة 6Ω'],['r4','▰','مقاومة 4Ω'],['r8','▰','مقاومة 8Ω']],target:2/3,req:18,mode:'series'},
parallel:{title:'مهمة التوازي',desc:'وصل المقاومتين على فرعين متوازيين، مع اللمبة والمفتاح في المسار الرئيسي.',slots:[['source','البطارية'],['switch','المفتاح'],['lamp','اللمبة'],['r1','فرع R₁'],['r2','فرع R₂']],parts:[['battery','🔋','بطارية 12V'],['switch','⏻','مفتاح'],['lamp','💡','لمبة 6Ω'],['r4','▰','مقاومة 4Ω'],['r8','▰','مقاومة 8Ω']],target:12/(6+(4*8)/(4+8)),req:6+(4*8)/(4+8),mode:'parallel'},
ohm:{title:'تحدي قانون أوم',desc:'اختار المقاومة التي تجعل التيار يساوي 2 أمبير مع مصدر 12 فولت. اللمبة مؤشر مثالي لا يضيف مقاومة.',slots:[['source','البطارية'],['switch','المفتاح'],['lamp','لمبة مؤشر'],['r1','المقاومة المطلوبة']],parts:[['battery','🔋','بطارية 12V'],['switch','⏻','مفتاح'],['lamp','💡','لمبة مؤشر'],['r2','▰','2Ω'],['r4','▰','4Ω'],['r6','▰','6Ω'],['r8','▰','8Ω'],['r12','▰','12Ω']],target:2,req:6,mode:'ohm'}
};
let mode='series',placed={},selected=null,closed=false,broken=false;
function reset(){placed={};selected=null;closed=false;broken=false;render()}
function partName(id){return ({battery:'البطارية 12V',switch:'المفتاح',lamp:'اللمبة',r2:'مقاومة 2Ω',r4:'مقاومة 4Ω',r6:'مقاومة 6Ω',r8:'مقاومة 8Ω',r12:'مقاومة 12Ω'})[id]||id}
function correct(){
 const m=missions[mode],expected={source:'battery',switch:'switch',lamp:'lamp',r1:mode==='ohm'?'r6':'r4',...(mode==='ohm'?{}:{r2:'r8'})};
 return m.slots.every(([slot])=>placed[slot]===expected[slot])&&Object.keys(placed).length===m.slots.length;
}
function compute(){
 if(mode==='series')return {req:18,current:12/18};
 if(mode==='parallel'){const rp=1/(1/4+1/8);return {req:6+rp,current:12/(6+rp)}}
 return {req:Number(placed.r1.slice(1)),current:12/Number(placed.r1.slice(1))};
}
function validate(){
 if(!missions[mode].slots.every(([s])=>placed[s])){message('لسه فيه أماكن فاضية. ركّب كل العناصر الأول.','warn');return}
 if(!correct()){broken=true;closed=true;render();message('التوصيل أو قيمة المقاومة مش مطابقة للمخطط! حصل تلف افتراضي في اللمبة. راجع التوصيلات والقيم.','bad');return}
 const result=compute(),target=missions[mode].target;
 if(Math.abs(result.current-target)>.015){broken=true;closed=true;render();message('التركيب مش مطابق للقيمة المطلوبة؛ اللمبة تعطلت في المحاكاة.','bad');return}
 closed=true;broken=false;render();message('ممتاز! الدائرة صحيحة واللمبة نورت. التيار '+result.current.toFixed(2)+' A والمقاومة المكافئة '+result.req.toFixed(2)+' Ω.','good');
}
function message(t,k){const el=$('.game-feedback');el.textContent=t;el.className='game-feedback '+k}
function render(){
 const m=missions[mode];host.innerHTML=`
 <div class="arcade-head"><div><span class="arcade-kicker">CIRCUIT BUILDER · LAB GAME</span><h2>ورشة تركيب الدوائر الكهربائية</h2><p>اسحب القطع لمكانها، أو اختار القطعة وبعدها اضغط مكانها. بعد ما تخلص اقفل المفتاح واختبر الدائرة.</p></div><div class="arcade-score">🎯 تحديات تفاعلية</div></div>
 <div class="mission-tabs">${Object.entries(missions).map(([id,x])=>'<button data-mode="'+id+'" class="'+(id===mode?'active':'')+'">'+x.title+'</button>').join('')}</div>
 <div class="mission-brief"><b>${m.title}</b><span>${m.desc}</span></div>
 <div class="circuit-board ${mode}">
  <div class="board-caption">لوحة تركيب الدائرة · محاكاة تعليمية منخفضة الجهد</div>
  <div class="slot-grid">${m.slots.map(([id,name])=>'<button class="circuit-slot '+(placed[id]?'filled':'')+'" data-slot="'+id+'"><small>'+name+'</small><strong>'+(placed[id]?partName(placed[id]):'＋ ضع القطعة هنا')+'</strong></button>').join('')}</div>
  <div class="bulb-state '+(closed&&!broken?'lit':'')+' '+(broken?'broken':'')+'"><span>'+(broken?'💥':closed?'💡':'⚪')+'</span><b>'+(broken?'اللمبة تالفة':closed?'اللمبة مضيئة':'اللمبة مطفأة')+'</b></div>
  <div class="switch-control"><span>المفتاح الرئيسي</span><button id="closeSwitch" '+(m.slots.some(([s])=>!placed[s])?'':'')+'>'+(closed?'فتح المفتاح':'قفل المفتاح')+'</button></div>
 </div>
 <div class="parts-title"><b>صندوق المكونات</b><small>المس القطعة لتحديدها أو اسحبها مباشرة</small></div>
 <div class="parts-tray">${m.parts.map(([id,ico,name])=>'<button class="part-chip '+(selected===id?'selected':'')+'" data-part="'+id+'" '+(Object.values(placed).includes(id)?'disabled':'')+'><span>'+ico+'</span><b>'+name+'</b></button>').join('')}</div>
 <div class="game-actions"><button id="checkCircuit" class="primary-game">⚡ اختبر الدائرة</button><button id="resetCircuit">إعادة تركيب</button></div>
 <div class="game-feedback" aria-live="polite">ابدأ بتركيب القطع في أماكنها.</div>
 <div class="circuit-math"><span>المطلوب: <b>${m.target.toFixed(2)} A</b></span><span>مصدر الجهد: <b>12 V</b></span><span>قانون أوم: <b>I = V ÷ R</b></span></div>`;
 host.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;reset()});
 host.querySelectorAll('[data-part]').forEach(b=>{
  b.onclick=()=>{selected=b.dataset.part;host.querySelectorAll('.part-chip').forEach(x=>x.classList.toggle('selected',x===b));message('تم تحديد '+partName(selected)+'؛ اختار مكانها في لوحة الدائرة.','info')};
  b.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;const id=b.dataset.part;const ghost=document.createElement('div');ghost.className='drag-ghost';ghost.textContent=partName(id);document.body.appendChild(ghost);const move=ev=>{ghost.style.left=ev.clientX+12+'px';ghost.style.top=ev.clientY+12+'px'};move(e);const end=ev=>{ghost.remove();b.removeEventListener('pointermove',move);b.removeEventListener('pointerup',end);b.removeEventListener('pointercancel',end);const target=document.elementFromPoint(ev.clientX,ev.clientY)?.closest('[data-slot]');if(target)place(target.dataset.slot,id)};b.addEventListener('pointermove',move);b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);});
 });
 host.querySelectorAll('[data-slot]').forEach(slot=>slot.onclick=()=>{const id=slot.dataset.slot;if(selected){place(id,selected);selected=null}else if(placed[id]){selected=placed[id];delete placed[id];render();message('تم سحب '+partName(selected)+'؛ اختار مكانًا آخر.','info')}});
 $('closeSwitch').onclick=()=>{if(closed){closed=false;broken=false;render();message('تم فتح المفتاح وفصل الدائرة.','info')}else validate()};
 $('checkCircuit').onclick=()=>validate();
 $('resetCircuit').onclick=reset;
}
function place(slot,id){if(Object.values(placed).includes(id)&&placed[slot]!==id)return;if(placed[slot])delete placed[slot];placed[slot]=id;selected=null;closed=false;broken=false;render();message('تم وضع '+partName(id)+' في مكانها.','good')}
render();
})();
