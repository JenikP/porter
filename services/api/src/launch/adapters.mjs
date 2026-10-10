import { ApiError, requireRule } from './policy.mjs';
export async function route(pickup, dropoff) {
  requireRule(typeof pickup === 'string' && typeof dropoff === 'string' && pickup.trim().length >= 10 && dropoff.trim().length >= 10 && pickup.trim().toLowerCase() !== dropoff.trim().toLowerCase(), 'Enter different complete pickup and drop-off addresses', 400);
  if (process.env.ROUTING_PROVIDER === 'http') {
    requireRule(process.env.ROUTING_URL, 'Routing provider is not configured', 503);
    const response = await fetch(process.env.ROUTING_URL, {method:'POST',headers:{'Content-Type':'application/json',Authorization: `Bearer ${process.env.ROUTING_TOKEN || ''}`},body:JSON.stringify({pickup,dropoff}),signal:AbortSignal.timeout(8000)});
    if (!response.ok) throw new ApiError(503, 'Routing provider unavailable; retry your quote');
    const data = await response.json();
    requireRule(Number.isFinite(data.distanceKm) && data.distanceKm > 0 && Number.isFinite(data.durationMinutes) && data.durationMinutes > 0, 'Invalid routing response', 503);
    return { ...data, provider:'configured-http', simulated:false };
  }
  const distanceKm = /docklands/i.test(dropoff) ? 3.2 : /southbank/i.test(dropoff) ? 4.1 : /richmond/i.test(dropoff) ? 6.5 : /carlton/i.test(dropoff) ? 4.8 : 7.2;
  return {distanceKm,durationMinutes:Math.ceil(distanceKm * 3 + 8),provider:'Melbourne development simulator',simulated:true};
}
export async function deliverRecovery(message) {
  if (process.env.NOTIFICATION_PROVIDER === 'http') {
    requireRule(process.env.NOTIFICATION_URL && process.env.NOTIFICATION_TOKEN, 'Notification provider is not configured', 503);
    const response=await fetch(process.env.NOTIFICATION_URL,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.NOTIFICATION_TOKEN}`},body:JSON.stringify(message),signal:AbortSignal.timeout(8000)});
    requireRule(response.ok,'Notification delivery failed; retry later',503);
    return {provider:'configured-http'};
  }
  requireRule(process.env.NODE_ENV !== 'production', 'Configure a recovery email provider before production', 503);
  return {provider:'development simulator',developmentResetUrl:message.url};
}
export async function deliverNotification(message,key){
 if(process.env.NOTIFICATION_PROVIDER!=='http')return {provider:'simulator'};
 requireRule(process.env.NOTIFICATION_URL&&process.env.NOTIFICATION_TOKEN,'Notification provider is not configured',503);
 requireRule(['EMAIL','SMS','PUSH'].includes(message.channel),'Unsupported notification channel',400);
 const response=await fetch(process.env.NOTIFICATION_URL,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.NOTIFICATION_TOKEN}`,'Idempotency-Key':key},body:JSON.stringify(message),signal:AbortSignal.timeout(8000)});requireRule(response.ok,'Notification gateway unavailable',503);return {provider:'configured-http'};
}

async function payment(operation,input,key){
 if(process.env.PAYMENT_PROVIDER!=='http')return {provider:'simulator',reference:`SIM-${key}`};
 requireRule(process.env.PAYMENT_URL&&process.env.PAYMENT_TOKEN,'Payment provider is not configured',503);
 const response=await fetch(`${process.env.PAYMENT_URL.replace(/\/$/,'')}/${operation}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.PAYMENT_TOKEN}`,'Idempotency-Key':key},body:JSON.stringify(input),signal:AbortSignal.timeout(10000)});
 requireRule(response.ok,'Payment provider unavailable; retry the same operation',503);
 const result=await response.json();requireRule(result.ok===true&&typeof result.reference==='string','Payment was not confirmed by the provider',503);
 return {provider:'configured-http',reference:result.reference};
}
export async function settleChanges(previous,next,commandId){
 for(const entry of next.payments){
  const old=previous.payments.find(p=>p.id===entry.id);
  if(entry.status==='AUTHORIZED'&&old?.status!=='AUTHORIZED'){
   const outcome=await payment('authorize',{amount:entry.amount,currency:'AUD',quoteId:next.jobs.find(j=>j.id===entry.jobId)?.quoteId},`${commandId}:authorize`);
   entry.provider=outcome.provider;entry.providerPaymentId=outcome.reference;
  }
  if(entry.status==='CAPTURED'&&old?.status!=='CAPTURED')await payment('capture',{reference:entry.providerPaymentId,amount:entry.amount,currency:'AUD'},`${commandId}:capture`);
  const refund=(entry.refundAmount||0)-(old?.refundAmount||0);
  if(refund>0){
   if(old?.status==='AUTHORIZED'){const retained=entry.amount-(entry.refundAmount||0);if(retained>0)await payment('capture',{reference:entry.providerPaymentId,amount:retained,currency:'AUD'},`${commandId}:fee`);await payment('void',{reference:entry.providerPaymentId,amount:refund,currency:'AUD'},`${commandId}:void`);}
   else await payment('refund',{reference:entry.providerPaymentId,amount:refund,currency:'AUD'},`${commandId}:refund`);
  }
 }
 for(const payout of next.payouts)if(payout.status==='COMPLETED'&&previous.payouts.find(p=>p.id===payout.id)?.status!=='COMPLETED')await payment('payout',{payoutId:payout.id,driverId:payout.driverId,amount:payout.amount,currency:'AUD'},`${commandId}:payout`);
}
