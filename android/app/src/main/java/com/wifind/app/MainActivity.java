package com.wifind.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Insets;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * WiFind for Android.
 *
 * The app shows the same WiFind website (bundled inside the app, so it opens without internet)
 * and adds a bridge, {@link WifiBridge}, that lets the page read the phone's real Wi-Fi signal.
 */
public class MainActivity extends Activity {

    /** The bundled website is served from this address inside the app. It never goes to the internet. */
    static final String APP_HOST = "appassets.androidplatform.net";
    static final String START_URL = "https://" + APP_HOST + "/index.html";

    private WebView web;
    private WifiBridge bridge;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        boolean night = (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        int surface = night ? Color.parseColor("#0C1A2F") : Color.WHITE; // same as the app's top bar

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(surface);
        web = new WebView(this);
        web.setBackgroundColor(surface);
        root.addView(web, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(root);
        drawBehindSystemBars(root, night);

        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);   // reports and settings are saved in the page's storage
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setTextZoom(100);

        bridge = new WifiBridge(this, web);
        web.addJavascriptInterface(bridge, "WiFindNative");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (APP_HOST.equals(url.getHost())) return serveAsset(url.getPath());
                return null; // everything else (speed test servers, fonts) loads normally
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (APP_HOST.equals(url.getHost())) return false;
                // Links to other websites open in the phone's browser, so the bridge is only ever used by WiFind itself.
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, url));
                } catch (ActivityNotFoundException e) {
                    // no app can open this link
                }
                return true;
            }
        });

        if (savedInstanceState == null || web.restoreState(savedInstanceState) == null) {
            web.loadUrl(START_URL);
        }
    }

    /** Reads a file of the bundled website from the app's assets (assets/www). */
    private WebResourceResponse serveAsset(String path) {
        if (path == null || path.isEmpty() || "/".equals(path)) path = "/index.html";
        Map<String, String> headers = new HashMap<>();
        headers.put("Cache-Control", "no-cache");
        if (path.contains("..")) return notFound(headers);
        try {
            InputStream in = getAssets().open("www" + path);
            String mime = mimeOf(path);
            String encoding = mime.startsWith("text/") || mime.contains("json") || mime.contains("javascript") ? "UTF-8" : null;
            return new WebResourceResponse(mime, encoding, 200, "OK", headers, in);
        } catch (IOException e) {
            return notFound(headers);
        }
    }

    private static WebResourceResponse notFound(Map<String, String> headers) {
        return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", headers,
                new ByteArrayInputStream("Not found".getBytes(StandardCharsets.UTF_8)));
    }

    private static String mimeOf(String path) {
        String p = path.toLowerCase(Locale.US);
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".js")) return "text/javascript";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".webmanifest")) return "application/manifest+json";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".webp")) return "image/webp";
        if (p.endsWith(".jpg") || p.endsWith(".jpeg")) return "image/jpeg";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".ico")) return "image/x-icon";
        if (p.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }

    /** Draws the app edge to edge (required on Android 15) and keeps the page clear of the status and navigation bars. */
    @SuppressWarnings("deprecation")
    private void drawBehindSystemBars(View root, boolean night) {
        Window window = getWindow();
        window.setStatusBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= 30) {
            window.setNavigationBarColor(Color.TRANSPARENT);
            window.setDecorFitsSystemWindows(false);
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                int light = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;
                controller.setSystemBarsAppearance(night ? 0 : light, light);
            }
        } else {
            int flags = View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION;
            if (!night) flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= 26) {
                window.setNavigationBarColor(Color.TRANSPARENT);
                if (!night) flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            } else {
                window.setNavigationBarColor(0x66000000); // older phones can't draw dark navigation buttons
            }
            window.getDecorView().setSystemUiVisibility(flags);
        }
        root.setOnApplyWindowInsetsListener((v, insets) -> {
            int left, top, right, bottom;
            if (Build.VERSION.SDK_INT >= 30) {
                Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                left = bars.left; top = bars.top; right = bars.right; bottom = bars.bottom;
            } else {
                left = insets.getSystemWindowInsetLeft(); top = insets.getSystemWindowInsetTop();
                right = insets.getSystemWindowInsetRight(); bottom = insets.getSystemWindowInsetBottom();
            }
            v.setPadding(left, top, right, bottom);
            return insets;
        });
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        bridge.onResume();
    }

    @Override
    protected void onPause() {
        bridge.onPause();
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        web.saveState(outState);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        bridge.onPermissionResult(requestCode);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        bridge.release();
        web.destroy();
        super.onDestroy();
    }
}
