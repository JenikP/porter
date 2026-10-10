import { useEffect, useState } from 'react';
import { useMockPlatform, driverHasValidDocuments, PlatformGate } from '@porter/mock-platform';
import { Icon, StatusBadge } from '@porter/ui';
import { driverName, money, done } from '../../customer-web/src/pages/JobDetail';
import { OfferPanel } from './OfferPanel';
import { ActiveJob } from './ActiveJob';
import { Documents } from './Documents';
import { Earnings } from './Earnings';
import '../../customer-web/src/styles.css';
const driverTabs=[['Home','home'],['Documents','jobs'],['Earnings','payments'],['History','clock']];
export function App() {
 const p=useMockPlatform();
 const [id,setId]=useState('driver_001'); const [tab,setTab]=useState('Home'); const [error,setError]=useState('');
 const d=p.drivers.find(d=>d.id===id)!; const v=p.vehicles.find(v=>v.driverId===id); const eligible=driverHasValidDocuments(p,id);
 const active=p.jobs.find(j=>j.driverId===id&&!done(j.status));
 const [clock,setClock]=useState(Date.now());
 useEffect(()=>{const timer=window.setInterval(()=>setClock(Date.now()),1000);return()=>window.clearInterval(timer);},[]);
 const run=(f:()=>void)=>{try{f();setError('');}catch(e){setError(e instanceof Error?e.message:'Action failed');}};
 const today=p.jobs.filter(j=>j.driverId===id&&j.actualDeliveryTime?.toLocaleDateString('en-AU',{timeZone:'Australia/Melbourne'})===new Date().toLocaleDateString('en-AU',{timeZone:'Australia/Melbourne'})).reduce((sum,j)=>sum+j.driverEarnings-(p.disputes.find(d=>d.jobId===j.id)?.driverDeduction??0),0);
 return <PlatformGate><main className={`role-page driver-page ${tab==='Home'?'driver-home':''}`}>
  <div className="driver-workspace"><div className={tab==='Home'?'driver-hero':'driver-heading'}>
   <h1>Your day, delivered.</h1>
   <label className="driver-selector">Demo driver<select value={id} onChange={e=>{setId(e.target.value);setError('');}}>{p.drivers.map(d=><option key={d.id} value={d.id}>{driverName(d.id)}</option>)}</select></label>
   {tab==='Home'&&<>
    <section className="driver-availability"><div className="availability-heading"><span className="vehicle-icon"><Icon name="truck" size={28}/></span><div><h2>{driverName(id)}</h2><p>{v?`${v.make} ${v.model} · ${v.plate}`:'Vehicle registration needed'}</p></div><button className="availability-toggle" aria-pressed={d.isOnline} disabled={!d.isOnline&&!eligible.ok} onClick={()=>run(()=>{d.isOnline?p.markDriverOffline(id):p.markDriverOnline(id);})}>{d.isOnline?'Go offline':'Go online'}<span className={d.isOnline?'switch-knob online':'switch-knob'}/></button></div><div className="verification-line"><StatusBadge status={d.approvalStatus}/><span>{d.isOnline?'Online':'Offline'}</span></div><p className={eligible.ok?'eligibility-good':'eligibility-error'}><Icon name={eligible.ok?'check':'shield'}/>{eligible.ok?'Documents current. Ready to work.':eligible.reason}</p></section>
    <div className="driver-metrics"><div><Icon name="payments"/><span>This week</span><strong>{money(d.weeklyEarnings)}</strong></div><div><Icon name="reports"/><span>Payout balance</span><strong>{money(d.payoutBalance)}</strong></div></div><p className="today-summary">Today · {money(today)} from completed deliveries</p>
   </>}
  </div><div className="driver-content">
   {error&&<p role="alert" className="error">{error}</p>}
   {tab==='Home'&&<>{!active&&<OfferPanel driverId={id} clock={clock} run={run}/>} {active?<ActiveJob key={active.id} job={active} run={run}/>:<section className="panel empty-state"><Icon name="truck" size={32}/><h2>Current delivery</h2><p className="muted">No active delivery. New offers appear here when you’re online.</p></section>}</>}
   {tab==='Documents'&&<div className="driver-documents"><Documents key={id} driverId={id} run={run}/></div>}
   {tab==='Earnings'&&<Earnings driverId={id}/>}
   {tab==='History'&&<Earnings driverId={id} history/>}
  </div></div>
  <nav className="driver-nav" aria-label="Driver navigation">{driverTabs.map(([title,icon])=><button key={title} aria-current={tab===title?'page':undefined} onClick={()=>setTab(title)}><Icon name={icon}/><span>{title}</span></button>)}</nav>
 </main></PlatformGate>;
}
