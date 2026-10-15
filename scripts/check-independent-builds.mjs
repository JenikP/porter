import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=process.cwd();
for(const role of ['customer','driver','admin']){
 const isolated=fs.mkdtempSync(path.join(root,'.tmp-independent-'));
 try{
  fs.mkdirSync(path.join(isolated,'apps'));
  fs.mkdirSync(path.join(isolated,'scripts'));
  fs.cpSync(path.join(root,`apps/${role}-web`),path.join(isolated,`apps/${role}-web`),{recursive:true,filter:source=>!['node_modules','dist'].includes(path.basename(source))});
  for(const name of ['packages','node_modules'])fs.symlinkSync(path.join(root,name),path.join(isolated,name),process.platform==='win32'?'junction':'dir');
  for(const name of ['tsconfig.base.json','package.json','postcss.config.js','postcss.config.cjs','tailwind.config.js','tailwind.config.cjs'])if(fs.existsSync(name))fs.copyFileSync(name,path.join(isolated,name));
  fs.copyFileSync('scripts/vite-aliases.ts',path.join(isolated,'scripts/vite-aliases.ts'));
  for(const args of [[path.join(root,'node_modules/typescript/bin/tsc'),'--noEmit','--project',`apps/${role}-web/tsconfig.json`],[path.join(root,'node_modules/vite/bin/vite.js'),'build',`apps/${role}-web`]]){
   const result=spawnSync(process.execPath,args,{cwd:isolated,stdio:'inherit'});if(result.status!==0)throw new Error(`${role} isolated build failed (${result.status})`);
  }
  console.log(`PASS: ${role} builds with all sibling application directories absent`);
 }finally{
  // Only this freshly-created workspace directory is removed, never a source checkout.
  if(path.dirname(isolated)!==root||!path.basename(isolated).startsWith('.tmp-independent-'))throw new Error('Unexpected isolated build directory');
  for(const name of ['packages','node_modules']){const link=path.join(isolated,name);if(fs.existsSync(link))fs.unlinkSync(link);}
  fs.rmSync(isolated,{recursive:true,force:true});
 }
}
