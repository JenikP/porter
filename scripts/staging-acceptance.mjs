// Run only against an explicitly configured testing environment. Never prints credentials.
import {request} from 'playwright';
import {randomBytes,randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const api=process.env.PORTER_STAGING_API_URL;
assert.ok(api?.startsWith('https://'),'Set PORTER_STAGING_API_URL to the real HTTPS API /api endpoint');
assert.ok(process.env.PORTER_STAGING_ADMIN_EMAIL&&process.env.PORTER_STAGING_ADMIN_PASSWORD,'Set staging Manager Admin credentials through private environment variables');
const health=await fetch(api+'/health').then(r=>r.json());assert.equal(health.environment,'staging');assert.equal(health.database,'postgresql');assert.equal(health.payments,'simulator','Staging must never use live payments');
const contexts={},sessions={},checks=[];const password=randomBytes(24).toString('base64url'),suffix=Date.now();
async function call(role,path,body,key=randomUUID()) {const ctx=contexts[role]??=await request.newContext({baseURL:api+'/'});const r=await ctx.fetch(api+path,{method:body===undefined?'GET':'POST',headers:{'X-Porter-App':role,...(body===undefined?{}:{'X-CSRF-Token':sessions[role]?.csrf||'','Idempotency-Key':key})},data:body});return {status:r.status(),data:await r.json()};}
const command=async(role,method,args)=>{const r=await call(role,'/commands',{method,args});assert.equal(r.status,200,`${method}: ${r.data.error}`);return r.data;};
const pass=label=>{checks.push(label);console.log('PASS: '+label);};
try{
 for(const role of ['customer','driver']){const email=`staging.${role}.${suffix}@example.test`;assert.equal((await call(role,'/auth/register',{name:`Staging ${role}`,email,password,phone:'0412345678'})).status,201);const login=await call(role,'/auth/login',{email,password});assert.equal(login.status,200);sessions[role]={...login.data,email};}
 const admin=await call('admin','/auth/login',{email:process.env.PORTER_STAGING_ADMIN_EMAIL,password:process.env.PORTER_STAGING_ADMIN_PASSWORD});assert.equal(admin.status,200);sessions.admin=admin.data;pass('Independent customer, driver and Manager sessions on HTTPS central API');
 const driverId=sessions.driver.user.profileId;
 assert.equal((await call('driver','/driver/application',{action:'profile',profile:{name:'Staging Driver',phone:'0412345678',identityNumber:'STAGING-ONLY',abn:'51824753556'},vehicle:{type:'BIKE_OR_CAR',make:'Toyota',model:'Corolla',year:2022,plate:'TESTONLY'}})).status,200);
 assert.equal((await call('driver','/driver/application',{action:'terms',accepted:true,version:'prototype-2026-10-v1'})).status,200);
 const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=';
 for(const type of ['IDENTITY','LICENCE','VEHICLE_REGISTRATION','INSURANCE','ABN'])assert.equal((await call('driver','/driver/documents',{name:'staging-only.png',data:png,type,expiryDate:'2035-10-10'})).status,201);
 assert.equal((await call('driver','/driver/application',{action:'submit'})).status,200);
 const state=(await call('admin','/state')).data;for(const doc of state.driverDocuments.filter(d=>d.driverId===driverId))await command('admin','updateDriverDocument',[doc.id,{status:'APPROVED'}]);await command('admin','approveDriver',[driverId]);await command('driver','markDriverOnline',[driverId]);pass('New driver submits private files; central Manager approves eligible application');
 const quote=(await command('customer','createQuote',[{pickupAddress:'120 Collins St, Melbourne VIC 3000',dropoffAddress:'700 Bourke St, Docklands VIC 3008',vehicleClass:'BIKE_OR_CAR',timeOption:'WITHIN_3_HOURS',stairs:0,helperRequired:false}])).result;
 const job=(await command('customer','bookDelivery',[{quote,item:{description:'Staging test parcel',size:'SMALL',weightKg:1,quantity:1,photos:[]},jobFields:{recipientName:'Staging recipient',recipientPhone:'0412345678'}}])).result.job;
 const offer=(await call('driver','/state')).data.driverOffers.find(o=>o.jobId===job.id&&o.status==='PENDING');assert.ok(offer);await command('driver','acceptDriverOffer',[offer.id]);assert.equal((await call('customer','/state')).data.jobs.find(j=>j.id===job.id).driverId,driverId);pass('Customer quote/simulated authorization; independent Driver accepts; Customer sees assignment');
 for(const status of ['EN_ROUTE_TO_PICKUP','AT_PICKUP','PICKED_UP','EN_ROUTE_TO_DROPOFF','AT_DROPOFF','DELIVERED','COMPLETED']){
  if(status==='PICKED_UP')await command('driver','addJobProof',[{jobId:job.id,type:'pickup',photoUrl:png,label:'Staging pickup'}]);
  if(status==='DELIVERED')await command('driver','addJobProof',[{jobId:job.id,type:'delivery',photoUrl:png,label:'Staging delivery'}]);
  const current=(await call('customer','/state')).data.jobs.find(j=>j.id===job.id);await command('driver','updateJobStatus',[job.id,status,'DRIVER',driverId,status==='DELIVERED'?current.recipientCode:undefined]);assert.equal((await call('customer','/state')).data.jobs.find(j=>j.id===job.id).status,status);
 }
 const dispute=(await command('customer','createDispute',[{jobId:job.id,reason:'DAMAGE',description:'Staging test: packaging damaged, please review.'}])).result;await command('admin','resolveDispute',[dispute.id,'Staging evidence reviewed',{refundAmount:1,driverDeduction:0}]);assert.equal((await call('customer','/state')).data.disputes.find(d=>d.id===dispute.id).status,'RESOLVED');pass('Driver proofs and completion update Customer; Admin sees and resolves same dispute');
 for(const role of ['customer','driver']){await call(role,'/auth/logout',{});const login=await call(role,'/auth/login',{email:sessions[role].email,password});assert.equal(login.status,200);sessions[role]={...sessions[role],...login.data};assert.ok((await call(role,'/state')).data.jobs.some(j=>j.id===job.id));}pass('Refresh-equivalent reads and logout/re-login retain central delivery records');
 const result={status:'PASS',api,checks,jobId:job.id,physicalDevices:false,apiRestartVerified:false,remaining:'Perform controlled API restart and rerun persisted-record read; physical iOS/Android acceptance still required.',generatedAt:new Date().toISOString()};fs.mkdirSync('docs/progress/staging',{recursive:true});fs.writeFileSync('docs/progress/staging/remote-acceptance.json',JSON.stringify(result,null,2));
}finally{await Promise.all(Object.values(contexts).map(c=>c.dispose()));}
