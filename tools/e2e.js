// End-to-end regression for 一目账, driven through headless Edge over CDP.
// Usage: node tools/e2e.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9247;
const OUT = 'C:\\Users\\zhoucm1\\yimu-zhang\\build';
const URL = 'file:///C:/Users/zhoucm1/yimu-zhang/app/assets/index.html';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function get(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => { let d = ''; r.on('data', (c) => d += c); r.on('end', () => res(d)); }).on('error', rej);
  });
}

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail === undefined ? '' : String(detail) });
  console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  <- ' + detail));
}

(async () => {
  const userDir = path.join(OUT, 'edge-profile-e2e');
  fs.mkdirSync(userDir, { recursive: true });
  execFile(EDGE, [
    '--headless=new', '--remote-debugging-port=' + PORT, '--user-data-dir=' + userDir,
    '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    '--window-size=390,844', '--force-device-scale-factor=2', 'about:blank'
  ], { detached: true, stdio: 'ignore' }).unref();

  let page = null;
  for (let i = 0; i < 40; i++) {
    try {
      const list = JSON.parse(await get('http://127.0.0.1:' + PORT + '/json/list'));
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
  ws.on('message', (m) => {
    const msg = JSON.parse(m);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    if (msg.method === 'Runtime.exceptionThrown') {
      exceptions.push(JSON.stringify(msg.params.exceptionDetails).slice(0, 400));
    }
    if (msg.method === 'Page.javascriptDialogOpening') {
      send('Page.handleJavaScriptDialog', { accept: true });
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
    if (r.result && r.result.exceptionDetails) {
      throw new Error('EVAL: ' + JSON.stringify(r.result.exceptionDetails).slice(0, 300));
    }
    return r.result && r.result.result ? r.result.result.value : null;
  }
  async function shot(name) {
    await sleep(420);
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(r.result.data, 'base64'));
    console.log('SHOT', name);
  }
  const q = (sel) => JSON.stringify(sel);
  async function click(sel) {
    const ok = await ev('(function(){var e=document.querySelector(' + q(sel) + ');if(!e)return false;e.click();return true;})()');
    if (!ok) throw new Error('missing element: ' + sel);
    await sleep(180);
  }
  async function key(k) {
    const ok = await ev('(function(){var e=document.querySelector("[data-key=\\"' + k + '\\"]");if(!e)return false;e.click();return true;})()');
    if (!ok) throw new Error('missing key: ' + k);
    await sleep(40);
  }
  async function typeAmount(str) {
    for (const k of String(str)) await key(k);
  }
  async function typeInto(sel, value, eventName) {
    return ev('(function(){var i=document.querySelector(' + q(sel) + ');if(!i)return false;i.value=' +
      JSON.stringify(String(value)) + ';i.dispatchEvent(new Event(' + JSON.stringify(eventName || 'input') +
      ',{bubbles:true}));return true;})()');
  }
  const store = () => ev("JSON.parse(localStorage.getItem('yimu.v1')||'{}')");
  const text = (sel) => ev('(function(){var e=document.querySelector(' + q(sel) + ');return e?e.innerText:null;})()');
  const bodyText = () => ev('document.body.innerText');
  const flat = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ');
  const tight = (v) => String(v == null ? '' : v).replace(/\s+/g, '');

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.navigate', { url: URL });
  await sleep(1300);

  // ---------- S0 empty state ----------
  await ev("localStorage.clear(); location.reload(); 'r'");
  await sleep(1100);
  check('空状态: 首页金额为 0', tight(await text('.hero-money')).indexOf('¥0') === 0, await text('.hero-money'));
  check('空状态: 有引导文案', (await bodyText()).indexOf('还不知道钱花在哪') >= 0);
  check('空状态: 没有示例记录', (await ev("document.querySelectorAll('.tx').length")) === 0);
  await shot('21-empty');

  // ---------- S1 add expense ----------
  await click('.nav-fab');
  await sleep(400);
  await typeAmount('88.00');
  check('键盘: 金额显示 88.00', String(await text('#amountView')).indexOf('88.00') === 0, await text('#amountView'));
  await click('[data-cat="买菜"]');
  await typeInto('#noteInput', '测试备注');
  await click('[data-sheet="save"]');
  await sleep(520);
  let s = await store();
  check('新增支出: 写入 1 笔', s.entries && s.entries.length === 1, JSON.stringify(s.entries));
  check('新增支出: 8800 分 / 买菜 / expense',
    s.entries[0].amount === 8800 && s.entries[0].cat === '买菜' && s.entries[0].type === 'expense',
    JSON.stringify(s.entries[0]));
  check('新增支出: 备注已保存', s.entries[0].note === '测试备注', s.entries[0].note);
  check('新增支出: 首页总额含 88', flat(await text('.hero-money')).indexOf('88') >= 0, flat(await text('.hero-money')));
  check('新增支出: 分类明细出现 买菜', (await text('.cat-list') || '').indexOf('买菜') >= 0);
  check('新增支出: 最近记录 -¥88.00', (await text('.tx-list') || '').indexOf('-¥88.00') >= 0, flat(await text('.tx-list')));
  check('新增支出: toast 提示已记下', (await text('#toast') || '').indexOf('已记下') >= 0, await text('#toast'));
  await shot('22-first-entry');

  // ---------- S2 add income ----------
  await click('.nav-fab');
  await sleep(400);
  await click('[data-type="income"]');
  await sleep(220);
  const chips = (await text('.chips')) || '';
  check('收入: 分类切换为收入分类', chips.indexOf('工资') >= 0 && chips.indexOf('餐饮') < 0, flat(chips));
  await typeAmount('5000');
  await click('[data-cat="工资"]');
  await click('[data-sheet="save"]');
  await sleep(500);
  s = await store();
  check('新增收入: 共 2 笔', s.entries.length === 2, JSON.stringify(s.entries.length));
  const income = s.entries.filter((e) => e.type === 'income')[0];
  check('新增收入: 500000 分 / 工资', income && income.amount === 500000 && income.cat === '工资', JSON.stringify(income));
  await click('.nav-item[data-view="ledger"]');
  await sleep(320);
  let sums = flat(await text('.sum-row'));
  check('明细: 支出 88 / 收入 5,000 / 结余 4,912',
    sums.indexOf('¥88') >= 0 && sums.indexOf('¥5,000') >= 0 && sums.indexOf('¥4,912') >= 0, sums);
  await shot('23-ledger-income');
  // ---------- S3 edit entry ----------
  const openedIncome = await ev("(function(){var rows=Array.prototype.slice.call(document.querySelectorAll('.tx'));var r=rows.filter(function(x){return x.querySelector('.tx-title').innerText==='工资';})[0];if(!r)return false;r.click();return true;})()");
  check('编辑: 能打开收入记录', openedIncome === true);
  await sleep(450);
  check('编辑: 金额回填 5,000', String(await text('#amountView')).indexOf('5,000') >= 0, await text('#amountView'));
  check('编辑: 分类高亮 工资', (await ev("(function(){var e=document.querySelector('[data-cat=\\\"工资\\\"]');return !!e&&e.classList.contains('on');})()")) === true);
  check('编辑: 显示删除按钮', (await ev("!!document.querySelector('[data-sheet=\\\"delete\\\"]')")) === true);
  for (let i = 0; i < 5; i++) await key('back');
  await typeAmount('4800');
  await click('[data-cat="奖金"]');
  await click('[data-sheet="save"]');
  await sleep(520);
  s = await store();
  const edited = s.entries.filter((e) => e.id === income.id)[0];
  check('编辑: 金额更新为 480000', edited && edited.amount === 480000, JSON.stringify(edited));
  check('编辑: 分类更新为 奖金', edited && edited.cat === '奖金', edited && edited.cat);
  check('编辑: 笔数仍为 2', s.entries.length === 2, s.entries.length);
  sums = flat(await text('.sum-row'));
  check('编辑: 收入 4,800 / 结余 4,712', sums.indexOf('¥4,800') >= 0 && sums.indexOf('¥4,712') >= 0, sums);
  check('编辑: toast 提示已更新', (await text('#toast') || '').indexOf('已更新') >= 0, await text('#toast'));
  await shot('24-edited');

  // ---------- S4 delete + undo ----------
  await click('.nav-item[data-view="home"]');
  await sleep(300);
  const openedExpense = await ev("(function(){var rows=Array.prototype.slice.call(document.querySelectorAll('.tx'));var r=rows.filter(function(x){return x.querySelector('.tx-title').innerText==='买菜';})[0];if(!r)return false;r.click();return true;})()");
  check('删除: 能打开支出记录', openedExpense === true);
  await sleep(450);
  await click('[data-sheet="delete"]');
  await sleep(600);
  s = await store();
  check('删除: 剩余 1 笔', s.entries.length === 1, s.entries.length);
  check('删除: 首页支出归零', tight(await text('.hero-money')).indexOf('¥0') === 0, await text('.hero-money'));
  check('删除: 出现撤销按钮', (await ev("!!document.getElementById('toastAction')")) === true);
  check('删除: toast 提示已删除', (await text('#toast') || '').indexOf('已删除') >= 0, await text('#toast'));
  await shot('25-deleted');
  await click('#toastAction');
  await sleep(450);
  s = await store();
  check('撤销: 恢复为 2 笔', s.entries.length === 2, s.entries.length);
  check('撤销: 88 元买菜记录已恢复', s.entries.some((e) => e.amount === 8800 && e.cat === '买菜'));
  check('撤销: toast 提示已恢复', (await text('#toast') || '').indexOf('已恢复') >= 0, await text('#toast'));
  await shot('26-undone');

  // ---------- S5 month switching ----------
  await click('.nav-item[data-view="ledger"]');
  await sleep(300);
  await click('.month-nav [data-step="-1"]');
  await sleep(350);
  check('翻月: 上月为空提示', (await bodyText()).indexOf('这个月还没有记录') >= 0);
  check('翻月: 上月支出为 0', flat(await text('.sum-row')).indexOf('¥0') >= 0, flat(await text('.sum-row')));
  await shot('27-prev-month');
  await click('.month-nav [data-act="month-today"]');
  await sleep(350);
  const backText = await bodyText();
  check('翻月: 回到本月记录恢复', backText.indexOf('奖金') >= 0 && backText.indexOf('买菜') >= 0, flat(backText).slice(0, 200));

  // ---------- S6 stats ----------
  await click('.nav-item[data-view="stats"]');
  await sleep(360);
  const stats = flat(await text('.stat-cards'));
  check('统计: 本月支出 88', stats.indexOf('¥88') >= 0, stats);
  check('统计: 最大一笔 88', stats.indexOf('最大一笔') >= 0 && stats.indexOf('¥88') >= 0, stats);
  check('统计: 记账笔数 1 笔', stats.indexOf('记账笔数 1 笔') >= 0 || /记账笔数 1笔/.test(stats), stats);
  const dim = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  check('统计: 日柱数 = 当月天数 (' + dim + ')', (await ev("document.querySelectorAll('.chart .bar').length")) === dim, await ev("document.querySelectorAll('.chart .bar').length"));
  check('统计: 分类排行含 买菜', (await text('.cat-list') || '').indexOf('买菜') >= 0);
  await shot('28-stats');

  // ---------- S7 budget ----------
  await click('.nav-item[data-view="mine"]');
  await sleep(300);
  await typeInto('#budgetInput', '1000');
  await click('[data-act="save-budget"]');
  await sleep(450);
  s = await store();
  check('预算: 保存 100000 分', s.budget === 100000, s.budget);
  check('预算: toast 显示 1,000', (await text('#toast') || '').indexOf('¥1,000') >= 0, await text('#toast'));
  await click('.nav-item[data-view="home"]');
  await sleep(320);
  const heroText = flat(await text('.hero'));
  check('预算: 首页显示剩余 912', heroText.indexOf('预算还剩') >= 0 && heroText.indexOf('¥912') >= 0, heroText);
  await shot('29-budget-home');

  await ev("location.reload(); 'r'");
  await sleep(1200);
  s = await store();
  check('持久化: 刷新后预算保留', s.budget === 100000, s.budget);
  check('持久化: 刷新后首页仍是剩余 912', flat(await text('.hero')).indexOf('¥912') >= 0, flat(await text('.hero')));
  await click('.nav-item[data-view="mine"]');
  await sleep(320);
  check('持久化: 输入框回填 1000', (await ev("document.getElementById('budgetInput').value")) === '1000', await ev("document.getElementById('budgetInput').value"));

  // ---------- S8 CSV ----------
  await ev("(function(){window.__csv=null;var OB=window.Blob;window.Blob=function(p,o){var b=new OB(p,o);window.__csvBlob=b;b.text().then(function(t){window.__csv=t;});return b;};window.URL.createObjectURL=function(){return 'blob:test';};HTMLAnchorElement.prototype.click=function(){};return true;})()");
  await click('[data-act="export"]');
  await sleep(700);
  const csv = await ev("window.__csv");
  check('CSV: 有内容', typeof csv === 'string' && csv.length > 0, typeof csv);
  const csvBytes = await ev("window.__csvBlob.arrayBuffer().then(function(b){return Array.prototype.slice.call(new Uint8Array(b,0,3));})");
  check('CSV: UTF-8 BOM (EF BB BF)', !!csvBytes && csvBytes[0] === 0xEF && csvBytes[1] === 0xBB && csvBytes[2] === 0xBF, JSON.stringify(csvBytes));
  check('CSV: 表头正确', !!csv && csv.indexOf('日期,时间,类型,分类,金额,备注') >= 0, !!csv && csv.split('\r\n')[0]);
  check('CSV: 含支出行', !!csv && csv.indexOf('支出,买菜,88.00,测试备注') >= 0);
  check('CSV: 含收入行', !!csv && csv.indexOf('收入,奖金,4800.00') >= 0);
  check('CSV: CRLF 换行', !!csv && csv.indexOf('\r\n') > 0);
  if (csv) fs.writeFileSync(path.join(OUT, 'export-sample.csv'), csv, 'utf8');
  check('CSV: 数据行数 = 记录数 + 表头', !!csv && csv.split('\r\n').length === 3, !!csv && csv.split('\r\n').length);

  // ---------- S9 validation ----------
  await click('.nav-fab');
  await sleep(400);
  await click('[data-sheet="save"]');
  await sleep(300);
  check('校验: 空金额被拦截', (await text('#toast') || '').indexOf('先输入金额') >= 0, await text('#toast'));
  await key('0');
  await click('[data-sheet="save"]');
  await sleep(300);
  check('校验: 金额 0 被拦截', (await store()).entries.length === 2, (await store()).entries.length);
  await click('.overlay');
  await sleep(350);

  // ---------- S10 back-dated entry ----------
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 15);
  const prevDate = prev.getFullYear() + '-' + String(prev.getMonth() + 1).padStart(2, '0') + '-15';
  await click('.nav-fab');
  await sleep(400);
  await typeAmount('10');
  await typeInto('#dateInput', prevDate, 'change');
  check('补记: 日期标签更新为 15 日', (await ev("document.querySelector('.date-btn span').innerText")).indexOf('15日') >= 0, await ev("document.querySelector('.date-btn span').innerText"));
  await click('[data-sheet="save"]');
  await sleep(600);
  s = await store();
  const backEntry = s.entries.filter((e) => e.amount === 1000)[0];
  check('补记: 保存到上个月', !!backEntry && new Date(backEntry.ts).getMonth() === prev.getMonth(), backEntry && new Date(backEntry.ts).toString());
  check('补记: 自动切到记录所在月份', tight(await text('.month-nav')).indexOf(prev.getFullYear() + '年' + (prev.getMonth() + 1) + '月') >= 0, await text('.month-nav'));
  check('补记: 总记录数为 3', s.entries.length === 3, s.entries.length);
  await shot('30-backdated');

  await click('.nav-item[data-view="home"]');
  await sleep(320);
  check('口径: 首页仍只统计本月 88', flat(await text('.hero-money')).indexOf('88') >= 0, flat(await text('.hero-money')));
  await shot('31-final-home');

  // ---------- report ----------
  check('无 JS 异常', exceptions.length === 0, exceptions.join(' | '));
  const failed = results.filter((r) => !r.ok);
  console.log('');
  console.log('RESULT ' + (results.length - failed.length) + '/' + results.length + ' passed');
  fs.writeFileSync(path.join(OUT, 'e2e-report.json'), JSON.stringify({ at: new Date().toISOString(), results }, null, 2), 'utf8');
  ws.close();
  process.exit(failed.length ? 2 : 0);
})().catch((e) => { console.error('FATAL', e && e.stack || e); process.exit(1); });
