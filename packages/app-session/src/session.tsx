import { isNative, subscribeNativePush, watchForegroundLocation } from './native';
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { MockPlatformContext } from '../../mock-platform/src/react';
import { deserializeMockPlatformState } from '../../mock-platform/src/serialization';
import type { MockPlatformContextValue, MockPlatformState } from '@porter/mock-platform';
import { createMockPlatformActions, useMockPlatform } from '@porter/mock-platform';

type Role = 'customer' | 'driver' | 'admin';
export interface SessionUser { id:string; email:string; name:string; role:string; profileId:string; onboarded:boolean }
type Session = {user:SessionUser;request:(path:string,body?:unknown,key?:string)=>Promise<any>};
const SessionContext=createContext<Session|undefined>(undefined);
export const useSession=()=>useContext(SessionContext);
export async function uploadFile(request:Session['request'],file:File) {
 if(file.size>650000)throw new Error('Use a file smaller than 650 KB');
 const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(new Error('Unable to read file'));reader.readAsDataURL(file);});
 return (await request('/uploads',{name:file.name,data})).url as string;
}
export function DocumentLink({url}:{url:string}){
 const session=useSession();const [error,setError]=useState('');
 if(!session||!url.startsWith('/api/uploads/'))return <span>{url.split('/').pop()}</span>;
 return <><button className="secondary" onClick={async()=>{try{const data=await session.request(url.replace('/api',''));const binary=atob(data.data.split(',')[1]);const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));const blob=new Blob([bytes],{type:data.data.split(';')[0].slice(5)});const target=URL.createObjectURL(blob);const link=document.createElement('a');link.href=target;link.download=data.name;link.click();setTimeout(()=>URL.revokeObjectURL(target),1000);}catch(e){setError(String(e));}}}>View uploaded document</button>{error&&<p role="alert">{error}</p>}</>;
}
const revive=(data:unknown)=>deserializeMockPlatformState(JSON.stringify(data));

export function Application({role,children}:{role:Role;children:ReactNode}) {
 const [session,setSession]=useState<{user:SessionUser;csrf:string}|null>();const [error,setError]=useState('');const location=useLocation();const navigate=useNavigate();
 const base=(import.meta as unknown as {env?:Record<string,string>}).env?.VITE_API_URL || '/api';
 const request=async(path:string,body?:unknown,key?:string)=>{
  const response=await fetch(`${base}${path}`,{credentials:'include',signal:AbortSignal.timeout(15000),method:body===undefined?'GET':'POST',headers:{'X-Porter-App':role,...(body!==undefined?{'Content-Type':'application/json','X-CSRF-Token':session?.csrf||''}:{}),...(key?{'Idempotency-Key':key}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  let data;try{data=await response.json();}catch{throw new TypeError("Porter API is temporarily unavailable. Check your connection and retry.");}if(!response.ok){if(response.status===401&&path!=='/auth/login')setSession(null);throw new Error(data.error || 'Request failed');}return data;
 };
 useEffect(()=>{let active=true;request('/auth/me').then(data=>{if(active)setSession(data);}).catch(()=>{if(active)setSession(null);});return()=>{active=false;};},[]);
 useEffect(()=>{if(!session)return;const report=(event:string)=>{request('/telemetry',{event}).catch(()=>{});};const error=()=>report('CLIENT_ERROR');const rejection=()=>report('UNHANDLED_REJECTION');window.addEventListener('error',error);window.addEventListener('unhandledrejection',rejection);return()=>{window.removeEventListener('error',error);window.removeEventListener('unhandledrejection',rejection);};},[session?.user.id]);
 const logout=async()=>{try{await request('/auth/logout',{});setSession(null);sessionStorage.removeItem('porter.booking');navigate('/sign-in');}catch(e){setError(String(e));}};
 const title=role==='admin'?'Porter Operations':'Porter';
 return <><header className="account-header"><Link className="porter-wordmark" to="/">{title}</Link><div>{session?<><span>{session.user.name} · {session.user.role.replaceAll('_',' ')}</span><button className="secondary" onClick={logout}>Log out</button></>:<Link to={role==='admin'?'/sign-in':'/help'}>{role==='admin'?'Operations access':'Help'}</Link>}</div></header>{error&&<p className="error" role="alert">{error}</p>}
 {session===undefined?<main className="role-page"><p role="status">Checking your session…</p></main>:!session?<AuthScreen key={location.pathname} role={role} request={request} onLogin={data=>{setSession(data);navigate('/');}}/>:<SessionContext.Provider value={{user:session.user,request}}><ApiPlatform key={session.user.id} request={request}>
  {!session.user.onboarded && role==='customer'?<CustomerOnboarding onComplete={async()=>{const data=await request('/auth/onboarding',{});setSession({...session,user:data.user});}}/>:children}
 </ApiPlatform></SessionContext.Provider>}
 </>;
}
function ApiPlatform({children,request}:{children:ReactNode;request:Session['request']}){
 const [state,setState]=useState<MockPlatformState>();const [error,setError]=useState('');const [pending,setPending]=useState(0);const requestRef=useRef(request);requestRef.current=request;
 const mounted=useRef(true);const inflight=useRef(0);
 const refresh=async()=>{try{const data=await requestRef.current('/state');if(mounted.current && !inflight.current){setState(revive(data));setError('');}}catch(e){if(mounted.current)setError(e instanceof Error?e.message:'Connection unavailable');}};
 useEffect(()=>{mounted.current=true;refresh();const timer=window.setInterval(()=>{if(!inflight.current)refresh();},2000);return()=>{mounted.current=false;window.clearInterval(timer);};},[]);
 const actions=useMemo(()=>Object.fromEntries(Object.keys(createMockPlatformActions(()=>{})).map(method=>[method,async(...args:unknown[])=>{
  if(method==='canDriverGoOnline')return {ok:true};
  inflight.current++;setPending(n=>n+1);
  const key=crypto.randomUUID();
  try{let data;try{data=await requestRef.current('/commands',{method,args},key);}catch(e){if(e instanceof TypeError||(e instanceof DOMException&&['TimeoutError','AbortError'].includes(e.name)))data=await requestRef.current('/commands',{method,args},key);else throw e;}if(mounted.current){setState(revive(data.state));setError('');}return revive(data.result);}catch(e){setError(e instanceof Error?e.message:'Operation failed. Check connection and retry.');throw e;}finally{inflight.current--;setPending(n=>n-1);}
 }])) as unknown as Omit<MockPlatformContextValue,keyof MockPlatformState>,[]);
 if(!state)return <main className="role-page"><section className="panel" role={error?'alert':'status'}><h1>{error?'Unable to connect':'Loading your workspace…'}</h1><p>{error||'Fetching your records from Porter.'}</p>{error&&<button className="primary" onClick={refresh}>Retry connection</button>}</section></main>;
 return <MockPlatformContext.Provider value={{...state,...actions}}><div className="api-status" role="status">{pending?'Saving to Porter…':'Connected to Porter API · development provider adapters'}<NotificationInbox/></div>{error&&<div className="api-error" role="alert">{error}<button className="secondary" onClick={refresh}>Retry connection</button></div>}{children}</MockPlatformContext.Provider>;
}
function NotificationInbox(){const p=useMockPlatform();const session=useSession();const [open,setOpen]=useState(false);const [error,setError]=useState('');return <div className="notification-inbox"><button className="secondary" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>Notifications ({p.notifications.filter(n=>!(n as unknown as {readAt?:Date}).readAt).length})</button>{open&&<section className="panel"><h2>Notifications</h2>{isNative()&&<button className="secondary" onClick={async()=>{try{await subscribeNativePush(async(token,platform)=>{await session?.request("/devices",{token,platform});});setError("Push device registered. Delivery requires a configured notification gateway.");}catch(e){setError(String(e));}}}>Enable device notifications</button>}{!p.notifications.length?<p>No updates yet.</p>:p.notifications.slice().reverse().slice(0,20).map(n=><article key={n.id}><b>{n.title}</b><p>{n.body}</p><small>{n.createdAt.toLocaleString('en-AU')}</small>{!(n as unknown as {readAt?:Date}).readAt&&<button className="secondary" onClick={async()=>{try{await session?.request('/notifications/read',{id:n.id});}catch(e){setError(String(e));}}}>Mark read</button>}</article>)}{error&&<p role="alert">{error}</p>}</section>}</div>;}
export function AddressField({label,value,onChange}:{label:string;value:string;onChange:(value:string)=>void}){
 const session=useSession();const [choices,setChoices]=useState<string[]>([]);const [provider,setProvider]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);const id=label.replaceAll(' ','-');
 return <label>{label}<input value={value} onChange={e=>onChange(e.target.value)} autoComplete="street-address" required list={session?id:undefined}/>{session&&<><datalist id={id}>{choices.map(a=><option key={a} value={a}/>)}</datalist><button type="button" className="secondary" disabled={busy||value.trim().length<3} onClick={async()=>{setBusy(true);try{const result=await session.request('/addresses?q='+encodeURIComponent(value));setChoices(result.addresses);setProvider(result.provider);setError('');}catch(e){setError(String(e));}finally{setBusy(false);}}}>{busy?'Searching…':'Find address'}</button>{provider&&<small>{provider} · {choices.length} suggestions</small>}{error&&<small role="alert">{error}</small>}</>}</label>;
}
export function LocationControl(){
 const session=useSession();const [sharing,setSharing]=useState(false);const [message,setMessage]=useState('');const stop=useRef<()=>void>();const mounted=useRef(true);useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;stop.current?.();};},[]);
 if(!session)return null;
 return <section className="panel location-consent"><h2>Driver location</h2><p>Share location while this app is open and you are online. You can stop at any time. Background tracking is not enabled.</p><button className="secondary" onClick={async()=>{if(sharing){stop.current?.();stop.current=undefined;setSharing(false);setMessage('Location sharing stopped.');return;}try{const cancel=await watchForegroundLocation(async(lat,lng)=>{try{await session.request('/location',{lat,lng});if(mounted.current)setMessage('Location update saved.');}catch(e){if(mounted.current)setMessage(String(e));}},error=>{stop.current?.();if(mounted.current){setMessage(error);setSharing(false);}});if(!mounted.current){cancel();return;}stop.current=cancel;setSharing(true);}catch(e){setMessage(String(e));}}}>{sharing?'Stop sharing location':'Share location while online'}</button><p role="status">{message}</p></section>;
}
function AuthScreen({role,request,onLogin}:{role:Role;request:Session['request'];onLogin:(data:any)=>void}){
 const path=useLocation().pathname;const navigate=useNavigate();const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [name,setName]=useState('');const [phone,setPhone]=useState('');const [type,setType]=useState('CONSUMER');const [business,setBusiness]=useState('');const [message,setMessage]=useState('');const [reset,setReset]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 const welcome=path==='/'&&role!=='admin';const registration=path==='/create-account'&&role!=='admin';const forgot=path==='/forgot-password';const resetting=path==='/reset-password';
 if(role==='admin'&&path==='/create-account')return <Navigate to="/sign-in" replace/>;
 if(path==='/help'&&role!=='admin')return <main className="role-page"><h1>How can we help?</h1><section className="panel"><h2>Bookings and account access</h2><p>Sign in to manage deliveries, request support or raise an issue from a completed delivery.</p><Link to="/forgot-password">Recover your account</Link><p><Link to="/sign-in">Sign in</Link></p><Link to="/">Back to Porter</Link></section></main>;
 const title=welcome?role==='driver'?'Your day, delivered.':'Deliver across Melbourne.':registration?role==='driver'?'Become a Porter driver':'Create your account':forgot?'Recover your account':resetting?'Choose a new password':role==='admin'?'Operations sign in':'Welcome back';
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setBusy(true);setError('');setMessage('');try{
  if(registration){await request('/auth/register',{email,password,name,phone,accountType:type,businessName:business});navigate('/sign-in');}
  else if(forgot){const data=await request('/auth/forgot',{email});setMessage(data.message);setReset(data.developmentResetUrl||'');}
  else if(resetting){const token=new URLSearchParams(window.location.search).get('token');const data=await request('/auth/reset',{token,password});setMessage(data.message);}
  else onLogin(await request('/auth/login',{email,password}));
 }catch(e){setError(e instanceof Error?e.message:'Unable to continue');}finally{setBusy(false);}};
 return <main className={`auth-layout auth-${role}`}><section className="auth-story"><h1>{role==='admin'?'Porter Operations':role==='driver'?'Your day, delivered.':<>Deliver across <span>Melbourne.</span></>}</h1><p>{role==='admin'?'A clear view of every delivery. Secure tools for your operations team.':role==='driver'?'Clear offers. Confident handovers. Your earnings in one place.':'Book, track and manage your deliveries in one place.'}</p><div className="auth-route"><span>Collins Street</span><i/><span>Docklands</span></div></section><section className="auth-form"><h2>{title}</h2><p className="muted">{welcome?role==='driver'?'Apply with your own identity and vehicle. Approval is required before going online.':'Simple bookings, a fixed quote and handover evidence.':role==='admin'?'Use your administrator account. Access is assigned by your operations manager.':'Sign in to your Porter account.'}</p>
 {welcome?<div className="welcome-actions"><Link className="primary button-link" to="/create-account">{role==='driver'?'Apply to drive':'Create account'}</Link><Link className="secondary button-link" to="/sign-in">Sign in</Link></div>:<form onSubmit={submit}>
 {registration&&<><label>Full name<input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} required minLength={2}/></label><label>Mobile<input type="tel" autoComplete="tel" value={phone} onChange={e=>setPhone(e.target.value)} required/></label>{role==='customer'&&<><fieldset><legend>Account type</legend><div className="actions">{[['CONSUMER','Personal'],['BUSINESS','Business']].map(([value,label])=><label key={value}><input type="radio" name="type" checked={type===value} onChange={()=>setType(value)}/>{label}</label>)}</div></fieldset>{type==='BUSINESS'&&<label>Business name<input value={business} onChange={e=>setBusiness(e.target.value)} required/></label>}</>}</>}
 {!resetting&&<label>Email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>}
 {!forgot&&<label>Password<input type="password" autoComplete={registration||resetting?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} minLength={registration||resetting?12:undefined} maxLength={128} required/></label>}
 {!registration&&!forgot&&!resetting&&<Link className="auth-recovery" to="/forgot-password">Forgot password?</Link>}
 <button className="primary" disabled={busy}>{busy?'Please wait…':registration?'Create account':forgot?'Send recovery instructions':resetting?'Reset password':'Sign in'}</button>
 {registration&&<p className="muted">Use at least 12 characters. Documents and payments use development simulators until providers are configured.</p>}
 </form>}
 {error&&<p className="error" role="alert">{error}</p>}{message&&<p className="success" role="status">{message}</p>}{reset&&<p className="success">Development email simulator: <a href={reset}>Open recovery link</a></p>}
 {!welcome&&<p className="auth-footer">{!registration&&!forgot&&!resetting&&role!=='admin'?<>New to Porter? <Link to="/create-account">Create account</Link></>:<Link to="/sign-in">Back to sign in</Link>}</p>}
 </section></main>;
}
function CustomerOnboarding({onComplete}:{onComplete:()=>Promise<void>}){
 const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 return <main className="role-page onboarding"><section className="panel"><h1>Welcome to Porter</h1><p>Your account is ready. Add saved addresses and business details in Account, then book your first delivery.</p><ol><li>Choose pickup and drop-off addresses.</li><li>Describe your item and review a fixed quote.</li><li>Track your delivery and both handovers.</li></ol><p className="muted">Payments, routing and notifications currently run through development simulators.</p><button className="primary" disabled={busy} onClick={async()=>{setBusy(true);try{await onComplete();}catch(e){setError(String(e));}finally{setBusy(false);}}}>Go to my dashboard</button>{error&&<p role="alert">{error}</p>}</section></main>;
}
