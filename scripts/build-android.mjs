import {spawnSync} from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
const role=process.argv[2]||'all';if(!['all','customer','driver'].includes(role))throw new Error('Use customer, driver or all');
if(!process.env.JAVA_HOME||!process.env.ANDROID_HOME)throw new Error('Set JAVA_HOME to JDK 21 and ANDROID_HOME to your Android SDK directory');
const java=path.join(process.env.JAVA_HOME,'bin',process.platform==='win32'?'java.exe':'java');const version=spawnSync(java,['-version'],{encoding:'utf8'});if(version.status!==0||!String(version.stderr+version.stdout).match(/version "(?:21|2[2-9])/))throw new Error('Capacitor 8 requires a JDK 21 or compatible newer toolchain');
console.log('Debug binaries only. Configure the native web VITE_API_URL to a reachable HTTPS API and rebuild before device acceptance.');
for(const app of role==='all'?['customer','driver']:[role]){
 const cwd=path.resolve(`apps/${app}-mobile`);const sync=spawnSync(process.execPath,[path.resolve('node_modules/@capacitor/cli/bin/capacitor'),'sync'],{cwd,stdio:'inherit'});if(sync.status!==0)process.exit(sync.status||1);
 const android=path.join(cwd,'android');const result=process.platform==='win32'?spawnSync('cmd.exe',['/d','/s','/c','gradlew.bat --no-daemon assembleDebug'],{cwd:android,stdio:'inherit'}):spawnSync('./gradlew',['--no-daemon','assembleDebug'],{cwd:android,stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);
 const apk=path.join(android,'app/build/outputs/apk/debug/app-debug.apk');if(!fs.existsSync(apk))throw new Error('Gradle returned without an APK');console.log(`APK: ${apk} (${fs.statSync(apk).size} bytes)`);
}
