import { JobStatus } from '@porter/shared';
export const money=(n:number)=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(n);
export const date=(d:Date)=>new Date(d).toLocaleString('en-AU',{timeZone:'Australia/Melbourne',dateStyle:'medium',timeStyle:'short'});
export const driverName=(id?:string)=>id==='driver_001'?'Sam Nguyen':id==='driver_002'?'Priya Shah':'Jordan Lee';
export const done=(s:JobStatus)=>[JobStatus.COMPLETED,JobStatus.CANCELLED,JobStatus.RESOLVED,JobStatus.DISPUTED].includes(s);
