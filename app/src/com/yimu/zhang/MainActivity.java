package com.yimu.zhang;

import android.app.Activity;
import android.content.ContentValues;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Vibrator;
import android.provider.MediaStore;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

public class MainActivity extends Activity {
    private static final String ENTRY_URL = "file:///android_asset/index.html";
    private static final String SAFE_ORIGIN = "file:///android_asset/";
    private static final int BG = 0xFFF7F6F2;

    private WebView webView;
    private FrameLayout root;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        try {
            buildUi(savedInstanceState);
        } catch (Throwable error) {
            showFailure(error);
        }
    }

    private void buildUi(Bundle savedInstanceState) {
        if (Build.VERSION.SDK_INT >= 21) {
            getWindow().setStatusBarColor(BG);
            getWindow().setNavigationBarColor(BG);
        }
        if (Build.VERSION.SDK_INT >= 23) {
            int flags = View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
            if (Build.VERSION.SDK_INT >= 26) {
                flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
            }
            getWindow().getDecorView().setSystemUiVisibility(flags);
        }

        root = new FrameLayout(this);
        root.setBackgroundColor(BG);
        setContentView(root);

        webView = createWebView();
        if (webView == null) {
            showMessage("无法启动页面", "这台手机的 Android System WebView 不可用。请安装或启用“Android System WebView”后重新打开。");
            return;
        }

        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        webView.setWebChromeClient(new WebChromeClient());
        if (savedInstanceState != null) {
            try {
                webView.restoreState(savedInstanceState);
                return;
            } catch (Throwable ignored) {
            }
        }
        webView.loadUrl(ENTRY_URL);
    }

    private WebView createWebView() {
        WebView view;
        try {
            view = new WebView(this);
        } catch (Throwable first) {
            return null;
        }
        try {
            view.setBackgroundColor(BG);
            WebSettings settings = view.getSettings();
            settings.setJavaScriptEnabled(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(false);
            settings.setSupportMultipleWindows(false);
            settings.setBuiltInZoomControls(false);
            settings.setDisplayZoomControls(false);
            settings.setTextZoom(100);
            settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
            try {
                settings.setBlockNetworkLoads(true);
            } catch (Throwable ignored) {
            }
            view.setVerticalScrollBarEnabled(true);
            view.setHorizontalScrollBarEnabled(false);
            view.addJavascriptInterface(new Bridge(), "NativeApp");
            view.setWebViewClient(new AppClient());
            return view;
        } catch (Throwable error) {
            try {
                view.destroy();
            } catch (Throwable ignored) {
            }
            return null;
        }
    }

    private final class AppClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return url == null || !url.startsWith(SAFE_ORIGIN);
        }

        @Override
        public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
            if (failingUrl != null && failingUrl.startsWith(ENTRY_URL)) {
                showMessage("页面加载失败", "内置页面未能打开（错误码 " + errorCode + "）。请卸载后重新安装。");
            }
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (Build.VERSION.SDK_INT >= 23 && request != null && request.isForMainFrame()) {
                onReceivedError(view, error == null ? -1 : error.getErrorCode(),
                        error == null ? "" : String.valueOf(error.getDescription()),
                        request.getUrl() == null ? null : request.getUrl().toString());
            }
        }
    }

    private final class Bridge {
        @JavascriptInterface
        public void toast(final String message) {
            runOnUiThread(new Runnable() {
                public void run() {
                    Toast.makeText(MainActivity.this, message, Toast.LENGTH_SHORT).show();
                }
            });
        }

        @JavascriptInterface
        public void vibrate(int ms) {
            try {
                Vibrator vibrator = (Vibrator) getSystemService(VIBRATOR_SERVICE);
                if (vibrator != null) {
                    vibrator.vibrate(Math.max(1, Math.min(ms, 40)));
                }
            } catch (Throwable ignored) {
            }
        }

        @JavascriptInterface
        public String saveCsv(String name, String content) {
            try {
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.MediaColumns.DISPLAY_NAME, name);
                    values.put(MediaStore.MediaColumns.MIME_TYPE, "text/csv");
                    values.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/一目账");
                    Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (uri == null) {
                        return "无法创建文件，请稍后再试";
                    }
                    OutputStream out = getContentResolver().openOutputStream(uri);
                    out.write(content.getBytes("UTF-8"));
                    out.flush();
                    out.close();
                    return "已保存到 下载/一目账/" + name;
                }
                File dir = getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                if (dir == null) {
                    dir = getFilesDir();
                }
                if (!dir.exists()) {
                    dir.mkdirs();
                }
                File file = new File(dir, name);
                FileOutputStream out = new FileOutputStream(file);
                out.write(content.getBytes("UTF-8"));
                out.flush();
                out.close();
                return "已保存到 " + file.getAbsolutePath();
            } catch (Throwable error) {
                return "导出失败：" + error.getMessage();
            }
        }
    }

    private void showFailure(Throwable error) {
        String detail = error == null ? "" : (error.getClass().getSimpleName() + "：" + error.getMessage());
        showMessage("应用启动失败", detail);
    }

    private void showMessage(String title, String message) {
        if (webView != null) {
            try {
                root.removeView(webView);
                webView.destroy();
            } catch (Throwable ignored) {
            }
            webView = null;
        }
        if (root == null) {
            root = new FrameLayout(this);
            root.setBackgroundColor(BG);
            setContentView(root);
        }
        root.removeAllViews();

        ScrollView scroll = new ScrollView(this);
        scroll.setBackgroundColor(BG);
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(24), dp(56), dp(24), dp(32));
        scroll.addView(box);

        TextView heading = new TextView(this);
        heading.setText(title);
        heading.setTextColor(0xFF16211B);
        heading.setTextSize(TypedValue.COMPLEX_UNIT_SP, 20);
        box.addView(heading);

        TextView body = new TextView(this);
        body.setText(message);
        body.setTextColor(0xFF5C665F);
        body.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
        body.setLineSpacing(dp(5), 1f);
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        params.topMargin = dp(14);
        box.addView(body, params);

        TextView hint = new TextView(this);
        hint.setText("一目账");
        hint.setTextColor(0xFF1D6A4E);
        hint.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        hint.setGravity(Gravity.START);
        params = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        params.topMargin = dp(28);
        box.addView(hint, params);

        root.addView(scroll, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    }

    private int dp(int value) {
        return (int) (value * getResources().getDisplayMetrics().density + 0.5f);
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        super.onSaveInstanceState(outState);
        if (webView != null) {
            try {
                webView.saveState(outState);
            } catch (Throwable ignored) {
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView == null) {
            super.onBackPressed();
            return;
        }
        try {
            webView.evaluateJavascript(
                    "(function(){try{return !!(window.__handleBack&&window.__handleBack());}catch(e){return false;}})()",
                    new ValueCallback<String>() {
                        @Override
                        public void onReceiveValue(String value) {
                            if (!"true".equals(value)) {
                                finish();
                            }
                        }
                    });
        } catch (Throwable error) {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            try {
                webView.loadUrl("about:blank");
                webView.destroy();
            } catch (Throwable ignored) {
            }
            webView = null;
        }
        super.onDestroy();
    }
}