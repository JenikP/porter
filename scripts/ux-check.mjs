import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PORTER_PLAYWRIGHT_PATH||'C:/Users/patel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out='C:/Users/patel/.codex/visualizations/2026/10/10/01a12485-e76c-7d22-a0a9-d7236011e6d3';
const browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage();const errors=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const checks=[];const base='http://127.0.0.1:5176';
async function check(label){await page.waitForLoadState('networkidle');await page.evaluate(()=>document.fonts.ready);const overflow=await page.evaluate(()=>Array.from(document.querySelectorAll('body *')).filter(el=>{const r=el.getBoundingClientRect();return r.right>innerWidth+1||r.left<-1;}).map(el=>({tag:el.tagName,cls:el.className,width:el.getBoundingClientRect().width,text:el.textContent?.slice(0,45)})));const wide=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);if(wide)console.log(label,overflow.slice(0,12));assert.equal(wide,false,label);checks.push(label);}
try{
 for(const width of [1505,768,390,320]){
  await page.setViewportSize({width,height:width>700?1045:844});
  for(const [role,url] of [['customer','/'],['driver','/driver'],['admin','/admin']]){await page.goto(base+url);await page.locator('main h1').first().waitFor();await check(role+' '+width);await page.screenshot({path:`${out}/ux-${role}-${width}.png`,fullPage:true,animations:'disabled'});}
 }
 await page.setViewportSize({width:1505,height:1045});await page.goto(base+'/admin');await page.getByRole('button',{name:'Collapse navigation',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.operations-sidebar')?.clientWidth<100);await page.getByRole('button',{name:'Jobs',exact:true}).click();await page.getByLabel('Sort jobs').selectOption('price');const rows=await page.locator('tbody tr').allTextContents();assert.ok(rows[0].includes('$38.00'));await page.getByRole('button',{name:'job_001',exact:true}).click();await page.getByRole('button',{name:'Close details',exact:true}).click();assert.equal(await page.locator('.detail-view').count(),0);checks.push('Sidebar collapse, sorting and close details');
 await page.getByRole('button',{name:'Switch to dark theme',exact:true}).click();assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');await check('Dark admin');await page.screenshot({path:out+'/ux-admin-dark.png',fullPage:true,animations:'disabled'});await page.getByRole('button',{name:'Switch to light theme',exact:true}).click();
 await page.goto(base+'/book');const click=name=>page.getByRole('button',{name,exact:true}).click();await click('Continue');await page.getByLabel('Item description',{exact:true}).fill('Two boxed lamps');await click('Continue');await click('Continue');await click('Continue');await page.getByRole('heading',{name:'Your fixed quote',exact:true}).waitFor();await check('Quote layout');await page.screenshot({path:out+'/ux-booking-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await check('Quote mobile');await page.screenshot({path:out+'/ux-booking-mobile.png',fullPage:true});
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.booking').evaluate(el=>getComputedStyle(el).animationName),'none');checks.push('Reduced motion');
 await page.goto(base+'/account');await click('Request account deletion');await page.getByRole('dialog').waitFor();assert.equal(await page.locator(':focus').innerText(),'Keep account');await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);assert.equal(await page.locator(':focus').innerText(),'Request account deletion');checks.push('Dialog focus and Escape restore');
 assert.deepEqual(errors,[]);fs.writeFileSync('docs/progress/ux-check-results.json',JSON.stringify({status:'PASS',checks,errors},null,2));console.log('PASS',checks);
}finally{await browser.close();}

