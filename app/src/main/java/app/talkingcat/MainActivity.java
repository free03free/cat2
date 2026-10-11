package app.talkingcat;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.net.Uri;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/** الواجهة التعليمية: الأرقام والحروف والألوان والدروس مع النطق العربي المحلي. */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.local";
    private WebView web;
    private EchoEngine engine;
    private volatile float speed = 0.95f;
    private volatile float volume = 1.0f;

    @Override protected void onCreate(Bundle b) {
        super.onCreate(b);
        web = new WebView(this);
        web.setBackgroundColor(0xFFFFF4DC);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);

        engine = new EchoEngine(this, new EchoEngine.Callback() {
            @Override public void emit(String type, String payload) {
                runJs("window.onNativeEvent && window.onNativeEvent(" + org.json.JSONObject.quote(type) + "," + org.json.JSONObject.quote(payload) + ");");
            }
            @Override public void report(String title, String msg) { toastJs(title + ": " + msg); }
            @Override public void toast(String msg) { toastJs(msg); }
        });
        engine.prepare();

        web.addJavascriptInterface(new Bridge(), "TomNative");
        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                return serve(r);
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                return !HOST.equals(r.getUrl().getHost());
            }
        });
        web.loadUrl("https://" + HOST + "/index.html");
    }

    private class Bridge {
        @JavascriptInterface public void say(String text, double pitchFactor, int delayMs) {
            engine.say(text, (float)pitchFactor, delayMs, volume);
        }
        @JavascriptInterface public void setSpeed(double v) { speed = (float) Math.max(0.6, Math.min(1.2, v)); }
        @JavascriptInterface public void setSystemVoice(boolean on) { engine.setUseSystem(on); }
        @JavascriptInterface public void setVoice(int v) { engine.setVoice(v); }
        @JavascriptInterface public void setSteps(int v) { engine.setSteps(v); }
        @JavascriptInterface public void prefetch(String json) {
            try {
                org.json.JSONArray a = new org.json.JSONArray(json);
                String[] t = new String[a.length()]; float[] sp = new float[a.length()];
                for (int i = 0; i < a.length(); i++) { org.json.JSONArray it = a.getJSONArray(i); t[i] = it.getString(0); sp[i] = (float) it.getDouble(1); }
                engine.prefetch(t, sp);
            } catch (Throwable ignored) {}
        }
        @JavascriptInterface public void setVolume(double v) { volume = (float) Math.max(0.0, Math.min(1.0, v)); }
    }

    private WebResourceResponse serve(WebResourceRequest r) {
        Uri u=r.getUrl();
        if(!HOST.equals(u.getHost())) return notFound();
        String path=u.getPath();
        if(path==null||path.equals("/")) path="/index.html";
        path=path.substring(1);
        if(path.contains("..")) return notFound();
        byte[] data;
        try{data=readAsset(path);}catch(IOException e){return notFound();}
        String mime=mimeOf(path);
        String enc=(mime.startsWith("text/")||mime.contains("json")||mime.contains("svg"))?"utf-8":null;
        Map<String,String> h=new HashMap<>();
        h.put("Cache-Control","no-cache");
        h.put("Content-Length",String.valueOf(data.length));
        return new WebResourceResponse(mime,enc,200,"OK",h,new ByteArrayInputStream(data));
    }

    private byte[] readAsset(String path)throws IOException{
        try(InputStream in=getAssets().open(path)){
            ByteArrayOutputStream out=new ByteArrayOutputStream(Math.max(1024,in.available()));
            byte[] buf=new byte[16384];int n;
            while((n=in.read(buf))>0)out.write(buf,0,n);
            return out.toByteArray();
        }
    }
    private WebResourceResponse notFound(){
        return new WebResourceResponse("text/plain","utf-8",404,"Not Found",
                new HashMap<String,String>(),new ByteArrayInputStream(new byte[0]));
    }
    private static String mimeOf(String p){
        String s=p.toLowerCase(Locale.ROOT);
        if(s.endsWith(".html"))return"text/html";
        if(s.endsWith(".js"))return"text/javascript";
        if(s.endsWith(".css"))return"text/css";
        if(s.endsWith(".json"))return"application/json";
        if(s.endsWith(".png"))return"image/png";
        if(s.endsWith(".webp"))return"image/webp";
        if(s.endsWith(".jpg")||s.endsWith(".jpeg"))return"image/jpeg";
        if(s.endsWith(".svg"))return"image/svg+xml";
        return"application/octet-stream";
    }
    @Override protected void onPause(){ engine.stop(); web.onPause(); super.onPause(); }
    @Override protected void onResume(){super.onResume();web.onResume();}
    @Override protected void onDestroy(){ if(engine!=null)engine.shutdown();web.destroy();super.onDestroy();}

    private void toastJs(String msg) {
        runJs("window.onNativeToast && window.onNativeToast(" + org.json.JSONObject.quote(msg) + ");");
    }

    private void runJs(String js) { if (web != null) web.post(() -> web.evaluateJavascript(js, null)); }
}
