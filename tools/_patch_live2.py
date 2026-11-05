import pathlib, re

p = pathlib.Path(r"C:/Users/zhoucm1/yimu-zhang/tools/check_live.js")
s = p.read_text(encoding="utf-8")

s = s.replace(
    "const http = require('http');",
    "const http = require('http');\nconst https = require('https');",
)
assert "require('https')" in s

old_get = """function get(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => res({ status: r.statusCode, body: d })); }).on('error', rej);
  });
}"""

new_get = """function get(url) {
  return new Promise((res, rej) => {
    const mod = url.startsWith('https:') ? https : http;
    mod.get(url, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => res({ status: r.statusCode, body: d })); }).on('error', rej);
  });
}"""

assert old_get in s, "get() not found"
s = s.replace(old_get, new_get)

# binary read for icon bytes must not be decoded as utf8 strings
old_icon = """  const iconHead = Buffer.from((await get(APP + 'icons/icon-512.png')).body, 'binary');
  check('\u56fe\u6807 512 \u53ef\u8bbf\u95ee', iconHead.length > 3000, iconHead.length);"""
new_icon = """  const iconRes = await get(APP + 'icons/icon-512.png');
  check('\u56fe\u6807 512 \u53ef\u8bbf\u95ee', iconRes.status === 200 && iconRes.body.length > 3000, iconRes.status + ' ' + iconRes.body.length);"""
if old_icon in s:
    s = s.replace(old_icon, new_icon)
    print("icon check patched")
else:
    print("icon check left as-is")

# manifest may be served with a non-json content type but body is fine
p.write_text(s, encoding="utf-8")
print("ok", len(s))
