import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url); const { chromium }=require(process.env.PORTER_PLAYWRIGHT_PATH || 'C:/Users/patel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const apps=[['porter',4140],['customer',4176],['driver',4174],['admin',4175]]; const servers=[]; const checks=[]; const browser=await chromium.launch({ headless:true,channel:'msedge' });
try {
 for(const [app,port] of apps) {
  const root=path.resolve('apps/'+app+'-web/dist');
  const server=http.createServer(async(req,res)=>{ try { const requested=path.resolve(root,'.'+new URL(req.url,'http://127.0.0.1').pathname); if(!requested.startsWith(root+path.sep) && requested!==root) { res.writeHead(403); res.end(); return; } let file=requested; try { if((await fs.stat(file)).isDirectory()) file=path.join(file,'index.html'); } catch { file=path.join(root,'index.html'); } const ext=path.extname(file); res.setHeader('Content-Type',({ '.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml' })[ext] || 'application/octet-stream'); res.end(await fs.readFile(file)); } catch { res.writeHead(404); res.end(); } }); await new Promise(resolve=>server.listen(port,'127.0.0.1',resolve)); servers.push(server);
  const page=await browser.newPage({ viewport:{ width:390,height:844 } }); const errors=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{ if(m.type()==='error') errors.push(m.text()); }); await page.goto('http://127.0.0.1:'+port+'/'); await page.locator('main h1').waitFor();
  if(app==='porter') { await page.getByRole('button',{ name:'Driver',exact:true }).click(); await page.getByRole('heading',{ name:'Your day, delivered.' }).waitFor(); await page.getByRole('button',{ name:'Admin',exact:true }).click(); await page.getByRole('button',{ name:'Jobs',exact:true }).click(); await page.getByRole('button',{ name:'job_001',exact:true }).click(); await page.getByLabel('Approved driver').waitFor(); }
  if(app==='customer') { await page.getByRole('button',{ name:'Book a delivery',exact:true }).click(); await page.getByLabel('Pickup address').waitFor(); }
  if(app==='driver') { await page.getByRole('button',{ name:'Start pickup journey',exact:true }).click(); await page.getByRole('button',{ name:'Arrived at pickup',exact:true }).waitFor(); }
  if(app==='admin') { await page.getByRole('button',{ name:'Jobs',exact:true }).click(); await page.getByRole('button',{ name:'job_001',exact:true }).click(); await page.getByLabel('Approved driver').waitFor(); }
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)); assert.deepEqual(errors,[]); checks.push({ app,status:'PASS',route:page.url(),meaningfulInteraction:true,consoleErrors:errors }); await page.close(); console.log('PASS:',app,'production bundle interaction and console');
 }
 await fs.writeFile('docs/progress/production-smoke-results.json',JSON.stringify({ status:'PASS',checks },null,2));
} catch(e) { console.error(e); process.exitCode=1; } finally { await browser.close(); await Promise.all(servers.map(s=>new Promise(resolve=>s.close(resolve)))); }
