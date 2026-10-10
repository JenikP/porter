import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
const checks=[];
for(const name of ['typecheck','build','test','test:e2e']) {
 const r=spawnSync(process.platform==='win32' ? 'npm.cmd':'npm',['run',name],{ shell:process.platform==='win32',encoding:'utf8',maxBuffer:20*1024*1024 }); const output=(r.stdout??'')+(r.stderr??''); fs.writeFileSync('docs/progress/'+name.replace(':','-')+'-output.log',output); console.log(output); checks.push({ command:'npm run '+name,exitCode:r.status,status:r.status===0?'PASS':'FAIL' });
 if(r.status!==0) { fs.writeFileSync('docs/progress/final-check-results.json',JSON.stringify({ status:'FAIL',checks },null,2)); process.exit(1); }
}
fs.writeFileSync('docs/progress/final-check-results.json',JSON.stringify({ status:'PASS',checks },null,2));
