import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url); const { chromium } = require(process.env.PORTER_PLAYWRIGHT_PATH || 'C:/Users/patel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.launch({ headless:true,channel:'msedge' }); const page=await browser.newPage(); const errors=[]; const checks=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{ if(m.type()==='error') errors.push(m.text()); });
const evidence='C:/Users/patel/.codex/visualizations/2026/10/10/01a12485-e76c-7d22-a0a9-d7236011e6d3';
const check = async label => { assert.match(await page.title(),/Porter/); assert.ok(page.url().startsWith('http://127.0.0.1:5173/')); assert.ok((await page.locator('main').innerText()).length>80,label+' meaningful content'); assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label+' overflow'); assert.equal(await page.locator('vite-error-overlay').count(),0); const unlabeled=await page.locator('main input,main select,main textarea').evaluateAll(inputs=>inputs.filter(input=>!input.labels?.length && !input.getAttribute('aria-label')).map(input=>input.outerHTML)); assert.deepEqual(unlabeled,[],label+' form labels'); checks.push(label); };
try {
 for(const width of [1440,390,320]) {
  await page.setViewportSize({ width,height:900 });
  for(const url of ['/','/jobs','/help','/account','/book','/jobs/job_001']) { await page.goto('http://127.0.0.1:5173'+url); await page.locator('main h1').waitFor(); await check('Customer '+url+' '+width); if(url==='/') await page.screenshot({ path:evidence+'/porter-home-'+width+'.png',fullPage:false }); }
  await page.goto('http://127.0.0.1:5173/driver');
  for(const tab of ['Home','Documents','Earnings','History']) { await page.getByRole('button',{ name:tab,exact:true }).click(); await check('Driver '+tab+' '+width); }
  await page.screenshot({ path:evidence+'/porter-driver-'+width+'.png',fullPage:true });
  await page.goto('http://127.0.0.1:5173/admin');
  for(const tab of ['Overview','Jobs','Live Map','Drivers','Customers','Disputes','Pricing','Payments','Reports','Settings','Audit Log']) { await page.getByRole('button',{ name:tab,exact:true }).click(); await check('Admin '+tab+' '+width); }
  await page.getByRole('button',{ name:'Overview',exact:true }).click(); await page.screenshot({ path:evidence+'/porter-admin-'+width+'.png',fullPage:true });
 }
 await page.goto('http://127.0.0.1:5173/'); await page.keyboard.press('Tab'); assert.equal(await page.locator(':focus').innerText(),'Skip to content'); checks.push('Keyboard skip link available');
 assert.deepEqual(errors,[]); fs.writeFileSync('docs/progress/smoke-results.json',JSON.stringify({ status:'PASS',checks,errors,viewports:[1440,390,320] },null,2)); console.log('PASS:',checks.length,'responsive screen / label / keyboard checks; no console errors');
} catch(e) { console.error(e); console.error((await page.locator('body').innerText()).slice(0,4000)); process.exitCode=1; } finally { await browser.close(); }
