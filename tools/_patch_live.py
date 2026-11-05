import pathlib

base = pathlib.Path(r"C:/Users/zhoucm1/yimu-zhang")
src = (base / "tools/check_web.js").read_text(encoding="utf-8-sig")
s = src

s = s.replace(
    "const APP = 'http://127.0.0.1:' + HTTP_PORT + '/';",
    "const LIVE = 'https://yimu-zhang.netlify.app';\nconst APP = LIVE + '/';",
)
assert "const LIVE" in s

old_loop = """  for (const v of ['ledger', 'stats']) {
    await click('.nav-item[data-view=' + v + ']');
    await sleep(320);
    await shot('43-web-' + v);
  }
  check('\u660e\u7ec6\u9875\u6709\u8bb0\u5f55', (await ev("document.querySelectorAll('.tx').length")) > 0);
"""

new_loop = """  for (const v of ['ledger', 'stats']) {
    await click('.nav-item[data-view=' + v + ']');
    await sleep(320);
    if (v === 'ledger') check('\u660e\u7ec6\u9875\u6709\u8bb0\u5f55', (await ev("document.querySelectorAll('.tx').length")) > 0);
    await shot('45-live-' + v);
  }
"""

assert old_loop in s, "loop block not found"
s = s.replace(old_loop, new_loop)

s = s.replace(
    "  await new Promise((r) => server.listen(HTTP_PORT, '127.0.0.1', r));\n",
    "",
)

old_off = """  // offline check: stop server, reload, expect app still renders from cache
  await new Promise((r) => server.close(r));
"""

new_off = """  // offline check: emulate offline, reload, expect app still renders from cache
  await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
"""

assert old_off in s, "offline block not found"
s = s.replace(old_off, new_off)

s = s.replace("'41-web-home-empty'", "'45-live-home-empty'")
s = s.replace("'42-web-home'", "'45-live-home'")
s = s.replace("'44-web-offline'", "'45-live-offline'")
s = s.replace("'web-report.txt'", "'live-report.txt'")
s = s.replace("const PORT = 9251;", "const PORT = 9261;")
s = s.replace(
    "'/icons/icon-512.png', '/icons/apple-touch-icon.png']",
    "'/icons/icon-512.png', '/icons/apple-touch-icon.png', '/icons/icon-maskable-512.png']",
)
s = s.replace("edge-profile-web", "edge-profile-live")
s = s.replace("await sleep(1600);", "await sleep(2600);")

out = base / "tools/check_live.js"
out.write_text(s, encoding="utf-8")
print("written", out, len(s), ascii(s[s.index("const LIVE") - 20 : s.index("const LIVE") + 90]))
