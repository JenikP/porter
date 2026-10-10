import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PORTER_PLAYWRIGHT_PATH || 'C:/Users/patel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.resolve('docs/screenshots'); fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'msedge'});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage(); const shots=[]; const errors=[];
page.on('pageerror',e=>errors.push(e.message));
const base='http://127.0.0.1:5173';
const click=name=>page.getByRole('button',{name,exact:true}).click();
async function ready(){
 await page.locator('main').waitFor(); await page.waitForLoadState('networkidle');
 await page.evaluate(async()=>{await document.fonts.ready; await Promise.all(Array.from(document.images).map(img=>img.complete ? Promise.resolve() : new Promise(resolve=>{img.onload=resolve;img.onerror=resolve;})));});
 await page.evaluate(()=>scrollTo(0,0));
}
async function capture(role,title,key){
 await ready();
 for(const [size,width,height] of [['desktop',1440,1000],['mobile',390,844]]){
  await page.setViewportSize({width,height}); await ready();
  const file=`${role.toLowerCase()}-${key}-${size}.png`;
  await page.screenshot({path:path.join(out,file),fullPage:true,animations:'disabled'});
  shots.push({role,title,size,file});
 }
 await page.setViewportSize({width:1440,height:1000});
 console.log('Captured',role,title);
}
try {
 for(const [title,url,key] of [['Home','/','home'],['Jobs','/jobs','jobs'],['Help','/help','help'],['Account','/account','account'],['Active delivery tracking','/jobs/job_001','tracking'],['Completed delivery','/jobs/job_prev_001','completed']]){
  await page.goto(base+url); await page.locator('main h1').waitFor(); await capture('Customer',title,key);
 }
 await page.goto(base+'/book'); await page.locator('main h1').waitFor();
 const stages=['Addresses','Item details','Delivery options','Vehicle recommendation','Calculated quote','Mock payment'];
 for(let i=0;i<stages.length;i++){
  if(i===1) await page.getByLabel('Item description',{exact:true}).fill('Two boxed lamps from a Melbourne shop');
  await capture('Customer',stages[i],`booking-${i+1}`);
  if(i<5) await click('Continue');
 }
 await page.goto(base+'/driver'); await page.locator('main h1').waitFor();
 for(const title of ['Home','Documents','Earnings','History']){await click(title); await capture('Driver',title,title.toLowerCase());}
 // Create a real issue using the isolated browser's seeded completed job.
 await page.goto(base+'/jobs/job_prev_001'); await page.getByText('Report an issue',{exact:true}).click();
 await page.getByLabel('Tell us what happened').fill('Outer packaging scuffed during delivery. Please review handover evidence.');
 await capture('Customer','Report a delivery issue','report-issue'); await click('Raise dispute');
 await capture('Customer','Delivery with submitted dispute','disputed-delivery');
 await page.goto(base+'/admin'); await page.locator('main h1').waitFor();
 for(const title of ['Overview','Jobs','Live Map','Drivers','Customers','Disputes','Pricing','Payments','Reports','Settings','Audit Log']){
  await click(title); await capture('Admin',title,title.toLowerCase().replaceAll(' ','-'));
  if(title==='Jobs'){
   await click('job_001'); await capture('Admin','Job detail and driver reassignment','job-detail');
  }
  if(title==='Disputes'){
   await page.getByRole('button').filter({hasText:'Outer packaging scuffed'}).click();
   await capture('Admin','Dispute detail and resolution','dispute-detail');
  }
 }
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify({capturedAt:new Date().toISOString(),screenshots:shots,errors,note:'Screens captured after network idle, fonts and images loaded. Isolated seeded browser state; no changes to your existing browser records.'},null,2));
 const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
 const groups=['Customer','Driver','Admin'].map(role=>`<section id="${role}"><h2>${role}</h2><div class="grid">${shots.filter(s=>s.role===role).map(s=>`<article data-size="${s.size}"><a href="${s.file}" target="_blank"><img src="${s.file}" loading="lazy" alt="${escape(s.role+' '+s.title+' '+s.size)}"></a><h3>${escape(s.title)}</h3><p>${s.size} · <a href="${s.file}" download>Download PNG</a> · <a href="${s.file}" target="_blank">Full size</a></p></article>`).join('')}</div></section>`).join('');
 fs.writeFileSync(path.join(out,'gallery.html'),`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Porter — All Page Screenshots</title><style>*{box-sizing:border-box}body{font:15px/1.5 system-ui;margin:0;background:#f6f8fb;color:#172033}header{background:white;border-bottom:1px solid #e2e8f0;padding:24px;position:sticky;top:0;z-index:1}h1{margin:0 0 8px;font-size:28px}nav{display:flex;gap:20px;flex-wrap:wrap}a{color:#2563eb}main{max-width:1440px;margin:auto;padding:24px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}article{background:white;border:1px solid #e2e8f0;border-radius:8px;padding:12px}img{display:block;width:100%;height:320px;object-fit:contain;object-position:top;background:#f6f8fb}h3{margin:12px 0 0}p{margin:6px 0}button{padding:8px 12px;cursor:pointer;background:white;border:1px solid #cbd5e1;border-radius:5px}button[aria-pressed=true]{background:#eff6ff;color:#2563eb}section{scroll-margin-top:150px}article[hidden]{display:none}</style></head><body><header><h1>Porter — All Page Screenshots</h1><p>${shots.length} full-page PNGs, captured after loading. Click a screenshot for its original size.</p><nav><a href="#Customer">Customer</a><a href="#Driver">Driver</a><a href="#Admin">Admin</a><button data-filter="desktop" aria-pressed="true">Desktop</button><button data-filter="mobile" aria-pressed="false">Mobile</button><button data-filter="all" aria-pressed="false">Both</button></nav></header><main>${groups}</main><script>function filter(size){document.querySelectorAll('article').forEach(el=>el.hidden=size!=='all'&&el.dataset.size!==size);document.querySelectorAll('button').forEach(el=>el.setAttribute('aria-pressed',el.dataset.filter===size))}document.querySelectorAll('button').forEach(el=>el.onclick=()=>filter(el.dataset.filter));filter('desktop')</script></body></html>`);
 console.log('DONE',shots.length,'screenshots',errors.length,'runtime errors');
} finally {await browser.close();}
