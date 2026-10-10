import { createRequire } from 'node:module';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PORTER_PLAYWRIGHT_PATH || 'C:/Users/patel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const browser = await chromium.launch({ headless:true,channel:'msedge' }); const page = await browser.newPage({ viewport:{ width:1440,height:1000 } }); const errors=[]; page.on('pageerror',e => errors.push(e.message)); page.on('console',m => { if (m.type() === 'error') errors.push(m.text()); });
const click = name => page.getByRole('button',{ name,exact:true }).click();
try {
 await page.goto('http://127.0.0.1:5176/'); await click('Driver'); await click('Cancel assignment · return to search');
 await click('Admin'); await click('Jobs'); await click('job_001'); await page.getByLabel('Approved driver').selectOption('driver_002'); await page.getByLabel('Assignment reason').fill('Reassigned after initial driver cancellation.'); await click('Save driver assignment');
 await page.getByText('Priya Shah',{ exact:true }).first().waitFor();
 await click('Customer'); await page.goto('http://127.0.0.1:5176/jobs/job_001'); await page.getByText('Priya Shah',{ exact:true }).waitFor();
 await click('Driver'); await page.getByLabel('Demo driver').selectOption('driver_002'); await page.getByRole('heading',{ name:'Driver Assigned',exact:true }).waitFor();
 const state=await page.evaluate(() => JSON.parse(localStorage.getItem('porter.mock-platform.v2')));
 assert.equal(state.jobs.find(j=>j.id==='job_001').driverId,'driver_002'); assert.ok(state.auditLogs.some(a => a.action==='ASSIGN_DRIVER')); assert.equal(state.drivers.find(d=>d.id==='driver_001').cancellationCount,2);
 assert.deepEqual(errors,[]);
 fs.writeFileSync('docs/progress/intervention-results.json',JSON.stringify({ status:'PASS',checks:['Driver cancellation returns job to searching','Admin assigns another eligible driver','Customer sees reassigned driver','Second driver sees active assignment','Cancellation count and audit persisted','No browser errors'] },null,2)); console.log('PASS: all reassignment intervention checks');
} catch(e) { console.error(e); console.error((await page.locator('body').innerText()).slice(0,4500)); process.exitCode=1; } finally { await browser.close(); }

