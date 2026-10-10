import { spawn, spawnSync, execFileSync } from 'node:child_process';
for(const script of ['scripts/init-launch.mjs','scripts/build-api.mjs']){const result=spawnSync(process.execPath,[script],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}
const children=[];let stopping=false;
const stop=()=>{if(stopping)return;stopping=true;for(const child of children){try{if(process.platform==='win32'&&child.pid)execFileSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore'});else child.kill('SIGTERM');}catch{}}};
const start=args=>{const child=spawn(process.execPath,args,{stdio:'inherit',env:process.env});children.push(child);child.on('exit',code=>{if(!stopping){process.exitCode=code||1;stop();}});};
start(['--env-file=.env.launch','services/api/dist/server.mjs']);
for(const role of ['customer','driver','admin'])start(['node_modules/vite/bin/vite.js',`apps/${role}-web`]);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,stop);
