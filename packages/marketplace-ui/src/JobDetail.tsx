import { useMockPlatform } from '@porter/mock-platform';
import { useSession } from '@porter/app-session';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { JobStatus } from '@porter/shared';
import { getVehicleLabel, getStatusDisplayInfo } from '@porter/domain';
import { Icon, StatusBadge, DeliveryProgress } from '@porter/ui';
import type { ReactNode } from 'react';
import type { Job } from '@porter/shared';
import { money, date, driverName, done } from './format';
export function JobDetail({jobId,admin=false,renderFeedback}:{jobId?:string;admin?:boolean;renderFeedback?:(job:Job)=>ReactNode}) {
 const session=useSession();const params=useParams();const p=useMockPlatform();const job=p.jobs.find(j=>j.id===(jobId??params.id));const [error,setError]=useState('');
 useEffect(()=>{if(session||!job||job.status!==JobStatus.SEARCHING)return;const timer=window.setInterval(async ()=>{try{await p.searchDrivers(job.id);}catch(e){setError(String(e));}},2000);return()=>window.clearInterval(timer);},[job?.id,job?.status,p.searchDrivers,!!session]);
 if(!job)return <div className="panel"><h1>Delivery not found</h1><p>The delivery may have been removed by a demo reset.</p><Link to="/jobs">Return to jobs</Link></div>;
 const driver=p.drivers.find(d=>d.id===job.driverId);const vehicle=p.vehicles.find(v=>v.driverId===driver?.id);const payment=p.payments.find(v=>v.id===job.paymentId);
 const events=p.jobEvents.filter(e=>e.jobId===job.id);const proofs=p.jobProofs.filter(e=>e.jobId===job.id);const dispute=p.disputes.find(d=>d.id===job.disputeId);
 return <div className="job-detail">
  <Link className="text-action" to={admin?'/admin':'/jobs'}>← {admin?'Operations':'Your jobs'}</Link>
  <header className="tracking-header"><div><p className="eyebrow">Delivery {job.id}</p><h1>{getStatusDisplayInfo(job.status).label}</h1><p className="muted" role="status">{getStatusDisplayInfo(job.status).description}</p></div><StatusBadge status={job.status}/></header>
  <div className="tracking-layout"><div className="tracking-main">
   <section className="panel"><h2>Pickup → Drop-off</h2><div className="route-stops"><p><small>Pickup</small><b>{job.pickupAddress}</b></p><p><small>Drop-off</small><b>{job.dropoffAddress}</b></p></div><p className="muted">{getVehicleLabel(job.vehicleClass)} · {money(job.price)} · {job.timeOption.replaceAll('_',' ')}</p>
    {driver&&<div className="driver-profile"><span className="avatar">{(driver.name ?? driverName(driver.id)).split(' ').map(n=>n[0]).join('')}</span><div><b>{(driver.name ?? driverName(driver.id))}</b><p>{vehicle?.make} {vehicle?.model} · {vehicle?.plate} · ★ {driver.rating.toFixed(2)}</p><p>Simulated ETA: {job.status===JobStatus.ASSIGNED?'12 minutes to pickup':done(job.status)?'Delivery closed':'8 minutes to next stop'}</p></div></div>}
    <DeliveryProgress status={job.actualDeliveryTime?JobStatus.COMPLETED:job.status}/>
    {job.status===JobStatus.UNMATCHED&&<><p className="error">No eligible driver found. Try again after a driver goes online, or ask operations for help.</p><button className="primary" onClick={async ()=>await p.searchDrivers(job.id)}>Retry driver search</button></>}
    {job.recipientCode&&!done(job.status)&&<p className="success">Recipient handover code: <b>{job.recipientCode}</b></p>}
    {[JobStatus.SEARCHING,JobStatus.UNMATCHED,JobStatus.ASSIGNED,JobStatus.EN_ROUTE_TO_PICKUP].includes(job.status)&&<button className="secondary" onClick={async()=>{try{await p.cancelJob(job.id,admin?'ADMIN':'CUSTOMER');}catch(e){setError(String(e));}}}>Cancel delivery{job.driverId?' · 10% cancellation fee':' · free'}</button>}
   </section>
   <div className="map-sim" aria-label="Delivery location"><span>Melbourne · illustrative route</span><b>● Pickup ━━━ 🚚 ━━━ ● Drop-off</b><small>{getStatusDisplayInfo(job.status).label} · route diagram, not a live map</small>{driver?.location&&<p>Last shared location: {driver.location.lat.toFixed(5)}, {driver.location.lng.toFixed(5)}{(driver.location as typeof driver.location & {updatedAt?:Date}).updatedAt&&<> · {date((driver.location as typeof driver.location & {updatedAt:Date}).updatedAt)}</>}</p>}</div>
   <section className="panel"><h2>Handover evidence</h2>{proofs.length?<div className="grid">{proofs.map(proof=><article key={proof.id}><h3>{proof.type==='pickup'?'Proof of pickup':'Proof of delivery'}</h3><img className="proof" src={proof.photoUrl} alt={proof.label} onError={e=>{e.currentTarget.style.display='none';}}/><p>{proof.note??proof.label}</p><small>{date(proof.createdAt)}</small></article>)}</div>:<p className="muted">Photos appear here when your driver confirms handover.</p>}</section>
   {!admin&&[JobStatus.COMPLETED,JobStatus.DELIVERED,JobStatus.DISPUTED,JobStatus.RESOLVED].includes(job.status)&&renderFeedback?.(job)}
  </div><aside className="tracking-side">
   <section className="panel"><div className="section-heading"><h2>Delivery receipt</h2><Icon name="jobs"/></div><div className="receipt-row"><span>Delivery total</span><b>{money(job.price)}</b></div><div className="receipt-row"><span>Payment</span><span>{payment?.status??'Historical demo receipt'}</span></div><p className="muted">Booked {date(job.createdAt)} · Receipt {payment?.id??job.id}</p>{!!payment?.refundAmount&&<p>Refunded: {money(payment.refundAmount)} · Retained total: {money(payment.amount-payment.refundAmount)}</p>}
    {dispute&&<div className={dispute.decision?'success':'error'}><b>Issue: {dispute.status}</b><p>{dispute.description}</p>{dispute.decision&&<p>Resolution: {dispute.decision} · Refund {money(dispute.refundAmount??0)}</p>}</div>}
   </section>
   <section className="panel"><h2>Delivery timeline</h2>{events.length?<ol className="timeline">{events.map(e=><li key={e.id}><b>{getStatusDisplayInfo(e.toStatus).label}</b><small>{date(e.createdAt)} · {e.actorType}</small></li>)}</ol>:<p className="muted">Historical delivery · {getStatusDisplayInfo(job.status).label}</p>}</section>
  </aside></div>
  {error&&<p className="error" role="alert">{error}</p>}
 </div>;
}
