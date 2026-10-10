import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { route, deliverRecovery, settleChanges, deliverNotification } from '../services/api/src/launch/adapters.mjs';

test('configured routing, recovery and financial gateway contracts, failure and idempotency keys', async () => {
  const calls=[];let fail=false;
  const server=http.createServer(async(req,res)=>{let raw='';for await(const chunk of req)raw+=chunk;calls.push({path:req.url,key:req.headers['idempotency-key'],authorization:req.headers.authorization,input:JSON.parse(raw)});res.setHeader('Content-Type','application/json');if(fail){res.writeHead(503);res.end('{}');return;}res.end(JSON.stringify(req.url==='/route'?{distanceKm:8.4,durationMinutes:23}: {ok:true,reference:'fixture-reference'}));});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const base=`http://127.0.0.1:${server.address().port}`;
  const keys=['ROUTING_PROVIDER','ROUTING_URL','ROUTING_TOKEN','NOTIFICATION_PROVIDER','NOTIFICATION_URL','NOTIFICATION_TOKEN','PAYMENT_PROVIDER','PAYMENT_URL','PAYMENT_TOKEN'];const previous=Object.fromEntries(keys.map(key=>[key,process.env[key]]));
  Object.assign(process.env,{ROUTING_PROVIDER:'http',ROUTING_URL:base+'/route',ROUTING_TOKEN:'fixture-only',NOTIFICATION_PROVIDER:'http',NOTIFICATION_URL:base+'/notify',NOTIFICATION_TOKEN:'fixture-only',PAYMENT_PROVIDER:'http',PAYMENT_URL:base,PAYMENT_TOKEN:'fixture-only'});
  try{
    assert.equal((await route('120 Collins St, Melbourne VIC 3000','200 Victoria St, Richmond VIC 3121')).distanceKm,8.4);
    assert.deepEqual(await deliverRecovery({to:'fixture@example.test',url:'https://customer.example.test/reset-password?token=fixture'}),{provider:'configured-http'});
    const state={payments:[],payouts:[],jobs:[{id:'job',quoteId:'quote'}]};const authorized={...state,payments:[{id:'payment',jobId:'job',amount:25,status:'AUTHORIZED'}]};await settleChanges(state,authorized,'command-authorization');assert.equal(authorized.payments[0].providerPaymentId,'fixture-reference');
    const captured={...authorized,payments:[{...authorized.payments[0],status:'CAPTURED'}]};await settleChanges(authorized,captured,'command-capture');
    const refunded={...captured,payments:[{...captured.payments[0],refundAmount:5}]};await settleChanges(captured,refunded,'command-refund');
    const cancelled={...authorized,payments:[{...authorized.payments[0],status:'REFUNDED',refundAmount:22.5}]};await settleChanges(authorized,cancelled,'command-cancel');
    await settleChanges(state,{...state,payouts:[{id:'payout',driverId:'driver',amount:20,status:'COMPLETED'}]},'command-payout');
    assert.deepEqual(calls.map(c=>c.path),['/route','/notify','/authorize','/capture','/refund','/capture','/void','/payout']);assert.equal(calls[5].input.amount,2.5);assert.equal(calls[6].input.amount,22.5);assert.equal(calls[2].key,'command-authorization:authorize');assert.ok(calls.every(c=>c.authorization==='Bearer fixture-only'));
    for(const channel of ['EMAIL','SMS','PUSH'])assert.deepEqual(await deliverNotification({channel,to:'fixture-recipient',body:'Delivery assigned'},`notification-${channel}`),{provider:'configured-http'});assert.equal(calls.at(-1).key,'notification-PUSH');
    fail=true;await assert.rejects(()=>settleChanges(state,authorized,'failure-retry'),/Payment provider unavailable/);await assert.rejects(()=>route('120 Collins St, Melbourne VIC 3000','200 Victoria St, Richmond VIC 3121'),/Routing provider unavailable/);await assert.rejects(()=>deliverRecovery({to:'fixture@example.test'}),/Notification delivery failed/);await assert.rejects(()=>deliverNotification({channel:'SMS'},'retry'),/Notification gateway unavailable/);
  }finally{for(const [key,value] of Object.entries(previous))if(value===undefined)delete process.env[key];else process.env[key]=value;await new Promise(r=>server.close(r));}
});
