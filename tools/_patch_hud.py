# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(r"C:\Users\zhoucm1\yimu-zhang\tools\build_web.py")
s = p.read_text(encoding="utf-8")

def rep(old, new, tag):
    global s
    n = s.count(old)
    if n != 1:
        print("SKIP", tag, n)
        return
    s = s.replace(old, new, 1)
    print("OK  ", tag)

rep("""      '#nl-badge-frame, iframe[title="Powered by Netlify"], iframe[src*=".netlify/"]');""",
    """      '#nl-badge-frame, #nl-hud-frame, iframe[title="Powered by Netlify"], ' +
      'iframe[title="Netlify"], iframe[src*=".netlify/"], iframe[style*="2147483645"]');""",
    "js-selector")

rep("""      try { n.setAttribute('aria-hidden', 'true'); } catch (e) {}""",
    """      try { n.setAttribute('aria-hidden', 'true'); } catch (e) {}
      try { if (n.parentNode) n.parentNode.removeChild(n); } catch (e) {}""",
    "js-remove")

rep("""  setTimeout(killNfBadge, 800);""",
    """  setTimeout(killNfBadge, 800);
  setTimeout(killNfBadge, 2000);
  setInterval(killNfBadge, 600);""",
    "js-poll")

rep("""  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {""",
    """  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone();
      caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
      return res;
    })['catch'](function () {
      return caches.match('./index.html');
    }));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {""",
    "sw-network-first")

rep("""    "/index.html\\n  Cache-Control: no-cache\\n\"""",
    """    "/\\n  Cache-Control: no-cache\\n"
    "/index.html\\n  Cache-Control: no-cache\\n\"""",
    "headers-root")

rep("""#nl-badge-frame,
iframe[title="Powered by Netlify"],""",
    """#nl-badge-frame,
#nl-hud-frame,
iframe[title="Powered by Netlify"],
iframe[title="Netlify"],
iframe[style*="2147483645"],""",
    "css")

p.write_text(s, encoding="utf-8")
print("LEN", len(s))