# -*- coding: utf-8 -*-
from pathlib import Path

p = Path(r"C:\Users\zhoucm1\yimu-zhang\tools\build_web.py")
s = p.read_text(encoding="utf-8")

old = """  if (req.mode === 'navigate') {"""
new = """  /* block the Netlify HUD/badge script before it can draw anything */
  if (new URL(req.url).pathname.indexOf('/.netlify/scripts/hud') === 0) {
    e.respondWith(new Response('', { status: 200, headers: { 'Content-Type': 'text/javascript' } }));
    return;
  }
  if (req.mode === 'navigate') {"""

assert s.count(old) == 1, s.count(old)
s = s.replace(old, new, 1)
p.write_text(s, encoding="utf-8")
print("PATCHED sw block")