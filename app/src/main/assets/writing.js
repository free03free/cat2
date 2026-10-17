/* قسم «الكتابة»: تعلّم كتابة الحروف والأرقام بثلاثة مستويات
   1) تتبّع الخط: شكل رمادي يلوّن الطفل فوقه   2) النقاط: شكل منقّط يرسم فوقه   3) بيدي: لوحة بيضاء بلا أي مساعدة
   يُحمَّل من index.html بعد games.js. نطق الحرف/الرقم بنفس سرعات الحزمة الجاهزة فيخرج فورًا. */
(function(){
"use strict";
if(document.getElementById("wr-mode"))return;
const $=id=>document.getElementById(id);
const CS=window.CatSpeech||{};
const letters=CS.letters||[],SAYM=CS.SAY||{};
const numberWord=CS.numberWord||(n=>String(n));
const sylKind=CS.sylKind||(()=>"");
function pref(k,d){try{const v=parseFloat(localStorage.getItem(k));return isFinite(v)?v:d}catch(e){return d}}
function maxNum(){let m=parseInt(localStorage.getItem("learningMaxNumber")||"10",10);if(!isFinite(m)||m<1)m=10;return Math.min(m,100)}
const LEVELS={
 trace:{hint:"لوّن فوق الشكل الرمادي دون أن تخرج منه",pen:.07},
 dots:{hint:"ارسم فوق النقاط وتتبّع حدود الشكل",pen:.05},
 free:{hint:"اكتب بيدك بلا أي مساعدة، ثم اضغط «تحقق» لترى النموذج",pen:.045}
};
const st={kind:"letters",level:"trace",idx:0,strokes:[],cur:null,S:300,modelT:0};

/* ----- التنسيق ----- */
const css=document.createElement("style");css.id="wr-css";
css.textContent=`
.mode-switch .mode{font-size:12.5px}
#wr-sec{padding-bottom:20px}
.wr-card{background:#fff;border-radius:24px;padding:12px;box-shadow:0 5px 18px #00000012}
.wr-seg,.wr-lv{display:flex;gap:5px;background:#f6ecdb;border-radius:16px;padding:4px;margin-bottom:8px}
.wr-seg button,.wr-lv button{flex:1;border:0;border-radius:12px;padding:9px 2px;background:transparent;color:#6a5444;font-weight:800;font-size:14px;font-family:inherit}
.wr-seg button.on{background:#f3a044;color:#fff}
.wr-lv button.on{background:#2f7fd6;color:#fff}
.wr-nav{display:flex;align-items:center;gap:8px;margin:6px 0}
.wr-nav button{flex:none;width:48px;height:44px;border:0;border-radius:14px;background:#fff0c8;color:#d95b2b;font-size:20px;font-family:inherit}
.wr-title{flex:1;text-align:center;font-weight:900;font-size:17px;color:#4a3426}
.wr-title small{display:block;font-size:12px;color:#8a7466;font-weight:700}
.wr-title i{font-style:normal;color:#f2b300;letter-spacing:2px}
.wr-hint{text-align:center;font-size:13px;color:#806d60;margin:2px 0 8px}
.wr-board{position:relative;margin:0 auto;border-radius:20px;background:#fff;border:3px solid #ead8c6;overflow:hidden;box-shadow:inset 0 0 0 1px #fff}
.wr-board canvas{position:absolute;left:0;top:0;touch-action:none;display:block}
.wr-res{min-height:26px;text-align:center;font-weight:900;font-size:16px;color:#4a3426;margin:10px 0 2px}
.wr-res.pop{animation:wrpop .35s}
@keyframes wrpop{0%{transform:scale(.8)}60%{transform:scale(1.12)}100%{transform:scale(1)}}
.wr-bar{display:flex;gap:6px;margin-top:6px}
.wr-bar button{flex:1;border:0;border-radius:14px;padding:11px 2px;background:#fff0c8;color:#5a4030;font-weight:800;font-size:14px;font-family:inherit}
.wr-bar button.go{background:#2e9a45;color:#fff;flex:1.3}
`;
document.head.appendChild(css);

/* ----- الواجهة ----- */
const sw=document.querySelector(".mode-switch");
const btn=document.createElement("button");btn.id="wr-mode";btn.className="mode";btn.textContent="✏️ الكتابة";sw.appendChild(btn);
const sec=document.createElement("section");sec.id="wr-sec";sec.className="mode-page";
sec.innerHTML=
'<div class="wr-card">'+
'<div class="wr-seg" id="wr-kind"><button data-k="letters" class="on">🔤 الحروف</button><button data-k="numbers">🔢 الأرقام</button></div>'+
'<div class="wr-lv" id="wr-lv"><button data-l="trace" class="on">تتبّع الخط</button><button data-l="dots">النقاط</button><button data-l="free">بيدي</button></div>'+
'<div class="wr-nav"><button id="wr-prev" aria-label="السابق">▶</button><div class="wr-title" id="wr-title"></div><button id="wr-next" aria-label="التالي">◀</button></div>'+
'<div class="wr-hint" id="wr-hint"></div>'+
'<div class="wr-board" id="wr-board"><canvas id="wr-g"></canvas><canvas id="wr-d"></canvas></div>'+
'<div class="wr-res" id="wr-res"></div>'+
'<div class="wr-bar"><button id="wr-clear">🗑 مسح</button><button id="wr-undo">↩ تراجع</button><button id="wr-hear">🔊 اسمع</button><button id="wr-check" class="go">✔ تحقق</button></div>'+
'</div>';
(document.querySelector("main.app")||document.body).appendChild(sec);
const gc=$("wr-g"),ic=$("wr-d"),gx=gc.getContext("2d"),ix=ic.getContext("2d");

/* ----- العناصر ----- */
function items(){
 if(st.kind==="letters")return letters.map(l=>({ch:l[0],name:l[1]}));
 const n=maxNum(),a=[];for(let i=1;i<=n;i++)a.push({ch:String(i),num:i});return a;
}
function cur(){const a=items();if(st.idx>=a.length)st.idx=0;return a[st.idx]}
function bestKey(){return "wrBest_"+st.kind+"_"+st.idx}
function getBest(){try{return parseInt(localStorage.getItem(bestKey())||"0",10)||0}catch(e){return 0}}
function setBest(v){try{if(v>getBest())localStorage.setItem(bestKey(),String(v))}catch(e){}}
const starsText=n=>"★★★".slice(0,n)+"☆☆☆".slice(0,3-n);

/* ----- النطق (بسرعات الحزمة الجاهزة) ----- */
function say(text,sp){try{if(window.TomNative&&TomNative.say){TomNative.say(text,Number(sp),0);return true}}catch(e){}return false}
function speak(){
 const it=cur(),base=pref("speechSpeed",.9),spd=k=>Number((base*k).toFixed(3));
 if(it.name){const t=SAYM[it.name]||it.name,k=sylKind(t);say(t,spd(k==="short"?.8:k==="madd"?.84:.91))}
 else say(numberWord(it.num),base);
}

/* ----- الرسم ----- */
function gfont(sz){return (st.kind==="numbers"?"800 ":"700 ")+sz+'px "Noto Naskh Arabic","Noto Sans Arabic","Droid Arabic Naskh",system-ui,sans-serif'}
function fit(ctx,ch){
 const S=st.S;let sz=S*.6;
 ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.font=gfont(sz);
 let m=ctx.measureText(ch);
 const w=m.actualBoundingBoxLeft+m.actualBoundingBoxRight,h=m.actualBoundingBoxAscent+m.actualBoundingBoxDescent;
 const k=Math.min(S*.62/Math.max(w,1),S*.62/Math.max(h,1));
 sz*=k;ctx.font=gfont(sz);m=ctx.measureText(ch);
 return [S/2-(m.actualBoundingBoxRight-m.actualBoundingBoxLeft)/2,S/2+(m.actualBoundingBoxAscent-m.actualBoundingBoxDescent)/2];
}
function clearCtx(ctx){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.restore()}
function drawGuide(model){
 clearCtx(gx);
 const it=cur();if(!it)return;
 if(model){const p=fit(gx,it.ch);gx.fillStyle="rgba(255,110,110,.5)";gx.fillText(it.ch,p[0],p[1]);return}
 if(st.level==="free")return;
 const p=fit(gx,it.ch);
 if(st.level==="trace"){
  gx.fillStyle="#dfe9fa";gx.fillText(it.ch,p[0],p[1]);
  gx.lineWidth=2.5;gx.strokeStyle="#a9c0ea";gx.lineJoin="round";gx.strokeText(it.ch,p[0],p[1]);
 }else{
  gx.setLineDash([1,10]);gx.lineCap="round";gx.lineJoin="round";gx.lineWidth=4.5;gx.strokeStyle="#4f6fae";
  gx.strokeText(it.ch,p[0],p[1]);gx.setLineDash([]);
 }
}
function penW(){return Math.max(8,st.S*LEVELS[st.level].pen)}
function strokesTo(ctx,w,S){
 ctx.lineCap="round";ctx.lineJoin="round";ctx.lineWidth=w;ctx.strokeStyle="#1f6fd0";ctx.fillStyle="#1f6fd0";
 st.strokes.forEach(s=>{
  if(!s.length)return;
  if(s.length<3){const q=s[0];ctx.beginPath();ctx.arc(q[0]*S,q[1]*S,w/2,0,6.2832);ctx.fill();if(s.length===1)return}
  ctx.beginPath();ctx.moveTo(s[0][0]*S,s[0][1]*S);
  for(let i=1;i<s.length-1;i++){const a=s[i],b=s[i+1];ctx.quadraticCurveTo(a[0]*S,a[1]*S,(a[0]+b[0])/2*S,(a[1]+b[1])/2*S)}
  const l=s[s.length-1];ctx.lineTo(l[0]*S,l[1]*S);ctx.stroke();
 });
}
function drawInk(){clearCtx(ix);strokesTo(ix,penW(),st.S)}
function setup(){
 const b=$("wr-board"),host=b.parentNode,w=Math.max(200,Math.min(host.clientWidth-6,440)),d=window.devicePixelRatio||1;
 st.S=w;b.style.width=w+"px";b.style.height=w+"px";
 [gc,ic].forEach(c=>{c.width=c.height=Math.round(w*d);c.style.width=c.style.height=w+"px"});
 gx.setTransform(d,0,0,d,0,0);ix.setTransform(d,0,0,d,0,0);
 drawGuide();drawInk();
}

/* ----- التقييم (للتتبّع والنقاط) ----- */
function mkCanvas(S){const c=document.createElement("canvas");c.width=c.height=S;return c}
function score(){
 const S=Math.round(st.S),it=cur();
 const inkN=mkCanvas(S),nx=inkN.getContext("2d");strokesTo(nx,penW(),S);
 const inkC=mkCanvas(S),cx=inkC.getContext("2d");strokesTo(cx,penW()+S*.05,S);
 const tgt=mkCanvas(S),tx=tgt.getContext("2d"),p=fit(tx,it.ch);
 if(st.level==="trace"){tx.fillStyle="#000";tx.fillText(it.ch,p[0],p[1])}
 else{tx.lineWidth=3;tx.lineJoin="round";tx.strokeStyle="#000";tx.strokeText(it.ch,p[0],p[1])}
 const dil=mkCanvas(S),dx=dil.getContext("2d"),q=fit(dx,it.ch);
 dx.fillStyle="#000";dx.fillText(it.ch,q[0],q[1]);dx.lineWidth=S*.09;dx.lineJoin="round";dx.strokeStyle="#000";dx.strokeText(it.ch,q[0],q[1]);
 const T=tx.getImageData(0,0,S,S).data,C=cx.getImageData(0,0,S,S).data,N=nx.getImageData(0,0,S,S).data,D=dx.getImageData(0,0,S,S).data;
 let tot=0,hit=0,ink=0,out=0;
 for(let y=0;y<S;y+=3)for(let x=0;x<S;x+=3){
  const i=(y*S+x)*4+3;
  if(T[i]>40){tot++;if(C[i]>40)hit++}
  if(N[i]>40){ink++;if(D[i]<=40)out++}
 }
 return {cover:tot?hit/tot:0,stray:ink?out/ink:1,ink:ink};
}
function result(r){
 const lv=st.level;
 let s=0;
 if(r.cover>=.78&&r.stray<=.3)s=3;else if(r.cover>=.6&&r.stray<=.45)s=2;else if(r.cover>=.4&&r.stray<=.65)s=1;
 setBest(s);refreshTitle();
 const msgs=[
  "حاول مرة أخرى وتتبّع الشكل ببطء",
  "بداية جيدة! تتبّع الشكل كله ببطء",
  "جميل! حاول أن تغطي الشكل بالكامل",
  "ممتاز! كتابتك رائعة"
 ];
 let m=msgs[s];
 if(s<3&&r.stray>.45)m="حاول أن تبقى داخل الشكل أكثر";
 else if(s<3&&r.cover<.6)m=lv==="trace"?"بقي جزء من الشكل بلا تلوين":"بقي جزء من النقاط بلا رسم";
 msg(starsText(s)+"  "+m,true);
}
function msg(t,pop){const e=$("wr-res");e.textContent=t;e.classList.remove("pop");if(pop){void e.offsetWidth;e.classList.add("pop")}}

/* ----- الواجهة: تحديث ----- */
function refreshTitle(){
 const it=cur(),n=items().length,b=getBest();
 const label=st.kind==="letters"?"الحرف "+it.ch+" — "+it.name:"الرقم "+it.ch;
 $("wr-title").innerHTML=label+'<small>'+(st.idx+1)+' من '+n+(b?'  <i>'+starsText(b)+'</i>':'')+'</small>';
}
function render(speakIt){
 st.strokes=[];st.cur=null;clearTimeout(st.modelT);
 $("wr-hint").textContent=LEVELS[st.level].hint;
 refreshTitle();msg("");drawGuide();drawInk();
 if(speakIt)speak();
}
function go(d){const n=items().length;st.idx=(st.idx+d+n)%n;render(true)}

/* ----- المؤشر ----- */
function pt(e){const r=ic.getBoundingClientRect();return [Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))]}
ic.addEventListener("pointerdown",e=>{
 e.preventDefault();try{ic.setPointerCapture(e.pointerId)}catch(x){}
 clearTimeout(st.modelT);if(st.level==="free")drawGuide();
 st.cur=[pt(e)];st.strokes.push(st.cur);drawInk();msg("");
});
ic.addEventListener("pointermove",e=>{if(!st.cur)return;e.preventDefault();st.cur.push(pt(e));drawInk()});
["pointerup","pointercancel","pointerleave"].forEach(t=>ic.addEventListener(t,()=>{st.cur=null}));
ic.addEventListener("touchstart",e=>e.preventDefault(),{passive:false});

/* ----- الأزرار ----- */
$("wr-kind").onclick=e=>{const b=e.target.closest("button");if(!b)return;st.kind=b.dataset.k;st.idx=0;
 [].forEach.call($("wr-kind").children,x=>x.classList.toggle("on",x===b));render(true)};
$("wr-lv").onclick=e=>{const b=e.target.closest("button");if(!b)return;st.level=b.dataset.l;
 [].forEach.call($("wr-lv").children,x=>x.classList.toggle("on",x===b));render(false)};
$("wr-next").onclick=()=>go(1);
$("wr-prev").onclick=()=>go(-1);
$("wr-hear").onclick=speak;
$("wr-clear").onclick=()=>{st.strokes=[];st.cur=null;clearTimeout(st.modelT);drawGuide();drawInk();msg("")};
$("wr-undo").onclick=()=>{st.strokes.pop();st.cur=null;drawInk();msg("")};
$("wr-check").onclick=()=>{
 if(!st.strokes.length){msg("اكتب أولًا ثم اضغط «تحقق»");return}
 if(st.level==="free"){
  drawGuide(true);msg("قارن كتابتك بالنموذج الأحمر، ثم جرّب مرة أخرى لتصير أجمل",true);
  clearTimeout(st.modelT);st.modelT=setTimeout(()=>drawGuide(),4000);return;
 }
 result(score());
};

/* ----- الدخول والخروج من القسم ----- */
function open(){
 [].slice.call(document.querySelectorAll(".mode-page")).forEach(p=>p.classList.remove("active"));
 [].slice.call(document.querySelectorAll(".mode-switch .mode")).forEach(b=>b.classList.remove("active"));
 sec.classList.add("active");btn.classList.add("active");
 const s=$("subtitle");if(s)s.textContent="نتعلّم الكتابة";
 setup();render(false);
}
function leave(){sec.classList.remove("active");btn.classList.remove("active");clearTimeout(st.modelT)}
btn.onclick=open;
[].slice.call(sw.querySelectorAll(".mode")).forEach(b=>{if(b!==btn)b.addEventListener("click",leave)});
window.addEventListener("resize",()=>{if(sec.classList.contains("active")){setup()}});
})();
