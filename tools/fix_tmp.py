import pathlib, re
p = pathlib.Path(r"C:\Users\zhoucm1\yimu-zhang\tools\build_web.py")
s = p.read_text(encoding="utf-8")
old = "  if ('serviceWorker' in navigator && location.protocol === 'https:') {"
new = ("  var secure = location.protocol === 'https:' || location.hostname === 'localhost' ||\n"
       "      location.hostname === '127.0.0.1';\n"
       "  if ('serviceWorker' in navigator && secure) {")
assert old in s
p.write_text(s.replace(old, new), encoding="utf-8", newline="\n")
print("patched build_web.py")

q = pathlib.Path(r"C:\Users\zhoucm1\yimu-zhang\tools\check_web.js")
t = q.read_text(encoding="utf-8")
t = t.replace("data-view=me]", "data-view=mine]").replace("data-view=home]", "data-view=home]")
q.write_text(t, encoding="utf-8", newline="\n")
print("patched check_web.js", t.count("data-view=mine"))
