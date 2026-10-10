import { useMockPlatform } from '@porter/mock-platform';
import { useNavigate } from 'react-router-dom';
import { Button, Input, StatusBadge, Icon } from '@porter/ui';
import { JobStatus } from '@porter/shared';
import { useState } from 'react';

export function HomePage() {
  const navigate = useNavigate();
  const { customers, jobs, drivers } = useMockPlatform();
  const customer = customers.find(entry => entry.id === 'customer_001') ?? customers[0];
  const [pickup, setPickup] = useState(customer?.savedAddresses[0]?.address ?? '120 Collins St, Melbourne VIC 3000');
  const [dropoff, setDropoff] = useState(customer?.savedAddresses[1]?.address ?? '700 Bourke St, Docklands VIC 3008');
  const book = () => { sessionStorage.removeItem('porter.booking'); navigate('/book'); };
  const quickStart = () => { sessionStorage.removeItem('porter.booking'); navigate('/book', { state: { pickup, dropoff, step: 0 } }); };
  const activeJob = jobs.find(job => job.customerId === customer?.id && ![JobStatus.COMPLETED, JobStatus.CANCELLED, JobStatus.RESOLVED].includes(job.status));
  const recentJobs = jobs.filter(job => job.customerId === customer?.id && job.status === JobStatus.COMPLETED).slice(0, 3);
  const driver = drivers.find(driver => driver.id === activeJob?.driverId);
  return <div className="customer-home">
    <header className="home-header">
      <div><h1>Deliver across Melbourne</h1><p className="muted">Book a vetted driver for envelopes, parcels, and bulky items with photo proof at drop-off.</p></div>
      <Button onClick={book}>Book a delivery <Icon name="arrow"/></Button>
    </header>
    <div className="home-layout">
      <section className="panel quick-start"><h2>Quick start</h2><p className="muted">Where are we picking up and dropping off?</p>
        <div className="booking-addresses"><div className="address-field"><Icon name="pin"/><Input label="Pickup" value={pickup} onChange={e => setPickup(e.target.value)} /></div>
        <div className="address-field"><Icon name="pin"/><Input label="Drop-off" value={dropoff} onChange={e => setDropoff(e.target.value)} /></div></div>
        <Button fullWidth onClick={quickStart}>Continue booking <Icon name="arrow"/></Button>
      </section>
      <section className="panel active-delivery"><div className="section-heading"><h2>Active delivery</h2>{activeJob && <StatusBadge status={activeJob.status} size="sm"/>}</div>
        {activeJob ? <>
          <div className="driver-summary"><span className="avatar">{driver ? (driver.name ?? 'Sam Nguyen').split(' ').map(n=>n[0]).slice(0,2).join('') : <Icon name="search"/>}</span><div><b>{driver?.name ?? 'Finding your driver'}</b><small>{driver ? `★ ${driver.rating.toFixed(2)} · Driver assigned` : 'Matching eligible Melbourne drivers'}</small></div><strong>${activeJob.price.toFixed(2)}</strong></div>
          <div className="route-stops"><p>{activeJob.pickupAddress}</p><p>{activeJob.dropoffAddress}</p></div>
          <Button className="forest-button" fullWidth onClick={() => navigate(`/jobs/${activeJob.id}`)}>Track delivery <Icon name="arrow"/></Button>
        </> : <p className="muted">No active deliveries right now.</p>}
      </section>
      <section className="panel recent-deliveries"><div className="section-heading"><h2>Recent deliveries</h2><button className="text-action" onClick={()=>navigate('/jobs')}>View all <Icon name="chevron" size={16}/></button></div>
        {recentJobs.length ? recentJobs.map(job => <div className="home-row" key={job.id}>
          <div><p>{job.pickupAddress.split(',')[0]} → {job.dropoffAddress.split(',')[0]}</p><small>Completed · ${job.price.toFixed(2)} · {job.estimatedDistanceKm ?? '—'} km</small></div>
          <Button variant="secondary" size="sm" onClick={() => navigate(`/jobs/${job.id}`)}>View delivery</Button>
        </div>) : <p className="muted">Your completed deliveries will appear here.</p>}
      </section>
      <section className="panel saved-addresses"><div className="section-heading"><h2>Saved addresses</h2><button className="text-action" onClick={()=>navigate('/account')}>Edit <Icon name="chevron" size={16}/></button></div><div className="address-shortcuts">
        {customer?.savedAddresses.map(address => <button className="address-shortcut" key={address.label} onClick={()=>{sessionStorage.removeItem('porter.booking');navigate('/book',{state:{pickup,dropoff:address.address,step:0}});}}><Icon name={address.isDefault?'home':'pin'}/><b>{address.label}</b><small>{address.address}</small></button>)}
        </div>
        {!customer?.savedAddresses.length && <p className="muted">Save addresses in Account for faster booking.</p>}
      </section>
    </div>
    <aside className="proof-note"><Icon name="shield"/><strong>Proof of delivery included</strong><p>Every Porter drop-off captures a photo and timestamp so you and your recipient can trust the handover.</p></aside>
  </div>;
}
