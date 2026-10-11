import {test} from 'node:test';
import assert from 'node:assert/strict';
import {decodeUpload,privateStorage,maxUpload} from '../services/api/src/launch/storage.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
test('document scans above old limit accepted; content signatures and size enforced',()=>{
 const pdf=Buffer.from('%PDF-1.7\n'+' '.repeat(800000)+'\n%%EOF');assert.equal(decodeUpload({name:'scan.pdf',data:'data:application/pdf;base64,'+pdf.toString('base64')}).bytes.length,pdf.length);
 assert.throws(()=>decodeUpload({data:'data:image/png;base64,'+pdf.toString('base64')}),/contents/);
 assert.throws(()=>decodeUpload({data:'data:application/pdf;base64,'+Buffer.alloc(maxUpload+1).toString('base64')}),/5 MB/);
 assert.throws(()=>decodeUpload({data:'data:image/heic;base64,YQ=='}),/PNG/);
});
test('private local file survives a new storage adapter instance',async()=>{
 const dir=await fs.mkdtemp(path.resolve('.tmp-storage-'));const previous=process.env.DOCUMENT_STORAGE_PATH;process.env.DOCUMENT_STORAGE_PATH=dir;
 try{const file=Buffer.from('%PDF-1.7\n%%EOF');await privateStorage().put('safe-object-id',file,'application/pdf');assert.deepEqual(await privateStorage().get('safe-object-id'),file);assert.equal((await fs.readdir(dir)).length,1);}finally{if(previous===undefined)delete process.env.DOCUMENT_STORAGE_PATH;else process.env.DOCUMENT_STORAGE_PATH=previous;}
});
test('private production gateway supplies credentials server-side and surfaces retryable failure',async()=>{
 const previous={DOCUMENT_STORAGE:process.env.DOCUMENT_STORAGE,DOCUMENT_STORAGE_URL:process.env.DOCUMENT_STORAGE_URL,DOCUMENT_STORAGE_TOKEN:process.env.DOCUMENT_STORAGE_TOKEN},fetchOriginal=globalThis.fetch;
 Object.assign(process.env,{DOCUMENT_STORAGE:'http',DOCUMENT_STORAGE_URL:'https://private-storage.example.test',DOCUMENT_STORAGE_TOKEN:'test-fixture-only'});
 const seen=[];globalThis.fetch=async(url,options)=>{seen.push({url,options});return new Response(options.method==='GET'?'%PDF-test':'',{status:200});};
 try{const storage=privateStorage();await storage.put('private-id',Buffer.from('%PDF-test'),'application/pdf');assert.equal((await storage.get('private-id')).toString(),'%PDF-test');assert.equal(seen[0].options.headers.Authorization,'Bearer test-fixture-only');globalThis.fetch=async()=>new Response('',{status:503});await assert.rejects(()=>storage.get('private-id'),/earlier documents are safe/);}finally{globalThis.fetch=fetchOriginal;for(const [key,value]of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
