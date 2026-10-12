/* games.js — وضع الألعاب كاملاً في ملف مستقل (حروف، أرقام، ألوان، مطابقة صور، ترتيب أرقام).
   يُحمَّل من index.html بعد app.js ولا يغيّر app.js ولا styles.css: يضيف زر «🎮 الألعاب» وصفحته وتنسيقه بنفسه.
   كل تعديل مستقبلي على الألعاب يكون في هذا الملف وحده. يُنطق المطلوب فقط، وعند الخطأ: «خَطَأ» ثم «أَعِدِ المُحَاوَلَة». */
(function(){
"use strict";
if(document.getElementById("games-mode")||document.getElementById("cg-mode"))return;
const $=id=>document.getElementById(id);
let speechSpeed=0.9,maxNumber=10;
function readPrefs(){
 speechSpeed=parseFloat(localStorage.getItem("speechSpeed")||"0.9");if(!isFinite(speechSpeed))speechSpeed=0.9;
 maxNumber=parseInt(localStorage.getItem("learningMaxNumber")||"10",10);if(!isFinite(maxNumber)||maxNumber<1)maxNumber=10;if(maxNumber>1000)maxNumber=1000;
}
readPrefs();
/* ----- بيانات ودوال منسوخة من app.js بنفس الصيغة ليتطابق النطق مع الحزمة المسبقة ----- */
const letters=[
 ["أ","أَلِف"],["ب","بَاء"],["ت","تَاء"],["ث","ثَاء"],["ج","جِيم"],["ح","حَاء"],["خ","خَاء"],["د","دَال"],["ذ","ذَال"],["ر","رَاء"],["ز","زَاي"],["س","سِين"],["ش","شِين"],["ص","صَاد"],["ض","ضَاد"],["ط","طَاء"],["ظ","ظَاء"],["ع","عَيْن"],["غ","غَيْن"],["ف","فَاء"],["ق","قَاف"],["ك","كَاف"],["ل","لَام"],["م","مِيم"],["ن","نُون"],["ه","هَاء"],["و","وَاو"],["ي","يَاء"]
];
const colors=[["أَحْمَر","#e74c3c"],["أَزْرَق","#3498db"],["أَصْفَر","#f1c40f"],["أَخْضَر","#2ecc71"],["بُرْتُقَالِي","#f39c12"],["بَنَفْسَجِي","#9b59b6"],["وَرْدِي","#ff7aa2"],["بُنِّي","#8b5a2b"],["أَسْوَد","#222"],["أَبْيَض","#fff"],["رَمَادِي","#95a5a6"],["ذَهَبِي","#d4ac0d"]];
function ones(n){return ["","وَاحِد","اِثْنَان","ثَلَاثَة","أَرْبَعَة","خَمْسَة","سِتَّة","سَبْعَة","ثَمَانِيَة","تِسْعَة"][n]}
function tens(n){return ["","عَشَرَة","عِشْرُون","ثَلَاثُون","أَرْبَعُون","خَمْسُون","سِتُّون","سَبْعُون","ثَمَانُون","تِسْعُون"][n]}
function numberWord(n){if(n<10)return ones(n);if(n===10)return "عَشَرَة";if(n===11)return "أَحَدَ عَشَر";if(n===12)return "اِثْنَا عَشَر";if(n<20)return ones(n-10)+"َ عَشَر";if(n<100){let u=n%10,t=Math.floor(n/10);return u?ones(u)+" وَ"+tens(t):tens(t)}if(n===100)return "مِئَة";if(n<200)return "مِئَة وَ"+numberWord(n-100);if(n<1000){let h=Math.floor(n/100),r=n%100,hw=["","","مِئَتَان","ثَلَاثُمِئَة","أَرْبَعُمِئَة","خَمْسُمِئَة","سِتُّمِئَة","سَبْعُمِئَة","ثَمَانِمِئَة","تِسْعُمِئَة"][h];return r?hw+" وَ"+numberWord(r):hw}if(n===1000)return "أَلْف";return String(n)}
const spd=k=>Math.max(.6,Math.min(1.2,speechSpeed*k));
function learnArgs(text){
 const t=String(text||"");
 if(/^[ء-ي][َُِْ]$/.test(t))return[t,spd(.8)];
 if(/^[ء-ي][اوي]$/.test(t))return[t,spd(.84)];
 return[t,spd(.91)];
}
const lessonWords=[
 ["أَسَد","🦁"],["بَقَرَة","🐄"],["تَمْر","svg:tamr"],["ثَعْلَب","🦊"],["جَمَل","🐪"],["حِصَان","🐎"],["خَرُوف","🐑"],["دُبّ","svg:bear"],["ذُرَة","🌽"],["رُمَّان","svg:rumman"],
 ["زَرَافَة","🦒"],["سَمَكَة","🐟"],["شَمْس","🌞"],["صَارُوخ","🚀"],["ضِفْدَع","🐸"],["طَائِر","🐦"],["ظَرْف","\u2709\uFE0F"],["عِنَب","🍇"],["غَيْمَة","\u2601\uFE0F"],["فِيل","🐘"],
 ["قِطَّة","🐈"],["كَلْب","🐕"],["لَيْمُون","🍋"],["مَوْز","🍌"],["نَحْلَة","🐝"],["هِلَال","🌙"],["وَرْدَة","🌹"],["يَد","✋"]
];
const LS_SVG={
 tamr:"<svg viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg' aria-hidden='true'><defs><radialGradient id='tm1' cx='.35' cy='.28' r='.9'><stop offset='0' stop-color='#e0924f'/><stop offset='.45' stop-color='#a24e1e'/><stop offset='1' stop-color='#4a1e09'/></radialGradient></defs><path d='M8 46Q60 -8 112 46' fill='none' stroke='#2e7d32' stroke-width='3.5' stroke-linecap='round'/><ellipse cx='18.4' cy='36.3' rx='8.2' ry='2.6' transform='rotate(18 18.4 36.3) translate(8.2 0)' fill='#43a047'/><ellipse cx='18.4' cy='36.3' rx='8.2' ry='2.6' transform='rotate(-98 18.4 36.3) translate(8.2 0)' fill='#43a047'/><ellipse cx='28.8' cy='28.7' rx='8.9' ry='2.6' transform='rotate(26 28.8 28.7) translate(8.9 0)' fill='#43a047'/><ellipse cx='28.8' cy='28.7' rx='8.9' ry='2.6' transform='rotate(-90 28.8 28.7) translate(8.9 0)' fill='#43a047'/><ellipse cx='39.2' cy='23.3' rx='9.6' ry='2.6' transform='rotate(35 39.2 23.3) translate(9.6 0)' fill='#43a047'/><ellipse cx='39.2' cy='23.3' rx='9.6' ry='2.6' transform='rotate(-81 39.2 23.3) translate(9.6 0)' fill='#43a047'/><ellipse cx='49.6' cy='20.1' rx='10.3' ry='2.6' transform='rotate(46 49.6 20.1) translate(10.3 0)' fill='#43a047'/><ellipse cx='49.6' cy='20.1' rx='10.3' ry='2.6' transform='rotate(-70 49.6 20.1) translate(10.3 0)' fill='#43a047'/><ellipse cx='60.0' cy='19.0' rx='11.0' ry='2.6' transform='rotate(58 60.0 19.0) translate(11.0 0)' fill='#43a047'/><ellipse cx='60.0' cy='19.0' rx='11.0' ry='2.6' transform='rotate(-58 60.0 19.0) translate(11.0 0)' fill='#43a047'/><ellipse cx='70.4' cy='20.1' rx='10.3' ry='2.6' transform='rotate(70 70.4 20.1) translate(10.3 0)' fill='#43a047'/><ellipse cx='70.4' cy='20.1' rx='10.3' ry='2.6' transform='rotate(-46 70.4 20.1) translate(10.3 0)' fill='#43a047'/><ellipse cx='80.8' cy='23.3' rx='9.6' ry='2.6' transform='rotate(81 80.8 23.3) translate(9.6 0)' fill='#43a047'/><ellipse cx='80.8' cy='23.3' rx='9.6' ry='2.6' transform='rotate(-35 80.8 23.3) translate(9.6 0)' fill='#43a047'/><ellipse cx='91.2' cy='28.7' rx='8.9' ry='2.6' transform='rotate(90 91.2 28.7) translate(8.9 0)' fill='#43a047'/><ellipse cx='91.2' cy='28.7' rx='8.9' ry='2.6' transform='rotate(-26 91.2 28.7) translate(8.9 0)' fill='#43a047'/><ellipse cx='101.6' cy='36.3' rx='8.2' ry='2.6' transform='rotate(98 101.6 36.3) translate(8.2 0)' fill='#43a047'/><ellipse cx='101.6' cy='36.3' rx='8.2' ry='2.6' transform='rotate(-18 101.6 36.3) translate(8.2 0)' fill='#43a047'/><g stroke='#6b4a1f' stroke-width='2.4' stroke-linecap='round' fill='none'><path d='M60 15L60 30'/><path d='M60 30L36 58'/><path d='M60 30L60 62'/><path d='M60 30L84 58'/></g><g transform='rotate(14 36 60)'><path d='M36 60C50 60 53 82 52 92C50 108 44 116 36 116C28 116 22 108 20 92C19 82 22 60 36 60Z' fill='url(#tm1)' stroke='#2a1105' stroke-width='2.6'/><path d='M27 80Q36 76 45 80M25 94Q36 90 47 94M27 106Q36 102 45 106' fill='none' stroke='#2a1105' stroke-opacity='.28' stroke-width='1.6' stroke-linecap='round'/><ellipse cx='29' cy='80' rx='2.6' ry='9' fill='#fff' fill-opacity='.32'/><path d='M31 61Q36 55 41 61L39.5 66Q36 63 32.5 66Z' fill='#6b4a1f' stroke='#2a1105' stroke-width='1.6' stroke-linejoin='round'/></g><g transform='rotate(-14 84 60)'><path d='M84 60C98 60 101 82 100 92C98 108 92 116 84 116C76 116 70 108 68 92C67 82 70 60 84 60Z' fill='url(#tm1)' stroke='#2a1105' stroke-width='2.6'/><path d='M75 80Q84 76 93 80M73 94Q84 90 95 94M75 106Q84 102 93 106' fill='none' stroke='#2a1105' stroke-opacity='.28' stroke-width='1.6' stroke-linecap='round'/><ellipse cx='77' cy='80' rx='2.6' ry='9' fill='#fff' fill-opacity='.32'/><path d='M79 61Q84 55 89 61L87.5 66Q84 63 80.5 66Z' fill='#6b4a1f' stroke='#2a1105' stroke-width='1.6' stroke-linejoin='round'/></g><g transform='rotate(0 60 66)'><path d='M60 66C74 66 77 88 76 98C74 114 68 122 60 122C52 122 46 114 44 98C43 88 46 66 60 66Z' fill='url(#tm1)' stroke='#2a1105' stroke-width='2.6'/><path d='M51 86Q60 82 69 86M49 100Q60 96 71 100M51 112Q60 108 69 112' fill='none' stroke='#2a1105' stroke-opacity='.28' stroke-width='1.6' stroke-linecap='round'/><ellipse cx='53' cy='86' rx='2.6' ry='9' fill='#fff' fill-opacity='.32'/><path d='M55 67Q60 61 65 67L63.5 72Q60 69 56.5 72Z' fill='#6b4a1f' stroke='#2a1105' stroke-width='1.6' stroke-linejoin='round'/></g></svg>",
 rumman:"<svg viewBox=\"0 0 120 120\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><defs><radialGradient id=\"rr\" cx=\".4\" cy=\".3\" r=\".9\"><stop offset=\"0\" stop-color=\"#ee5a4f\"/><stop offset=\".7\" stop-color=\"#b8182a\"/><stop offset=\"1\" stop-color=\"#7d0f1d\"/></radialGradient></defs>\n<path d=\"M44 20L50 6L57 17L64 4L71 17L78 6L84 20Z\" fill=\"#9c1426\" stroke=\"#6e0b17\" stroke-width=\"2\" stroke-linejoin=\"round\"/>\n<circle cx=\"60\" cy=\"66\" r=\"46\" fill=\"url(#rr)\" stroke=\"#6e0b17\" stroke-width=\"3\"/>\n<circle cx=\"60\" cy=\"66\" r=\"40\" fill=\"#fff0cf\"/>\n<path d=\"M60 26V106M20 66H100M32 38L88 94M88 38L32 94\" stroke=\"#f1d6a0\" stroke-width=\"3\"/>\n<ellipse cx=\"90.0\" cy=\"66.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(90 90.0 66.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"88.5\" cy=\"63.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"86.0\" cy=\"81.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(120 86.0 81.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"84.5\" cy=\"78.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"75.0\" cy=\"92.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(150 75.0 92.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"73.5\" cy=\"89.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"60.0\" cy=\"96.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(180 60.0 96.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"58.5\" cy=\"93.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"45.0\" cy=\"92.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(210 45.0 92.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"43.5\" cy=\"89.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"34.0\" cy=\"81.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(240 34.0 81.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"32.5\" cy=\"78.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"30.0\" cy=\"66.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(270 30.0 66.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"28.5\" cy=\"63.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"34.0\" cy=\"51.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(300 34.0 51.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"32.5\" cy=\"48.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"45.0\" cy=\"40.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(330 45.0 40.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"43.5\" cy=\"37.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"60.0\" cy=\"36.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(360 60.0 36.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"58.5\" cy=\"33.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"75.0\" cy=\"40.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(390 75.0 40.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"73.5\" cy=\"37.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"86.0\" cy=\"51.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(420 86.0 51.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"84.5\" cy=\"48.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"77.5\" cy=\"73.4\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(113 77.5 73.4)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"76.0\" cy=\"71.2\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"67.1\" cy=\"83.6\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(158 67.1 83.6)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"65.6\" cy=\"81.4\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"52.6\" cy=\"83.5\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(203 52.6 83.5)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"51.1\" cy=\"81.3\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"42.4\" cy=\"73.1\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(248 42.4 73.1)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"40.9\" cy=\"70.9\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"42.5\" cy=\"58.6\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(293 42.5 58.6)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"41.0\" cy=\"56.4\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"52.9\" cy=\"48.4\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(338 52.9 48.4)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"51.4\" cy=\"46.2\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"67.4\" cy=\"48.5\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(383 67.4 48.5)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"65.9\" cy=\"46.3\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"77.6\" cy=\"58.9\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(428 77.6 58.9)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"76.1\" cy=\"56.7\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"65.6\" cy=\"71.7\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(136 65.6 71.7)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"64.1\" cy=\"69.5\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"52.2\" cy=\"68.0\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(256 52.2 68.0)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"50.7\" cy=\"65.8\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/><ellipse cx=\"62.2\" cy=\"58.3\" rx=\"6.2\" ry=\"7.4\" transform=\"rotate(376 62.2 58.3)\" fill=\"#c4122b\" stroke=\"#7a0a1a\" stroke-width=\"1.3\"/><ellipse cx=\"60.7\" cy=\"56.1\" rx=\"1.8\" ry=\"2.6\" fill=\"#fff\" fill-opacity=\".55\"/></svg>",
 bear:"<svg viewBox=\"0 0 120 120\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><g fill=\"#8a5a33\" stroke=\"#4e2f16\" stroke-width=\"3\"><circle cx=\"38\" cy=\"22\" r=\"11\"/><circle cx=\"82\" cy=\"22\" r=\"11\"/><ellipse cx=\"26\" cy=\"68\" rx=\"11\" ry=\"20\" transform=\"rotate(18 26 68)\"/><ellipse cx=\"94\" cy=\"68\" rx=\"11\" ry=\"20\" transform=\"rotate(-18 94 68)\"/><ellipse cx=\"60\" cy=\"76\" rx=\"30\" ry=\"32\"/><ellipse cx=\"42\" cy=\"108\" rx=\"15\" ry=\"10\"/><ellipse cx=\"78\" cy=\"108\" rx=\"15\" ry=\"10\"/><circle cx=\"60\" cy=\"40\" r=\"26\"/></g><circle cx=\"38\" cy=\"22\" r=\"5\" fill=\"#e8a98a\"/><circle cx=\"82\" cy=\"22\" r=\"5\" fill=\"#e8a98a\"/><ellipse cx=\"60\" cy=\"80\" rx=\"18\" ry=\"22\" fill=\"#e8c9a0\"/><ellipse cx=\"60\" cy=\"48\" rx=\"13\" ry=\"10\" fill=\"#e8c9a0\"/><circle cx=\"50\" cy=\"36\" r=\"3.5\" fill=\"#222\"/><circle cx=\"70\" cy=\"36\" r=\"3.5\" fill=\"#222\"/><ellipse cx=\"60\" cy=\"44\" rx=\"5\" ry=\"3.5\" fill=\"#222\"/><path d=\"M60 47V51M54 52Q60 56 66 52\" stroke=\"#222\" stroke-width=\"2\" fill=\"none\" stroke-linecap=\"round\"/><ellipse cx=\"42\" cy=\"108\" rx=\"8\" ry=\"5\" fill=\"#e8c9a0\"/><ellipse cx=\"78\" cy=\"108\" rx=\"8\" ry=\"5\" fill=\"#e8c9a0\"/></svg>"
};
const lsPic=p=>p.indexOf("svg:")===0?LS_SVG[p.slice(4)]:'<span class="ls-emoji">'+p+'</span>';
const LS_SAY={"نَحْلَة":"نَحْلَه"};
function lsArgs(i,kind){const n=letters[i][1],w=LS_SAY[lessonWords[i][0]]||lessonWords[i][0];return learnArgs(kind==="word"?w:kind==="name"?n:n+"، "+w)}
function talk(text,speed){if(window.TomNative&&TomNative.say)TomNative.say(text,Number(speed||speechSpeed),0)}
function speakLearning(text){const a=learnArgs(text);talk(a[0],a[1])}
/* ----- الواجهة: تُحقن في الصفحة ----- */
const CSS="\n.mode-switch{grid-template-columns:repeat(3,minmax(0,1fr))}\n.gm-wrap{padding-bottom:24px}\n.gm-menu{display:grid;gap:14px}\n.gm-card{border:0;border-radius:26px;padding:20px 18px;display:flex;align-items:center;gap:16px;font-size:24px;font-weight:900;color:#fff;box-shadow:0 6px 0 #0002;text-align:right}\n.gm-ico{font-size:46px}\n.gm-letters{background:#f08a5d}.gm-numbers{background:#4a9ff5}.gm-colors{background:#8e6fe0}.gm-match{background:#2fb59b}.gm-order{background:#e05a8a}\n.gm-stage{display:grid;gap:14px;justify-items:center;position:relative}\n.gm-top{display:flex;width:100%;align-items:center;justify-content:space-between}\n.gm-back{border:0;border-radius:14px;background:#fff;color:#594536;font-size:22px;font-weight:900;padding:8px 16px;box-shadow:0 3px 0 #0002}\n.gm-stars{font-size:17px;letter-spacing:1px;direction:ltr}\n.gm-prompt{min-height:70px;font-size:44px;display:flex;flex-wrap:wrap;gap:4px;justify-content:center;align-items:center;text-align:center;line-height:1.2;color:#594536}\n.gm-hear{border:0;width:92px;height:92px;border-radius:50%;font-size:42px;background:#f3a044;color:#fff;box-shadow:0 6px 0 #c9791c}\n.gm-hear:active{transform:scale(.94)}\n.gm-options{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;width:100%}\n.gm-opt{border:0;border-radius:26px;min-height:112px;font-size:58px;font-weight:900;background:#fff;color:#c4552d;box-shadow:0 6px 0 #0002;transition:transform .15s}\n.gm-opt:active{transform:scale(.95)}\n.gm-num{color:#1f6fc4}\n.gm-color{border:6px solid #0002;box-shadow:0 6px 0 #0003}\n.gm-pic{display:flex;align-items:center;justify-content:center;padding:6px}\n.gm-pic .ls-emoji{font-size:68px;line-height:1}\n.gm-pic svg{width:86px;height:86px}\n.gm-bigpic .ls-emoji{font-size:92px;line-height:1}\n.gm-bigpic svg{width:116px;height:116px}\n.gm-right{background:#7ed957!important;color:#fff;animation:gmPop .5s}\n.gm-wrong{animation:gmShake .4s;opacity:.45}\n.gm-hint{animation:gmPulse .8s infinite}\n@keyframes gmPop{0%{transform:scale(1)}50%{transform:scale(1.15)}100%{transform:scale(1)}}\n@keyframes gmShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-10px)}75%{transform:translateX(10px)}}\n@keyframes gmPulse{50%{transform:scale(1.07);box-shadow:0 0 0 10px #7ed95766}}\n.gm-end{text-align:center;padding:12px 0}\n.gm-trophy{font-size:100px}\n.gm-score{font-size:30px;font-weight:900;margin:8px 0 16px;color:#594536}\n.gm-fx{position:absolute;inset:0;pointer-events:none;overflow:hidden}\n.gm-fx b{position:absolute;font-size:30px;animation:gmUp 1.3s ease-out forwards}\n@keyframes gmUp{from{transform:translateY(0);opacity:1}to{transform:translateY(-170px);opacity:0}}\n";
const st=document.createElement("style");st.id="cg-style";st.textContent=CSS;document.head.appendChild(st);
const sw=document.querySelector(".mode-switch"),mainEl=document.querySelector("main.app")||document.body;
const btn=document.createElement("button");btn.id="cg-mode";btn.className="mode";btn.textContent="🎮 الألعاب";sw.appendChild(btn);
const sec=document.createElement("section");sec.id="cg-games";sec.className="mode-page";sec.innerHTML="<div class=\"gm-wrap\">\n<div id=\"gm-menu\" class=\"gm-menu\"><button class=\"gm-card gm-letters\" data-game=\"letters\"><span class=\"gm-ico\">🔤</span><span>لعبة الحروف</span></button><button class=\"gm-card gm-numbers\" data-game=\"numbers\"><span class=\"gm-ico\">🔢</span><span>لعبة الأرقام</span></button><button class=\"gm-card gm-colors\" data-game=\"colors\"><span class=\"gm-ico\">🎨</span><span>لعبة الألوان</span></button><button class=\"gm-card gm-match\" data-game=\"match\"><span class=\"gm-ico\">🖼️</span><span>مطابقة الصور</span></button><button class=\"gm-card gm-order\" data-game=\"order\"><span class=\"gm-ico\">📶</span><span>ترتيب الأرقام</span></button></div>\n<div id=\"gm-stage\" class=\"gm-stage\" hidden><div id=\"gm-fx\" class=\"gm-fx\"></div><div class=\"gm-top\"><button id=\"gm-back\" class=\"gm-back\" aria-label=\"رجوع\">→</button><div id=\"gm-stars\" class=\"gm-stars\"></div></div><div id=\"gm-prompt\" class=\"gm-prompt\"></div><button id=\"gm-hear\" class=\"gm-hear\" aria-label=\"اسمع\">🔊</button><div id=\"gm-options\" class=\"gm-options\"></div><div id=\"gm-end\" class=\"gm-end\" hidden><div id=\"gm-trophy\" class=\"gm-trophy\">🏆</div><div id=\"gm-score\" class=\"gm-score\"></div><button id=\"gm-again\" class=\"speak\">🔄 العب مرة أخرى</button></div></div>\n</div>";mainEl.appendChild(sec);

const GM_ROUNDS=10,GM_PRAISE=["أَحْسَنْتَ","مُمْتَاز","رَائِع"],GM_WRONG=["خَطَأ","أَعِدِ المُحَاوَلَة"],GM_OBJ=["🍎","⭐","🐟","🎈","🦋","🍓","🚗","🌼","🐥","⚽"];
let gm=null;
const rnd=n=>Math.floor(Math.random()*n);
function gmWrong(n){return GM_WRONG[n<=1?0:1]}
function gmPick(n,count,not){const s=new Set();if(not!=null)s.add(not);const out=[];while(out.length<count&&s.size<n){const r=rnd(n);if(!s.has(r)){s.add(r);out.push(r)}}return out}
function gmShuffle(a){return a.sort(()=>Math.random()-.5)}
function gmShow(menu){$("gm-menu").hidden=!menu;$("gm-stage").hidden=menu}
function gmStars(){const b=$("gm-stars");b.textContent="";for(let i=0;i<GM_ROUNDS;i++){b.textContent+=i<gm.score?"⭐":"☆"}}
function gmBurst(list){const fx=$("gm-fx");for(let i=0;i<6;i++){const e=document.createElement("b");e.textContent=list[i%list.length];e.style.left=(10+Math.random()*80)+"%";e.style.top=(45+Math.random()*30)+"%";e.style.animationDelay=(i*80)+"ms";fx.appendChild(e);setTimeout(()=>e.remove(),1500)}}
function gmStart(kind){readPrefs();gm={kind:kind,round:0,score:0,last:-1,locked:false,tries:0,t:0,count:false,dir:"",pos:0,sorted:[]};gmShow(false);$("gm-end").hidden=true;$("gm-options").hidden=false;$("gm-prompt").hidden=false;gmStars();gmNext()}
function gmSpeak(){
 if(!gm||gm.count)return;const k=gm.kind;
 if(k==="letters")speakLearning(letters[gm.t][1]);
 else if(k==="colors")talk(colors[gm.t][0],speechSpeed);
 else if(k==="match"){if(gm.dir==="pic")speakLearning(letters[gm.t][1]);else{const a=lsArgs(gm.t,"word");talk(a[0],a[1])}}
 else talk(numberWord(gm.t),speechSpeed)
}
function gmNext(){
 if(!gm)return;
 if(gm.round>=GM_ROUNDS){gmFinish();return}
 gm.tries=0;gm.locked=false;gm.count=false;gm.pos=0;
 const op=$("gm-options"),pr=$("gm-prompt"),hear=$("gm-hear");op.textContent="";pr.textContent="";pr.style.fontSize="";pr.classList.remove("gm-bigpic");hear.hidden=false;
 const opts=[];let t;
 if(gm.kind==="letters"){
  const n=letters.length;do{t=rnd(n)}while(t===gm.last&&n>1);gm.last=t;gm.t=t;
  gmShuffle([t].concat(gmPick(n,3,t))).forEach(i=>opts.push({id:i,text:letters[i][0],cls:"gm-letter"}));
 }else if(gm.kind==="colors"){
  const n=colors.length;do{t=rnd(n)}while(t===gm.last&&n>1);gm.last=t;gm.t=t;
  gmShuffle([t].concat(gmPick(n,3,t))).forEach(i=>opts.push({id:i,color:colors[i][1],label:colors[i][0],cls:"gm-color"}));
 }else if(gm.kind==="match"){
  const n=letters.length;do{t=rnd(n)}while(t===gm.last&&n>1);gm.last=t;gm.t=t;
  gm.dir=(gm.round%2===0)?"pic":"letter";
  const ids=gmShuffle([t].concat(gmPick(n,3,t)));
  if(gm.dir==="pic"){pr.textContent=letters[t][0];pr.style.fontSize="84px";ids.forEach(i=>opts.push({id:i,html:lsPic(lessonWords[i][1]),cls:"gm-pic"}))}
  else{pr.innerHTML=lsPic(lessonWords[t][1]);pr.classList.add("gm-bigpic");ids.forEach(i=>opts.push({id:i,text:letters[i][0],cls:"gm-letter"}))}
 }else if(gm.kind==="order"){
  const N=Math.max(5,Math.min(maxNumber,20));gm.count=true;hear.hidden=true;
  const nums=gmPick(N,4).map(x=>x+1);gm.sorted=nums.slice().sort((a,b)=>a-b);
  pr.textContent="من الأصغر إلى الأكبر";pr.style.fontSize="17px";
  gmShuffle(nums.slice()).forEach(i=>opts.push({id:i,text:String(i),cls:"gm-num",order:true}));
 }else{
  const N=Math.max(5,Math.min(maxNumber,20));gm.count=(gm.round%2===1);
  const top=gm.count?Math.min(N,10):N;do{t=1+rnd(top)}while(t===gm.last&&top>1);gm.last=t;gm.t=t;
  gmShuffle([t].concat(gmPick(N,3,t-1).map(x=>x+1))).forEach(i=>opts.push({id:i,text:String(i),cls:"gm-num"}));
  if(gm.count){hear.hidden=true;const o=GM_OBJ[rnd(GM_OBJ.length)];pr.textContent=Array(t+1).join(o)}
 }
 opts.forEach(o=>{const b=document.createElement("button");b.className="gm-opt "+o.cls;if(o.color){b.style.background=o.color;b.setAttribute("aria-label",o.label)}else if(o.html)b.innerHTML=o.html;else b.textContent=o.text;
  if(o.order){b.dataset.v=String(o.id);b.onclick=()=>gmOrder(b,o.id)}
  else{if(o.id===gm.t)b.dataset.ok="1";b.onclick=()=>gmAnswer(b,o.id===gm.t)}
  op.appendChild(b)});
 if(!gm.count)setTimeout(gmSpeak,350);
}
function gmWrongTap(btn){gm.tries++;btn.classList.add("gm-wrong");talk(gmWrong(gm.tries),0.72)}
function gmDone(){gm.locked=true;if(gm.tries===0)gm.score++;gmStars();gmBurst(["⭐","✨","🎉"]);gm.round++;setTimeout(gmNext,1800)}
function gmAnswer(btn,ok){
 if(!gm||gm.locked||btn.disabled)return;
 if(ok){
  btn.classList.add("gm-right");
  if(gm.kind==="match"){if(gm.dir==="pic"){const a=lsArgs(gm.t,"word");talk(a[0],a[1])}else speakLearning(letters[gm.t][1])}
  else if(gm.count)talk(numberWord(gm.t),speechSpeed);
  else talk(GM_PRAISE[rnd(GM_PRAISE.length)],0.72);
  gmDone();
 }else{
  btn.disabled=true;gmWrongTap(btn);
  if(gm.tries>=2){const k=[].slice.call($("gm-options").children).find(x=>x.dataset.ok==="1");if(k)k.classList.add("gm-hint")}
 }
}
function gmOrder(btn,v){
 if(!gm||gm.locked||btn.disabled)return;
 if(v===gm.sorted[gm.pos]){
  btn.classList.add("gm-right");btn.disabled=true;talk(numberWord(v),speechSpeed);gm.pos++;
  if(gm.pos>=gm.sorted.length)gmDone();
 }else{
  gmWrongTap(btn);
  if(gm.tries>=2){const k=[].slice.call($("gm-options").children).find(x=>x.dataset.v===String(gm.sorted[gm.pos]));if(k)k.classList.add("gm-hint")}
 }
}
function gmFinish(){
 $("gm-options").hidden=true;$("gm-prompt").hidden=true;$("gm-hear").hidden=true;$("gm-end").hidden=false;
 $("gm-trophy").textContent=gm.score>=8?"🏆":(gm.score>=5?"🎉":"💪");$("gm-score").textContent="⭐ "+gm.score+" / "+GM_ROUNDS;
 gmBurst(["🎉","⭐","✨","🎈"]);talk(GM_PRAISE[0],0.72);
}

function openGames(){
 [].slice.call(document.querySelectorAll(".mode-page")).forEach(p=>p.classList.remove("active"));
 [].slice.call(document.querySelectorAll(".mode-switch .mode")).forEach(b=>b.classList.remove("active"));
 sec.classList.add("active");btn.classList.add("active");
 const s=$("subtitle");if(s)s.textContent="نلعب ونتعلّم";
 gm=null;gmShow(true);
}
function leaveGames(){sec.classList.remove("active");btn.classList.remove("active");gm=null}
btn.onclick=openGames;
["learning-mode","lessons-mode"].forEach(id=>{const b=$(id);if(b)b.addEventListener("click",leaveGames)});
[].slice.call(sec.querySelectorAll(".gm-card")).forEach(c=>{c.onclick=()=>gmStart(c.dataset.game)});
$("gm-back").onclick=()=>{gm=null;gmShow(true)};
$("gm-hear").onclick=gmSpeak;
$("gm-again").onclick=()=>gmStart(gm?gm.kind:"letters");
gmShow(true);
})();
