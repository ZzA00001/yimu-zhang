const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9245;
const OUT = 'C:\\Users\\zhoucm1\\yimu-zhang\\build';
const URL = 'file:///C:/Users/zhoucm1/yimu-zhang/app/assets/index.html';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function get(url) {
  return new Promise((res, rej) => {
    http.get(url, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res(d)); }).on('error', rej);
  });
}

function demoData() {
  const now = new Date();
  const plan = [
    ['餐饮', 32, '早餐'], ['餐饮', 58, '午饭'], ['交通', 6, '地铁'], ['买菜', 86, '超市'],
    ['餐饮', 24, '咖啡'], ['购物', 199, '日用品'], ['居住', 2600, '房租'], ['娱乐', 52, '电影'],
    ['餐饮', 46, '外卖'], ['学习', 68, '课程'], ['交通', 18, '打车'], ['买菜', 64, '水果'],
    ['医疗', 58, '药'], ['人情', 200, '红包'], ['餐饮', 38, '面馆'], ['购物', 129, '换季'],
    ['娱乐', 88, '聚会'], ['居住', 268, '水电']
  ];
  const entries = [];
  for (let i = 0; i < plan.length; i++) {
    const day = Math.max(1, now.getDate() - 13 + i);
    const ts = new Date(now.getFullYear(), now.getMonth(), day, 9 + (i % 10), (i * 7) % 60).getTime();
    entries.push({ id: 's' + i, type: 'expense', amount: Math.round(plan[i][1] * 100), cat: plan[i][0], note: plan[i][2], ts });
  }
  entries.push({
    id: 'inc1', type: 'income', amount: 1280000, cat: '工资', note: '月薪',
    ts: new Date(now.getFullYear(), now.getMonth(), 5, 10, 0).getTime()
  });
  return JSON.stringify({ entries, budget: 800000, seen: true });
}

(async () => {
  const userDir = path.join(OUT, 'edge-profile2');
  fs.mkdirSync(userDir, { recursive: true });
  execFile(EDGE, [
    '--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + userDir,
    '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    '--window-size=390,844', '--force-device-scale-factor=2', 'about:blank'
  ], { detached: true, stdio: 'ignore' }).unref();

  let page = null;
  for (let i = 0; i < 40; i++) {
    try {
      const parsed = JSON.parse(await get('http://127.0.0.1:' + PORT + '/json/list'));
      page = parsed.find(x => x.type === 'page');
      if (page) break;
    } catch (e) { }
    await sleep(350);
  }
  if (!page) throw new Error('edge not ready');

  const WebSocket = require('C:/Users/zhoucm1/liuyao-guide/node_modules/ws');
  const ws = new WebSocket(page.webSocketDebuggerUrl, { perMessageDeflate: false });
  let id = 0;
  const pending = new Map();
  const logs = [];
  ws.on('message', m => {
    const msg = JSON.parse(m);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.consoleAPICalled') logs.push(msg.params.args.map(a => a.value).join(' '));
    if (msg.method === 'Runtime.exceptionThrown') logs.push('EXC ' + JSON.stringify(msg.params.exceptionDetails).slice(0, 300));
  });
  await new Promise((res, rej) => { ws.on('open', res); ws.on('error', rej); });

  function send(method, params) {
    return new Promise(res => {
      const n = ++id;
      pending.set(n, res);
      ws.send(JSON.stringify({ id: n, method, params: params || {} }));
    });
  }
  async function ev(expr) {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result && r.result.exceptionDetails) console.log('EVAL ERROR', JSON.stringify(r.result.exceptionDetails).slice(0, 500));
    return r.result && r.result.result ? r.result.result.value : null;
  }
  async function shot(name) {
    await sleep(500);
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.result.data, 'base64'));
    console.log('SHOT', name);
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.navigate', { url: URL });
  await sleep(1400);

  await ev("localStorage.clear();");
  const b64 = Buffer.from(demoData(), 'utf8').toString('base64');
  await ev("localStorage.setItem('yimu.v1', decodeURIComponent(escape(atob('" + b64 + "')))); 'ok'");
  await ev("location.reload(); 'reload'");
  await sleep(1200);
  await shot('11-home');

  await ev("document.querySelector('.nav-item[data-view=ledger]').click(); 'ledger'");
  await shot('12-ledger');

  await ev("document.querySelector('.nav-item[data-view=stats]').click(); 'stats'");
  await shot('13-stats');

  await ev("document.querySelector('.nav-item[data-view=mine]').click(); 'mine'");
  await shot('14-mine');

  await ev("document.querySelector('.nav-fab').click(); 'add'");
  await sleep(600);
  await shot('15-add');

  await ev("['3','8','.','5'].forEach(function(k){document.querySelector('[data-key=\"'+k+'\"]').click();}); 'typed'");
  await ev("document.querySelector('[data-cat=买菜]').click(); 'cat'");
  await sleep(200);
  await shot('16-add-filled');

  await ev("document.querySelector('[data-sheet=save]').click(); 'saved'");
  await sleep(700);
  await shot('17-after-save');

  console.log('TITLE', await ev("document.querySelector('.hero-money').innerText"));
  console.log('LOGS', JSON.stringify(logs.slice(0, 10)));
  console.log('DONE');
  ws.close();
  process.exit(0);
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });