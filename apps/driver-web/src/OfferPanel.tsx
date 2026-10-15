import { useMockPlatform } from '@porter/mock-platform';
import { JobStatus, OfferStatus } from '@porter/shared';
import { money } from '../../customer-web/src/pages/JobDetail';

const area = (address: string) => address.split(',').slice(1).join(',').replace(/VIC\s*\d+/, '').trim() || 'Melbourne';

export function OfferPanel({ driverId, clock, run }: { driverId: string; clock: number; run: (f: () => void) => void }) {
 const p = useMockPlatform();
 const driver = p.drivers.find(d => d.id === driverId)!;
 const offers = p.driverOffers.filter(o => o.driverId === driverId && o.status === OfferStatus.PENDING && o.expiresAt.getTime() > clock && p.jobs.some(j => j.id === o.jobId && j.status === JobStatus.SEARCHING));
 return <section className="panel offers-panel">
  <div className="section-heading"><div><p className="eyebrow">AVAILABLE NOW</p><h2>Delivery offers</h2></div>{driver.isOnline && <span className="live-orbit" aria-label="Online and listening for offers"/>}</div>
  {!driver.isOnline ? <p className="muted">Go online to receive delivery offers.</p> : !offers.length ? <div className="offer-empty"><p className="muted">You’re online. New offers will appear here when a matching delivery is nearby.</p><button className="secondary" onClick={() => run(() => { p.jobs.filter(j => [JobStatus.SEARCHING,JobStatus.UNMATCHED].includes(j.status)).forEach(async j => await p.searchDrivers(j.id)); })}>Check available deliveries</button></div> : offers.map(o => {
    const j = p.jobs.find(j => j.id === o.jobId)!;
    const item = p.jobItems.find(i => i.jobId === j.id);
    const seconds = Math.max(0,Math.ceil((o.expiresAt.getTime() - clock) / 1000));
    return <article className="offer-card" key={o.id}>
      <div className="offer-top"><div><p className="eyebrow">NEW DELIVERY OFFER</p><p className="offer-earnings">{money(o.earnings)}</p><small>Your estimated earnings</small></div><div className="offer-countdown" aria-label={`Offer expires in ${seconds} seconds`}><strong>{seconds}</strong><small>sec</small></div></div>
      <div className="offer-route"><div><span className="route-dot pickup"/><p><small>Pickup area</small><b>{area(j.pickupAddress)}</b></p></div><div><span className="route-dot dropoff"/><p><small>Drop-off area</small><b>{area(j.dropoffAddress)}</b></p></div></div>
      <div className="offer-meta"><span>{j.estimatedDistanceKm} km</span><span>{j.vehicleClass.replaceAll('_',' ')}</span><span>{j.timeOption.replaceAll('_',' ')}</span></div>
      <p className="muted">{item?.description ?? 'Parcel'} · Exact addresses and recipient details unlock after acceptance.</p>
      <div className="offer-actions"><button className="primary" onClick={() => run(async () => await p.acceptDriverOffer(o.id))}>Accept delivery</button><button className="secondary" onClick={() => run(async () => { await p.declineDriverOffer(o.id); await p.searchDrivers(j.id); })}>Decline</button></div>
    </article>;
  })}
 </section>;
}