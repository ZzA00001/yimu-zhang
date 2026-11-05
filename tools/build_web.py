# -*- coding: utf-8 -*-
"""Build the static web version of 一目账 into build/web (H5 + PWA, Netlify ready)."""
import hashlib
import io
import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(r"C:\Users\zhoucm1\yimu-zhang")
ASSETS = ROOT / "app" / "assets"
OUT = ROOT / "build" / "web"

if OUT.exists():
    shutil.rmtree(OUT)
(OUT / "icons").mkdir(parents=True, exist_ok=True)

for name in ("index.html", "styles.css", "app.js"):
    shutil.copyfile(ASSETS / name, OUT / name)

# ---------------- icons ----------------
src = Image.open(ROOT / "app" / "res" / "drawable" / "ic_launcher.png").convert("RGBA")
for size, name in ((192, "icon-192.png"), (512, "icon-512.png"), (180, "apple-touch-icon.png")):
    src.resize((size, size), Image.LANCZOS).save(OUT / "icons" / name, optimize=True)
maskable = Image.new("RGBA", (512, 512), (18, 62, 45, 255))
maskable.alpha_composite(src.resize((436, 436), Image.LANCZOS), (38, 38))
maskable.save(OUT / "icons" / "icon-maskable-512.png", optimize=True)
src.save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])

# ---------------- css additions ----------------
WEB_CSS = """
/* ---------- web / PWA adaptation ---------- */
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
body { -webkit-touch-callout: none; }
button, .nav-item, .nav-fab, .chip, .key, .cat, .seg button { touch-action: manipulation; }
/* iOS zooms the page when focusing an input smaller than 16px */
@media (max-width: 820px) {
  input, select, textarea { font-size: 16px; }
}
@supports (padding: max(0px)) {
  .nav { padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 0px); }
  .toast { bottom: calc(88px + max(env(safe-area-inset-bottom, 0px), 0px)); }
}
@media all and (display-mode: standalone) {
  .app { min-height: 100vh; min-height: 100dvh; }
}
/* desktop: keep the phone-width canvas centred on a calm backdrop */
@media (min-width: 700px) {
  body { background: #EFEDE7; }
  .app { background: var(--bg); min-height: 100vh; min-height: 100dvh;
         box-shadow: 0 0 0 1px rgba(22, 33, 27, .05), 0 18px 50px rgba(22, 33, 27, .07); }
  .nav { border-radius: 0; box-shadow: 0 -18px 50px rgba(22, 33, 27, .06); }
}
/* install / add-to-home-screen hint */
.inst-tip {
  position: fixed; left: 12px; right: 12px; z-index: 55;
  bottom: calc(80px + env(safe-area-inset-bottom, 0px));
  display: none; align-items: center; gap: 10px;
  max-width: 536px; margin: 0 auto;
  padding: 10px 12px; border-radius: 14px;
  background: rgba(22, 33, 27, .96); color: #F7F6F2;
  font-size: 12px; line-height: 1.5;
  box-shadow: 0 12px 32px rgba(14, 22, 18, .3);
}
.inst-tip.show { display: flex; }
.inst-tip .txt { flex: 1; min-width: 0; }
.inst-tip b { color: #F0C876; font-weight: 600; }
.inst-tip button {
  flex: 0 0 auto; font-size: 12px; font-weight: 600; color: #F0C876;
  padding: 4px 6px;
}
/* ---------- hide Netlify free-plan badge overlay (bottom-right) ---------- */
#nl-badge-frame,
#nl-hud-frame,
iframe[title="Powered by Netlify"],
iframe[title="Netlify"],
iframe[style*="2147483645"],
iframe[src*=".netlify/"],
[data-netlify-badge],
.netlify-badge {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
  width: 0 !important;
  height: 0 !important;
}
"""

css = io.open(OUT / "styles.css", "r", encoding="utf-8").read()
io.open(OUT / "styles.css", "w", encoding="utf-8", newline="\n").write(css + "\n" + WEB_CSS)

# ---------------- patched index.html ----------------
html = io.open(ASSETS / "index.html", "r", encoding="utf-8").read()

head_extra = """<meta name="description" content="一目账：一秒记一笔，一眼看清钱花在哪。本地存储、无广告、无需登录。">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="一目账">
<meta name="format-detection" content="telephone=no">
<meta property="og:title" content="一目账 · 极简记账">
<meta property="og:description" content="一秒记一笔，一眼看清钱花在哪。">
<meta property="og:type" content="website">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" href="icons/icon-192.png">
"""
html = html.replace('<link rel="stylesheet" href="styles.css">',
                    head_extra + '<link rel="stylesheet" href="styles.css">')

tip = """<div class="inst-tip" id="instTip">
  <div class="txt" id="instTxt"></div>
  <button id="instBtn" type="button">安装</button>
  <button id="instClose" type="button" aria-label="关闭">✕</button>
</div>
"""
html = html.replace('<div class="toast" id="toast"', tip + '<div class="toast" id="toast"')

boot = """<script>
(function () {
  var secure = location.protocol === 'https:' || location.hostname === 'localhost' ||
      location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && secure) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js')['catch'](function () {});
    });
  }
  /* Netlify injects a "Powered by Netlify" badge iframe at runtime - drop it */
  function killNfBadge() {
    var nodes = document.querySelectorAll(
      '#nl-badge-frame, #nl-hud-frame, iframe[title="Powered by Netlify"], ' +
      'iframe[title="Netlify"], iframe[src*=".netlify/"], iframe[style*="2147483645"]');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      try { n.style.setProperty('display', 'none', 'important'); } catch (e) {}
      try { n.setAttribute('aria-hidden', 'true'); } catch (e) {}
      try { if (n.parentNode) n.parentNode.removeChild(n); } catch (e) {}
    }
  }
  killNfBadge();
  try {
    new MutationObserver(killNfBadge).observe(document.documentElement,
      { childList: true, subtree: true });
  } catch (e) {}
  window.addEventListener('load', killNfBadge);
  setTimeout(killNfBadge, 800);
  setTimeout(killNfBadge, 2000);
  setInterval(killNfBadge, 600);

  var tip = document.getElementById('instTip');
  var txt = document.getElementById('instTxt');
  var btn = document.getElementById('instBtn');
  var close = document.getElementById('instClose');
  if (!tip) return;

  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isSafari = isIOS && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  var standalone = window.navigator.standalone === true ||
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  var dismissed = false;
  try { dismissed = localStorage.getItem('yimu.instTip') === 'off'; } catch (e) {}

  function hide(mark) {
    tip.className = 'inst-tip';
    if (mark) { try { localStorage.setItem('yimu.instTip', 'off'); } catch (e) {} }
  }
  close.onclick = function () { hide(true); };

  if (standalone || dismissed) return;

  if (isSafari) {
    txt.innerHTML = '在 Safari 底部点 <b>分享</b> → <b>添加到主屏幕</b>，可全屏离线使用';
    btn.textContent = '知道了';
    btn.onclick = function () { hide(true); };
    setTimeout(function () { tip.className = 'inst-tip show'; }, 1500);
    return;
  }

  var prompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    prompt = e;
    txt.innerHTML = '添加到主屏幕，像 App 一样全屏使用，断网也能记账';
    btn.textContent = '添加';
    tip.className = 'inst-tip show';
  });
  btn.onclick = function () {
    hide(true);
    if (prompt) { try { prompt.prompt(); } catch (e) {} }
  };
  window.addEventListener('appinstalled', function () { hide(true); });
})();
</script>
"""
html = html.replace('</body>', boot + '</body>')
io.open(OUT / "index.html", "w", encoding="utf-8", newline="\n").write(html)

# ---------------- manifest ----------------
manifest = {
    "name": "一目账 · 极简记账",
    "short_name": "一目账",
    "description": "一秒记一笔，一眼看清钱花在哪。数据只存本地，无广告、无需登录。",
    "lang": "zh-CN",
    "dir": "ltr",
    "start_url": "./",
    "scope": "./",
    "display": "standalone",
    "orientation": "portrait",
    "background_color": "#F7F6F2",
    "theme_color": "#F7F6F2",
    "categories": ["finance", "productivity"],
    "icons": [
        {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any"},
        {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any"},
        {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
    ],
}
io.open(OUT / "manifest.webmanifest", "w", encoding="utf-8", newline="\n").write(
    json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")

# ---------------- service worker ----------------
FILES = ["./", "./index.html", "./styles.css", "./app.js",
         "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png",
         "./icons/icon-maskable-512.png", "./icons/apple-touch-icon.png"]

sig = hashlib.sha256()
for rel in ("index.html", "styles.css", "app.js", "manifest.webmanifest"):
    sig.update((OUT / rel).read_bytes())
cache = "yimu-" + sig.hexdigest()[:10]

sw = """var CACHE = '%s';
var FILES = %s;
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(FILES);
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  if (req.url.indexOf('http') !== 0) return;
  if (new URL(req.url).origin !== location.origin) return;
  /* block the Netlify HUD/badge script before it can draw anything */
  if (new URL(req.url).pathname.indexOf('/.netlify/scripts/hud') === 0) {
    e.respondWith(new Response('', { status: 200, headers: { 'Content-Type': 'text/javascript' } }));
    return;
  }
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
      return res;
    })['catch'](function () {
      return caches.match('./index.html');
    }));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
    if (hit) return hit;
    return fetch(req).then(function (res) {
      if (res && res.status === 200 && res.type === 'basic') {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    })['catch'](function () {
      return caches.match('./index.html');
    });
  }));
});
""" % (cache, json.dumps(FILES))
io.open(OUT / "sw.js", "w", encoding="utf-8", newline="\n").write(sw)

io.open(OUT / "_headers", "w", encoding="utf-8", newline="\n").write(
    "/sw.js\n  Cache-Control: no-cache\n"
    "/\n  Cache-Control: no-cache\n"
    "/index.html\n  Cache-Control: no-cache\n"
    "/manifest.webmanifest\n  Cache-Control: no-cache\n"
    "/icons/*\n  Cache-Control: public, max-age=604800\n"
    "/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n")

print("WEB OK", cache)
for p in sorted(OUT.rglob("*")):
    if p.is_file():
        print("  %-28s %8d" % (p.relative_to(OUT).as_posix(), p.stat().st_size))
