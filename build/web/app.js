(function () {
  'use strict';

  var STORAGE_KEY = 'yimu.v1';
  var WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  var EXPENSE_CATS = [
    { name: '餐饮', color: '#E0783C', icon: 'food' },
    { name: '买菜', color: '#6E9C4B', icon: 'veg' },
    { name: '交通', color: '#3E84B4', icon: 'car' },
    { name: '购物', color: '#B4638F', icon: 'bag' },
    { name: '居住', color: '#8A7A5E', icon: 'home' },
    { name: '娱乐', color: '#7E64B5', icon: 'play' },
    { name: '医疗', color: '#C2554F', icon: 'heart' },
    { name: '学习', color: '#3E8E8A', icon: 'book' },
    { name: '人情', color: '#C9963F', icon: 'gift' },
    { name: '其他', color: '#7C8A82', icon: 'dots' }
  ];

  var INCOME_CATS = [
    { name: '工资', color: '#1D6A4E', icon: 'wallet' },
    { name: '奖金', color: '#C9963F', icon: 'star' },
    { name: '兼职', color: '#3E84B4', icon: 'case' },
    { name: '理财', color: '#6E9C4B', icon: 'trend' },
    { name: '红包', color: '#C2554F', icon: 'envelope' },
    { name: '其他', color: '#7C8A82', icon: 'dots' }
  ];

  var ICONS = {
    home: '<path d="M3.6 10.4 12 3.6l8.4 6.8V20a.8.8 0 0 1-.8.8h-4.6v-6.1H9.9v6.1H4.4a.8.8 0 0 1-.8-.8z"/>',
    list: '<path d="M8.5 6.5h11.5M8.5 12h11.5M8.5 17.5h11.5"/><circle cx="4.2" cy="6.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.2" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="4.2" cy="17.5" r="1.1" fill="currentColor" stroke="none"/>',
    chart: '<path d="M5 20v-6.5M12 20V4.8M19 20V9.5"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M4.6 20.2c0-3.4 3.3-5.5 7.4-5.5s7.4 2.1 7.4 5.5"/>',
    plus: '<path d="M12 5.2v13.6M5.2 12h13.6"/>',
    back: '<path d="M9 6h10.2a1.8 1.8 0 0 1 1.8 1.8v8.4a1.8 1.8 0 0 1-1.8 1.8H9L3.4 12z"/><path d="M12.6 9.6l4.8 4.8M17.4 9.6l-4.8 4.8"/>',
    cal: '<rect x="3.6" y="5.2" width="16.8" height="15.2" rx="2.6"/><path d="M8 3.2v4M16 3.2v4M3.6 10h16.8"/>',
    trash: '<path d="M4.2 7h15.6M9.6 7V4.9h4.8V7M6.6 7l.8 13h9.2l.8-13M10.1 11v5.6M13.9 11v5.6"/>',
    left: '<path d="M14.5 6.5 9 12l5.5 5.5"/>',
    right: '<path d="M9.5 6.5 15 12l-5.5 5.5"/>',
    down: '<path d="M12 4v11M7.5 10.8 12 15.3l4.5-4.5M4.5 20h15"/>',
    slider: '<path d="M4 8h6M14 8h6M4 16h10M18 16h2"/><circle cx="12" cy="8" r="2"/><circle cx="16" cy="16" r="2"/>',
    check: '<path d="M5 12.6l4.4 4.4L19 7.4"/>',
    spark: '<path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3M6 6l2.1 2.1M15.9 15.9 18 18M18 6l-2.1 2.1M8.1 15.9 6 18"/><circle cx="12" cy="12" r="3"/>',
    food: '<path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M8.2 7.3c0-1 .9-1.2.9-2.3M12 7.3c0-1 .9-1.2.9-2.3M15.8 7.3c0-1 .9-1.2.9-2.3"/>',
    veg: '<circle cx="12" cy="14.2" r="5.2"/><path d="M12 9V5.8M12 5.8c1.9 0 3.2-1 3.4-2.8M12 5.8c-1.9 0-3.2-1-3.4-2.8"/>',
    car: '<path d="M4.2 16.2v-3.1l2-5.1h11.6l2 5.1v3.1"/><path d="M4.2 13.1h15.6"/><circle cx="7.6" cy="17.4" r="1.7"/><circle cx="16.4" cy="17.4" r="1.7"/>',
    bag: '<path d="M5.6 8h12.8l-1 12.2H6.6z"/><path d="M9.1 8V6a2.9 2.9 0 0 1 5.8 0v2"/>',
    play: '<circle cx="12" cy="12" r="8.4"/><path d="M10.4 9.2l5 2.8-5 2.8z" fill="currentColor" stroke-width="1.2"/>',
    heart: '<path d="M12 20s-7-4.4-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 4.6-7 9-7 9z"/>',
    book: '<path d="M4 5.6h6a2 2 0 0 1 2 2V20a2.6 2.6 0 0 0-2.6-2.6H4z"/><path d="M20 5.6h-6a2 2 0 0 0-2 2V20a2.6 2.6 0 0 1 2.6-2.6H20z"/>',
    gift: '<rect x="4" y="9.2" width="16" height="11.2" rx="2"/><path d="M3.2 9.2h17.6v3.2H3.2zM12 9.2V20.4"/><path d="M12 9.2C10.6 5.8 6.2 5.6 6.2 8.4c0 1.3 2.4.8 5.8.8zM12 9.2c1.4-3.4 5.8-3.6 5.8-.8 0 1.3-2.4.8-5.8.8z"/>',
    dots: '<circle cx="6" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="18" cy="12" r="1.5" fill="currentColor" stroke="none"/>',
    wallet: '<rect x="3.2" y="6.4" width="17.6" height="13.2" rx="3"/><path d="M3.2 10.2h17.6"/><circle cx="16.6" cy="14.8" r="1.3"/>',
    star: '<path d="M12 3.8l2.5 5.1 5.6.8-4 4 .9 5.6-5-2.7-5 2.7.9-5.6-4-4 5.6-.8z"/>',
    case: '<rect x="3.2" y="7.2" width="17.6" height="12.4" rx="2.6"/><path d="M9 7.2V5.6a1.4 1.4 0 0 1 1.4-1.4h3.2A1.4 1.4 0 0 1 15 5.6v1.6M3.2 12.6h17.6"/>',
    trend: '<path d="M4 16.6l5-5 3.2 3.2 7.8-7.4"/><path d="M15 7.4h5v5"/>',
    envelope: '<rect x="3.2" y="5.6" width="17.6" height="12.8" rx="2.4"/><path d="M3.6 7.6l8.4 5.6 8.4-5.6"/>'
  };

  function icon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[name] || ICONS.dots) + '</svg>';
  }

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function each(list, fn) { for (var i = 0; i < list.length; i++) { fn(list[i], i); } }

  function rgba(hex, a) {
    var h = hex.replace('#', '');
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  function catOf(name) {
    var all = EXPENSE_CATS.concat(INCOME_CATS);
    for (var i = 0; i < all.length; i++) { if (all[i].name === name) return all[i]; }
    return { name: name || '其他', color: '#7C8A82', icon: 'dots' };
  }

  function fmt(cents, trim) {
    var neg = cents < 0;
    var v = Math.abs(cents) / 100;
    var parts = v.toFixed(2).split('.');
    var int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (trim && parts[1] === '00') { return (neg ? '-' : '') + int; }
    return (neg ? '-' : '') + int + '.' + parts[1];
  }

  function keyOf(ts) {
    var d = new Date(ts);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function ymOf(date) { return date.getFullYear() + '-' + pad2(date.getMonth() + 1); }
  function todayKey() { return keyOf(Date.now()); }

  function dateLabel(key) {
    if (key === todayKey()) return '今天';
    var y = new Date(); y.setDate(y.getDate() - 1);
    if (key === keyOf(y.getTime())) return '昨天';
    var p = key.split('-');
    return parseInt(p[1], 10) + '月' + parseInt(p[2], 10) + '日';
  }
  function longDate(date) {
    return (date.getMonth() + 1) + '月' + date.getDate() + '日 · ' + WEEKDAYS[date.getDay()];
  }
  /* ---------------- data ---------------- */

  var store = { entries: [], budget: 0, seen: false, lastCatExpense: '餐饮', lastCatIncome: '工资' };
  var lastDeleted = null;

  function loadStore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (!data) return;
      if (Object.prototype.toString.call(data.entries) === '[object Array]') {
        var clean = [];
        each(data.entries, function (e) {
          if (!e || typeof e !== 'object') return;
          var amount = Math.round(Number(e.amount));
          if (!isFinite(amount) || amount <= 0) return;
          clean.push({
            id: String(e.id || (Date.now().toString(36) + Math.random().toString(36).slice(2, 6))),
            type: e.type === 'income' ? 'income' : 'expense',
            amount: amount,
            cat: String(e.cat || '其他'),
            note: String(e.note || '').slice(0, 40),
            ts: Number(e.ts) || Date.now()
          });
        });
        store.entries = clean;
      }
      store.budget = Math.max(0, parseInt(data.budget, 10) || 0);
      store.seen = !!data.seen;
      store.lastCatExpense = data.lastCatExpense || '餐饮';
      store.lastCatIncome = data.lastCatIncome || '工资';
    } catch (e) { }
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        entries: store.entries,
        budget: store.budget,
        seen: store.seen,
        lastCatExpense: store.lastCatExpense,
        lastCatIncome: store.lastCatIncome
      }));
    } catch (e) { }
  }

  function sorted() {
    return store.entries.slice().sort(function (a, b) { return b.ts - a.ts; });
  }
  function inMonth(ym) {
    var out = [];
    each(store.entries, function (e) { if (keyOf(e.ts).substring(0, 7) === ym) out.push(e); });
    return out;
  }
  function sumOf(list, type) {
    var total = 0;
    each(list, function (e) { if (e.type === type) total += e.amount; });
    return total;
  }
  function byCategory(list) {
    var map = {}, out = [];
    each(list, function (e) {
      if (e.type !== 'expense') return;
      if (!map[e.cat]) { map[e.cat] = { cat: e.cat, amount: 0, count: 0 }; out.push(map[e.cat]); }
      map[e.cat].amount += e.amount;
      map[e.cat].count += 1;
    });
    out.sort(function (a, b) { return b.amount - a.amount; });
    return out;
  }

  function catIcon(cat, cls) {
    var c = catOf(cat);
    return '<span class="' + (cls || 'cat-ic') + '" style="color:' + c.color + ';background:' + rgba(c.color, 0.1) + '">' + icon(c.icon) + '</span>';
  }

  /* ---------------- views ---------------- */

  var ui = { view: 'home', month: new Date(), monthTouched: false };

  function topbar() {
    if (ui.view === 'home') {
      return '<div class="topbar"><div><div class="eyebrow">' + longDate(new Date()).replace(' · ', '  ') + '</div>' +
        '<h1>一目账</h1></div>' +
        '<button class="icon-btn" data-act="nav" data-view="mine" aria-label="设置">' + icon('slider') + '</button></div>';
    }
    if (ui.view === 'ledger') {
      return '<div class="topbar"><div><div class="eyebrow">每一笔都有去处</div><h1>收支明细</h1></div>' +
        '<button class="icon-btn" data-act="nav" data-view="stats" aria-label="统计">' + icon('chart') + '</button></div>';
    }
    if (ui.view === 'stats') {
      return '<div class="topbar"><div><div class="eyebrow">看见规律，才管得住</div><h1>消费统计</h1></div>' +
        '<button class="icon-btn" data-act="nav" data-view="home" aria-label="回首页">' + icon('home') + '</button></div>';
    }
    return '<div class="topbar"><div><div class="eyebrow">只存本机，不联网</div><h1>我的</h1></div></div>';
  }

  function hero() {
    var now = new Date();
    var list = inMonth(ymOf(now));
    var spent = sumOf(list, 'expense');
    var avg = Math.round(spent / Math.max(1, now.getDate()));
    var budget = store.budget;
    var todaySpent = 0;
    each(list, function (e) {
      if (e.type === 'expense' && keyOf(e.ts) === todayKey()) todaySpent += e.amount;
    });

    var parts = fmt(spent, false).split('.');
    var amountHtml = '<span class="cur">¥</span><b>' + parts[0] + '</b>' +
      (parts[1] === '00' ? '' : '<small>.' + parts[1] + '</small>');

    var pct = 0;
    var right, sub;
    if (budget > 0) {
      pct = Math.min(100, spent / budget * 100);
      var remain = budget - spent;
      right = '<span class="hero-budget">月预算 ¥' + fmt(budget, true) + '</span>';
      sub = remain >= 0
        ? '预算还剩 <strong>¥' + fmt(remain, true) + '</strong>'
        : '已超支 <strong>¥' + fmt(-remain, true) + '</strong>';
    } else {
      right = '<button class="hero-set" data-act="nav" data-view="mine">设置预算</button>';
      sub = '设一个月预算，花钱更有数';
    }

    return '<section class="hero">' +
      '<div class="hero-head"><span class="hero-label">本月支出</span>' + right + '</div>' +
      '<div class="hero-money num">' + amountHtml + '</div>' +
      '<div class="hero-sub">' + sub + '</div>' +
      '<div class="track"><i style="width:' + pct.toFixed(2) + '%"></i></div>' +
      '<div class="hero-foot">' +
      '<div>今日<b class="num">¥' + fmt(todaySpent, true) + '</b></div>' +
      '<div>日均<b class="num">¥' + fmt(avg, true) + '</b></div>' +
      '<div>本月笔数<b class="num">' + list.length + '</b></div>' +
      '</div></section>';
  }

  function stackBar(rows, total) {
    if (!total) return '';
    var html = '<div class="stack">';
    each(rows, function (r) {
      var w = r.amount / total * 100;
      html += '<i style="width:' + w.toFixed(2) + '%;background:' + catOf(r.cat).color + '"></i>';
    });
    return html + '</div>';
  }

  function categoryCard() {
    var list = inMonth(ymOf(new Date()));
    var rows = byCategory(list);
    var spent = sumOf(list, 'expense');
    if (!rows.length) {
      return '<div class="card empty"><div class="mark">' + icon('spark') + '</div>' +
        '<h3>还不知道钱花在哪</h3><p>点下面的 + 记下第一笔，<br>这里会按分类告诉你答案。</p></div>';
    }
    var html = '<div class="card">' + stackBar(rows, spent) + '<ul class="cat-list">';
    each(rows.slice(0, 5), function (r) {
      var pct = spent ? Math.round(r.amount / spent * 100) : 0;
      html += '<li><div class="cat-line">' + catIcon(r.cat) +
        '<div><div class="cat-name">' + esc(r.cat) + '</div><div class="cat-meta">' + r.count + ' 笔 · ' + pct + '%</div></div>' +
        '<div class="cat-amount"><b class="num">¥' + fmt(r.amount, false) + '</b><span>' + pct + '%</span></div></div>' +
        '<div class="cat-bar"><i style="width:' + Math.max(2, pct) + '%;background:' + catOf(r.cat).color + '"></i></div></li>';
    });
    return html + '</ul></div>';
  }

  function txRow(e, showDate) {
    var c = catOf(e.cat);
    var sub = e.note ? esc(e.note) : (showDate ? dateLabel(keyOf(e.ts)) : '');
    var d = new Date(e.ts);
    var time = pad2(d.getHours()) + ':' + pad2(d.getMinutes());
    return '<li class="tx" data-act="edit" data-id="' + esc(e.id) + '">' +
      '<span class="tx-ic" style="color:' + c.color + ';background:' + rgba(c.color, 0.1) + '">' + icon(c.icon) + '</span>' +
      '<div class="tx-main"><div class="tx-title">' + esc(e.cat) + '</div>' +
      '<div class="tx-note">' + (sub || time) + '</div></div>' +
      '<div><div class="tx-amt num' + (e.type === 'income' ? ' income' : '') + '">' +
      (e.type === 'income' ? '+' : '-') + '¥' + fmt(e.amount, false) + '</div>' +
      '<div class="tx-time">' + (e.type === 'income' ? '收入' : time) + '</div></div></li>';
  }

  function recentCard() {
    var list = sorted().slice(0, 6);
    if (!list.length) return '';
    var html = '<div class="card tight"><ul class="tx-list">';
    each(list, function (e) { html += txRow(e, true); });
    return html + '</ul></div>';
  }

  function viewHome() {
    var html = hero();
    html += '<div class="section"><div class="section-head"><h2>钱花在哪</h2><span class="hint">本月</span></div>' +
      categoryCard() + '</div>';
    var recent = recentCard();
    if (recent) {
      html += '<div class="section"><div class="section-head"><h2>最近</h2>' +
        '<button class="link" data-act="nav" data-view="ledger">全部明细</button></div>' + recent + '</div>';
    }
    return html;
  }

  function monthSwitcher() {
    var m = ui.month;
    var isCurrent = ymOf(m) === ymOf(new Date());
    return '<div class="month-nav">' +
      '<button class="arrow" data-act="month" data-step="-1" aria-label="上个月">' + icon('left') + '</button>' +
      '<h1 class="num">' + m.getFullYear() + '年' + (m.getMonth() + 1) + '月</h1>' +
      '<button class="arrow" data-act="month" data-step="1" aria-label="下个月">' + icon('right') + '</button>' +
      (isCurrent ? '<span class="today-chip">本月</span>' : '<button class="today-chip" data-act="month-today">回到本月</button>') +
      '</div>';
  }

  function viewLedger() {
    var list = inMonth(ymOf(ui.month)).sort(function (a, b) { return b.ts - a.ts; });
    var spent = sumOf(list, 'expense');
    var income = sumOf(list, 'income');
    var html = monthSwitcher();
    html += '<div class="sum-row"><div><span>支出</span><b class="num">¥' + fmt(spent, true) + '</b></div>' +
      '<div><span>收入</span><b class="num income">¥' + fmt(income, true) + '</b></div>' +
      '<div><span>结余</span><b class="num">¥' + fmt(income - spent, true) + '</b></div></div>';

    if (!list.length) {
      return html + '<div class="section"><div class="card empty"><div class="mark">' + icon('list') + '</div>' +
        '<h3>这个月还没有记录</h3><p>翻翻别的月份，或者现在记一笔。</p></div></div>';
    }

    var days = [], map = {};
    each(list, function (e) {
      var k = keyOf(e.ts);
      if (!map[k]) { map[k] = { key: k, items: [], spent: 0, income: 0 }; days.push(map[k]); }
      map[k].items.push(e);
      if (e.type === 'expense') map[k].spent += e.amount; else map[k].income += e.amount;
    });

    each(days, function (day) {
      var d = new Date(day.key + 'T00:00:00');
      html += '<div class="day-head"><span class="d">' + (d.getMonth() + 1) + '月' + d.getDate() + '日' +
        '<small>' + WEEKDAYS[d.getDay()] + (day.key === todayKey() ? ' · 今天' : '') + '</small></span>' +
        '<span class="t num">支出 ¥' + fmt(day.spent, true) + (day.income ? '  收入 ¥' + fmt(day.income, true) : '') + '</span></div>';
      html += '<div class="card tight"><ul class="tx-list">';
      each(day.items, function (e) { html += txRow(e, false); });
      html += '</ul></div>';
    });
    return html;
  }

  function viewStats() {
    var ym = ymOf(ui.month);
    var list = inMonth(ym);
    var spent = sumOf(list, 'expense');
    var rows = byCategory(list);
    var m = ui.month;
    var now = new Date();
    var isCurrent = ym === ymOf(now);
    var daysInMonth = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    var elapsed = isCurrent ? now.getDate() : daysInMonth;
    var avg = Math.round(spent / Math.max(1, elapsed));
    var maxOne = 0, count = 0;
    each(list, function (e) {
      if (e.type !== 'expense') return;
      count++;
      if (e.amount > maxOne) maxOne = e.amount;
    });

    var html = monthSwitcher();
    html += '<div class="stat-cards">' +
      '<div class="stat"><span>本月支出</span><b class="num">¥' + fmt(spent, true) + '</b></div>' +
      '<div class="stat"><span>日均支出</span><b class="num">¥' + fmt(avg, true) + '</b></div>' +
      '<div class="stat"><span>最大一笔</span><b class="num">¥' + fmt(maxOne, true) + '</b></div>' +
      '<div class="stat"><span>记账笔数</span><b class="num">' + count + '<small>笔</small></b></div>' +
      '</div>';

    var daily = [], maxDay = 0, i;
    for (i = 0; i < daysInMonth; i++) daily.push(0);
    each(list, function (e) {
      if (e.type !== 'expense') return;
      var d = new Date(e.ts).getDate() - 1;
      daily[d] += e.amount;
      if (daily[d] > maxDay) maxDay = daily[d];
    });
    if (!maxDay) maxDay = 1;

    html += '<div class="section"><div class="section-head"><h2>每天花了多少</h2>' +
      '<span class="hint">单日最高 ¥' + fmt(maxDay, true) + '</span></div><div class="card">' +
      '<div class="chart">';
    for (i = 0; i < daysInMonth; i++) {
      var pct = daily[i] ? Math.max(4, daily[i] / maxDay * 100) : 0;
      var cls = daily[i] ? 'bar' : 'bar zero';
      if (isCurrent && i === now.getDate() - 1) cls += ' today';
      html += '<div class="' + cls + '"><i style="height:' + pct.toFixed(1) + '%"></i></div>';
    }
    html += '</div><div class="chart-axis"><span>1日</span><span>10日</span><span>20日</span><span>' + daysInMonth + '日</span></div></div></div>';

    html += '<div class="section"><div class="section-head"><h2>分类排行</h2><span class="hint">共 ' + count + ' 笔</span></div>';
    if (!rows.length) {
      html += '<div class="card rank-empty">这个月还没有支出记录</div>';
    } else {
      html += '<div class="card"><ul class="cat-list">';
      each(rows, function (r) {
        var pct = spent ? Math.round(r.amount / spent * 100) : 0;
        html += '<li><div class="cat-line">' + catIcon(r.cat) +
          '<div><div class="cat-name">' + esc(r.cat) + '</div><div class="cat-meta">' + pct + '% · ' + r.count + ' 笔</div></div>' +
          '<div class="cat-amount"><b class="num">¥' + fmt(r.amount, true) + '</b></div></div>' +
          '<div class="cat-bar"><i style="width:' + Math.max(2, pct) + '%;background:' + catOf(r.cat).color + '"></i></div></li>';
      });
      html += '</ul></div>';
    }
    return html + '</div>';
  }

  function viewMine() {
    var budget = store.budget;
    var html = '<div class="card"><div class="section-head" style="padding:0 0 10px"><h2>每月预算</h2>' +
      '<span class="hint">' + (budget ? '当前 ¥' + fmt(budget, true) : '还没设置') + '</span></div>' +
      '<div class="budget-input"><span class="yuan">¥</span>' +
      '<input id="budgetInput" type="number" inputmode="numeric" min="0" step="100" placeholder="例如 5000" value="' +
      (budget ? (budget / 100) : '') + '"></div>' +
      '<button class="save-btn" data-act="save-budget">保存预算</button>' +
      '<p class="footnote" style="padding:10px 0 0;text-align:left">设好后，首页会显示“预算还剩多少”，超支会提醒你。</p></div>';

    html += '<div class="section"><div class="section-head"><h2>数据</h2><span class="hint">共 ' + store.entries.length + ' 笔</span></div><div class="card tight">' +
      '<div class="mine-card"><span class="cat-ic" style="color:#3E84B4;background:rgba(62,132,180,.1)">' + icon('down') + '</span>' +
      '<div class="txt"><b>导出 CSV 表格</b><span>用 Excel / WPS 打开，随时备份</span></div>' +
      '<button class="chev" data-act="export" aria-label="导出">' + icon('right') + '</button></div>' +
      '<div class="divider"></div>' +
      '<div class="mine-card"><span class="cat-ic" style="color:#C9963F;background:rgba(201,150,63,.1)">' + icon('spark') + '</span>' +
      '<div class="txt"><b>填入示例数据</b><span>先看看有数据时的样子</span></div>' +
      '<button class="chev" data-act="demo" aria-label="示例数据">' + icon('right') + '</button></div>' +
      '</div></div>';

    html += '<div class="section"><div class="card tight"><div class="mine-card">' +
      '<span class="cat-ic" style="color:#B4443C;background:rgba(180,68,60,.08)">' + icon('trash') + '</span>' +
      '<div class="txt"><b>清空全部记录</b><span>删除后无法恢复</span></div>' +
      '<button class="chev" data-act="clear" aria-label="清空">' + icon('right') + '</button></div></div></div>';

    html += '<p class="footnote">一目账 v1.0<br>所有账目只保存在这台手机里<br>不注册 · 不联网 · 不上传 · 无广告</p>';
    return html;
  }

  function navHtml() {
    function item(view, label, ic) {
      return '<button class="nav-item' + (ui.view === view ? ' active' : '') + '" data-act="nav" data-view="' + view + '">' +
        icon(ic) + '<span>' + label + '</span></button>';
    }
    return '<nav class="nav"><div class="nav-inner">' +
      item('home', '首页', 'home') +
      item('ledger', '明细', 'list') +
      '<button class="nav-fab" data-act="add" aria-label="记一笔">' + icon('plus') + '</button>' +
      item('stats', '统计', 'chart') +
      item('mine', '我的', 'user') +
      '</div></nav>';
  }

  function render() {
    var html = topbar();
    if (ui.view === 'home') html += viewHome();
    else if (ui.view === 'ledger') html += viewLedger();
    else if (ui.view === 'stats') html += viewStats();
    else html += viewMine();
    html += navHtml();
    document.getElementById('app').innerHTML = html;
  }
  /* ---------------- toast ---------------- */

  var toastTimer = null;
  function toast(message, actionLabel, action) {
    var el = document.getElementById('toast');
    el.innerHTML = '<span>' + esc(message) + '</span>' +
      (actionLabel ? '<button id="toastAction">' + esc(actionLabel) + '</button>' : '');
    el.classList.add('show');
    if (actionLabel) {
      document.getElementById('toastAction').onclick = function () {
        hideToast();
        if (action) action();
      };
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, actionLabel ? 4200 : 1900);
  }
  function hideToast() {
    document.getElementById('toast').classList.remove('show');
  }

  function buzz() {
    try { if (window.NativeApp) window.NativeApp.vibrate(8); } catch (e) { }
  }

  /* ---------------- add / edit sheet ---------------- */

  var sheet = { open: false, type: 'expense', cat: '餐饮', amount: '', note: '', date: '', editId: null };

  function openSheet(entry) {
    sheet.open = true;
    sheet.editId = entry ? entry.id : null;
    sheet.type = entry ? entry.type : 'expense';
    sheet.cat = entry ? entry.cat : (sheet.type === 'expense' ? (store.lastCatExpense || '餐饮') : (store.lastCatIncome || '工资'));
    sheet.amount = entry ? (entry.amount / 100).toFixed(2).replace(/\.00$/, '') : '';
    sheet.note = entry ? (entry.note || '') : '';
    sheet.date = entry ? keyOf(entry.ts) : todayKey();
    renderSheet();
    var layer = document.getElementById('sheetLayer');
    layer.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(function () { layer.classList.add('open'); });
  }

  function closeSheet() {
    var layer = document.getElementById('sheetLayer');
    layer.classList.remove('open');
    layer.setAttribute('aria-hidden', 'true');
    sheet.open = false;
    setTimeout(function () {
      if (!sheet.open) layer.innerHTML = '';
    }, 280);
  }

  function typeCats() { return sheet.type === 'expense' ? EXPENSE_CATS : INCOME_CATS; }

  function amountDisplay() {
    var raw = sheet.amount;
    if (!raw) return '<span class="ph">0</span><span class="caret"></span>';
    var parts = raw.split('.');
    var int = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    var rest = parts.length > 1 ? '.' + parts.slice(1).join('') : '';
    return int + rest + '<span class="caret"></span>';
  }

  function renderSheet() {
    var html = '<div class="overlay" data-close="1"></div><div class="sheet">';
    html += '<div class="grab"></div><div class="sheet-head">';
    html += '<div class="seg"><button data-type="expense" class="' + (sheet.type === 'expense' ? 'on' : '') + '">支出</button>' +
      '<button data-type="income" class="' + (sheet.type === 'income' ? 'on' : '') + '">收入</button></div>';
    html += sheet.editId
      ? '<button class="del" data-sheet="delete" aria-label="删除">' + icon('trash') + '</button>'
      : '<span style="width:32px"></span>';
    html += '</div>';

    html += '<div class="amount-box"><span class="amount-cur">¥</span>' +
      '<span class="amount-view num" id="amountView">' + amountDisplay() + '</span></div>';

    html += '<div class="chips" id="chips">';
    each(typeCats(), function (c) {
      html += '<button class="chip' + (c.name === sheet.cat ? ' on' : '') + '" data-cat="' + esc(c.name) + '"' +
        ' style="--c:' + c.color + '">' + icon(c.icon) + esc(c.name) + '</button>';
    });
    html += '</div>';

    html += '<div class="note-row"><input id="noteInput" type="text" maxlength="40" placeholder="备注（可选）" value="' +
      esc(sheet.note) + '">' +
      '<label class="date-btn">' + icon('cal') + '<span>' + dateLabel(sheet.date) + '</span>' +
      '<input id="dateInput" type="date" value="' + sheet.date + '"></label></div>';

    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'];
    html += '<div class="keypad">';
    each(keys, function (k) {
      if (k === 'back') {
        html += '<button class="key fn" data-key="back" aria-label="退格">' + icon('back') + '</button>';
      } else {
        html += '<button class="key" data-key="' + k + '">' + k + '</button>';
      }
    });
    html += '</div>';

    html += '<button class="primary" data-sheet="save">保存这笔</button>';
    html += '</div>';

    document.getElementById('sheetLayer').innerHTML = html;
    bindSheet();
  }

  function updateAmountView() {
    var el = document.getElementById('amountView');
    if (el) el.innerHTML = amountDisplay();
  }

  function pressKey(k) {
    if (k === 'back') {
      sheet.amount = sheet.amount.slice(0, -1);
    } else if (k === '.') {
      if (sheet.amount.indexOf('.') < 0) sheet.amount = (sheet.amount || '0') + '.';
    } else {
      var dot = sheet.amount.indexOf('.');
      if (dot >= 0 && sheet.amount.length - dot > 2) return false;
      if (dot < 0 && sheet.amount.length >= 7) return false;
      sheet.amount = (sheet.amount === '0' ? '' : sheet.amount) + k;
    }
    return true;
  }

  function bindSheet() {
    var layer = document.getElementById('sheetLayer');

    layer.querySelectorAll('[data-key]').forEach(function (el) {
      el.addEventListener('click', function () {
        if (pressKey(el.getAttribute('data-key'))) {
          updateAmountView();
          buzz();
        }
      });
    });

    layer.querySelectorAll('[data-type]').forEach(function (el) {
      el.addEventListener('click', function () {
        var t = el.getAttribute('data-type');
        if (t === sheet.type) return;
        sheet.type = t;
        var cats = typeCats(), found = false;
        each(cats, function (c) { if (c.name === sheet.cat) found = true; });
        if (!found) sheet.cat = cats[0].name;
        renderSheet();
      });
    });

    layer.querySelectorAll('[data-cat]').forEach(function (el) {
      el.addEventListener('click', function () {
        sheet.cat = el.getAttribute('data-cat');
        layer.querySelectorAll('[data-cat]').forEach(function (n) { n.classList.remove('on'); });
        el.classList.add('on');
        buzz();
      });
    });

    var note = document.getElementById('noteInput');
    if (note) {
      note.addEventListener('input', function () { sheet.note = note.value; });
      note.addEventListener('change', function () { sheet.note = note.value; });
    }

    var date = document.getElementById('dateInput');
    if (date) date.addEventListener('change', function () {
      if (date.value) sheet.date = date.value;
      var span = date.parentNode.querySelector('span');
      if (span) span.textContent = dateLabel(sheet.date);
    });

    var del = layer.querySelector('[data-sheet="delete"]');
    if (del) del.addEventListener('click', deleteEditing);

    var save = layer.querySelector('[data-sheet="save"]');
    if (save) save.addEventListener('click', saveEntry);

    var overlay = layer.querySelector('[data-close]');
    if (overlay) overlay.addEventListener('click', closeSheet);
  }

  function saveEntry() {
    var cents = Math.round(parseFloat(sheet.amount) * 100);
    if (!sheet.amount || !isFinite(cents) || cents <= 0) {
      toast('先输入金额');
      return;
    }
    if (cents > 99999999) {
      toast('金额太大了');
      return;
    }
    var ts;
    if (sheet.date === todayKey()) {
      ts = Date.now();
    } else {
      var p = sheet.date.split('-');
      ts = new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10), 12, 0, 0).getTime();
    }
    var isEdit = false;
    if (sheet.editId) {
      each(store.entries, function (e) {
        if (e.id !== sheet.editId) return;
        e.amount = cents;
        e.cat = sheet.cat;
        e.note = sheet.note;
        e.type = sheet.type;
        e.ts = ts;
        isEdit = true;
      });
    } else {
      store.entries.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        type: sheet.type,
        amount: cents,
        cat: sheet.cat,
        note: sheet.note,
        ts: ts
      });
    }
    if (sheet.type === 'expense') store.lastCatExpense = sheet.cat;
    else store.lastCatIncome = sheet.cat;
    store.seen = true;
    persist();
    closeSheet();
    buzz();
    var savedYm = keyOf(ts).substring(0, 7);
    var shownYm = (ui.view === 'ledger' || ui.view === 'stats') ? ymOf(ui.month) : ymOf(new Date());
    if (savedYm !== shownYm) {
      ui.view = 'ledger';
      ui.month = new Date(parseInt(sheet.date.substring(0, 4), 10), parseInt(sheet.date.substring(5, 7), 10) - 1, 1);
      ui.monthTouched = true;
    } else if (ui.view === 'mine') {
      ui.view = 'home';
    }
    render();
    toast((isEdit ? '已更新 ' : '已记下 ') + fmt(cents, false) + ' · ' + sheet.cat);
  }

  function deleteEditing() {
    if (!sheet.editId) return;
    if (!confirm('删除这笔记录？')) return;
    var id = sheet.editId;
    closeSheet();
    removeEntry(id);
  }

  function removeEntry(id) {
    var kept = [], target = null;
    each(store.entries, function (e) {
      if (e.id === id) target = e; else kept.push(e);
    });
    if (!target) return;
    store.entries = kept;
    lastDeleted = target;
    persist();
    render();
    toast('已删除 ' + target.cat + ' ¥' + fmt(target.amount, false), '撤销', function () {
      if (!lastDeleted) return;
      store.entries.push(lastDeleted);
      lastDeleted = null;
      persist();
      render();
      toast('已恢复');
    });
  }
  /* ---------------- actions ---------------- */

  function setView(view) {
    ui.view = view;
    if (view === 'ledger' || view === 'stats') {
      if (!ui.monthTouched) ui.month = new Date();
    }
    window.scrollTo(0, 0);
    render();
  }

  function shiftMonth(step) {
    ui.month = new Date(ui.month.getFullYear(), ui.month.getMonth() + step, 1);
    ui.monthTouched = true;
    render();
  }

  function exportCsv() {
    var rows = [['日期', '时间', '类型', '分类', '金额', '备注']];
    var list = sorted().slice().reverse();
    each(list, function (e) {
      var d = new Date(e.ts);
      rows.push([keyOf(e.ts), pad2(d.getHours()) + ':' + pad2(d.getMinutes()),
        e.type === 'income' ? '收入' : '支出', e.cat, (e.amount / 100).toFixed(2), e.note || '']);
    });
    var csv = '\ufeff' + rows.map(function (r) {
      return r.map(function (cell) {
        var s = String(cell);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(',');
    }).join('\r\n');
    var name = '一目账-' + ymOf(new Date()) + '.csv';

    if (window.NativeApp && typeof window.NativeApp.saveCsv === 'function') {
      var result = '';
      try { result = window.NativeApp.saveCsv(name, csv); } catch (e) { result = ''; }
      toast(result || ('已导出 ' + name));
      return;
    }
    try {
      var blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      toast('已导出 ' + name);
    } catch (e) {
      toast('当前环境不支持导出');
    }
  }

  function loadDemo() {
    if (store.entries.length && !confirm('这会替换当前所有记录，确定载入示例数据？')) return;
    var now = new Date();
    var y = now.getFullYear(), m = now.getMonth();
    var planned = [
      ['餐饮', 28, '早餐'], ['餐饮', 45, '外卖'], ['餐饮', 62, '午饭'],
      ['交通', 6, '地铁'], ['交通', 24, '打车'], ['买菜', 78, '超市'],
      ['餐饮', 19, '咖啡'], ['购物', 129, '日用'], ['居住', 2600, '房租'],
      ['娱乐', 45, '电影'], ['餐饮', 52, '晚饭'], ['学习', 39, '电子书'],
      ['买菜', 56, '水果'], ['交通', 100, '加油'], ['医疗', 68, '买药'],
      ['人情', 200, '红包'], ['购物', 89, '换季'], ['餐饮', 33, '面馆'],
      ['娱乐', 68, '聚会'], ['居住', 210, '水电']
    ];
    var entries = [];
    var last = Math.min(now.getDate(), 28);
    var k = 0;
    for (var day = 1; day <= last; day++) {
      var perDay = day > last - 6 ? 2 : 1;
      for (var j = 0; j < perDay; j++) {
        var p = planned[k % planned.length];
        k++;
        entries.push({
          id: 'demo' + day + '_' + j + '_' + Math.random().toString(36).slice(2, 5),
          type: 'expense',
          amount: Math.round(p[1] * 100 * (0.85 + ((k * 7) % 30) / 100)),
          cat: p[0],
          note: p[2],
          ts: new Date(y, m, day, 8 + ((k * 3) % 13), (k * 11) % 60).getTime()
        });
      }
    }
    entries.push({
      id: 'demo_income_1', type: 'income', amount: 1280000, cat: '工资', note: '月薪',
      ts: new Date(y, m, Math.min(5, last), 10, 0).getTime()
    });
    store.entries = entries;
    if (!store.budget) store.budget = 500000;
    persist();
    ui.month = now;
    ui.monthTouched = false;
    render();
    toast('已载入示例数据，可在“我的”里清空');
  }

  function clearAll() {
    if (!store.entries.length) { toast('本来就没有记录'); return; }
    if (!confirm('清空全部 ' + store.entries.length + ' 笔记录？此操作无法恢复。')) return;
    store.entries = [];
    lastDeleted = null;
    ui.month = new Date();
    ui.monthTouched = false;
    persist();
    render();
    toast('已清空');
  }

  function saveBudget() {
    var input = document.getElementById('budgetInput');
    if (!input) return;
    var value = Math.max(0, Math.round(parseFloat(input.value) * 100) || 0);
    store.budget = value;
    persist();
    render();
    toast(value ? '月预算已设为 ¥' + fmt(value, true) : '已取消预算');
  }

  document.addEventListener('click', function (event) {
    var el = event.target;
    while (el && el !== document.body) {
      if (el.getAttribute && el.getAttribute('data-act')) break;
      el = el.parentNode;
    }
    if (!el || el === document.body || !el.getAttribute) return;
    var act = el.getAttribute('data-act');

    if (act === 'nav') {
      ui.monthTouched = false;
      setView(el.getAttribute('data-view'));
    } else if (act === 'add') {
      openSheet(null);
    } else if (act === 'edit') {
      var id = el.getAttribute('data-id');
      each(store.entries, function (e) { if (e.id === id) openSheet(e); });
    } else if (act === 'month') {
      shiftMonth(parseInt(el.getAttribute('data-step'), 10));
    } else if (act === 'month-today') {
      ui.month = new Date();
      ui.monthTouched = false;
      render();
    } else if (act === 'save-budget') {
      saveBudget();
    } else if (act === 'export') {
      exportCsv();
    } else if (act === 'demo') {
      loadDemo();
    } else if (act === 'clear') {
      clearAll();
    }
  });

  window.__handleBack = function () {
    if (sheet.open) { closeSheet(); return true; }
    if (ui.view !== 'home') { setView('home'); return true; }
    return false;
  };

  loadStore();
  render();
})();