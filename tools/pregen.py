#!/usr/bin/env python3
"""
يولّد مسبقًا أصوات كل الحروف والحركات والمدود والكلمات والألوان والأرقام (1..1000) من tools/lessons.json
لكل الأصوات العشرة (0..9) بجودة عالية، ويضغطها بصيغة m4a (AAC) ويضعها في app/src/main/assets/tts-pre/v<رقم>/
فتدخل داخل الـ APK وتُنطق فورًا من أول ضغطة بأي صوت يختاره المستخدم، بلا تجهيز على الجهاز.
يعمل تلقائيًا أثناء البناء من fetch-engine.sh، ويُستأنف إن انقطع (يتخطى ما تم توليده).
التحقّق من صحة النطق: كل عنصر يُولَّد حتى 6 محاولات (النموذج عشوائي: قد يخطئ في محاولة وينجح في أخرى)،
ويُنسَخ كل مقطع إلى نص بنموذج Whisper ويُقارَن بالنص المطلوب (والأرقام بقيمتها)، ويُختار المقطع الصحيح.
العناصر التي لم تجتز التحقق تُسجَّل في pack-report.txt لمراجعتها.
الاستعمال اليدوي:  python3 tools/pregen.py --steps 8 --voices 0,9 --jobs 2
"""
import argparse, difflib, json, os, re, shutil, subprocess, sys, time, unicodedata
import numpy as np
from multiprocessing import get_context

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)
ap = argparse.ArgumentParser()
ap.add_argument("--model", default=os.path.join(root, "app/src/main/assets/models/tts-ar"))
ap.add_argument("--out", default=os.path.join(root, "app/src/main/assets/tts-pre"))
ap.add_argument("--voices", default="0,1,2,3,4,5,6,7,8,9")
ap.add_argument("--steps", type=int, default=8)
ap.add_argument("--jobs", type=int, default=os.cpu_count() or 2)
ap.add_argument("--bitrate", default="48k")
ap.add_argument("--budget-min", type=float, default=0, help="أقصى مدة بالدقائق في هذه الدورة (0 = بلا حد)")
ap.add_argument("--start", type=int, default=0, help="للتجربة فقط")
ap.add_argument("--limit", type=int, default=0, help="للتجربة فقط")
ap.add_argument("--asr-dir", default=os.path.join(os.environ.get("CAT_CACHE") or os.path.expanduser("~/.cache/talking-cat-engine"), "whisper-small"))
ap.add_argument("--tries", type=int, default=6, help="أقصى محاولات لكل عنصر")
ap.add_argument("--accept", type=float, default=0.92, help="أدنى درجة تشابه لقبول المقطع")
ap.add_argument("--report", default=os.path.join(root, "pack-report.txt"))
a = ap.parse_args()

FF = shutil.which("ffmpeg")
if not FF:
    import imageio_ffmpeg
    FF = imageio_ffmpeg.get_ffmpeg_exe()

def clean(t):  # نفس clean() في EchoEngine.java
    t = "".join(" " if unicodedata.category(c) in ("So", "Cs", "Cn") else c for c in t)
    t = t.replace("\u0640", "")
    t = re.sub(r'["«»()\[\]*_#]', " ", t)
    return re.sub(r"\s+", " ", t).strip()

def trim(s, sr):  # نفس trim() في EchoEngine.java
    pk = float(np.abs(s).max()) if len(s) else 0
    if pk < 1e-4: return s
    th = max(0.012 * pk, 1e-4)
    idx = np.where(np.abs(s) >= th)[0]
    f = max(0, int(idx[0]) - sr * 100 // 1000); t = min(len(s), int(idx[-1]) + 1 + sr * 260 // 1000)
    return s[f:t] if t - f >= 16 else s

_DIAC = re.compile("[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]")
def norm(t):
    t = _DIAC.sub("", t)
    for x, y in (("أ", "ا"), ("إ", "ا"), ("آ", "ا"), ("ٱ", "ا"), ("ى", "ي"), ("ة", "ه"), ("ؤ", "و"), ("ئ", "ي")):
        t = t.replace(x, y)
    t = t.translate(str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789"))
    t = re.sub(r"[^\u0621-\u064A0-9 ]", " ", t)
    t = re.sub(r"[اه](?=\s|$)", "ه", t)
    return re.sub(r"\s+", " ", t).strip()

def variants(c, num):
    """الأرقام والكلمات المفردة (أسماء الحروف وكلمات الصور): النموذج ينطق أحيانًا أوضح بلا سكون أو بلا تشكيل،
    فنجرّب الصيغ الثلاث ونختار ما يسمعه التحقق صحيحًا. عبارات «حرف أَ، كرر» و«مد:» تبقى بتشكيلها الكامل."""
    single = (" " not in c) and (":" not in c) and ("،" not in c) and not c.startswith("حرف") and not c.startswith("مد")
    if num is None and not single: return [c]
    nodiac = re.sub("[\u064B-\u065F\u0670]", "", c)
    nosukun = c.replace("\u0652", "")
    return [c, nodiac, nosukun]

# مقاطع الحرف مع الحركة أو المد (بَ، بِ، بُ، بْ، با، بو، بي): يُنطق المقطع وحده بلا أي تعليمات.
# النموذج ينطق المقطع المنفرد بشكل رديء، فنولّد جملة حاملة ثم نقتطع آخر مقطع منها فقط.
SYL = re.compile("^[\u0621-\u064A][\u064E\u064F\u0650\u0652\u0627\u0648\u064A]$")
def carrier(c): return f"حرف {c}، كرر: {c}" if c[1] in "\u064E\u064F\u0650\u0652" else f"مد: {c}"

def cut_last(s, sr, gap_ms=90):
    fr = int(sr * 0.01); n = len(s) // fr
    if n < 5: return s, False
    e = np.sqrt((s[:n * fr].reshape(n, fr) ** 2).mean(axis=1))
    act = e > max(float(e.max()) * 0.03, 1e-4)
    idx = np.where(act)[0]
    if len(idx) == 0: return s, False
    end = int(idx[-1]); start = end; gap = 0; k = end
    while k >= 0:
        if act[k]: start = k; gap = 0
        else:
            gap += 1
            if gap * 10 >= gap_ms: break
        k -= 1
    a = max(0, start * fr - int(sr * 0.04)); b = min(len(s), (end + 1) * fr + int(sr * 0.12))
    seg = s[a:b].copy(); f = int(sr * 0.006)
    if len(seg) > 2 * f: seg[:f] *= np.linspace(0, 1, f).astype(np.float32); seg[-f:] *= np.linspace(1, 0, f).astype(np.float32)
    return seg, (0.12 <= (end + 1 - start) * 0.01 <= 1.2)

def score(expected, n, got):
    g = norm(got).replace(" ", "")
    if n is not None and g.isdigit(): return 1.0 if int(g) == n else 0.0
    e = norm(expected).replace(" ", "")
    if not e or not g: return 0.0
    return difflib.SequenceMatcher(None, e, g).ratio()

items = json.load(open(os.path.join(here, "lessons.json"), encoding="utf-8"))
if a.start or a.limit: items = items[a.start:(a.start + a.limit) if a.limit else None]
T0 = time.time()
DEADLINE = T0 + a.budget_min * 60 if a.budget_min else 0

def encode(pcm, path):
    subprocess.run([FF, "-y", "-loglevel", "error", "-f", "s16le", "-ar", "22050", "-ac", "1", "-i", "-",
                    "-c:a", "aac", "-b:a", a.bitrate, "-movflags", "+faststart", path], input=pcm, check=True)

def work(voice):
    import sherpa_onnx
    from scipy.signal import resample_poly
    d = a.model
    cfg = sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
        supertonic=sherpa_onnx.OfflineTtsSupertonicModelConfig(
            duration_predictor=f"{d}/duration_predictor.int8.onnx", text_encoder=f"{d}/text_encoder.int8.onnx",
            vector_estimator=f"{d}/vector_estimator.int8.onnx", vocoder=f"{d}/vocoder.int8.onnx",
            tts_json=f"{d}/tts.json", unicode_indexer=f"{d}/unicode_indexer.bin", voice_style=f"{d}/voice.bin"),
        num_threads=1))
    tts = sherpa_onnx.OfflineTts(cfg)
    rec = None
    w = a.asr_dir
    if os.path.exists(f"{w}/small-encoder.int8.onnx"):
        rec = sherpa_onnx.OfflineRecognizer.from_whisper(encoder=f"{w}/small-encoder.int8.onnx", decoder=f"{w}/small-decoder.int8.onnx",
                                                         tokens=f"{w}/small-tokens.txt", language="ar", task="transcribe", num_threads=1)
    else:
        print("تحذير: نموذج التحقق غير موجود؛ تُولَّد الأصوات بلا تحقّق من النطق.", flush=True)
    def transcribe(s, sr):
        x = resample_poly(s, 16000, sr).astype(np.float32) if sr != 16000 else s
        st = rec.create_stream(); st.accept_waveform(16000, x); rec.decode_stream(st)
        return st.result.text.strip()
    od = os.path.join(a.out, f"v{voice}"); os.makedirs(od, exist_ok=True)
    ip = os.path.join(od, "index.json")
    index = {"rate": 22050, "format": "m4a", "steps": a.steps, "voice": voice, "items": {}, "weak": {}}
    if os.path.exists(ip):
        try:
            old = json.load(open(ip, encoding="utf-8"))
            if old.get("steps") == a.steps and old.get("format") == "m4a": index["items"] = old.get("items", {}); index["weak"] = old.get("weak", {})
        except Exception: pass
    def save(): json.dump(index, open(ip, "w", encoding="utf-8"), ensure_ascii=False)
    made = 0; stopped = False
    for n, row in enumerate(items):
        text, sp = row[0], row[1]; num = row[2] if len(row) > 2 else None
        c = clean(text); key = f"{int(sp * 100 + 0.5)}|{c}"
        fn = f"{n:05d}.m4a"
        if key in index["items"] and os.path.exists(os.path.join(od, index["items"][key])): continue
        if DEADLINE and time.time() > DEADLINE: stopped = True; break
        best = None
        for attempt in range(1, (a.tries if rec else 1) + 1):
            g = sherpa_onnx.GenerationConfig(); g.sid = voice; g.speed = float(sp); g.num_steps = a.steps; g.extra = {"lang": "ar"}
            syl = bool(SYL.match(c))
            vs = [carrier(c)] if syl else variants(c, num)
            r = tts.generate(vs[(attempt - 1) % len(vs)], g)
            raw = np.asarray(r.samples, dtype=np.float32)
            if syl: s, okdur = cut_last(raw, r.sample_rate)
            else: s, okdur = trim(raw, r.sample_rate), True
            if r.sample_rate != 22050: s = resample_poly(s, 22050, r.sample_rate).astype(np.float32)
            if not rec: best = (s, 1.0, ""); break
            heard = transcribe(s, 22050)
            sc = (0.0 if not okdur else (1.0 if norm(c[0]) in norm(heard) else 0.5)) if syl else score(c, num, heard)
            if best is None or sc > best[1]: best = (s, sc, heard)
            if sc >= a.accept: break
        s = best[0]
        if best[1] < a.accept and rec: index["weak"][key] = [round(best[1], 2), best[2]]
        else: index["weak"].pop(key, None)
        pk = float(np.abs(s).max()) or 1.0
        encode((s / pk * 0.95 * 32767).astype("<i2").tobytes(), os.path.join(od, fn))
        index["items"][key] = fn; made += 1
        if made % 25 == 0:
            save(); print(f"صوت {voice}: {len(index['items'])}/{len(items)}  ({int(time.time()-T0)}s)", flush=True)
    save()
    print(f"صوت {voice}: {'توقّف مؤقتًا' if stopped else 'اكتمل'} {len(index['items'])}/{len(items)}", flush=True)
    return voice, (not stopped)

if __name__ == "__main__":
    voices = [int(x) for x in a.voices.split(",") if x.strip() != ""]
    os.makedirs(a.out, exist_ok=True)
    done_mark = os.path.join(a.out, ".complete")
    if os.path.exists(done_mark): os.remove(done_mark)
    with get_context("fork").Pool(max(1, min(a.jobs, len(voices)))) as pool:
        res = pool.map(work, voices, chunksize=1)
    size = 0
    for v in voices:
        vd = os.path.join(a.out, f"v{v}")
        if os.path.isdir(vd): size += sum(os.path.getsize(os.path.join(vd, f)) for f in os.listdir(vd))
    lines = []
    for v in voices:
        ipath = os.path.join(a.out, f"v{v}", "index.json")
        if os.path.exists(ipath):
            ix = json.load(open(ipath, encoding="utf-8"))
            wk = ix.get("weak", {})
            lines.append(f"== صوت {v+1} (رقم {v}): {len(ix.get('items', {}))} عنصرًا، منها {len(wk)} لم يجتز التحقق")
            for k, (sc, heard) in sorted(wk.items()): lines.append(f"   {sc:.2f}  المطلوب: {k.split('|',1)[1]}   |   سمعه النظام: {heard}")
    try: open(a.report, "w", encoding="utf-8").write("\n".join(lines) + "\n")
    except Exception: pass
    print("\n".join(l for l in lines if l.startswith("==")))
    ok = all(r[1] for r in res)
    if ok and not a.limit:
        open(done_mark, "w").write("ok")
        print(f"اكتمل: {len(voices)} أصوات ({round(size/1e6,1)} MB)")
    else:
        print(f"توقّف مؤقتًا بسبب حدّ الوقت ({round(size/1e6,1)} MB حتى الآن). أعد البناء لإكمال الباقي.")
