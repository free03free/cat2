(function(){
"use strict";
const KEY="learningMaxNumber", REPEAT_KEY="repeatEnabled", SPEED_KEY="speechSpeed", STEPS_KEY="ttsSteps", NORMAL_VOLUME_KEY="normalVolume", LEARNING_VOLUME_KEY="learningVolume";
const FEATURE_KEY="learningFeatures";
let maxNumber=parseInt(localStorage.getItem(KEY)||"10",10);
if(!Number.isFinite(maxNumber)||maxNumber<1)maxNumber=10;
if(maxNumber>1000)maxNumber=1000;
let speechSpeed=parseFloat(localStorage.getItem(SPEED_KEY)||"0.9");
let learningVolume=parseInt(localStorage.getItem(LEARNING_VOLUME_KEY)||"100",10);
if(!Number.isFinite(learningVolume)||learningVolume<0)learningVolume=90;
if(learningVolume>100)learningVolume=100;
let volumeLevel=learningVolume;
if(!Number.isFinite(speechSpeed))speechSpeed=0.9;
let features=Object.assign({harakat:false,madd:false,words:false,quiz:false},JSON.parse(localStorage.getItem(FEATURE_KEY)||"{}"));
let selectedNumber=1,selectedLetter=0,selectedColor=0,quizAnswer="",quizActive=false;
let heard="",pokes=0,pokeT=0,idleAt=Date.now(),talkDog=0;
pushNativePrefs();
const letters=[
 ["أ","أَلِف"],["ب","بَاء"],["ت","تَاء"],["ث","ثَاء"],["ج","جِيم"],["ح","حَاء"],["خ","خَاء"],["د","دَال"],["ذ","ذَال"],["ر","رَاء"],["ز","زَاي"],["س","سِين"],["ش","شِين"],["ص","صَاد"],["ض","ضَاد"],["ط","طَاء"],["ظ","ظَاء"],["ع","عَيْن"],["غ","غَيْن"],["ف","فَاء"],["ق","قَاف"],["ك","كَاف"],["ل","لَام"],["م","مِيم"],["ن","نُون"],["ه","هَاء"],["و","وَاو"],["ي","يَاء"]
];
const colors=[["أَحْمَر","#e74c3c"],["أَزْرَق","#3498db"],["أَصْفَر","#f1c40f"],["أَخْضَر","#2ecc71"],["بُرْتُقَالِي","#f39c12"],["بَنَفْسَجِي","#9b59b6"],["وَرْدِي","#ff7aa2"],["بُنِّي","#8b5a2b"],["أَسْوَد","#222"],["أَبْيَض","#fff"],["رَمَادِي","#95a5a6"],["ذَهَبِي","#d4ac0d"]];
const $=id=>document.getElementById(id);
function showSpeech(t){const s2=$("speech2");if(s2)s2.textContent=t}
const catEls=()=>[$("cat2")];
let mouthT=null;
function mouthLoop(on){clearInterval(mouthT);mouthT=null;if(on){mouthT=setInterval(()=>{const v=(.25+Math.random()*.8).toFixed(2);catEls().forEach(c=>c&&c.style.setProperty("--mo",v))},120)}else catEls().forEach(c=>c&&c.style.setProperty("--mo",.3))}
function catSet(cls,on){catEls().forEach(c=>c&&c.classList.toggle(cls,!!on));if(cls==="talk")mouthLoop(!!on)}
function catOnce(cls,ms){catEls().forEach(c=>{if(!c)return;c.classList.remove(cls);void c.offsetWidth;c.classList.add(cls)});setTimeout(()=>catEls().forEach(c=>c&&c.classList.remove(cls)),ms)}
function wake(){idleAt=Date.now();if($("cat2").classList.contains("sleep")){catSet("sleep",false);document.querySelectorAll(".zzz").forEach(z=>z.remove())}}
function talk(text,speed){
 showSpeech(text);wake();
 if(window.TomNative&&TomNative.say){TomNative.say(text,Number(speed||speechSpeed),0);clearTimeout(talkDog);talkDog=setTimeout(()=>catSet("talk",false),20000)}
 else{catSet("talk",true);setTimeout(()=>catSet("talk",false),Math.min(2500,Math.max(500,String(text).length*90)))}
}
function activeVolume(){return learningVolume}
function pushNativePrefs(){volumeLevel=activeVolume();if(!window.TomNative)return;try{TomNative.setSpeed&&TomNative.setSpeed(speechSpeed);TomNative.setVolume&&TomNative.setVolume(volumeLevel/100);TomNative.setSystemVoice&&TomNative.setSystemVoice(localStorage.getItem("systemVoice")==="1");TomNative.setVoice&&TomNative.setVoice(parseInt(localStorage.getItem("voiceSel")||"9",10));TomNative.setSteps&&TomNative.setSteps(parseInt(localStorage.getItem(STEPS_KEY)||"6",10)||6)}catch(e){}}
/* ---------- مؤثرات القط ---------- */
let ac;function unlockAudio(){try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.state==="suspended")ac.resume()}catch(e){}}
function meow(){}  // لا صوت عند الضغط على القط: يبقى الحركة والقلوب فقط، فلا يختلط شيء بنطق الحرف أو الرقم أو اللون
function burst(el,emoji,n,cx,cy){const box=el.closest(".cat-card,.mini-bar");if(!box)return;const fx=box.querySelector(".fx");if(!fx)return;const r=fx.getBoundingClientRect();
 for(let i=0;i<n;i++){const b=document.createElement("b");b.textContent=emoji[i%emoji.length];b.style.left=(cx-r.left-12+(Math.random()*50-25))+"px";b.style.top=(cy-r.top-12+(Math.random()*20-10))+"px";b.style.setProperty("--dx",(Math.random()*80-40)+"px");b.style.animationDelay=(i*70)+"ms";fx.appendChild(b);setTimeout(()=>b.remove(),1500)}}
function poke(el,e){
 unlockAudio();wake();
 const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
 const now=Date.now();pokes=now-pokeT<2500?pokes+1:1;pokeT=now;
 if(pokes>=6){pokes=0;catOnce("surprise",900);burst(el,["💫","😵","⭐"],3,e.clientX,e.clientY);meow(.7,.7);return}
 if(y<.6){catOnce("happy",900);burst(el,["❤️","💕","✨"],3,e.clientX,e.clientY);meow(1+Math.random()*.25,.5)}
 else if(x>.72&&y>.55){catOnce("swing",1300);meow(.9,.35)}
 else{catOnce("surprise",600);burst(el,["⭐","✨"],2,e.clientX,e.clientY);
  meow(1.35,.3)}
}
function bindCat(el){if(!el)return;el.addEventListener("pointerdown",e=>poke(el,e))}
function look(e){catEls().forEach(c=>{if(!c)return;const r=c.getBoundingClientRect();if(!r.width)return;const dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height*.4),d=Math.hypot(dx,dy)||1,k=Math.min(1,d/200);
 c.style.setProperty("--px",(dx/d*4*k).toFixed(1)+"px");c.style.setProperty("--py",(dy/d*5*k).toFixed(1)+"px")})}
function startIdle(){
 document.addEventListener("pointermove",look);document.addEventListener("pointerdown",e=>{look(e);wake()});
 setInterval(()=>{const c=$("cat2");if(c.classList.contains("talk")||c.classList.contains("sleep"))return;
  const idle=Date.now()-idleAt;
  if(idle>45000){catSet("sleep",true);return}
  const a=["earL","earR","yawn","swing"][Math.floor(Math.random()*4)];catOnce(a,a==="swing"?1300:900)
 },5500)}
function ones(n){return ["","وَاحِد","اِثْنَان","ثَلَاثَة","أَرْبَعَة","خَمْسَة","سِتَّة","سَبْعَة","ثَمَانِيَة","تِسْعَة"][n]}
function tens(n){return ["","عَشَرَة","عِشْرُون","ثَلَاثُون","أَرْبَعُون","خَمْسُون","سِتُّون","سَبْعُون","ثَمَانُون","تِسْعُون"][n]}
function numberWord(n){if(n<10)return ones(n);if(n===10)return "عَشَرَة";if(n===11)return "أَحَدَ عَشَر";if(n===12)return "اِثْنَا عَشَر";if(n<20)return ones(n-10)+"َ عَشَر";if(n<100){let u=n%10,t=Math.floor(n/10);return u?tens(t)+" وَ"+ones(u).toLowerCase():tens(t)}if(n===100)return "مِئَة";if(n<200)return "مِئَة وَ"+numberWord(n-100);if(n<1000){let h=Math.floor(n/100),r=n%100,hw=["","","مِئَتَان","ثَلَاثُمِئَة","أَرْبَعُمِئَة","خَمْسُمِئَة","سِتُّمِئَة","سَبْعُمِئَة","ثَمَانِيُمِئَة","تِسْعُمِئَة"][h];return r?hw+" وَ"+numberWord(r):hw}if(n===1000)return "أَلْف";return String(n)}
function renderNumbers(){const g=$("number-grid");g.innerHTML="";for(let n=1;n<=maxNumber;n++){const b=document.createElement("button");b.className="number"+(n===selectedNumber?" selected":"");b.textContent=n;b.onclick=()=>{selectedNumber=n;document.querySelectorAll(".number").forEach(x=>x.classList.remove("selected"));b.classList.add("selected");talk(numberWord(n));};g.appendChild(b)}}
function currentLetter(){return letters[selectedLetter][0]}
const spd=k=>Math.max(.6,Math.min(1.2,speechSpeed*k));
// يحدد النص المنطوق وسرعته لكل عنصر تعليمي؛ نفس الدالة تُستعمل للنطق وللتجهيز المسبق كي يتطابق المخزَّن مع المطلوب
function learnArgs(text){
 const t=String(text||"");
 if(/^[ء-ي][َُِْ]$/.test(t))return["حرف "+t+"، كرر: "+t,spd(.8)];
 if(/^[ء-ي][اوي]$/.test(t))return["مد: "+t,spd(.84)];
 return[t,spd(.91)];
}
function speakLearning(text){const a=learnArgs(text);return talk(a[0],a[1])}
function prefetchAll(){
 if(!window.TomNative||!TomNative.prefetch)return;
 const items=[],seen=new Set(),add=(t,sp)=>{const k=t+"|"+sp;if(!seen.has(k)){seen.add(k);items.push([t,Number(sp.toFixed(3))])}};
 const wordMap={"ب":["بَاب","بَيْت","بَطَّة"],"ر":["رُمَّان","رَأْس","رِيشَة"],"م":["مَاء","مُوز","مَلِك"],"ت":["تِين","تُوت","تَمْر"],"س":["سَمَك","سُوق","سَيْف"],"ن":["نُور","نَار","نَمْل"],"ك":["كِتَاب","كُرَة","كَلْب"]};
 const order=letters.map((_,i)=>i);order.sort((a,b)=>(a===selectedLetter?-1:b===selectedLetter?1:a-b));
 order.forEach(i=>{const l=letters[i][0];
  const la=learnArgs(letters[i][1]);add(la[0],la[1]);
  [l+"َ",l+"ِ",l+"ُ",l+"ْ",l+"ا",l+"و",l+"ي"].forEach(x=>{const a=learnArgs(x);add(a[0],a[1])});
  (wordMap[l]||[l+"َاب",l+"ِي",l+"ُو"]).forEach(x=>{const a=learnArgs(x);add(a[0],a[1])});
 });
 colors.forEach(c=>add(c[0],speechSpeed));
 try{for(let n=1;n<=Math.min(maxNumber,1000);n++)add(numberWord(n),speechSpeed)}catch(e){}
 ["مَرْحَبًا أَنَا القِطُّ المُتَكَلِّم"].forEach(x=>add(x,speechSpeed));
 lessonWords.forEach((_,i)=>{["word","both"].forEach(k=>{const a=lsArgs(i,k);add(a[0],a[1])})});
 add("وَضْعُ الدُّرُوس. اِخْتَرْ حَرْفًا",0.78);add("وَضْعُ التَّعَلُّم. اِضْغَطْ عَلَيَّ لِأُكَرِّرَ",0.78);
 try{for(let n=1;n<=1000;n++)add(numberWord(n),speechSpeed)}catch(e){}
 try{TomNative.prefetch(JSON.stringify(items))}catch(e){}
}
let prefetchT=null;function schedulePrefetch(){clearTimeout(prefetchT);prefetchT=setTimeout(prefetchAll,1800)}
function addMini(parent,text,extra){const b=document.createElement("button");b.className="mini-item"+(extra?" "+extra:"");b.textContent=text;b.onclick=()=>speakLearning(text);parent.appendChild(b);return b}
function renderLetterLessons(){
 const l=currentLetter(), h=$("harakat-grid"),m=$("madd-grid"),s=$("syllable-grid"),w=$("word-grid");h.innerHTML="";m.innerHTML="";s.innerHTML="";w.innerHTML="";
 [[l+"َ","فَتْحَة"],[l+"ِ","كِسْرَة"],[l+"ُ","ضَمَّة"],[l+"ْ","سُكُون"]].forEach(x=>addMini(h,x[0]));
 [[l+"ا","مَدٌّ بِالأَلِف"],[l+"و","مَدٌّ بِالْوَاو"],[l+"ي","مَدٌّ بِالْيَاءِ"]].forEach(x=>addMini(m,x[0]));
 [l+"َ",l+"ِ",l+"ُ",l+"ا",l+"و",l+"ي"].forEach(x=>addMini(s,x));
 const wordMap={"ب":["بَاب","بَيْت","بَطَّة"],"ر":["رُمَّان","رَأْس","رِيشَة"],"م":["مَاء","مُوز","مَلِك"],"ت":["تِين","تُوت","تَمْر"],"س":["سَمَك","سُوق","سَيْف"],"ن":["نُور","نَار","نَمْل"],"ك":["كِتَاب","كُرَة","كَلْب"]};
 (wordMap[l]||[l+"َاب",l+"ِي",l+"ُو"]).forEach(x=>{const b=addMini(w,x);b.classList.add("word-item")});
 $("harakat-grid").parentElement.hidden=!features.harakat;$("madd-grid").parentElement.hidden=!features.madd;$("syllable-grid").parentElement.hidden=!features.madd;$("word-grid").parentElement.hidden=!features.words;$("start-quiz").parentElement.hidden=!features.quiz;
}
function renderLetters(){const g=$("letter-grid");g.innerHTML="";letters.forEach((x,i)=>{const b=document.createElement("button");b.className="letter"+(i===selectedLetter?" selected":"");b.textContent=x[0];b.onclick=()=>{selectedLetter=i;document.querySelectorAll(".letter").forEach(y=>y.classList.remove("selected"));b.classList.add("selected");$("letter-detail").textContent=x[0]+" — "+x[1];renderLetterLessons();speakLearning(x[1]);};g.appendChild(b)});$("letter-detail").textContent=letters[0][0]+" — "+letters[0][1];renderLetterLessons()}
function renderColors(){const g=$("color-grid");g.innerHTML="";colors.forEach((x,i)=>{const b=document.createElement("button");b.className="color-card"+(i===selectedColor?" selected":"");b.innerHTML='<div class="swatch" style="background:'+x[1]+'"></div>'+x[0];b.onclick=()=>{selectedColor=i;document.querySelectorAll(".color-card").forEach(y=>y.classList.remove("selected"));b.classList.add("selected");talk(x[0]);};g.appendChild(b)})}
function startQuiz(){const pool=["بَ","بِ","بُ","بْ","با","بو","بي","رَ","رِ","رُ","را","رو","ري"];quizAnswer=pool[Math.floor(Math.random()*pool.length)];quizActive=true;$("quiz-prompt").textContent="استمع جيدًا ثم اختر ما سمعت.";{const a=learnArgs(quizAnswer);talk(a[0],a[1])};const options=$("quiz-options");options.innerHTML="";const set=[quizAnswer];while(set.length<4){const x=pool[Math.floor(Math.random()*pool.length)];if(!set.includes(x))set.push(x)}set.sort(()=>Math.random()-0.5);set.forEach(x=>{const b=document.createElement("button");b.className="quiz-option";b.textContent=x;b.onclick=()=>{if(!quizActive)return;if(x===quizAnswer){b.classList.add("correct");$("quiz-prompt").textContent="أحسنت! ⭐ إجابة صحيحة";talk("أَحْسَنْتَ",0.72)}else{b.classList.add("wrong");$("quiz-prompt").textContent="حاول مرة أخرى 🔄";talk("حَاوِلْ مَرَّةً أُخْرَى",0.72)}};options.appendChild(b)})}
function speakCurrent(){const t=document.querySelector(".tab.active"),p=t?t.dataset.page:"numbers";if(p==="numbers")talk(numberWord(selectedNumber));else if(p==="letters")speakLearning(letters[selectedLetter][1]);else talk(colors[selectedColor][0])}
// ===== الوضع الثالث: وضع الدروس (حرف + صورة + كلمة) =====
const LS_KEY="lessonSeen";
const lessonWords=[
 ["أَسَد","🦁"],["بَقَرَة","🐄"],["تَمْر","svg:tamr"],["ثَعْلَب","🦊"],["جَمَل","🐪"],["حِصَان","🐎"],["خَرُوف","🐑"],["دُبّ","svg:bear"],["ذُرَة","🌽"],["رُمَّان","svg:rumman"],
 ["زَرَافَة","🦒"],["سَمَكَة","🐟"],["شَمْس","🌞"],["صَارُوخ","🚀"],["ضِفْدَع","🐸"],["طَائِر","🐦"],["ظَرْف","\u2709\uFE0F"],["عِنَب","🍇"],["غَيْمَة","\u2601\uFE0F"],["فِيل","🐘"],
 ["قِطَّة","🐈"],["كَلْب","🐕"],["لَيْمُون","🍋"],["مَوْز","🍌"],["نَحْلَة","🐝"],["هِلَال","🌙"],["وَرْدَة","🌹"],["يَد","✋"]
];
// رسمان للكلمتين اللتين لا يوجد لهما رمز تعبيري (تمر، رمان)
const LS_SVG={
 tamr:"<svg viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'><defs><radialGradient id='tm1' cx='.35' cy='.28' r='.9'><stop offset='0' stop-color='#e0924f'/><stop offset='.45' stop-color='#a24e1e'/><stop offset='1' stop-color='#4a1e09'/></radialGradient></defs><path d='M8 46Q60 -8 112 46' fill='none' stroke='#2e7d32' stroke-width='3.5' stroke-linecap='round'/><ellipse cx='18.4' cy='36.3' rx='8.2' ry='2.6' transform='rotate(18 18.4 36.3) translate(8.2 0)' fill='#43a047'/><ellipse cx='18.4' cy='36.3' rx='8.2' ry='2.6' transform='rotate(-98 18.4 36.3) translate(8.2 0)' fill='#43a047'/><ellipse cx='28.8' cy='28.7' rx='8.9' ry='2.6' transform='rotate(26 28.8 28.7) translate(8.9 0)' fill='#43a047'/><ellipse cx='28.8' cy='28.7' rx='8.9' ry='2.6' transform='rotate(-90 28.8 28.7) translate(8.9 0)' fill='#43a047'/><ellipse cx='39.2' cy='23.3' rx='9.6' ry='2.6' transform='rotate(35 39.2 23.3) translate(9.6 0)' fill='#43a047'/><ellipse cx='39.2' cy='23.3' rx='9.6' ry='2.6' transform='rotate(-81 39.2 23.3) translate(9.6 0)' fill='#43a047'/><ellipse cx='49.6' cy='20.1' rx='10.3' ry='2.6' transform='rotate(46 49.6 20.1) translate(10.3 0)' fill='#43a047'/><ellipse cx='49.6' cy='20.1' rx='10.3' ry='2.6' transform='rotate(-70 49.6 20.1) translate(10.3 0)' fill='#43a047'/><ellipse cx='60.0' cy='19.0' rx='11.0' ry='2.6' transform='rotate(58 60.0 19.0) translate(11.0 0)' fill='#43a047'/><ellipse cx='60.0' cy='19.0' rx='11.0' ry='2.6' transform='rotate(-58 60.0 19.0) translate(11.0 0)' fill='#43a047'/><ellipse cx='70.4' cy='20.1' rx='10.3' ry='2.6' transform='rotate(70 70.4 20.1) translate(10.3 0)' fill='#43a047'/><ellipse cx='70.4' cy='20.1' rx='10.3' ry='2.6' transform='rotate(-46 70.4 20.1) translate(10.3 0)' fill='#43a047'/><ellipse cx='80.8' cy='23.3' rx='9.6' ry='2.6' transform='rotate(81 80.8 23.3) translate(9.6 0)' fill='#43a047'/><ellipse cx='80.8' cy='23.3' rx='9.6' ry='2.6' transform='rotate(-35 80.8 23.3) translate(9.6 0)' fill='#43a047'/><ellipse cx='91.2' cy='28.7' rx='8.9' ry='2.6' transform='rotate(90 91.2 28.7) translate(8.9 0)' fill='#43a047'/><ellipse cx='91.2' cy='28.7' rx='8.9' ry='2.6' transform='rotate(-26 91.2 28.7) translate(8.9 0)' fill='#43a047'/><ellipse cx='101.6' cy='36.3' rx='8.2' ry='2.6' transform='rotate(98 101.6 36.3) translate(8.2 0)' fill='#43a047'/><ellipse cx='101.6' cy='36.3' rx='8.2' ry='2.6' transform='rotate(-18 101.6 36.3) translate(8.2 0)' fill='#43a047'/><g stroke='#6b4a1f' stroke-width='2.4' stroke-linecap='round' fill='none'><path d='M60 15L60 30'/><path d='M60 30L36 58'/><path d='M60 30L60 62'/><path d='M60 30L84 58'/></g><g transform='rotate(14 36 60)'><path d='M36 60C50 60 53 82 52 92C50 108 44 116 36 116C28 116 22 108 20 92C19 82 22 60 36 60Z' fill='url(#tm1)' stroke='#2a1105' stroke-width='2.6'/><path d='M27 80Q36 76 45 80M25 94Q36 90 47 94M27 106Q36 102 45 106' fill='none' stroke='#2a1105' stroke-opacity='.28' stroke-width='1.6' stroke-linecap='round'/><ellipse cx='29' cy='80' rx='2.6' ry='9' fill='#fff' fill-opacity='.32'/><path d='M31 61Q36 55 41 61L39.5 66Q36 63 32.5 66Z' fill='#6b4a1f' stroke='#2a1105' stroke-width='1.6' stroke-linejoin='round'/></g><g transform='rotate(-14 84 60)'><path d='M84 60C98 60 101 82 100 92C98 108 92 116 84 116C76 116 70 108 68 92C67 82 70 60 84 60Z' fill='url(#tm1)' stroke='#2a1105' stroke-width='2.6'/><path d='M75 80Q84 76 93 80M73 94Q84 90 95 94M75 106Q84 102 93 106' fill='none' stroke='#2a1105' stroke-opacity='.28' stroke-width='1.6' stroke-linecap='round'/><ellipse cx='77' cy='80' rx='2.6' ry='9' fill='#fff' fill-opacity='.32'/><path d='M79 61Q84 55 89 61L87.5 66Q84 63 80.5 66Z' fill='#6b4a1f' stroke='#2a1105' stroke-width='1.6' stroke-linejoin='round'/></g><g transform='rotate(0 60 66)'><path d='M60 66C74 66 77 88 76 98C74 114 68 122 60 122C52 122 46 114 44 98C43 88 46 66 60 66Z' fill='url(#tm1)' stroke='#2a1105' stroke-width='2.6'/><path d='M51 86Q60 82 69 86M49 100Q60 96 71 100M51 112Q60 108 69 112' fill='none' stroke='#2a1105' stroke-opacity='.28' stroke-width='1.6' stroke-linecap='round'/><ellipse cx='53' cy='86' rx='2.6' ry='9' fill='#fff' fill-opacity='.32'/><path d='M55 67Q60 61 65 67L63.5 72Q60 69 56.5 72Z' fill='#6b4a1f' stroke='#2a1105' stroke-width='1.6' stroke-linejoin='round'/></g></svg>",
 rumman:"<svg viewBox=\"0 0 120 120\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><defs><radialGradient id=\"rr\" cx=\".4\" cy=\".3\" r=\".9\"><stop offset=\"0\" stop-color=\"#ee5a4f\"/><stop offset=\".7\" stop-color=\"#b8182a\"/><stop offset=\"1\" stop-color=\"#7d0f1d\"/></radialGradient></defs>\n<path d=\"M44 20L50 6L57 17L64 4L71 17L78 6L84 20Z\" fill=\"#9c1426\" stroke=\"#6e0b17\" stroke-width=\"2\" stroke-linejoin=\"round\"/>\n<circle cx=\"60\" cy=\"66\" r=\"46\" fill=\"url(#rr)\" stroke=\"#6e0b17\" stroke-width=\"3\"/>\n<circle cx=\"60\" cy=\"66\" r=\"40\" fill=\"#fff0cf\"/>\n<path d=\"M60 26V106M20 66H100M32 38L88 94M88 38L32 94\" stroke=\"#f1d6a0\" stroke-width=\"3\"/>\n<ellipse cx=\"90.0\" cy=\"66.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(90 90.0 66.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"88.5\" cy=\"63.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"86.0\" cy=\"81.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(120 86.0 81.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"84.5\" cy=\"78.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"75.0\" cy=\"92.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(150 75.0 92.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"73.5\" cy=\"89.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"60.0\" cy=\"96.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(180 60.0 96.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"58.5\" cy=\"93.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"45.0\" cy=\"92.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(210 45.0 92.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"43.5\" cy=\"89.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"34.0\" cy=\"81.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(240 34.0 81.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"32.5\" cy=\"78.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"30.0\" cy=\"66.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(270 30.0 66.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"28.5\" cy=\"63.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"34.0\" cy=\"51.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(300 34.0 51.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"32.5\" cy=\"48.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"45.0\" cy=\"40.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(330 45.0 40.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"43.5\" cy=\"37.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"60.0\" cy=\"36.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(360 60.0 36.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"58.5\" cy=\"33.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"75.0\" cy=\"40.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(390 75.0 40.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"73.5\" cy=\"37.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"86.0\" cy=\"51.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(420 86.0 51.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"84.5\" cy=\"48.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"77.5\" cy=\"73.4\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(113 77.5 73.4)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"76.0\" cy=\"71.2\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"67.1\" cy=\"83.6\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(158 67.1 83.6)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"65.6\" cy=\"81.4\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"52.6\" cy=\"83.5\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(203 52.6 83.5)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"51.1\" cy=\"81.3\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"42.4\" cy=\"73.1\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(248 42.4 73.1)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"40.9\" cy=\"70.9\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"42.5\" cy=\"58.6\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(293 42.5 58.6)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"41.0\" cy=\"56.4\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"52.9\" cy=\"48.4\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(338 52.9 48.4)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"51.4\" cy=\"46.2\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"67.4\" cy=\"48.5\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(383 67.4 48.5)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"65.9\" cy=\"46.3\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"77.6\" cy=\"58.9\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(428 77.6 58.9)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"76.1\" cy=\"56.7\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"65.6\" cy=\"71.7\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(136 65.6 71.7)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"64.1\" cy=\"69.5\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"52.2\" cy=\"68.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(256 52.2 68.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"50.7\" cy=\"65.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"62.2\" cy=\"58.3\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(376 62.2 58.3)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"60.7\" cy=\"56.1\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/></svg>",
 bear:"<svg viewBox=\"0 0 120 120\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><g fill=\"#8a5a33\" stroke=\"#4e2f16\" stroke-width=\"3\"><circle cx=\"38\" cy=\"22\" r=\"11\"/><circle cx=\"82\" cy=\"22\" r=\"11\"/><ellipse cx=\"26\" cy=\"68\" rx=\"11\" ry=\"20\" transform=\"rotate(18 26 68)\"/><ellipse cx=\"94\" cy=\"68\" rx=\"11\" ry=\"20\" transform=\"rotate(-18 94 68)\"/><ellipse cx=\"60\" cy=\"76\" rx=\"30\" ry=\"32\"/><ellipse cx=\"42\" cy=\"108\" rx=\"15\" ry=\"10\"/><ellipse cx=\"78\" cy=\"108\" rx=\"15\" ry=\"10\"/><circle cx=\"60\" cy=\"40\" r=\"26\"/></g><circle cx=\"38\" cy=\"22\" r=\"5\" fill=\"#e8a98a\"/><circle cx=\"82\" cy=\"22\" r=\"5\" fill=\"#e8a98a\"/><ellipse cx=\"60\" cy=\"80\" rx=\"18\" ry=\"22\" fill=\"#e8c9a0\"/><ellipse cx=\"60\" cy=\"48\" rx=\"13\" ry=\"10\" fill=\"#e8c9a0\"/><circle cx=\"50\" cy=\"36\" r=\"3.5\" fill=\"#222\"/><circle cx=\"70\" cy=\"36\" r=\"3.5\" fill=\"#222\"/><ellipse cx=\"60\" cy=\"44\" rx=\"5\" ry=\"3.5\" fill=\"#222\"/><path d=\"M60 47V51M54 52Q60 56 66 52\" stroke=\"#222\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\"/><ellipse cx=\"42\" cy=\"108\" rx=\"8\" ry=\"5\" fill=\"#e8c9a0\"/><ellipse cx=\"78\" cy=\"108\" rx=\"8\" ry=\"5\" fill=\"#e8c9a0\"/></svg>"
};
const LS_COLORS=["#ffe3b3","#ffd6e0","#d6f0ff","#dff5d2","#ead9ff","#fff0a8","#ffd9c2"];
let lsIdx=0;
const lsSeen=()=>{try{return JSON.parse(localStorage.getItem(LS_KEY)||"[]")}catch(e){return[]}};
function lsMark(i){try{const s=lsSeen();if(s.indexOf(i)<0){s.push(i);localStorage.setItem(LS_KEY,JSON.stringify(s))}}catch(e){}}
const lsPic=p=>p.indexOf("svg:")===0?LS_SVG[p.slice(4)]:'<span class="ls-emoji">'+p+'</span>';
function lsWordHtml(w){const m=w.match(/^([\s\S][\u064B-\u0652\u0670]*)([\s\S]*)$/);return"<b>"+m[1]+"</b>"+m[2]}
// نفس صياغة النطق تُستعمل للنطق وللتجهيز المسبق فيتطابق المخزَّن مع المطلوب
const LS_SAY={"نَحْلَة":"نَحْلَه"};
function lsArgs(i,kind){const n=letters[i][1],w=LS_SAY[lessonWords[i][0]]||lessonWords[i][0];return learnArgs(kind==="word"?w:kind==="name"?n:n+"، "+w)}
function lsSay(kind){const a=lsArgs(lsIdx,kind);talk(a[0],a[1])}
function lsGrid(){
 const g=$("ls-grid");
 if(!g.children.length){
  letters.forEach((l,i)=>{const b=document.createElement("button");b.className="ls-tile";b.type="button";b.setAttribute("aria-label",l[1]+" "+lessonWords[i][0]);
   b.innerHTML='<span class="ls-t-l">'+l[0]+'</span><span class="ls-t-p">'+lsPic(lessonWords[i][1])+'</span>';
   b.onclick=()=>lsOpen(i,true);g.appendChild(b)});
 }
 const seen=lsSeen();
 Array.prototype.forEach.call(g.children,(b,i)=>{b.classList.toggle("active",i===lsIdx);b.classList.toggle("seen",seen.indexOf(i)>=0)});
 $("ls-progress").textContent="تعلّمتَ "+seen.length+" من "+letters.length+" حرفًا";
}
function lsOpen(i,say){
 lsIdx=(i+letters.length)%letters.length;
 const L=letters[lsIdx],W=lessonWords[lsIdx];
 $("ls-card").style.setProperty("--ls",LS_COLORS[lsIdx%LS_COLORS.length]);
 $("ls-letter").textContent=L[0];$("ls-name").textContent=L[1];
 $("ls-pic").innerHTML=lsPic(W[1]);$("ls-word").innerHTML=lsWordHtml(W[0]);
 $("ls-count").textContent="الحرف "+(lsIdx+1)+" من "+letters.length;
 lsMark(lsIdx);lsGrid();
 if(say)lsSay("both");
}
(function lsInit(){
 $("lessons-mode").onclick=()=>setMode("lessons");
 $("ls-prev").onclick=()=>lsOpen(lsIdx-1,true);
 $("ls-next").onclick=()=>lsOpen(lsIdx+1,true);
 $("ls-letter").onclick=()=>lsSay("name");
 $("ls-pic").onclick=()=>lsSay("word");
 $("ls-word").onclick=()=>lsSay("word");
 $("ls-play").onclick=()=>lsSay("both");
 lsOpen(0,false);
})();

function setMode(mode,silent){const study=mode==="learning",letterMode=mode==="lessons";
 ["learning","lessons"].forEach(m=>{$(m).classList.toggle("active",m===mode);$(m+"-mode").classList.toggle("active",m===mode)});
 $("subtitle").textContent=letterMode?"نتعلّم الحروف مع الصور":"اضغط على القط ليكرر الدرس";
 pushNativePrefs();
 if(silent)return;
 if(study)talk("وَضْعُ التَّعَلُّم. اِضْغَطْ عَلَيَّ لِأُكَرِّرَ",0.78);if(letterMode)talk("وَضْعُ الدُّرُوس. اِخْتَرْ حَرْفًا",0.78)}
function openSettings(){$("settings").hidden=false;$("max-number").value=maxNumber;$("system-voice").checked=localStorage.getItem("systemVoice")==="1";$("voice-id").value=localStorage.getItem("voiceSel")||"9";$("tts-quality").value=localStorage.getItem(STEPS_KEY)||"6";$("speech-speed-value").textContent=Number(speechSpeed).toFixed(2);$("speech-speed").value=speechSpeed;$("learning-volume-level").value=learningVolume;$("learning-volume-value").textContent=learningVolume+"%";$("enable-harakat").checked=features.harakat;$("enable-madd").checked=features.madd;$("enable-words").checked=features.words;$("enable-quiz").checked=features.quiz}
function bind(){
 $("learning-mode").onclick=()=>setMode("learning");$("mini-cat-btn").onclick=speakCurrent;
 document.querySelectorAll(".tab").forEach(t=>t.onclick=()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.remove("active"));document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));t.classList.add("active");$(t.dataset.page).classList.add("active")});
 $("speak-number").onclick=()=>talk(numberWord(selectedNumber));$("speak-letter").onclick=()=>speakLearning(letters[selectedLetter][1]);$("speak-color").onclick=()=>talk(colors[selectedColor][0]);$("start-quiz").onclick=startQuiz;
 $("gear").onclick=()=>askAdult(openSettings);$("gate-ok").onclick=gateSubmit;$("gate-cancel").onclick=gateClose;$("gate-in").onkeydown=e=>{if(e.key==="Enter")gateSubmit()};$("pin-save").onclick=pinSave;$("pin-clear").onclick=pinClear;$("close-settings").onclick=()=>$("settings").hidden=true;
 $("settings-normal").onclick=()=>switchSettings("normal");$("settings-advanced").onclick=()=>switchSettings("advanced");  $("learning-volume-level").oninput=()=>{learningVolume=Number($("learning-volume-level").value);$("learning-volume-value").textContent=learningVolume+"%";localStorage.setItem(LEARNING_VOLUME_KEY,String(learningVolume));pushNativePrefs();};
 $("save-settings").onclick=()=>{let v=parseInt($("max-number").value,10);if(!Number.isFinite(v))v=20;v=Math.max(1,Math.min(1000,v));maxNumber=v;localStorage.setItem("systemVoice",$("system-voice").checked?"1":"0");localStorage.setItem("voiceSel",String(Math.max(0,Math.min(9,parseInt($("voice-id").value,10)||0))));localStorage.setItem(STEPS_KEY,String(parseInt($("tts-quality").value,10)||6));speechSpeed=Math.max(.6,Math.min(1.2,parseFloat($("speech-speed").value)||.9));features={harakat:$("enable-harakat").checked,madd:$("enable-madd").checked,words:$("enable-words").checked,quiz:$("enable-quiz").checked};localStorage.setItem(KEY,v);localStorage.setItem(SPEED_KEY,speechSpeed);localStorage.setItem(LEARNING_VOLUME_KEY,String(learningVolume));pushNativePrefs();schedulePrefetch();localStorage.setItem(FEATURE_KEY,JSON.stringify(features));renderNumbers();renderLetterLessons();$("settings").hidden=true;talk("تَمَّ حِفْظُ الإِعْدَادَات",.78)};
}
// ---- قفل الكبار: سؤال حسابي عشوائي، أو رمز سري يختاره الكبير. 3 أخطاء = قفل دقيقة ----
const PIN_KEY="parentPin";let gateOkFn=null,gateAns=0,gateBad=0,gateLockUntil=0;
function hashPin(p){let h=5381;for(const ch of String(p))h=((h<<5)+h+ch.charCodeAt(0))>>>0;return String(h)}
function getPin(){try{return localStorage.getItem(PIN_KEY)||""}catch(e){return ""}}
const toLatin=v=>String(v).replace(/[٠-٩]/g,d=>"٠١٢٣٤٥٦٧٨٩".indexOf(d)).trim();
function gateNew(){const inp=$("gate-in"),q=$("gate-q");inp.value="";
 if(getPin()){q.textContent="أدخل الرمز السري";inp.type="password";inp.placeholder="الرمز"}
 else{const a=7+Math.floor(Math.random()*3),b=13+Math.floor(Math.random()*7);gateAns=a*b;q.innerHTML='<span dir="ltr">'+a+" × "+b+" = ؟</span>";inp.type="text";inp.placeholder="الناتج"}}
function gateClose(){$("gate").hidden=true;gateOkFn=null;$("gate-in").value=""}
function askAdult(onOk){const left=Math.ceil((gateLockUntil-Date.now())/1000);
 $("gate").hidden=false;gateOkFn=onOk;
 if(left>0){$("gate-q").textContent="مقفل مؤقتًا";$("gate-msg").textContent="حاول بعد "+left+" ثانية";$("gate-in").disabled=true;$("gate-ok").disabled=true;return}
 $("gate-in").disabled=false;$("gate-ok").disabled=false;gateBad=0;$("gate-msg").textContent="";gateNew();setTimeout(()=>{try{$("gate-in").focus()}catch(e){}},60)}
function gateSubmit(){if(Date.now()<gateLockUntil)return;
 const v=toLatin($("gate-in").value),pin=getPin();
 const ok=pin?hashPin(v)===pin:(/^\d+$/.test(v)&&parseInt(v,10)===gateAns);
 if(ok){const f=gateOkFn;gateClose();gateBad=0;if(f)f();return}
 gateBad++;const box=$("gate").querySelector(".panel");box.classList.remove("gate-shake");void box.offsetWidth;box.classList.add("gate-shake");
 if(gateBad>=3){gateLockUntil=Date.now()+60000;gateBad=0;$("gate-in").disabled=true;$("gate-ok").disabled=true;$("gate-q").textContent="مقفل مؤقتًا";$("gate-msg").textContent="3 محاولات خاطئة. حاول بعد دقيقة.";return}
 $("gate-msg").textContent="إجابة غير صحيحة";gateNew()}
function pinSave(){const v=toLatin($("parent-pin").value);
 if(!/^\d{4,6}$/.test(v)){$("pin-msg").textContent="الرمز من 4 إلى 6 أرقام.";return}
 try{localStorage.setItem(PIN_KEY,hashPin(v))}catch(e){$("pin-msg").textContent="تعذّر الحفظ.";return}
 $("parent-pin").value="";$("pin-msg").textContent="تم حفظ الرمز. سيُطلب في كل مرة."}
function pinClear(){try{localStorage.removeItem(PIN_KEY)}catch(e){}$("parent-pin").value="";$("pin-msg").textContent="أُزيل الرمز. عاد السؤال الحسابي."}
function switchSettings(mode){["normal","advanced"].forEach(m=>{$("settings-"+m).classList.toggle("active",m===mode);$(m+"-settings").classList.toggle("active",m===mode)})}
window.onNativeToast=function(m){if(document.body.classList.contains("lessons-on"))showSpeech(m)};
function packStatus(p){try{const a=String(p).split("/"),d=+a[0],n=+a[1];let e=document.getElementById("pack-bar");if(!e){e=document.createElement("div");e.id="pack-bar";e.style.cssText="position:fixed;left:8px;right:8px;bottom:8px;z-index:50;background:#222d;color:#fff;border-radius:12px;padding:6px 10px;font:13px sans-serif;text-align:center;pointer-events:none;transition:opacity .6s";document.body.appendChild(e)}if(n>0&&d<n){e.style.opacity=1;e.textContent="🐱 جارٍ تجهيز أصوات القط… "+d+" / "+n}else{e.textContent="✓ اكتمل تجهيز الأصوات";setTimeout(()=>{e.style.opacity=0},2500)}}catch(x){}}
window.onNativeEvent=function(t,p){
 if(t==="packprog"){packStatus(p);return}
 if(t==="ttsready"){pushNativePrefs();schedulePrefetch();return}
 if(t==="speaking"){clearTimeout(talkDog);catSet("talk",p==="1");if(p==="1"){wake()}else{catOnce("happy",600)}}
 
};

// تطبيق فوري: كل تغيير في الإعدادات الصوتية يُحفَظ ويُرسَل للتطبيق مباشرة، ثم يمكن سماعه بزر «جرّب الصوت»
function applyLive(){
 speechSpeed=Math.max(.6,Math.min(1.2,parseFloat($("speech-speed").value)||.9));
 $("speech-speed-value").textContent=speechSpeed.toFixed(2);
  localStorage.setItem(SPEED_KEY,speechSpeed);
 localStorage.setItem("systemVoice",$("system-voice").checked?"1":"0");
 localStorage.setItem("voiceSel",String(Math.max(0,Math.min(9,parseInt($("voice-id").value,10)||0))));
 localStorage.setItem(STEPS_KEY,String(parseInt($("tts-quality").value,10)||6));
 pushNativePrefs();
}
["speech-speed","voice-id","tts-quality","system-voice"].forEach(id=>{const e=$(id);if(!e)return;
 const f=()=>{applyLive();if(id==="speech-speed"||id==="voice-id"||id==="tts-quality")schedulePrefetch()};
 e.addEventListener("input",f);e.addEventListener("change",f)});
// ---- زر «↺ افتراضي» تحت كل إعداد، وزر لإعادة الكل ----
const SET_DEF={"speech-speed":"0.9","voice-id":"9","tts-quality":"6","system-voice":false,"learning-volume-level":"100","max-number":"10","enable-harakat":false,"enable-madd":false,"enable-words":false,"enable-quiz":false};
function resetOne(id){const e=$(id);if(!e)return;if(e.type==="checkbox")e.checked=!!SET_DEF[id];else e.value=SET_DEF[id];e.dispatchEvent(new Event("input",{bubbles:true}));e.dispatchEvent(new Event("change",{bubbles:true}))}
Object.keys(SET_DEF).forEach(id=>{const e=$(id);if(!e)return;const lab=e.closest("label");if(!lab)return;const b=document.createElement("button");b.type="button";b.className="rst";b.textContent="↺ افتراضي";b.onclick=()=>resetOne(id);lab.insertAdjacentElement("afterend",b)});
$("reset-all").onclick=()=>{Object.keys(SET_DEF).forEach(resetOne);$("save-settings").onclick()};
$("test-voice").onclick=()=>{applyLive();talk("مَرْحَبًا أَنَا القِطُّ المُتَكَلِّم",speechSpeed)};
renderNumbers();renderLetters();renderColors();bind();bindCat($("cat2"));startIdle();setMode("learning",true);
})();
