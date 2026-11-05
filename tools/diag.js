const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 9246;
const OUT = 'C:\\Users\\zhoucm1\\yimu-zhang\\build';
const URL = 'file:///C:/Users/zhoucm1/yimu-zhang/app/assets/index.html';
function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
function get(url){ return new Promise((res,rej)=>{ http.get(url,r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>res(d));}).on('error',rej); }); }
(async()=>{
  const userDir = path.join(OUT,'edge-profile-diag');
  fs.mkdirSync(userDir,{recursive:true});
  execFile(EDGE,['--headless=new','--remote-debugging-port='+PORT,'--user-data-dir='+userDir,'--disable-gpu','--no-first-run','--window-size=390,844','about:blank'],{detached:true,stdio:'ignore'}).unref();
  let page=null;
  for(let i=0;i<40;i++){ try{ const p=JSON.parse(await get('http://127.0.0.1:'+PORT+'/json/list')); page=p.find(x=>x.type==='page'); if(page)break; }catch(e){} await sleep(350); }
  if(!page) throw new Error('no page');
  const WebSocket = require('C:/Users/zhoucm1/liuyao-guide/node_modules/ws');
  const ws = new WebSocket(page.webSocketDebuggerUrl,{perMessageDeflate:false});
  let id=0; const pending=new Map(); const events=[];
  ws.on('message',m=>{ const msg=JSON.parse(m); if(msg.id&&pending.has(msg.id)){pending.get(msg.id)(msg);pending.delete(msg.id);} if(msg.method){ if(['Runtime.exceptionThrown','Log.entryAdded','Network.loadingFailed','Runtime.consoleAPICalled'].includes(msg.method)) events.push(msg); } });
  await new Promise((res,rej)=>{ws.on('open',res);ws.on('error',rej);});
  function send(method,params){ return new Promise(res=>{ const n=++id; pending.set(n,res); ws.send(JSON.stringify({id:n,method,params:params||{}})); }); }
  async function ev(expr){ const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true}); if(r.result&&r.result.exceptionDetails) return {ERR:JSON.stringify(r.result.exceptionDetails).slice(0,400)}; return r.result&&r.result.result?r.result.result.value:null; }
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable'); await send('Network.enable');
  await send('Page.navigate',{url:URL});
  await sleep(1500);
  console.log('READY', await ev('document.readyState'));
  console.log('APPHTML', await ev("document.getElementById('app').innerHTML.length"));
  console.log('BODY', await ev('document.body.innerHTML.slice(0,300)'));
  console.log('SCRIPTS', await ev("Array.from(document.scripts).map(s=>s.src)"));
  console.log('PERF', await ev("performance.getEntriesByType('resource').map(e=>e.name+' '+e.transferSize)"));
  console.log('LS', await ev("typeof localStorage"));
  console.log('EVENTS', JSON.stringify(events).slice(0,3000));
  await send('Page.navigate',{url:'file:///C:/Users/zhoucm1/yimu-zhang/app/assets/app.js'});
  await sleep(800);
  console.log('JSBODY', await ev('document.body.innerText.slice(0,200)'));
  ws.close(); process.exit(0);
})().catch(e=>{console.error('FAIL',e.message);process.exit(1);});