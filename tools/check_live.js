// Web/PWA smoke test for 一目账, served from build/web over HTTP.
// Usage: node tools/check_web.js
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9261;
const HTTP_PORT = 8932;
const OUT = 'C:\\Users\\zhoucm1\\yimu-zhang\\build';
const WEB = path.join(OUT, 'web');
const LIVE = 'https://yimu-zhang.netlify.app';
const APP = LIVE + '/';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.ico': 'image/x-icon'
};
const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split('?')[0]);
  if (rel === '/') rel = '/index.html';
  const file = path.join(WEB, rel);
  if (!file.startsWith(WEB) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  res.end(fs.readFileSync(file));
});

function get(url) {
  return new Promise((res, rej) => {
    const mod = url.startsWith('https:') ? https : http;
    mod.get(url, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => res({ status: r.statusCode, body: d })); }).on('error', rej);
  });
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  <- ' + String(detail == null ? '' : detail).slice(0, 200)));
}

(async () => {

  const userDir = path.join(OUT, 'edge-profile-live');
  fs.mkdirSync(userDir, { recursive: true });
  execFile(EDGE, [
    '--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + userDir,
    '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    '--window-size=390,844', '--force-device-scale-factor=2', 'about:blank'
  ], { detached: true, stdio: 'ignore' }).unref();

  let page = null;
  for (let i = 0; i < 40; i++) {
    try {
      const list = JSON.parse((await get('http://127.0.0.1:' + PORT + '/json/list')).body);
      page = list.find((x) => x.type === 'page');
      if (page) break;
    } catch (e) { }
    await sleep(350);
  }
  if (!page) throw new Error('edge not ready');

  const WebSocket = require('C:/Users/zhoucm1/liuyao-guide/node_modules/ws');
  const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false });
  let id = 0;
  const pending = new Map();
  const exceptions = [];
  const consoleErrors = [];
  ws.on('message', (m) => {
    const msg = JSON.parse(m);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') exceptions.push(JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value || a.description).join(' '));
    }
  });
  await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); });

  function send(method, params) {
    return new Promise((res) => {
      const n = ++id;
      pending.set(n, res);
      ws.send(JSON.stringify({ id: n, method, params: params || {} }));
    });
  }
  async function ev(expr) {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result && r.result.exceptionDetails) throw new Error('EVAL: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300));
    return r.result && r.result.result ? r.result.result.value : null;
  }
  async function shot(name) {
    await sleep(420);
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.result.data, 'base64'));
  }
  const q = (s) => JSON.stringify(s);
  async function click(sel) {
    const ok = await ev('(function(){var e=document.querySelector(' + q(sel) + ');if(!e)return false;e.click();return true;})()');
    if (!ok) throw new Error('missing: ' + sel);
    await sleep(200);
  }
  async function key(k) {
    await ev('(function(){var e=document.querySelector("[data-key=\\"' + k + '\\"]");if(e)e.click();})()');
    await sleep(40);
  }
  async function typeAmount(s) { for (const k of String(s)) await key(k); }
  const text = (sel) => ev('(function(){var e=document.querySelector(' + q(sel) + ');return e?e.innerText:null;})()');
  const tight = (v) => String(v == null ? '' : v).replace(/\s+/g, '');

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.navigate', { url: APP });
  await sleep(2600);

  // ---- static assets ----
  for (const p of ['/', '/styles.css', '/app.js', '/manifest.webmanifest', '/sw.js', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png', '/icons/icon-maskable-512.png']) {
    const r = await get(APP.replace(/\/$/, '') + p);
    check('HTTP 200 ' + p, r.status === 200, r.status);
  }

  const manifest = JSON.parse((await get(APP + 'manifest.webmanifest')).body);
  check('manifest: 名称', manifest.name && manifest.short_name === '一目账', manifest.short_name);
  check('manifest: standalone', manifest.display === 'standalone', manifest.display);
  check('manifest: 含 maskable 图标', (manifest.icons || []).some((i) => (i.purpose || '').indexOf('maskable') >= 0));

  const iconRes = await get(APP + 'icons/icon-512.png');
  check('图标 512 可访问', iconRes.status === 200 && iconRes.body.length > 3000, iconRes.status + ' ' + iconRes.body.length);

  // ---- PWA ----
  const reg = await ev("navigator.serviceWorker.getRegistration().then(function(r){return r? (r.active? 'active':'pending'):'none'})");
  check('Service Worker 已注册并激活', reg === 'active', reg);
  const cached = await ev("caches.keys().then(function(keys){return keys.join(',')})");
  check('离线缓存已写入', /yimu-/.test(String(cached)), cached);

  // ---- install hint ----
  const tipText = await text('#instTip');
  check('安装提示存在（或已记住关闭）', tipText !== null, 'missing element');

  // ---- render ----
  await ev("localStorage.clear();location.reload();'r'");
  await sleep(1400);
  check('首页金额为 0', tight(await text('.hero-money')).indexOf('¥0') === 0, await text('.hero-money'));
  await shot('45-live-home-empty');

  // load demo data via UI
  await click('.nav-item[data-view=mine]');
  await sleep(250);
  await ev("(function(){var b=[].slice.call(document.querySelectorAll('[data-act=demo]'));if(b[0])b[0].click();})()");
  await sleep(700);
  await click('.nav-item[data-view=home]');
  await sleep(400);
  const hero = await text('.hero-money');
  check('示例数据后首页有金额', /\d/.test(String(hero)) && tight(hero) !== '¥0.00', hero);
  check('分类占比条渲染', (await ev("document.querySelectorAll('.stack > i').length")) >= 2);
  await shot('45-live-home');

  // quick add flow
  await click('.nav-fab');
  await sleep(420);
  await typeAmount('36.50');
  await click('[data-cat="餐饮"]');
  await click('[data-sheet="save"]');
  await sleep(500);
  const stored = JSON.parse(await ev("localStorage.getItem('yimu.v1')"));
  check('快速记账写入 localStorage', (stored.entries || []).some((e) => e.amount === 3650), JSON.stringify(stored.entries || []).slice(0, 120));
  check('保存后无弹层残留', (await ev("document.getElementById('sheetLayer').className.indexOf('open')")) === -1);

  for (const v of ['ledger', 'stats']) {
    await click('.nav-item[data-view=' + v + ']');
    await sleep(320);
    if (v === 'ledger') check('明细页有记录', (await ev("document.querySelectorAll('.tx').length")) > 0);
    await shot('45-live-' + v);
  }
  check('统计页有柱状图', (await ev("document.querySelectorAll('.bar, .day-bar, .col').length")) > 0);

  // CSV export on web (blob path)
  await click('.nav-item[data-view=mine]');
  await sleep(300);
  const csvBtn = await ev("(function(){var b=document.querySelector('[data-act=export]');return b?b.tagName:'none';})()");
  check('导出入口存在', csvBtn !== 'none', csvBtn);

  // reload persistence
  await ev("location.reload();'r'");
  await sleep(1300);
  const after = JSON.parse(await ev("localStorage.getItem('yimu.v1')"));
  check('刷新后数据仍在', (after.entries || []).some((e) => e.amount === 3650));

  // offline check: emulate offline, reload, expect app still renders from cache
  await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 });
  await ev("location.reload();'r'");
  await sleep(1800);
  const offlineHero = await text('.hero-money');
  check('断网后仍可打开（离线缓存）', offlineHero !== null && /\d/.test(String(offlineHero)), offlineHero);
  await shot('45-live-offline');

  check('无 JS 异常', exceptions.length === 0, exceptions.join(' | '));
  check('无 console 错误', consoleErrors.length === 0, consoleErrors.join(' | '));

  fs.writeFileSync(path.join(OUT, 'live-report.txt'),
    results.map((r) => (r.ok ? 'PASS ' : 'FAIL ') + r.name).join('\n') + '\n');

  const failed = results.filter((r) => !r.ok);
  console.log('\n' + (results.length - failed.length) + '/' + results.length + ' passed');
  ws.close();
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(2); });
