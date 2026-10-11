import http from 'node:http';
import { randomBytes, randomUUID, createHash, createHmac, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { openDatabase } from './database.mjs';
import { ApiError, requireRule, authorizeCommand, scopedState, pick } from './policy.mjs';
import { route, deliverRecovery, settleChanges, deliverNotification } from './adapters.mjs';
import {decodeUpload,privateStorage} from './storage.mjs';
import { createSeedMockPlatformState } from '../../../../packages/mock-platform/src/seed.ts';
import { createMockPlatformActions, driverHasValidDocuments } from '../../../../packages/mock-platform/src/store.ts';
import { deserializeMockPlatformState } from '../../../../packages/mock-platform/src/serialization.ts';
import { calculatePrice, recommendVehicle } from '@porter/domain';
import { DocumentType, DriverApprovalStatus, VehicleClass, ItemSize, TimeOption, DRIVER_TERMS_VERSION, REQUIRED_DRIVER_DOCUMENTS, driverApplicationErrors } from '@porter/shared';

const derive = promisify(scrypt);
const hash = value => createHash('sha256').update(value).digest('hex');
const passwordHash = async password => { const salt=randomBytes(16).toString('hex'); const key=await derive(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024}); return `${salt}:${key.toString('hex')}`; };
const passwordMatches = async (password, stored) => {const [salt,key]=stored.split(':');const actual=await derive(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});return timingSafeEqual(actual,Buffer.from(key,'hex'));};
const passwordValid = value => requireRule(typeof value === 'string' && value.length >= 12 && value.length <= 128, 'Use a password of 12–128 characters', 400);
const emailValid = email => requireRule(typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length < 255, 'Enter a valid email address', 400);
const appForRole = role => role.endsWith('_ADMIN') ? 'admin' : role.toLowerCase();
const publicAccount = user => ({id:user.id,email:user.email,name:user.name,role:user.role,profileId:user.profile_id,onboarded:!!user.onboarded});
const expiresIn = 7*86400000;
const production=process.env.NODE_ENV === 'production';
if(process.env.PORTER_ENV==='staging'&&process.env.PAYMENT_PROVIDER&&process.env.PAYMENT_PROVIDER!=='simulator')throw new Error('Staging is simulator-only and cannot accept real payments');
if(production&&process.env.ALLOW_SIMULATORS!=='true'&&['PAYMENT_PROVIDER','ROUTING_PROVIDER','NOTIFICATION_PROVIDER'].some(key=>process.env[key]!=='http'))throw new Error('Configure real provider adapters or explicitly ALLOW_SIMULATORS=true for staging');
const webOrigins=(process.env.APP_ORIGINS || 'http://127.0.0.1:5173,http://127.0.0.1:5174,http://127.0.0.1:5175,http://localhost:5173,http://localhost:5174,http://localhost:5175').split(',');
if(production && (!process.env.APP_ORIGINS || webOrigins.some(o=>!o.startsWith('https://')))) throw new Error('Production requires explicit HTTPS APP_ORIGINS');
const nativeOrigins=(process.env.NATIVE_ORIGINS||'').split(',').filter(Boolean);requireRule(nativeOrigins.every(o=>['capacitor://localhost','https://localhost'].includes(o)),'Invalid native origin');
const allowedOrigins=[...webOrigins,...nativeOrigins];
const seed=createSeedMockPlatformState();
if(process.env.DEMO_SEED !== 'true') for(const key of Object.keys(seed)) if(key !== 'rateCards' && Array.isArray(seed[key])) seed[key]=[];
const db=await openDatabase(seed);
const storage=privateStorage();
if(process.env.BOOTSTRAP_ADMIN_EMAIL && process.env.BOOTSTRAP_ADMIN_PASSWORD) {
  passwordValid(process.env.BOOTSTRAP_ADMIN_PASSWORD); emailValid(process.env.BOOTSTRAP_ADMIN_EMAIL);
  await db.query('INSERT INTO accounts(id,email,password_hash,role,profile_id,name,onboarded) VALUES($1,$2,$3,$4,$5,$6,1) ON CONFLICT(email) DO NOTHING',[randomUUID(),process.env.BOOTSTRAP_ADMIN_EMAIL.toLowerCase(),await passwordHash(process.env.BOOTSTRAP_ADMIN_PASSWORD),'MANAGER_ADMIN',randomUUID(),'Porter Manager']);
}
if(!production && process.env.DEV_SUPPORT_EMAIL && process.env.DEV_SUPPORT_PASSWORD) {
  passwordValid(process.env.DEV_SUPPORT_PASSWORD);
  await db.query('INSERT INTO accounts(id,email,password_hash,role,profile_id,name,onboarded) VALUES($1,$2,$3,$4,$5,$6,1) ON CONFLICT(email) DO NOTHING',[randomUUID(),process.env.DEV_SUPPORT_EMAIL,await passwordHash(process.env.DEV_SUPPORT_PASSWORD),'SUPPORT_ADMIN',randomUUID(),'Porter Support']);
}
const readState=async q=>deserializeMockPlatformState((await q('SELECT data FROM porter_state WHERE id=1'))[0].data);
const saveState=(q,state)=>q('UPDATE porter_state SET data=$1,revision=revision+1 WHERE id=1',[JSON.stringify(state)]);
const engine=state=>{let next=state;const actions=createMockPlatformActions(update=>{next=typeof update==='function'?update(next):update;});return {actions,get state(){return next;}};};
const rates=new Map();
const limit=(key,max=20)=>{const now=Date.now();const current=rates.get(key);const entry=current&&current.until>now?current:{count:0,until:now+15*60000};entry.count++;rates.set(key,entry);requireRule(entry.count<=max,'Too many attempts; try again later',429);};
const cookie=(app,token,maxAge)=>`porter_${app}_session=${token}; HttpOnly; Path=/api; SameSite=${production&&process.env.SESSION_CROSS_SITE==='true'?'None':'Lax'}; Max-Age=${maxAge}${production?'; Secure':''}`;
async function session(req,app) {
  const token=(req.headers.cookie || '').split(';').map(s=>s.trim()).find(s=>s.startsWith(`porter_${app}_session=`))?.split('=').slice(1).join('=');
  requireRule(token,'Sign in to continue',401);
  const user=(await db.query('SELECT a.*,s.csrf,s.hash AS session_hash FROM sessions s JOIN accounts a ON a.id=s.account_id WHERE s.hash=$1 AND s.expires>$2',[hash(token),Date.now()]))[0];
  requireRule(user && appForRole(user.role)===app,'Sign in with the correct account',401);
  if(!['GET','HEAD'].includes(req.method)) requireRule(req.headers['x-csrf-token']===user.csrf,'Invalid session verification',403);
  return user;
}
async function body(req) {let value='';for await(const chunk of req){value+=chunk;requireRule(Buffer.byteLength(value)<=8*1024*1024,'Upload exceeds 8 MB',413);}try{return value?JSON.parse(value):{};}catch{throw new ApiError(400,'Invalid JSON');}}
const server=http.createServer(async(req,res)=>{
  const requestId=randomUUID();res.setHeader('X-Request-ID',requestId);
  const origin=req.headers.origin;
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');
  if(origin && !allowedOrigins.includes(origin)){res.writeHead(403);res.end();return;}
  if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Access-Control-Allow-Credentials','true');res.setHeader('Vary','Origin');}
  if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Headers','Content-Type,X-Porter-App,X-CSRF-Token,Idempotency-Key');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.writeHead(204);res.end();return;}
  const respond=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data));};
  try {
    const url=new URL(req.url,'http://porter.local');
    const app=req.headers['x-porter-app'];
    if(url.pathname==='/api/health'){await db.query('SELECT id FROM porter_state WHERE id=1');respond(200,{status:'ok',database:db.provider,documents:storage.provider,environment:process.env.PORTER_ENV||process.env.NODE_ENV||'development',requestId,payments:process.env.PAYMENT_PROVIDER||'simulator',routing:process.env.ROUTING_PROVIDER||'simulator',notifications:process.env.NOTIFICATION_PROVIDER||'simulator'});return;}
    if(url.pathname==='/api/webhooks/payments'&&req.method==='POST'){
      requireRule(process.env.PAYMENT_WEBHOOK_SECRET,'Webhook verification is not configured',503);
      let raw='';for await(const chunk of req){raw+=chunk;requireRule(raw.length<100000,'Webhook too large',413);}
      const provided=String(req.headers['x-porter-signature']||'');const expected=createHmac('sha256',process.env.PAYMENT_WEBHOOK_SECRET).update(raw).digest('hex');requireRule(/^[a-f0-9]{64}$/.test(provided)&&timingSafeEqual(Buffer.from(provided),Buffer.from(expected)),'Invalid webhook signature',401);
      const event=JSON.parse(raw);requireRule(typeof event.id==='string'&&event.id.length<100&&['capture.confirmed','refund.confirmed'].includes(event.type),'Invalid payment event',400);
      await db.transaction(async q=>{if((await q('SELECT id FROM webhook_events WHERE id=$1',[event.id])).length)return;const state=await readState(q);const payment=state.payments.find(p=>p.providerPaymentId===event.reference);requireRule(payment,'Unknown payment reference',404);requireRule(event.amount===payment.amount||event.type==='refund.confirmed','Capture amount does not match',400);if(event.type==='capture.confirmed')requireRule(payment.status==='CAPTURED','Capture must first be initiated through verified completion',409);else requireRule(Number.isFinite(event.amount)&&event.amount<=Number(payment.refundAmount||0),'Refund must first be initiated through operations',409);await q('INSERT INTO webhook_events(id,received) VALUES($1,$2)',[event.id,Date.now()]);});respond(200,{received:true});return;
    }
    requireRule(['customer','driver','admin'].includes(app),'Specify an application',400);
    if(url.pathname.startsWith('/api/auth/') && req.method==='POST'){
      limit(`${req.socket.remoteAddress}:${url.pathname}`,process.env.NODE_ENV==='test'?1000:20);
      const input=await body(req);const email=String(input.email||'').trim().toLowerCase();
      if(url.pathname==='/api/auth/register'){
        requireRule(app!=='admin','Admin registration is unavailable');emailValid(email);passwordValid(input.password);requireRule(typeof input.name==='string' && input.name.trim().length>=2 && input.name.length<=100,'Enter your full name',400);
        const encrypted=await passwordHash(input.password);const id=randomUUID();const profileId=randomUUID();
        await db.transaction(async q=>{
          requireRule(!(await q('SELECT id FROM accounts WHERE email=$1',[email])).length,'Account already exists',409);
          await q('INSERT INTO accounts(id,email,password_hash,role,profile_id,name) VALUES($1,$2,$3,$4,$5,$6)',[id,email,encrypted,app.toUpperCase(),profileId,input.name.trim()]);
          const state=await readState(q);const now=new Date();
          if(app==='customer') state.customers.push({id:profileId,userId:id,type:input.accountType==='BUSINESS'?'BUSINESS':'CONSUMER',name:input.name.trim(),email,phone:input.phone||'',businessName:input.accountType==='BUSINESS'?input.businessName||'':undefined,savedAddresses:[],notificationsEnabled:true,createdAt:now,updatedAt:now});
          else state.drivers.push({id:profileId,userId:id,name:input.name.trim(),email,phone:input.phone||'',approvalStatus:DriverApprovalStatus.PENDING,applicationStatus:'DRAFT',onboardingStep:0,isOnline:false,isSuspended:false,termsAccepted:false,rating:0,totalJobs:0,cancellationCount:0,weeklyEarnings:0,payoutBalance:0,bankName:'',accountNumber:'',bsb:'',createdAt:now,updatedAt:now});
          await saveState(q,state);
        });
        respond(201,{message:'Account created. Sign in to continue.'});return;
      }
      if(url.pathname==='/api/auth/login'){
        emailValid(email);requireRule(typeof input.password==='string' && input.password.length<=128,'Invalid email or password',401);
        const user=(await db.query('SELECT * FROM accounts WHERE email=$1',[email]))[0];
        requireRule(user && await passwordMatches(input.password,user.password_hash) && appForRole(user.role)===app,'Invalid email or password for this application',401);
        const token=randomBytes(32).toString('hex');const csrf=randomBytes(24).toString('hex');
        await db.query('INSERT INTO sessions(hash,account_id,csrf,expires) VALUES($1,$2,$3,$4)',[hash(token),user.id,csrf,Date.now()+expiresIn]);
        res.setHeader('Set-Cookie',cookie(app,token,expiresIn/1000));respond(200,{user:publicAccount(user),csrf});return;
      }
      if(url.pathname==='/api/auth/forgot'){
        emailValid(email);const user=(await db.query('SELECT * FROM accounts WHERE email=$1',[email]))[0];let delivery={};
        if(user && appForRole(user.role)===app){const token=randomBytes(32).toString('hex');await db.query('INSERT INTO recovery(hash,account_id,expires) VALUES($1,$2,$3)',[hash(token),user.id,Date.now()+30*60000]);const target=allowedOrigins.find(o=>o===origin)||allowedOrigins[{customer:0,driver:1,admin:2}[app]];delivery=await deliverRecovery({to:email,type:'PASSWORD_RECOVERY',url:`${target}/reset-password?token=${token}`});}
        respond(200,{message:'If an account exists, recovery instructions have been sent.',...delivery});return;
      }
      if(url.pathname==='/api/auth/reset'){
        passwordValid(input.password);const encrypted=await passwordHash(input.password);
        await db.transaction(async q=>{const entry=(await q('SELECT r.*,a.role FROM recovery r JOIN accounts a ON a.id=r.account_id WHERE r.hash=$1 AND r.expires>$2',[hash(String(input.token||'')),Date.now()]))[0];requireRule(entry&&appForRole(entry.role)===app,'Reset link is invalid or expired',400);await q('UPDATE accounts SET password_hash=$1 WHERE id=$2',[encrypted,entry.account_id]);await q('DELETE FROM sessions WHERE account_id=$1',[entry.account_id]);await q('DELETE FROM recovery WHERE account_id=$1',[entry.account_id]);});respond(200,{message:'Password changed. Sign in with your new password.'});return;
      }
    }
    const user=await session(req,app);
    if(url.pathname==='/api/telemetry'&&req.method==='POST'){
      limit(`telemetry:${user.id}`,60);const input=await body(req);requireRule(['CLIENT_ERROR','UNHANDLED_REJECTION'].includes(input.event),'Invalid health event',400);await db.query('INSERT INTO telemetry(event,count) VALUES($1,1) ON CONFLICT(event) DO UPDATE SET count=telemetry.count+1',[input.event]);respond(200,{recorded:true});return;
    }
    if(url.pathname==='/api/operations/health'&&req.method==='GET'){
      requireRule(user.role.endsWith('_ADMIN'),'Operations access required');const rows=await db.query('SELECT status,COUNT(*) AS count FROM notification_outbox GROUP BY status');respond(200,{database:db.provider,providers:{payments:process.env.PAYMENT_PROVIDER||'simulator',routing:process.env.ROUTING_PROVIDER||'simulator',notifications:process.env.NOTIFICATION_PROVIDER||'simulator'},notificationOutbox:rows,clientErrors:await db.query('SELECT event,count FROM telemetry'),backgroundLocation:false});return;
    }
    if(url.pathname==='/api/devices'&&req.method==='POST'){
      const input=await body(req);requireRule(['android','ios'].includes(input.platform)&&typeof input.token==='string'&&input.token.length>=16&&input.token.length<=4096,'Invalid device registration',400);
      await db.query('INSERT INTO devices(token_hash,account_id,platform,token) VALUES($1,$2,$3,$4) ON CONFLICT(token_hash) DO UPDATE SET account_id=excluded.account_id,platform=excluded.platform,token=excluded.token',[hash(input.token),user.id,input.platform,input.token]);respond(200,{registered:true});return;
    }
    if(url.pathname==='/api/auth/me'&&req.method==='GET'){respond(200,{user:publicAccount(user),csrf:user.csrf});return;}
    if(url.pathname==='/api/auth/logout'&&req.method==='POST'){await db.query('DELETE FROM sessions WHERE hash=$1',[user.session_hash]);await db.query('DELETE FROM devices WHERE account_id=$1',[user.id]);res.setHeader('Set-Cookie',cookie(app,'',0));respond(200,{message:'Signed out'});return;}
    if(url.pathname==='/api/auth/onboarding'&&req.method==='POST'){await db.query('UPDATE accounts SET onboarded=1 WHERE id=$1',[user.id]);respond(200,{user:{...publicAccount(user),onboarded:true}});return;}
    if(url.pathname==='/api/state'&&req.method==='GET'){
      const state=await db.transaction(async q=>{const s=await readState(q);let changed=false;for(const d of s.drivers)if(d.isOnline&&!driverHasValidDocuments(s,d.id).ok){d.isOnline=false;changed=true;}if(changed)await saveState(q,s);return s;});respond(200,scopedState(user,state));return;
    }
    if(url.pathname==='/api/notifications/read'&&req.method==='POST'){
      const input=await body(req);await db.transaction(async q=>{const state=await readState(q);const notification=state.notifications.find(n=>n.id===input.id&&n.userId===user.id);requireRule(notification,'Notification unavailable',404);notification.readAt=new Date();await saveState(q,state);});respond(200,{read:true});return;
    }
    if(url.pathname==='/api/addresses'&&req.method==='GET'){
      const search=String(url.searchParams.get('q')||'').trim();requireRule(search.length>=3&&search.length<=200,'Enter at least three characters',400);
      if(process.env.ADDRESS_SEARCH_URL){const target=new URL(process.env.ADDRESS_SEARCH_URL);target.searchParams.set('q',search);const response=await fetch(target,{headers:{Authorization:`Bearer ${process.env.ROUTING_TOKEN||''}`},signal:AbortSignal.timeout(8000)});requireRule(response.ok,'Address search unavailable',503);const addresses=await response.json();requireRule(Array.isArray(addresses)&&addresses.length<=50&&addresses.every(a=>typeof a==='string'&&a.length<=500),'Invalid address provider response',503);respond(200,{provider:'configured-http',addresses});}
      else respond(200,{provider:'Melbourne development simulator',addresses:['120 Collins St, Melbourne VIC 3000','700 Bourke St, Docklands VIC 3008','1 Southbank Blvd, Southbank VIC 3006','285 Russell St, Melbourne VIC 3000','200 Victoria St, Richmond VIC 3121','73 Nicholson St, Footscray VIC 3011'].filter(a=>a.toLowerCase().includes(search.toLowerCase()))});return;
    }
    if(url.pathname==='/api/location'&&req.method==='POST'){
      requireRule(user.role==='DRIVER','Only drivers can update location');const input=await body(req);requireRule(Number.isFinite(input.lat)&&input.lat>=-90&&input.lat<=90&&Number.isFinite(input.lng)&&input.lng>=-180&&input.lng<=180,'Invalid coordinates',400);await db.transaction(async q=>{const state=await readState(q);const d=state.drivers.find(d=>d.id===user.profile_id);requireRule(d?.isOnline,'Go online before sharing location',409);d.location={lat:input.lat,lng:input.lng,updatedAt:new Date()};await saveState(q,state);});respond(200,{updated:true});return;
    }
    if(url.pathname==='/api/uploads'&&req.method==='POST'){
      const input=await body(req),file=decodeUpload(input),id=randomUUID();await storage.put(id,file.bytes,file.mime);await db.query('INSERT INTO uploads(id,account_id,name,mime,data) VALUES($1,$2,$3,$4,$5)',[id,user.id,file.name,file.mime,'storage:'+id]);respond(201,{url:`/api/uploads/${id}`});return;
    }
    if(url.pathname.startsWith('/api/uploads/')&&req.method==='GET'){
      const upload=(await db.query('SELECT * FROM uploads WHERE id=$1',[url.pathname.split('/').pop()]))[0];requireRule(upload && (upload.account_id===user.id || user.role.endsWith('_ADMIN')),'Upload unavailable',404);const bytes=upload.data.startsWith('storage:')?await storage.get(upload.id):undefined;respond(200,{name:upload.name,data:bytes?`data:${upload.mime};base64,${bytes.toString('base64')}`:upload.data});return;
    }
    if(url.pathname==='/api/driver/application'&&req.method==='POST'){
      requireRule(user.role==='DRIVER','Driver account required');const input=await body(req);
      const response=await db.transaction(async q=>{
        const state=await readState(q),d=state.drivers.find(d=>d.id===user.profile_id),e=engine(state);requireRule(d,'Driver profile unavailable',404);
        if(input.action==='profile'){
          const profile=pick(input.profile,['name','phone','identityNumber','abn']);for(const key of Object.keys(profile)){requireRule(typeof profile[key]==='string'&&profile[key].length<=120,'Invalid profile value',400);profile[key]=profile[key].trim();}
          const vehicle=pick(input.vehicle,['type','make','model','year','plate']);requireRule(Object.values(VehicleClass).includes(vehicle.type)&&['make','model','plate'].every(k=>typeof vehicle[k]==='string'&&vehicle[k].length<=100)&&Number.isInteger(vehicle.year)&&vehicle.year>=1980&&vehicle.year<=new Date().getFullYear()+1,'Enter valid vehicle information',400);
          requireRule(d.approvalStatus!=='APPROVED','Contact operations to change an approved identity or vehicle',409);
          e.actions.updateDriverProfile(d.id,profile);e.actions.updateVehicle(d.id,vehicle);
        }else if(input.action==='terms'){
          requireRule(input.accepted===true&&input.version===DRIVER_TERMS_VERSION,'Explicit acceptance of current prototype terms is required',400);
          Object.assign(d,{termsAccepted:true,termsVersion:DRIVER_TERMS_VERSION,termsAcceptedAt:d.termsVersion===DRIVER_TERMS_VERSION&&d.termsAcceptedAt?d.termsAcceptedAt:new Date()});
        }else if(input.action==='step'){requireRule(Number.isInteger(input.step)&&input.step>=0&&input.step<=6,'Invalid onboarding step',400);requireRule(input.step<2||d.termsVersion===DRIVER_TERMS_VERSION&&d.termsAcceptedAt,'Accept current terms before document submission',409);d.onboardingStep=input.step;
        }else if(input.action==='remove'){
          requireRule(d.approvalStatus!=='APPROVED','Approved documents must be replaced rather than removed',409);requireRule(REQUIRED_DRIVER_DOCUMENTS.includes(input.type),'Invalid document type',400);state.driverDocuments=state.driverDocuments.filter(doc=>!(doc.driverId===d.id&&doc.type===input.type));d.applicationStatus='DRAFT';d.isOnline=false;
        }else if(input.action==='submit'){
          const errors=driverApplicationErrors(d,state.vehicles.find(v=>v.driverId===d.id),state.driverDocuments);requireRule(!errors.length,errors.join('; '),409);requireRule(!d.isSuspended,'Suspended applications cannot be submitted',409);d.applicationStatus='PENDING_REVIEW';d.approvalStatus=DriverApprovalStatus.PENDING;d.submittedAt=new Date();d.isOnline=false;d.onboardingStep=6;
          state.auditLogs.push({id:randomUUID(),adminId:user.id,action:'SUBMIT_DRIVER_APPLICATION',entityType:'Driver',entityId:d.id,createdAt:new Date(),reason:'Driver submitted current profile, terms and documents'});
        }else throw new ApiError(400,'Invalid application action');
        await saveState(q,e.state);return {state:scopedState(user,e.state)};
      });respond(200,response);return;
    }
    if(url.pathname==='/api/driver/documents'&&req.method==='POST'){
      requireRule(user.role==='DRIVER','Driver account required');const input=await body(req),file=decodeUpload(input),key=req.headers['idempotency-key'];requireRule(typeof key==='string'&&key.length>=16&&key.length<=100,'An upload idempotency key is required',400);const id=hash(user.id+key),fingerprint=hash(JSON.stringify(input));
      const output=await db.transaction(async q=>{
        const existing=(await q('SELECT * FROM commands WHERE id=$1',[id]))[0];if(existing){requireRule(existing.account_id===user.id&&existing.fingerprint===fingerprint,'Upload key already used',409);return JSON.parse(existing.result);}
        const state=await readState(q),d=state.drivers.find(d=>d.id===user.profile_id);requireRule(d?.termsAccepted&&d.termsVersion===DRIVER_TERMS_VERSION&&d.termsAcceptedAt,'Accept the current driver terms before uploading documents',409);requireRule(REQUIRED_DRIVER_DOCUMENTS.includes(input.type),'Invalid document category',400);
        const expiry=input.expiryDate?new Date(input.expiryDate):undefined;requireRule(!expiry||Number.isFinite(expiry.getTime())&&expiry>new Date(),'Use a future document expiry date',400);requireRule(!['LICENCE','VEHICLE_REGISTRATION','INSURANCE'].includes(input.type)||expiry,'An expiry date is required for this document',400);
        await storage.put(id,file.bytes,file.mime);await q('INSERT INTO uploads(id,account_id,name,mime,data) VALUES($1,$2,$3,$4,$5)',[id,user.id,file.name,file.mime,'storage:'+id]);const e=engine(state);e.actions.submitDriverDocument(d.id,input.type,`/api/uploads/${id}`,expiry);const doc=e.state.driverDocuments.find(doc=>doc.driverId===d.id&&doc.type===input.type);doc.filename=file.name;e.state.drivers.find(x=>x.id===d.id).applicationStatus=d.applicationStatus==='CHANGES_REQUIRED'?'CHANGES_REQUIRED':'DRAFT';await saveState(q,e.state);const result={url:doc.fileUrl,document:doc,state:scopedState(user,e.state)};await q('INSERT INTO commands(id,account_id,fingerprint,result) VALUES($1,$2,$3,$4)',[id,user.id,fingerprint,JSON.stringify(result)]);return result;
      });respond(201,output);return;
    }
    if(url.pathname==='/api/admin/driver-review'&&req.method==='POST'){
      requireRule(user.role==='MANAGER_ADMIN','Manager Admin access required');const input=await body(req);requireRule(['CHANGES_REQUIRED','REJECTED'].includes(input.status)&&typeof input.reason==='string'&&input.reason.trim().length>=3&&input.reason.length<=2000,'Choose a review decision and explain the reason',400);
      await db.transaction(async q=>{const state=await readState(q),d=state.drivers.find(d=>d.id===input.driverId);requireRule(d,'Driver unavailable',404);d.applicationStatus=input.status;d.applicationNotes=input.reason.trim();d.approvalStatus=input.status==='REJECTED'?DriverApprovalStatus.REJECTED:DriverApprovalStatus.PENDING;d.isOnline=false;state.auditLogs.push({id:randomUUID(),adminId:user.id,action:'REVIEW_DRIVER_APPLICATION',entityType:'Driver',entityId:d.id,reason:input.reason,createdAt:new Date()});state.notifications.push({id:randomUUID(),userId:d.userId,channel:'IN_APP',type:'APPLICATION_REVIEW',title:'Driver application update',body:input.reason,status:'SENT',createdAt:new Date()});await saveState(q,state);});respond(200,{saved:true});return;
    }
    if(url.pathname==='/api/commands'&&req.method==='POST'){
      const input=await body(req);const commandId=req.headers['idempotency-key'];requireRule(typeof commandId==='string'&&commandId.length>=16&&commandId.length<=100,'An idempotency key is required',400);requireRule(typeof input.method==='string'&&Array.isArray(input.args),'Invalid command',400);
      const fingerprint=hash(JSON.stringify(input));
      const output=await db.transaction(async q=>{
        const existing=(await q('SELECT * FROM commands WHERE id=$1',[commandId]))[0];
        if(existing){requireRule(existing.account_id===user.id&&existing.fingerprint===fingerprint,'Idempotency key was used for another operation',409);return JSON.parse(existing.result);}
        const state=await readState(q);const previousNotifications=new Set(state.notifications.map(n=>n.id));const actions=engine(state);const args=deserializeMockPlatformState(JSON.stringify(input.args));const method=input.method;
        authorizeCommand(user,state,method,args);
        if(method==='createQuote'){
          const fields=pick(args[0],['pickupAddress','dropoffAddress','vehicleClass','timeOption','stairs','helperRequired']);
          requireRule(Object.values(VehicleClass).includes(fields.vehicleClass)&&Object.values(TimeOption).includes(fields.timeOption)&&Number.isInteger(fields.stairs)&&fields.stairs>=0&&fields.stairs<=20&&typeof fields.helperRequired==='boolean','Invalid quote options',400);
          const estimate=await route(fields.pickupAddress,fields.dropoffAddress);const rate=state.rateCards.filter(r=>r.effectiveFrom<=new Date()).sort((a,b)=>b.effectiveFrom-a.effectiveFrom||b.version-a.version)[0];requireRule(rate,'No current rate card',503);
          const breakdown=calculatePrice({...fields,...estimate,rateCard:rate.values});args[0]={...fields,customerId:user.profile_id,...estimate,price:breakdown.total,priceBreakdown:breakdown,rateCardVersionId:rate.id,expiresAt:new Date(Date.now()+15*60000),validUntil:new Date(Date.now()+15*60000)};
        }
        if(method==='bookDelivery'){
          const quote=state.quotes.find(x=>x.id===args[0]?.quote?.id&&x.customerId===user.profile_id);requireRule(quote,'Use your own saved quote',400);requireRule(!state.jobs.some(j=>j.quoteId===quote.id),'This quote has already been booked',409);
          const item=pick(args[0].item,['description','size','weightKg','quantity','photos','notes']);requireRule(typeof item.description==='string'&&item.description.trim().length>=2&&Object.values(ItemSize).includes(item.size)&&Number.isFinite(item.weightKg)&&item.weightKg>0&&item.weightKg<=500&&Number.isInteger(item.quantity)&&item.quantity>=1&&item.quantity<=100&&Array.isArray(item.photos)&&item.photos.length<=5,'Invalid delivery item',400);
          requireRule(!(recommendVehicle(item.size,item.weightKg*item.quantity,quote.helperRequired)===VehicleClass.VAN_OR_UTE&&quote.vehicleClass!==VehicleClass.VAN_OR_UTE),'A van is required for this item',400);
          args[0]={customerId:user.profile_id,quote,item,jobFields:{...pick(args[0].jobFields,['pickupNotes','dropoffNotes','recipientName','recipientPhone']),recipientCode:String(Math.floor(1000+Math.random()*9000))},paymentFail:!!args[0].paymentFail};
        }
        if(method==='authorizePayment'){args[0].customerId=user.profile_id;args[0].amount=state.jobs.find(j=>j.id===args[0].jobId).price;}
        if(method==='returnJobToSearching'&&user.role==='CUSTOMER')requireRule(state.jobs.find(j=>j.id===args[0]).status==='BOOKED','Only retry payment on a booked delivery',400);
        if(method==='submitDriverDocument'){const d=state.drivers.find(d=>d.id===user.profile_id);requireRule(d?.termsVersion===DRIVER_TERMS_VERSION&&d.termsAcceptedAt,'Accept current terms before submitting documents',409);requireRule(Object.values(DocumentType).includes(args[1]),'Invalid document type',400);requireRule(typeof args[2]==='string'&&args[2].startsWith('/api/uploads/'),'Upload a document before submitting it',400);const uploaded=(await q('SELECT account_id FROM uploads WHERE id=$1',[args[2].split('/').pop()]))[0];requireRule(uploaded?.account_id===user.id,'Document upload belongs to another account');if(args[3]){args[3]=new Date(args[3]);requireRule(Number.isFinite(args[3].getTime())&&args[3]>new Date(),'Use a future expiry date',400);}}
        if(method==='updateDriverDocument'){const doc=state.driverDocuments.find(d=>d.id===args[0]);requireRule(doc,'Document unavailable',404);if(['REJECTED','ACTION_REQUIRED'].includes(args[1]?.status))requireRule(args[1].reviewNotes?.trim().length>=3,'Explain why this document needs correction',400);if(args[1]?.status==='APPROVED')requireRule(!(args[1].expiryDate||doc.expiryDate)||new Date(args[1].expiryDate||doc.expiryDate)>new Date(),'Expired documents cannot be approved',409);}
        if(method==='approveDriver'){const d=state.drivers.find(d=>d.id===args[0]);requireRule(d?.applicationStatus==='PENDING_REVIEW','Driver must submit a complete application for review',409);const errors=driverApplicationErrors(d,state.vehicles.find(v=>v.driverId===d.id),state.driverDocuments,true);requireRule(!errors.length,errors.join('; '),409);for(const doc of state.driverDocuments.filter(doc=>doc.driverId===d.id)){const stored=(await q('SELECT id FROM uploads WHERE id=$1',[doc.fileUrl.split('/').pop()]))[0];requireRule(stored,'Required private document file is missing',409);}}
        if(method==='markDriverOnline'){const d=state.drivers.find(d=>d.id===args[0]);requireRule(d?.termsVersion===DRIVER_TERMS_VERSION&&d.termsAcceptedAt,'Accept current driver terms before going online',409);}
        const result=actions.actions[method](...args);
        if(method==='approveDriver')actions.state.drivers.find(d=>d.id===args[0]).applicationStatus='APPROVED';
        if(method==='rejectDriver')actions.state.drivers.find(d=>d.id===args[0]).applicationStatus='REJECTED';
        if(method==='submitDriverDocument')actions.state.drivers.find(d=>d.id===args[0]).applicationStatus='DRAFT';
        if(method==='updateDriverDocument'&&['REJECTED','ACTION_REQUIRED','EXPIRED'].includes(args[1]?.status)){const doc=actions.state.driverDocuments.find(d=>d.id===args[0]);const d=actions.state.drivers.find(d=>d.id===doc.driverId);d.applicationStatus='CHANGES_REQUIRED';d.approvalStatus=DriverApprovalStatus.PENDING;d.isOnline=false;}
        if(method==='markDriverOnline'&&!result.ok)throw new ApiError(409,result.reason);
        if(['markDriverOnline','declineDriverOffer','returnJobToSearching'].includes(method)) for(const j of actions.state.jobs.filter(j=>['SEARCHING','UNMATCHED'].includes(j.status)))actions.actions.searchDrivers(j.id);
        const previousLogs=new Set(state.auditLogs.map(l=>l.id));const previousEvents=new Set(state.jobEvents.map(e=>e.id));
        for(const log of actions.state.auditLogs)if(!previousLogs.has(log.id))log.adminId=user.id;
        for(const event of actions.state.jobEvents)if(!previousEvents.has(event.id)&&event.actorType==='ADMIN')event.actorId=user.id;
        for(const event of actions.state.jobEvents.filter(e=>!previousEvents.has(e.id))){const job=actions.state.jobs.find(j=>j.id===event.jobId);const recipients=[actions.state.customers.find(c=>c.id===job.customerId)?.userId,actions.state.drivers.find(d=>d.id===job.driverId)?.userId].filter(Boolean);for(const recipient of recipients)actions.state.notifications.push({id:randomUUID(),userId:recipient,channel:'IN_APP',type:'DELIVERY_UPDATE',title:'Delivery update',body:`${job.id} · ${event.toStatus.replaceAll('_',' ')}`,status:'SENT',sentAt:new Date(),createdAt:new Date()});}
        for(const notification of actions.state.notifications.filter(n=>!previousNotifications.has(n.id))){
          const recipient=(await q('SELECT email FROM accounts WHERE id=$1',[notification.userId]))[0];if(!recipient)continue;
          const profile=[...actions.state.customers,...actions.state.drivers].find(p=>p.userId===notification.userId);if(profile?.notificationsEnabled===false)continue;
          const channels=(process.env.NOTIFICATION_CHANNELS||'').split(',');for(const channel of channels.filter(c=>['EMAIL','SMS','PUSH'].includes(c))){const destinations=channel==='EMAIL'?[recipient.email]:channel==='SMS'?(profile?.phone?[profile.phone]:[]):(await q('SELECT token FROM devices WHERE account_id=$1',[notification.userId])).map(d=>d.token);for(const to of destinations){const id=randomUUID();await q('INSERT INTO notification_outbox(id,account_id,payload,due) VALUES($1,$2,$3,$4)',[id,notification.userId,JSON.stringify({channel,to,title:notification.title,body:notification.body}),Date.now()]);}}
        }
        await settleChanges(state,actions.state,commandId);
        await saveState(q,actions.state);const response={result:result??null,state:scopedState(user,actions.state)};
        await q('INSERT INTO commands(id,account_id,fingerprint,result) VALUES($1,$2,$3,$4)',[commandId,user.id,fingerprint,JSON.stringify(response)]);return response;
      });respond(200,output);return;
    }
    throw new ApiError(404,'Route not found');
  } catch(error){const unavailable=req.url?.startsWith('/api/health')||['ECONNREFUSED','ECONNRESET','57P01','08006'].includes(error?.code);const status=unavailable?503:error instanceof ApiError?error.status:400;console.error(JSON.stringify({event:'API_REQUEST_FAILED',requestId,status,method:req.method,path:req.url?.split('?')[0]}));respond(status,{error:unavailable?'Porter is temporarily unavailable. Please retry shortly.':error instanceof Error?error.message:'Request failed',requestId});}
});
const port=Number(process.env.PORT||3001);server.listen(port,process.env.API_HOST||'127.0.0.1',()=>console.log(`Porter central API http://${process.env.API_HOST||'127.0.0.1'}:${port} — ${db.provider}; payment simulator`));
let delivering=false;const deliveryTimer=setInterval(async()=>{if(delivering)return;delivering=true;try{const entries=await db.query("SELECT * FROM notification_outbox WHERE status='PENDING' AND due<=$1 LIMIT 10",[Date.now()]);for(const entry of entries){try{const outcome=await deliverNotification(JSON.parse(entry.payload),entry.id);await db.query('UPDATE notification_outbox SET status=$1 WHERE id=$2',[outcome.provider==='simulator'?'SIMULATED':'SENT',entry.id]);}catch{const attempts=entry.attempts+1;await db.query('UPDATE notification_outbox SET attempts=$1,due=$2,status=$3 WHERE id=$4',[attempts,Date.now()+Math.min(300000,2**attempts*1000),attempts>=5?'FAILED':'PENDING',entry.id]);}}}catch{console.error('Notification delivery worker unavailable');}finally{delivering=false;}},2000);deliveryTimer.unref();
let matching=false;const matchingTimer=setInterval(async()=>{if(matching)return;matching=true;try{await db.transaction(async q=>{const state=await readState(q);const e=engine(state);for(const driver of state.drivers)if(driver.isOnline&&!driverHasValidDocuments(state,driver.id).ok)e.actions.markDriverOffline(driver.id);for(const job of state.jobs.filter(j=>['SEARCHING','UNMATCHED'].includes(j.status)).slice(0,100))e.actions.searchDrivers(job.id);if(e.state!==state)await saveState(q,e.state);});}catch{console.error('Matching worker unavailable');}finally{matching=false;}},5000);matchingTimer.unref();
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{clearInterval(deliveryTimer);clearInterval(matchingTimer);server.close(async()=>{await db.close();process.exit(0);});});
