import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import ts from 'typescript';
const root=process.cwd();
const roles=['customer','driver','admin'];
function graph(entry){
 const seen=new Set();
 function visit(file){
  file=path.resolve(file);if(seen.has(file))return;seen.add(file);
  const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true);
  function walk(node){
   let spec;
   if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier))spec=node.moduleSpecifier.text;
   if(ts.isCallExpression(node)&&(node.expression.kind===ts.SyntaxKind.ImportKeyword||node.expression.getText(source)==='require')&&node.arguments[0]&&ts.isStringLiteral(node.arguments[0]))spec=node.arguments[0].text;
   if(spec){
    let base;if(spec.startsWith('.'))base=path.resolve(path.dirname(file),spec);
    else if(spec.startsWith('@porter/'))base=path.resolve(root,'packages',spec.slice(8),'src/index');
    if(base){const target=[base,...['.ts','.tsx','.js','.mjs','.css','/index.ts','/index.tsx'].map(ext=>base+ext)].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());assert.ok(target,`Unresolved local import ${spec} from ${file}`);if(/\.(?:[cm]?js|tsx?)$/.test(target))visit(target);}
   }
   ts.forEachChild(node,walk);
  }
  walk(source);
 }
 visit(entry);return [...seen];
}
for(const role of roles)test(`${role} entry and transitive source imports exclude other application products`,()=>{
 const entry=`apps/${role}-web/src/main.tsx`;const text=fs.readFileSync(entry,'utf8');assert.match(text,new RegExp(`Application role="${role}"`));
 const files=graph(entry);assert.ok(files.length>20,'Check the transitive graph, not just entry imports');
 for(const file of files){const rel=path.relative(root,file).replaceAll('\\','/');if(rel.startsWith('apps/'))assert.ok(rel.startsWith(`apps/${role}-web/`),`${role} depends on ${rel}`);}
 assert.ok(!files.some(file=>fs.readFileSync(file,'utf8').includes('aria-label="Demo role"')),'Preview selector must not enter production graph');
});
for(const role of ['customer','driver'])test(`${role} native application embeds only its matching standalone web build`,()=>{
 const config=fs.readFileSync(`apps/${role}-mobile/capacitor.config.ts`,'utf8');assert.ok(config.includes(`appId:'com.porter.${role}'`));assert.ok(config.includes(`webDir:'../${role}-web/dist'`));assert.ok(!config.includes('porter-web'));assert.ok(!config.includes('admin-web'));
});
test('combined role composition and development label stay exclusive to porter-web',()=>{
 const preview=fs.readFileSync('apps/porter-web/src/main.tsx','utf8');assert.ok(preview.includes('Development / QA role preview only'));assert.ok(preview.includes('DEVELOPMENT PREVIEW'));
 for(const role of roles)assert.ok(preview.includes(`../../${role}-web/src/app`));
 const scripts=JSON.parse(fs.readFileSync('package.json','utf8')).scripts;assert.ok(!scripts['build:production'].includes('porter-web'));
 assert.ok(!fs.readFileSync('deploy/staging.compose.yaml','utf8').includes('porter-web'));
});
