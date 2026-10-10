import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
// Rasterize the repository's own code-native Porter mark into platform icon sizes.
const browser=await chromium.launch({headless:true,...(process.env.PORTER_BROWSER_CHANNEL==='chromium'?{}:{channel:'msedge'})});
try{const page=await browser.newPage();for(const role of ['customer','driver']){
 const svg=fs.readFileSync(`apps/${role}-web/public/icon.svg`,'utf8');
 const render=async(size,destination,splash=false)=>{await page.setViewportSize({width:size,height:size});await page.setContent(`<style>body{margin:0;background:#173B32}svg{width:${splash?'20%':'100%'};height:${splash?'20%':'100%'};${splash?'position:absolute;inset:40%':''}}</style>${svg}`);fs.mkdirSync(path.dirname(destination),{recursive:true});await page.screenshot({path:destination});};
 for(const size of [192,512])await render(size,`apps/${role}-web/public/icon-${size}.png`);
 await render(1024,`apps/${role}-mobile/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png`);
 for(const suffix of ['', '-1','-2'])await render(2732,`apps/${role}-mobile/ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732${suffix}.png`,true);
 for(const [density,size]of Object.entries({mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192}))for(const name of ['ic_launcher','ic_launcher_round','ic_launcher_foreground'])await render(size,`apps/${role}-mobile/android/app/src/main/res/mipmap-${density}/${name}.png`);
 const resources=`apps/${role}-mobile/android/app/src/main/res`;for(const folder of fs.readdirSync(resources)){const file=path.join(resources,folder,'splash.png');if(!fs.existsSync(file))continue;const png=fs.readFileSync(file);const width=png.readUInt32BE(16),height=png.readUInt32BE(20);await page.setViewportSize({width,height});await page.setContent(`<style>body{margin:0;background:#173B32}svg{position:absolute;width:20%;height:20%;inset:40%}</style>${svg}`);await page.screenshot({path:file});}
 fs.writeFileSync(`apps/${role}-mobile/android/app/src/main/res/drawable/ic_launcher_background.xml`,'<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108"><path android:fillColor="#173B32" android:pathData="M0,0h108v108H0z"/></vector>');
 fs.writeFileSync(`apps/${role}-mobile/android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml`,'<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="192" android:viewportHeight="192"><path android:fillColor="#C7F464" android:fillType="evenOdd" android:pathData="M54,48h47c30,0 43,15 43,39s-16,39 -44,39H78v26H54V48z M78,72v31h23c13,0 20,-6 20,-16s-7,-15 -20,-15H78z"/></vector>');
 const manifest=JSON.parse(fs.readFileSync(`apps/${role}-web/public/manifest.webmanifest`));manifest.icons=[192,512].map(size=>({src:`/icon-${size}.png`,sizes:`${size}x${size}`,type:'image/png',purpose:'any'}));fs.writeFileSync(`apps/${role}-web/public/manifest.webmanifest`,JSON.stringify(manifest,null,2));
}}finally{await browser.close();}
