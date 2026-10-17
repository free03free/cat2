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
 trace:{hint:"لوّن فوق الشكل الرمادي دون أن تخرج منه، وسأشجعك عند الإتقان",pen:.055},
 dots:{hint:"ارسم فوق النقاط بالترتيب دون أن تبتعد عنها، وسأشجعك عند الإتقان",pen:.045},
 free:{hint:"اكتب بيدك بلا أي مساعدة، ثم اضغط «تحقق» لترى النموذج",pen:.045}
};
const st={kind:"letters",level:"trace",idx:0,strokes:[],cur:null,S:300,modelT:0};

/* ----- التنسيق ----- */
const css=document.createElement("style");css.id="wr-css";
css.textContent=`
.mode-switch .mode{font-size:12.5px}
#wr-sec{padding-bottom:20px}
.wr-card{background:#fff;border-radius:24px;padding:12px;box-shadow:0 5px 18px #00000012}
.wr-lab{font-size:13px;font-weight:900;color:#8a7466;margin:2px 4px 6px}
.wr-seg{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}
.wr-seg button{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;border:3px solid #f0e2d0;border-radius:18px;padding:8px 4px 7px;background:#fffaf3;color:#6a5444;font-family:inherit;font-weight:900;font-size:14px}
.wr-seg button .big{font-size:26px;line-height:1.2;color:#d9770a}
.wr-seg button.on{background:#f3a044;border-color:#d9770a;color:#fff;box-shadow:0 4px 10px #f3a04455}
.wr-seg button.on .big{color:#fff}
.wr-lv{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:8px}
.wr-lv button{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;border:3px solid #dbe6f7;border-radius:18px;padding:8px 2px 7px;background:#f4f8ff;color:#45638f;font-family:inherit;font-weight:900;font-size:13.5px}
.wr-lv button .ic{font-size:22px;line-height:1.2}
.wr-lv button.on{background:#2f7fd6;border-color:#1c5fb0;color:#fff;box-shadow:0 4px 10px #2f7fd655}
.wr-lv button.on::after,.wr-seg button.on::after{content:"✓";position:absolute;top:-8px;left:-6px;width:22px;height:22px;border-radius:50%;background:#2e9a45;color:#fff;font-size:13px;line-height:22px;text-align:center;border:2px solid #fff}
.wr-nav{display:flex;align-items:center;gap:8px;margin:8px 0 6px}
.wr-nav>button{flex:none;width:58px;height:54px;border:0;border-radius:16px;background:#fff0c8;color:#d95b2b;font-family:inherit;font-weight:900;font-size:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0}
.wr-nav>button b{font-size:20px;line-height:1.1}
.wr-title{flex:1;text-align:center;font-weight:900;font-size:17px;color:#4a3426;border:0;background:#fffaf3;border-radius:16px;padding:6px 4px;font-family:inherit;min-height:54px}
.wr-title small{display:block;font-size:12px;color:#8a7466;font-weight:700}
.wr-title i{font-style:normal;color:#f2b300;letter-spacing:2px}
.wr-pick{display:block;width:100%;border:2px dashed #d9a35a;border-radius:14px;background:#fffaf0;color:#a8570b;font-family:inherit;font-weight:900;font-size:15px;padding:10px 4px;margin:2px 0 6px}
.wr-pick.on{background:#f3a044;color:#fff;border-style:solid}
.wr-grid{display:none;grid-template-columns:repeat(7,1fr);gap:6px;max-height:210px;overflow-y:auto;background:#fffaf3;border:1px solid #f0e2d0;border-radius:16px;padding:8px;margin:0 0 8px;-webkit-overflow-scrolling:touch}
.wr-grid.open{display:grid}
.wr-grid.num{grid-template-columns:repeat(6,1fr)}
.wr-grid button{border:0;border-radius:12px;background:#ffe4ea;color:#7d3047;min-height:44px;font-size:22px;font-weight:900;font-family:inherit;position:relative;padding:0}
.wr-grid.num button{background:#fff0c8;color:#604126}
.wr-grid button.cur{background:#2f7fd6;color:#fff}
.wr-grid button.done::after{content:"★";position:absolute;top:0;left:3px;font-size:10px;color:#f2b300}
.wr-hint{text-align:center;font-size:13px;color:#806d60;margin:2px 0 8px}
.wr-board{position:relative;margin:0 auto;border-radius:20px;background:#fff;border:3px solid #ead8c6;overflow:hidden;box-shadow:inset 0 0 0 1px #fff}
.wr-board canvas{position:absolute;left:0;top:0;touch-action:none;display:block}
.wr-res{min-height:26px;text-align:center;font-weight:900;font-size:16px;color:#4a3426;margin:10px 0 2px}
.wr-res.pop{animation:wrpop .35s}
@keyframes wrpop{0%{transform:scale(.8)}60%{transform:scale(1.12)}100%{transform:scale(1)}}
.wr-bar{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:6px}
.wr-bar button{border:0;border-radius:14px;padding:8px 2px;background:#fff0c8;color:#5a4030;font-weight:800;font-size:13px;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:1px}
.wr-bar button span{font-size:19px;line-height:1.2}
.wr-bar button.go{background:#2e9a45;color:#fff}
`;
document.head.appendChild(css);

/* ----- الواجهة ----- */
const sw=document.querySelector(".mode-switch");
const btn=document.createElement("button");btn.id="wr-mode";btn.className="mode";btn.textContent="✏️ الكتابة";sw.appendChild(btn);
const sec=document.createElement("section");sec.id="wr-sec";sec.className="mode-page";
sec.innerHTML=
'<div class="wr-card">'+
'<div class="wr-lab">١) ماذا تريد أن تكتب؟</div>'+
'<div class="wr-seg" id="wr-kind"><button data-k="letters" class="on"><span class="big">أ ب</span>الحروف</button><button data-k="numbers"><span class="big">١٢٣</span>الأرقام</button></div>'+
'<div class="wr-lab">٢) كيف تريد أن تكتب؟</div>'+
'<div class="wr-lv" id="wr-lv"><button data-l="trace" class="on"><span class="ic">🖍️</span>لوّن الشكل</button><button data-l="dots" ><span class="ic">🔵</span>صِلِ النقاط</button><button data-l="free"><span class="ic">✋</span>اكتب بنفسك</button></div>'+
'<div class="wr-nav"><button id="wr-prev" aria-label="السابق"><b>▶</b>السابق</button><button class="wr-title" id="wr-title" type="button" aria-label="اختيار الحرف أو الرقم"></button><button id="wr-next" aria-label="التالي"><b>◀</b>التالي</button></div>'+
'<button class="wr-pick" id="wr-pick" type="button"></button>'+
'<div class="wr-grid" id="wr-grid"></div>'+
'<div class="wr-hint" id="wr-hint"></div>'+
'<div class="wr-board" id="wr-board"><canvas id="wr-g"></canvas><canvas id="wr-d"></canvas></div>'+
'<div class="wr-res" id="wr-res"></div>'+
'<div class="wr-bar"><button id="wr-clear"><span>🗑</span>مسح</button><button id="wr-undo"><span>↩</span>تراجع</button><button id="wr-hear"><span>🔊</span>اسمع</button><button id="wr-check" class="go"><span>✔</span>تحقق</button></div>'+
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
/* ----- الهيكل المركزي للشكل (خط واحد منقّط بدل خطّي الحافة): ترقيق Zhang-Suen ثم حذف الأشواك القصيرة ----- */
const SK={key:"",pts:[],dots:[]};
function thin(bw,G){
 const I=(x,y)=>y*G+x;let changed=true,guard=0;
 while(changed&&guard++<200){
  changed=false;
  for(let pass=0;pass<2;pass++){
   const del=[];
   for(let y=1;y<G-1;y++)for(let x=1;x<G-1;x++){
    if(!bw[I(x,y)])continue;
    const p2=bw[I(x,y-1)],p3=bw[I(x+1,y-1)],p4=bw[I(x+1,y)],p5=bw[I(x+1,y+1)],p6=bw[I(x,y+1)],p7=bw[I(x-1,y+1)],p8=bw[I(x-1,y)],p9=bw[I(x-1,y-1)];
    const B=p2+p3+p4+p5+p6+p7+p8+p9;if(B<2||B>6)continue;
    const A=(p2===0&&p3===1?1:0)+(p3===0&&p4===1?1:0)+(p4===0&&p5===1?1:0)+(p5===0&&p6===1?1:0)+(p6===0&&p7===1?1:0)+(p7===0&&p8===1?1:0)+(p8===0&&p9===1?1:0)+(p9===0&&p2===1?1:0);
    if(A!==1)continue;
    if(pass===0){if(p2*p4*p6!==0||p4*p6*p8!==0)continue}else{if(p2*p4*p8!==0||p2*p6*p8!==0)continue}
    del.push(I(x,y));
   }
   if(del.length){changed=true;for(const i of del)bw[i]=0}
  }
 }
}
function nbrs(bw,G,i){
 const x=i%G,y=(i-x)/G,r=[];
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
  if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;
  if(nx<0||ny<0||nx>=G||ny>=G)continue;
  const j=ny*G+nx;if(bw[j])r.push(j);
 }
 return r;
}
function prune(bw,G,maxLen){
 for(let round=0;round<2;round++){
  for(let i=0;i<bw.length;i++){
   if(!bw[i]||nbrs(bw,G,i).length!==1)continue;
   const path=[i];let prev=-1,c=i,junction=false;
   for(let k=0;k<maxLen+2;k++){
    const n=nbrs(bw,G,c).filter(j=>j!==prev&&path.indexOf(j)<0);
    if(n.length===0)break;
    if(n.length>1||nbrs(bw,G,n[0]).length>=3){junction=true;break}
    prev=c;c=n[0];path.push(c);
   }
   if(junction&&path.length<maxLen)for(const j of path)bw[j]=0;
  }
 }
}
function skeleton(){
 const S=st.S,it=cur(),G=Math.min(170,Math.round(S)),key=st.kind+"|"+it.ch+"|"+Math.round(S);
 if(SK.key===key)return SK;
 const c=mkCanvas(G),x=c.getContext("2d");x.scale(G/S,G/S);
 const p=fit(x,it.ch);x.fillStyle="#000";x.fillText(it.ch,p[0],p[1]);
 const d=x.getImageData(0,0,G,G).data,bw=new Uint8Array(G*G);
 for(let i=0;i<bw.length;i++)bw[i]=d[i*4+3]>127?1:0;
 thin(bw,G);prune(bw,G,Math.round(G*.07));
 const k=S/G,pts=[],lbl=new Int32Array(G*G).fill(-1);let nc=0;
 for(let i=0;i<bw.length;i++)if(bw[i]&&lbl[i]<0){const stack=[i];lbl[i]=nc;while(stack.length){const c0=stack.pop();for(const j of nbrs(bw,G,c0))if(lbl[j]<0){lbl[j]=nc;stack.push(j)}}nc++}
 for(let i=0;i<bw.length;i++)if(bw[i]){const gx_=i%G,gy_=(i-gx_)/G;pts.push([(gx_+.5)*k,(gy_+.5)*k,lbl[i]])}
 // نقاط متباعدة بانتظام: اختيار جشع بمسافة دنيا
 const gap=S*.058,dots=[];
 for(const q of pts){let ok=true;for(const w of dots){const dx=q[0]-w[0],dy=q[1]-w[1];if(dx*dx+dy*dy<gap*gap){ok=false;break}}if(ok)dots.push(q)}
 SK.key=key;SK.pts=pts;SK.dots=dots;return SK;
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
  const sk=skeleton();gx.fillStyle="#4f6fae";
  sk.dots.forEach(q=>{gx.beginPath();gx.arc(q[0],q[1],Math.max(3.5,st.S*.0125),0,6.2832);gx.fill()});
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
 // تغطية: مسار القلم بسُمكه + هامش تساهل صغير
 const cov=mkCanvas(S),cx=cov.getContext("2d");strokesTo(cx,penW()+S*.03,S);
 const C=cx.getImageData(0,0,S,S).data;
 // حدود مسموحة للخروج: الشكل موسَّعًا قليلًا
 const dil=mkCanvas(S),dx=dil.getContext("2d"),q=fit(dx,it.ch);
 dx.fillStyle="#000";dx.fillText(it.ch,q[0],q[1]);dx.lineWidth=S*.06;dx.lineJoin="round";dx.strokeStyle="#000";dx.strokeText(it.ch,q[0],q[1]);
 const D=dx.getImageData(0,0,S,S).data;
 const at=(arr,x,y)=>arr[(Math.min(S-1,Math.max(0,y))*S+Math.min(S-1,Math.max(0,x)))*4+3];
 // عينات الهدف مع رقم المكوّن (الجسم، الهمزة، كل نقطة...)
 const samples=[];
 if(st.level==="trace"){
  const tg=mkCanvas(S),tx=tg.getContext("2d"),p=fit(tx,it.ch);tx.fillStyle="#000";tx.fillText(it.ch,p[0],p[1]);
  const T=tx.getImageData(0,0,S,S).data,st3=3,W=Math.ceil(S/st3),lab=new Int32Array(W*W).fill(-1);let nc=0;
  const on=(gx_,gy_)=>gx_>=0&&gy_>=0&&gx_<W&&gy_<W&&at(T,gx_*st3,gy_*st3)>40;
  for(let gy_=0;gy_<W;gy_++)for(let gx_=0;gx_<W;gx_++){
   if(!on(gx_,gy_)||lab[gy_*W+gx_]>=0)continue;
   const stack=[[gx_,gy_]];lab[gy_*W+gx_]=nc;
   while(stack.length){const c=stack.pop();[[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const nx=c[0]+d[0],ny=c[1]+d[1];if(on(nx,ny)&&lab[ny*W+nx]<0){lab[ny*W+nx]=nc;stack.push([nx,ny])}})}
   nc++;
  }
  for(let gy_=0;gy_<W;gy_++)for(let gx_=0;gx_<W;gx_++){const l=lab[gy_*W+gx_];if(l>=0)samples.push([gx_*st3,gy_*st3,l])}
 }else{
  skeleton().pts.forEach(q2=>samples.push([Math.round(q2[0]),Math.round(q2[1]),q2[2]]));
 }
 const tot=samples.length;let hit=0;const byC={};
 samples.forEach(s=>{const h=at(C,s[0],s[1])>40;if(h)hit++;const o=byC[s[2]]||(byC[s[2]]={n:0,h:0});o.n++;if(h)o.h++});
 // كل مكوّن في الحرف (نقطة، همزة، جسم) يجب أن يُكتب فعلًا؛ المكوّنات الصغيرة تُفحص بقلم بلا هامش تساهل زائد
 const gl=glyphComps(S,it),cov2=mkCanvas(S),cx2=cov2.getContext("2d");strokesTo(cx2,penW()+S*.012,S);
 const Ct=cx2.getImageData(0,0,S,S).data,bigN=gl.total*.12,gb={};
 gl.samples.forEach(q=>{const small=gl.cnt[q[2]]<bigN,h=at(small?Ct:C,q[0],q[1])>40,o=gb[q[2]]||(gb[q[2]]={n:0,h:0});o.n++;if(h)o.h++});
 let worst=1;Object.keys(gb).forEach(k=>{const o=gb[k];if(o.n>=2&&(gl.cnt[k]<bigN||st.level==="trace"))worst=Math.min(worst,o.h/o.n)});
 if(st.level==="dots")Object.keys(byC).forEach(k=>{const o=byC[k];if(o.n>=3)worst=Math.min(worst,o.h/o.n)});
 const ncomp=Object.keys(gb).length;
 // الدقة: نقاط مسار القلم نفسه (لا سُمكه) داخل حدود الشكل
 let ink=0,out=0,extra=0;const step=S*.008;
 st.strokes.forEach(s=>{
  let sI=0,sO=0;
  for(let i=0;i<s.length;i++){
   const a=s[i],b=s[i+1]||s[i],dist=Math.hypot((b[0]-a[0])*S,(b[1]-a[1])*S),n=Math.max(1,Math.ceil(dist/step));
   for(let k=0;k<n;k++){
    const x=Math.round((a[0]+(b[0]-a[0])*k/n)*S),y=Math.round((a[1]+(b[1]-a[1])*k/n)*S);
    ink++;sI++;if(at(D,x,y)<=40){out++;sO++}
   }
  }
  if(sI&&sO/sI>.6)extra++;
 });
 const cv=tot?hit/tot:0,sy=ink?out/ink:1;
 return {cover:cv,worst:worst,stray:sy,ink:ink,extra:extra,outLen:out*step,S:S,ncomp:ncomp,pct:Math.round(100*cv*(1-sy))};
}
/* مكوّنات الحرف نفسه (الجسم، كل نقطة، الهمزة...) تُستخرج من رسم الحرف مهما كان المستوى */
function glyphComps(S,it){
 const tg=mkCanvas(S),tx=tg.getContext("2d"),p=fit(tx,it.ch);tx.fillStyle="#000";tx.fillText(it.ch,p[0],p[1]);
 const T=tx.getImageData(0,0,S,S).data,k=3,W=Math.ceil(S/k),lab=new Int32Array(W*W).fill(-1);let nc=0;
 const on=(a,b)=>a>=0&&b>=0&&a<W&&b<W&&T[(Math.min(S-1,b*k)*S+Math.min(S-1,a*k))*4+3]>40;
 for(let b=0;b<W;b++)for(let a=0;a<W;a++){
  if(!on(a,b)||lab[b*W+a]>=0)continue;
  const stack=[[a,b]];lab[b*W+a]=nc;
  while(stack.length){const c=stack.pop();[[1,0],[-1,0],[0,1],[0,-1]].forEach(d=>{const nx=c[0]+d[0],ny=c[1]+d[1];if(on(nx,ny)&&lab[ny*W+nx]<0){lab[ny*W+nx]=nc;stack.push([nx,ny])}})}
  nc++;
 }
 const samples=[],cnt={};
 for(let b=0;b<W;b++)for(let a=0;a<W;a++){const l=lab[b*W+a];if(l>=0){samples.push([a*k,b*k,l]);cnt[l]=(cnt[l]||0)+1}}
 return {samples:samples,cnt:cnt,total:samples.length};
}
function result(r){
 const lv=st.level;
 let s=0;
 if(r.cover>=.85&&r.worst>=.75&&r.stray<=.18&&r.extra===0)s=3;
 else if(r.cover>=.68&&r.worst>=.5&&r.stray<=.33)s=2;
 else if(r.cover>=.45&&r.stray<=.55)s=1;
 if(r.extra>0&&s>2)s=2;
 setBest(s);refreshTitle();
 const msgs=[
  "حاول مرة أخرى وتتبّع الشكل ببطء",
  "بداية جيدة! تتبّع الشكل كله ببطء",
  "جميل! بقي بعض الدقة في التفاصيل",
  "ممتاز! كتابتك دقيقة ورائعة"
 ];
 let m=msgs[s];
 if(s<3){
  if(r.extra>0)m="هناك علامة زائدة؛ انتبه لعدد النقاط والهمزة في هذا الحرف";
  else if(r.stray>.33)m="حاول أن تبقى فوق الشكل ولا تخرج منه";
  else if(r.worst<.75&&r.cover>=.5)m="ينقصك جزء صغير في الحرف (نقطة أو همزة)، اكتبه في مكانه الصحيح";
  else if(r.cover<.68)m=lv==="trace"?"بقي جزء من الشكل بلا تلوين":"بقي جزء من النقاط بلا رسم";
 }
 msg(starsText(s)+"  "+(r.pct!==undefined?r.pct+"٪  ":"")+m,true);
 cheer(s);
}
/* كلمات التشجيع (كلها في الحزمة الجاهزة بسرعة speechSpeed فتُنطق فورًا) */
const CHEERS={
 3:["أَحْسَنْتَ","مُمْتَاز","رَائِع"],
 2:["جَيِّد","جَمِيل","أَحْسَنْتَ"],
 1:["جَيِّد","حَاوِلْ مَرَّةً أُخْرَى"],
 0:["أَعِدِ المُحَاوَلَةَ مَرَّةً أُخْرَى","حَاوِلْ مَرَّةً أُخْرَى"],
 free:["جَيِّد","جَمِيل","أَحْسَنْتَ"]
};
let lastCheer="";
function cheer(k){
 const a=CHEERS[k]||CHEERS[0];let t=a[Math.floor(Math.random()*a.length)];
 if(a.length>1&&t===lastCheer)t=a[(a.indexOf(t)+1)%a.length];
 lastCheer=t;say(t,pref("speechSpeed",.9));
}
function msg(t,pop){const e=$("wr-res");e.textContent=t;e.classList.remove("pop");if(pop){void e.offsetWidth;e.classList.add("pop")}}

/* ----- الواجهة: تحديث ----- */
function refreshTitle(){
 const it=cur(),n=items().length,b=getBest();
 const label=st.kind==="letters"?"الحرف "+it.ch+" — "+it.name:"الرقم "+it.ch;
 $("wr-title").innerHTML=label+'<small>'+(st.idx+1)+' من '+n+(b?'  <i>'+starsText(b)+'</i>':'')+'</small>';
}
function render(speakIt){
 st.strokes=[];st.cur=null;clearTimeout(st.modelT);cancelAuto();st.done=false;
 $("wr-hint").textContent=LEVELS[st.level].hint;
 refreshTitle();buildPick();msg("");drawGuide();drawInk();
 if(speakIt)speak();
}
function go(d){const n=items().length;st.idx=(st.idx+d+n)%n;render(true)}

/* ----- اختيار حرف أو رقم بنفسك ----- */
function buildPick(){
 const g=$("wr-grid"),a=items(),isNum=st.kind==="numbers";
 g.className="wr-grid"+(isNum?" num":"")+(g.classList.contains("open")?" open":"");
 g.innerHTML="";
 a.forEach((it,i)=>{
  const b=document.createElement("button");b.type="button";b.textContent=it.ch;b.dataset.i=i;
  b.setAttribute("aria-label",(isNum?"الرقم ":"الحرف ")+it.ch);
  if(i===st.idx)b.classList.add("cur");
  try{if(parseInt(localStorage.getItem("wrBest_"+st.kind+"_"+i)||"0",10)>0)b.classList.add("done")}catch(e){}
  g.appendChild(b);
 });
 $("wr-pick").textContent=(g.classList.contains("open")?"▲ إغلاق القائمة":(isNum?"🔎 اختر الرقم بنفسك":"🔎 اختر الحرف بنفسك"));
 $("wr-pick").classList.toggle("on",g.classList.contains("open"));
}
function togglePick(force){
 const g=$("wr-grid"),open=force===undefined?!g.classList.contains("open"):force;
 g.classList.toggle("open",open);buildPick();
 if(open){const c=g.querySelector(".cur");if(c&&c.scrollIntoView)try{c.scrollIntoView({block:"nearest"})}catch(e){}}
}
$("wr-pick").onclick=()=>togglePick();
$("wr-title").onclick=()=>togglePick();
$("wr-grid").onclick=e=>{const b=e.target.closest("button");if(!b)return;st.idx=parseInt(b.dataset.i,10)||0;togglePick(false);render(true)};

/* ----- تشجيع مباشر: عند رفع الطفل يده وتوقّفه عن الكتابة، إن بلغت الدقة 95% فأكثر وكان الشكل صحيحًا ----- */
const AUTO_PCT=95,AUTO_WAIT=900;
function autoCheck(){
 st.autoT=0;
 if(st.level==="free"||!st.strokes.length||st.cur||st.done)return;
 const r=score();
 if(r.pct>=AUTO_PCT&&r.worst>=.75&&r.extra===0&&r.outLen<=r.S*.1&&r.ink>0){
  st.done=true;setBest(3);refreshTitle();buildPick();
  msg(starsText(3)+"  "+r.pct+"٪  ممتاز! كتابتك صحيحة ودقيقة",true);
  cheer(3);
 }
}
function scheduleAuto(){clearTimeout(st.autoT);st.autoT=0;if(st.level==="free"||!st.strokes.length)return;st.autoT=setTimeout(autoCheck,AUTO_WAIT)}
function cancelAuto(){clearTimeout(st.autoT);st.autoT=0}

/* ----- المؤشر ----- */
function pt(e){const r=ic.getBoundingClientRect();return [Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))]}
ic.addEventListener("pointerdown",e=>{
 e.preventDefault();try{ic.setPointerCapture(e.pointerId)}catch(x){}
 clearTimeout(st.modelT);cancelAuto();st.done=false;if(st.level==="free")drawGuide();
 st.cur=[pt(e)];st.strokes.push(st.cur);drawInk();msg("");
});
ic.addEventListener("pointermove",e=>{if(!st.cur)return;e.preventDefault();st.cur.push(pt(e));drawInk()});
["pointerup","pointercancel","pointerleave"].forEach(t=>ic.addEventListener(t,()=>{const was=!!st.cur;st.cur=null;if(was)scheduleAuto()}));
ic.addEventListener("touchstart",e=>e.preventDefault(),{passive:false});

/* ----- الأزرار ----- */
$("wr-kind").onclick=e=>{const b=e.target.closest("button");if(!b)return;st.kind=b.dataset.k;st.idx=0;$("wr-grid").classList.remove("open");
 [].forEach.call($("wr-kind").children,x=>x.classList.toggle("on",x===b));render(true)};
$("wr-lv").onclick=e=>{const b=e.target.closest("button");if(!b)return;st.level=b.dataset.l;
 [].forEach.call($("wr-lv").children,x=>x.classList.toggle("on",x===b));render(false)};
$("wr-next").onclick=()=>go(1);
$("wr-prev").onclick=()=>go(-1);
$("wr-hear").onclick=speak;
$("wr-clear").onclick=()=>{st.strokes=[];st.cur=null;clearTimeout(st.modelT);cancelAuto();st.done=false;drawGuide();drawInk();msg("")};
$("wr-undo").onclick=()=>{st.strokes.pop();st.cur=null;cancelAuto();st.done=false;drawInk();msg("")};
$("wr-check").onclick=()=>{
 if(!st.strokes.length){msg("اكتب أولًا ثم اضغط «تحقق»");return}
 if(st.level==="free"){
  drawGuide(true);msg("قارن كتابتك بالنموذج الأحمر، ثم جرّب مرة أخرى لتصير أجمل",true);cheer("free");
  clearTimeout(st.modelT);st.modelT=setTimeout(()=>drawGuide(),4000);return;
 }
 const r0=score();if(st.done&&r0.pct>=AUTO_PCT)return;result(r0);
};

/* ----- الدخول والخروج من القسم ----- */
function open(){
 [].slice.call(document.querySelectorAll(".mode-page")).forEach(p=>p.classList.remove("active"));
 [].slice.call(document.querySelectorAll(".mode-switch .mode")).forEach(b=>b.classList.remove("active"));
 sec.classList.add("active");btn.classList.add("active");
 const s=$("subtitle");if(s)s.textContent="نتعلّم الكتابة";
 setup();render(false);
}
function leave(){sec.classList.remove("active");btn.classList.remove("active");clearTimeout(st.modelT);cancelAuto()}
btn.onclick=open;
[].slice.call(sw.querySelectorAll(".mode")).forEach(b=>{if(b!==btn)b.addEventListener("click",leave)});
/* ----- إخفاء قسم الكتابة من الإعدادات ----- */
function applyWritingTab(){
 let on=true;try{on=(JSON.parse(localStorage.getItem("learningFeatures")||"{}")).writingTab!==false}catch(e){}
 btn.hidden=!on;
 if(!on&&sec.classList.contains("active")){const l=$("learning-mode");if(l)l.click()}
}
window.applyWritingTab=applyWritingTab;
applyWritingTab();
window.addEventListener("resize",()=>{if(sec.classList.contains("active")){setup()}});
})();
