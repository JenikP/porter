import { useState } from 'react';
import { useMockPlatform, useResetMockPlatform, PlatformGate } from '@porter/mock-platform';
import { JobStatus, DisputeStatus, DriverApprovalStatus } from '@porter/shared';
import { done, driverName } from '../../customer-web/src/pages/JobDetail';
import '../../customer-web/src/styles.css';
import { Jobs } from './Jobs';
import { Drivers } from './Drivers';
import { Customers } from './Customers';
import { Disputes } from './Disputes';
import { Pricing } from './Pricing';
import { Payments } from './Payments';
import { Reports } from './Reports';
import { Audit } from './Audit';
import { Sidebar } from './Sidebar';
import { Overview } from './Overview';
export function App() {
 const p = useMockPlatform(); const reset = useResetMockPlatform(); const [tab,setTab] = useState('Overview'); const [error,setError] = useState(''); const [resetConfirm,setResetConfirm] = useState(false);
 const run = (f:()=>void) => { try { f(); setError(''); } catch(e) { setError(e instanceof Error ? e.message : 'Operation failed'); } };
 const overview = [['Active deliveries',p.jobs.filter(j => !done(j.status)).length],['Searching',p.jobs.filter(j => j.status === JobStatus.SEARCHING).length],['Unmatched',p.jobs.filter(j => j.status === JobStatus.UNMATCHED).length],['Completed today',p.jobs.filter(j => j.actualDeliveryTime?.toLocaleDateString('en-AU',{ timeZone:'Australia/Melbourne' }) === new Date().toLocaleDateString('en-AU',{ timeZone:'Australia/Melbourne' })).length],['Open disputes',p.disputes.filter(d => d.status !== DisputeStatus.RESOLVED).length],['Drivers online',p.drivers.filter(d => d.isOnline).length],['Pending approvals',p.drivers.filter(d => d.approvalStatus === DriverApprovalStatus.PENDING).length]];
 return <PlatformGate><div className="operations-layout"><Sidebar tab={tab} onSelect={t=>{setTab(t);setError('');}}/><main className="role-page admin-page">
  <header className="operations-header"><div><h1>{tab === 'Overview' ? 'Operations overview' : tab}</h1><p className="muted">{tab === 'Overview' ? 'Melbourne marketplace at a glance.' : 'Manage the connected Melbourne marketplace.'}</p></div><span className="workspace-indicator"><span/>Live demo</span></header>
  {error && <p role="alert" className="error">{error}</p>}
  {tab === 'Overview' && <><Overview onJobs={()=>setTab('Jobs')}/><div className="operations-supplement">{overview.filter(([label])=>['Unmatched','Completed today','Pending approvals'].includes(String(label))).map(([label,value])=><span key={label}><b>{value}</b> {label}</span>)}</div></>}
  {tab === 'Live Map' && <section className="panel"><h2>Melbourne activity</h2><div className="map-sim"><span>Carlton · CBD · Docklands · Southbank · Richmond</span><b>{p.drivers.filter(d => d.isOnline).length} online drivers · {p.jobs.filter(j => !done(j.status)).length} live jobs</b><small>Simulated locations, no GPS or maps integration</small></div>{p.jobs.filter(j => !done(j.status)).map(j => <p key={j.id}>{j.pickupAddress} → {j.dropoffAddress} · {j.status} · {j.driverId ? driverName(j.driverId) : 'Unassigned'}</p>)}</section>}
  {tab === 'Settings' && <section className="panel"><h2>Demo settings</h2><p>Service area: Melbourne metropolitan area. Currency: AUD. Quote expiry: 15 minutes. Driver offers: 120 seconds. Customer cancellation after assignment: 10% demo fee.</p><p className="muted">All integrations are simulated. Reset replaces local demo records with Melbourne seed data.</p><button className="secondary" onClick={() => setResetConfirm(true)}>Reset demo data</button>{resetConfirm && <div role="alert"><p>Reset all jobs, payments and profile edits on this origin?</p><div className="actions"><button className="primary" onClick={reset}>Confirm demo reset</button><button className="secondary" onClick={() => setResetConfirm(false)}>Keep current data</button></div></div>}</section>}
  {tab === 'Settings' && <section className="panel"><h2>Connection simulator</h2><label>Demo connection<select value={p.demoSettings?.connection ?? 'online'} onChange={e => p.setDemoConnection(e.target.value as 'online'|'slow'|'offline')}><option value="online">Online · normal</option><option value="slow">Slow · loading simulation</option><option value="offline">Offline · error and retry</option></select></label></section>}
  {tab === 'Jobs' && <Jobs run={run}/>}
  {tab === 'Drivers' && <Drivers run={run}/>}
  {tab === 'Customers' && <Customers run={run}/>}
  {tab === 'Disputes' && <Disputes run={run}/>}
  {tab === 'Pricing' && <Pricing run={run}/>}
  {tab === 'Payments' && <Payments run={run}/>}
  {tab === 'Reports' && <Reports/>}
  {tab === 'Audit Log' && <Audit/>}
 </main></div></PlatformGate>;
}

