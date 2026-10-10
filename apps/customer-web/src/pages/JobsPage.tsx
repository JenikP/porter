import { Link } from 'react-router-dom';
import { useMockPlatform } from '@porter/mock-platform';
import { StatusBadge, Icon } from '@porter/ui';
import { date, money, done } from './JobDetail';
export function JobsPage() {
 const p=useMockPlatform();const jobs=p.jobs.filter(j=>j.customerId===p.customers[0]?.id).slice().reverse();
 return <><h1>Every handover, in one place.</h1><p className="muted">Track your active deliveries and review previous handovers.</p><div className="jobs-layout">{['Active','Previous'].map(group=><section key={group}><h2>{group} deliveries</h2>{jobs.filter(j=>group==='Active'?!done(j.status):done(j.status)).map(j=><Link key={j.id} to={`/jobs/${j.id}`} className="panel job-list-card"><div className="section-heading"><Icon name="package"/><StatusBadge status={j.status}/></div><b>{j.pickupAddress.split(',')[0]} → {j.dropoffAddress.split(',')[0]}</b><div className="job-list-meta"><strong>{money(j.price)}</strong><span>{j.timeOption.replaceAll('_',' ')}</span></div><small className="muted">{date(j.createdAt)}</small><p className="text-action">View delivery <Icon name="chevron" size={16}/></p></Link>)}{!jobs.some(j=>group==='Active'?!done(j.status):done(j.status))&&<div className="panel empty-state"><Icon name="truck" size={32}/><p className="muted">No {group.toLowerCase()} deliveries yet.</p></div>}</section>)}</div><Link className="primary" to="/book">Book another delivery <Icon name="arrow"/></Link></>;
}
