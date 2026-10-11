import {mkdir,writeFile,readFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {ApiError,requireRule} from './policy.mjs';
export const maxUpload=5*1024*1024;
export function decodeUpload(input) {
  const match=/^data:(image\/(?:png|jpeg|webp)|application\/pdf);base64,([A-Za-z0-9+/]+={0,2})$/.exec(input.data||'');
  requireRule(match,'Use a PNG, JPG, WebP or PDF file',400);
  const bytes=Buffer.from(match[2],'base64');requireRule(bytes.length>0&&bytes.length<=maxUpload,'Use a file up to 5 MB',413);
  const mime=match[1];const valid=mime==='application/pdf'?bytes.subarray(0,5).toString()==='%PDF-':mime==='image/png'?bytes.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')):mime==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
  requireRule(valid,'File contents do not match the selected image/PDF format',400);
  return {bytes,mime,name:path.basename(String(input.name||'document')).replace(/[\x00-\x1f]/g,'').slice(0,120)};
}
export function privateStorage() {
  const remote=process.env.DOCUMENT_STORAGE==='http';
  const directory=path.resolve(process.env.DOCUMENT_STORAGE_PATH||'.data/private-uploads');
  if(remote&&(!process.env.DOCUMENT_STORAGE_URL?.startsWith('https://')||!process.env.DOCUMENT_STORAGE_TOKEN))throw new Error('Private storage requires an HTTPS gateway and server-only token');
  async function gateway(key,method,bytes,mime){try{const r=await fetch(`${process.env.DOCUMENT_STORAGE_URL.replace(/\/$/,'')}/objects/${key}`,{method,headers:{Authorization:`Bearer ${process.env.DOCUMENT_STORAGE_TOKEN}`,...(mime?{'Content-Type':mime}:{})},body:bytes,signal:AbortSignal.timeout(15000)});if(!r.ok)throw new Error();return method==='GET'?Buffer.from(await r.arrayBuffer()):undefined;}catch{throw new ApiError(503,'Private document storage is unavailable. Your earlier documents are safe; retry this upload.');}}
  return {provider:remote?'private-http-object-storage':'private-local',async put(key,bytes,mime){if(remote)return gateway(key,'PUT',bytes,mime);await mkdir(directory,{recursive:true});const target=path.join(directory,key);const temporary=target+'.tmp';await writeFile(temporary,bytes,{mode:0o600});await rename(temporary,target);},async get(key){if(remote)return gateway(key,'GET');try{return await readFile(path.join(directory,key));}catch{throw new ApiError(503,'Document file is unavailable. Contact operations.');}}};
}
