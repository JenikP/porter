import { AddressField } from '@porter/app-session';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMockPlatform } from '@porter/mock-platform';
import { Button, Card, Icon } from '@porter/ui';
import { ItemSize, TimeOption, VehicleClass, JobStatus, type Quote } from '@porter/shared';
import { calculatePrice, recommendVehicle, getVehicleLabel } from '@porter/domain';

export type BookingDraft = { pickup: string; dropoff: string; description: string; size: ItemSize; weight: number; quantity: number; photos: string[]; pickupNotes: string; dropoffNotes: string; stairs: number; helper: boolean; speed: TimeOption; recipientName: string; recipientPhone: string; otherRecipient: boolean; notes: string; vehicle: VehicleClass; step: number };
const initial: BookingDraft = { pickup: '120 Collins St, Melbourne VIC 3000', dropoff: '700 Bourke St, Docklands VIC 3008', description: '', size: ItemSize.SMALL, weight: 2, quantity: 1, photos: [], pickupNotes: '', dropoffNotes: '', stairs: 0, helper: false, speed: TimeOption.WITHIN_3_HOURS, recipientName: '', recipientPhone: '', otherRecipient: false, notes: '', vehicle: VehicleClass.BIKE_OR_CAR, step: 0 };
export function BookingPage() {
  const p = useMockPlatform(); const navigate = useNavigate(); const location = useLocation();
  const [draft, setDraft] = useState<BookingDraft>(() => { try { return { ...initial, ...JSON.parse(sessionStorage.getItem('porter.booking') ?? '{}'), ...(location.state ?? {}) }; } catch { return initial; } });
  const [error, setError] = useState('');
  const [quote, setQuote] = useState<Quote | undefined>();
  const [failedJob, setFailedJob] = useState<string>();
  const [failPayment, setFailPayment] = useState(false);
  const [busy, setBusy] = useState(false);
  const [clock, setClock] = useState(Date.now());
  useEffect(() => { const timer = window.setInterval(() => setClock(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const recommended = recommendVehicle(draft.size, draft.weight * draft.quantity, draft.helper);
  useEffect(() => { sessionStorage.setItem('porter.booking', JSON.stringify(draft)); }, [draft]);
  const patch = (values: Partial<BookingDraft>) => setDraft(d => ({ ...d, ...values }));
  const generateQuote = async () => {
    if (failedJob) { setError('The saved booking total is locked. Retry payment using the same amount.'); return quote; }
    const rate = p.rateCards.filter(r => r.effectiveFrom <= new Date()).sort((a,b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime() || b.version - a.version)[0];
    const distanceKm = /docklands/i.test(draft.dropoff) ? 3.2 : /southbank/i.test(draft.dropoff) ? 4.1 : /richmond/i.test(draft.dropoff) ? 6.5 : /carlton/i.test(draft.dropoff) ? 4.8 : 7.2;
    const durationMinutes = Math.ceil(distanceKm * 3 + 8);
    const priceBreakdown = calculatePrice({ vehicleClass: draft.vehicle, distanceKm, durationMinutes, timeOption: draft.speed, stairs: draft.stairs, helperRequired: draft.helper, rateCard: rate.values });
    const q = await p.createQuote({ customerId: p.customers[0].id, pickupAddress: draft.pickup, dropoffAddress: draft.dropoff, vehicleClass: draft.vehicle, timeOption: draft.speed, stairs: draft.stairs, helperRequired: draft.helper, distanceKm, durationMinutes, priceBreakdown, price: priceBreakdown.total, rateCardVersionId: rate.id, expiresAt: new Date(Date.now() + 15 * 60000), validUntil: new Date(Date.now() + 15 * 60000) });
    setQuote(q); return q;
  };
  const pay = async () => {
    if (!quote || (!failedJob && quote.expiresAt.getTime() <= Date.now())) { setError('Quote expired. Refresh it first.'); return; }
    setBusy(true); setError('');
    await new Promise(resolve => setTimeout(resolve, 450));
    try {
      let jobId = failedJob;
      if (jobId) {
        await p.authorizePayment({ jobId, customerId: p.customers[0].id, amount: quote.price, fail: failPayment });
        if (!failPayment) { await p.returnJobToSearching(jobId, 'Payment retry authorized'); await p.searchDrivers(jobId); }
      } else {
        const result = await p.bookDelivery({ customerId: p.customers[0].id, quote, item: { description: draft.description, size: draft.size, weightKg: draft.weight, quantity: draft.quantity, photos: draft.photos, notes: draft.notes }, jobFields: { pickupNotes: draft.pickupNotes, dropoffNotes: draft.dropoffNotes, recipientName: draft.recipientName || p.customers[0].name || 'Recipient', recipientPhone: draft.recipientPhone || p.customers[0].phone || '', recipientCode: '2468' }, paymentFail: failPayment });
        jobId = result.job.id;
      }
      if (failPayment) { setFailedJob(jobId); setError('Mock payment declined. Select success and retry. No driver search started.'); }
      else { sessionStorage.removeItem('porter.booking'); navigate(`/jobs/${jobId}`); }
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to simulate payment. Retry.'); }
    finally { setBusy(false); }
  };
  const next = async () => {
    if (draft.pickup.trim().length < 10 || draft.dropoff.trim().length < 10 || draft.pickup.trim().toLowerCase() === draft.dropoff.trim().toLowerCase()) { setError('Enter two different complete Melbourne addresses.'); return; }
    if (draft.step === 1 && (!draft.description.trim() || draft.weight <= 0 || draft.weight * draft.quantity > 500 || draft.quantity < 1)) { setError('Describe the item and enter a positive weight and quantity, up to 500 kg total.'); return; }
    if (draft.step === 2 && (draft.stairs < 0 || draft.stairs > 10 || (draft.otherRecipient && (!draft.recipientName.trim() || !/^(?:\+61|0)4\d{8}$/.test(draft.recipientPhone.replace(/\s/g, '')))))) { setError('Use 0–10 flights and provide a recipient name and valid Australian mobile number.'); return; }
    if (draft.step === 3) { setBusy(true); try { await generateQuote(); } catch(e) { setError(e instanceof Error ? e.message : "Unable to calculate quote"); return; } finally { setBusy(false); } }
    if (draft.step === 4 && (!quote || quote.expiresAt.getTime() <= Date.now())) { setError('Quote expired. Refresh the quote before continuing.'); return; }
    setError(''); patch({ step: draft.step + 1, ...(draft.step === 2 ? { vehicle: recommended } : {}) });
  };
  const uploadPhotos = async (files: FileList | null) => {
    if (!files) return;
    if (draft.photos.length + files.length > 5 || Array.from(files).some(f => !f.type.startsWith('image/') || f.size > 500000)) { setError('Use up to five images, each smaller than 500 KB for local demo storage.'); return; }
    const photos = await Promise.all(Array.from(files).map(f => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(f); })));
    patch({ photos: [...draft.photos, ...photos] }); setError('');
  };
  let content = <><AddressField label="Pickup address" value={draft.pickup} onChange={pickup=>patch({pickup})}/><AddressField label="Drop-off address" value={draft.dropoff} onChange={dropoff=>patch({dropoff})}/><h3>Use a saved address</h3><div className="actions">{p.customers[0]?.savedAddresses.map(a => <button className="secondary" key={a.label} onClick={() => patch({ dropoff: a.address })}>{a.label}</button>)}</div><div className="map-sim" aria-label="Simulated Melbourne service map"><span>Melbourne CBD</span><b>● Pickup ━━━━━ ● Drop-off</b><small>Illustrative route · no live maps</small></div></>;
  if (draft.step === 1) content = <><label>Item description<textarea value={draft.description} onChange={e => patch({ description: e.target.value })} placeholder="Two boxed lamps from a Carlton shop" required /></label><fieldset><legend>Item size</legend><div className="item-size-cards">{Object.values(ItemSize).map(s=><label className="selection-card" key={s}><input type="radio" name="item-size" checked={draft.size===s} onChange={()=>patch({size:s})}/>{s.toLowerCase()}</label>)}</div></fieldset><div className="grid"><label>Weight per item (kg)<input type="number" min="0.1" max="500" step="0.1" value={draft.weight} onChange={e => patch({ weight: Number(e.target.value) })}/></label><label>Quantity<input type="number" min="1" max="100" value={draft.quantity} onChange={e => patch({ quantity: Number(e.target.value) })}/></label></div><label>Item photos · up to five<input type="file" accept="image/*" multiple onChange={e => void uploadPhotos(e.target.files)}/></label><div className="grid">{draft.photos.map((src,i) => <div key={i}><img className="proof" src={src} alt={`Item photo ${i + 1}`}/><button className="secondary" onClick={() => patch({ photos: draft.photos.filter((_,n) => n !== i) })}>Remove photo {i + 1}</button></div>)}</div><label>Pickup notes<textarea value={draft.pickupNotes} onChange={e => patch({ pickupNotes: e.target.value })}/></label><label>Drop-off notes<textarea value={draft.dropoffNotes} onChange={e => patch({ dropoffNotes: e.target.value })}/></label></>;
  if (draft.step === 2) content = <><label>Stair flights<input type="number" min="0" max="10" value={draft.stairs} onChange={e => patch({ stairs: Number(e.target.value) })}/></label><label><input type="checkbox" checked={draft.helper} onChange={e => patch({ helper: e.target.checked })}/>Second person for lifting</label><fieldset><legend>Delivery speed</legend>{[[TimeOption.FLEXIBLE_WINDOW, 'Flexible'], [TimeOption.WITHIN_3_HOURS, 'Within 3 Hours'], [TimeOption.WITHIN_1_HOUR, 'Within 1 Hour']].map(([value,label]) => <label key={value}><input type="radio" name="speed" checked={draft.speed === value} onChange={() => patch({ speed: value as TimeOption })}/>{label}</label>)}</fieldset><label>Additional delivery notes<textarea value={draft.notes} onChange={e => patch({ notes: e.target.value })}/></label><label><input type="checkbox" checked={draft.otherRecipient} onChange={e => patch({ otherRecipient: e.target.checked })}/>Booking for someone else</label>{draft.otherRecipient && <><label>Recipient name<input value={draft.recipientName} onChange={e => patch({ recipientName: e.target.value })}/></label><label>Recipient mobile<input type="tel" placeholder="0412 345 678" value={draft.recipientPhone} onChange={e => patch({ recipientPhone: e.target.value })}/></label></>}</>;
  if (draft.step === 3) content = <><p className="success">Recommended: {getVehicleLabel(recommended)}</p><p className="muted">Based on {draft.size.toLowerCase()} items, {draft.weight * draft.quantity} kg total and {draft.helper ? 'two-person' : 'one-person'} handling. Prototype thresholds: car 30 kg, van 500 kg.</p>{Object.values(VehicleClass).map(v => <label className="selection-card" key={v}><Icon name="truck"/><input type="radio" name="vehicle" disabled={recommended === VehicleClass.VAN_OR_UTE && v === VehicleClass.BIKE_OR_CAR} checked={draft.vehicle === v} onChange={() => patch({ vehicle: v })}/>{getVehicleLabel(v)}{v === recommended ? ' · recommended' : ' · larger vehicle'}</label>)}</>;
  if (draft.step >= 4 && quote) content = <><p className="price">${quote.price.toFixed(2)}</p><p className="muted">Fixed customer total · {getVehicleLabel(quote.vehicleClass)} · {quote.distanceKm} km / {quote.durationMinutes} min illustrative route</p><dl className="quote-lines">{[['Base fare', quote.priceBreakdown.baseFare], ['Distance', quote.priceBreakdown.distanceFare], ['Time', quote.priceBreakdown.timeFare], ['Stairs', quote.priceBreakdown.stairsCharge], ['Helper', quote.priceBreakdown.helperCharge], ['Minimum adjustment', Math.max(0, quote.price - quote.priceBreakdown.subtotal)]].map(([label,value]) => <div className="flex justify-between py-2" key={label}><dt>{label}</dt><dd>${Number(value).toFixed(2)}</dd></div>)}</dl><p>Speed multiplier: ×{quote.priceBreakdown.urgencyMultiplier}</p><p className="muted">Rate card v{p.rateCards.find(r => r.id === quote.rateCardVersionId)?.version} · valid for {Math.min(15, Math.max(0, Math.ceil((quote.expiresAt.getTime() - clock) / 60000)))} minutes. Commission is included in the total, not an extra fee.</p><Button variant="secondary" onClick={generateQuote}>Refresh quote</Button></>;
  if (draft.step >= 4 && !quote) content = <><p className="error">Your quote needs to be refreshed after returning to this booking.</p><Button onClick={generateQuote}>Refresh quote</Button></>;
  if (draft.step === 5) content = <>{content}<h3>Demo wallet · no card details required</h3><label>Payment simulation<select value={failPayment ? 'failed' : 'success'} onChange={e => setFailPayment(e.target.value === 'failed')}><option value="success">Authorize successfully</option><option value="failed">Decline payment</option></select></label><p className="muted">Receipt preview: {draft.pickup} → {draft.dropoff}. Payment is authorized now and captured when delivery completes. Recipient demo code: 2468.</p></>;
  return <div className="booking">
    <ol className="booking-progress" aria-label="Booking progress">{['Addresses','Items','Options','Vehicle','Quote','Payment'].map((label,i)=><li key={label} className={i<draft.step?'complete':i===draft.step?'current':''} aria-current={i===draft.step?'step':undefined}><span>{i<draft.step?<Icon name="check" size={16}/>:i+1}</span><small>{label}</small></li>)}</ol>
    <h1>{['Where are we going?', 'What are we moving?', 'Make it yours', 'The right vehicle', 'Your fixed quote', 'Confirm & pay'][draft.step]}</h1>
    <p className="muted">Step {draft.step + 1} of 6 · Your progress is saved on this device.</p>
    <div className="booking-layout"><div><Card>{draft.step>=4&&<h2>Price breakdown</h2>}{content}</Card>{error && <p role="alert" className="error">{error}</p>}</div><aside className="booking-summary"><h2>Booking summary</h2><dl><div><dt>Pickup</dt><dd className="summary-value"><Icon name="pin"/>{draft.pickup}</dd></div><div><dt>Drop-off</dt><dd className="summary-value"><Icon name="pin"/>{draft.dropoff}</dd></div>{draft.description&&<div><dt>Item</dt><dd>{draft.description} · {draft.weight*draft.quantity} kg</dd></div>}{draft.step>=3&&<><div><dt>Vehicle</dt><dd>{getVehicleLabel(draft.vehicle)}</dd></div><div><dt>Delivery speed</dt><dd>{draft.speed.replaceAll('_',' ').toLowerCase()}</dd></div></>}{quote&&<div><dt>Total distance</dt><dd>{quote.distanceKm} km · illustrative route</dd></div>}</dl><div className="summary-meta"><Icon name="shield"/><p>Photo proof at pickup and drop-off.</p>{quote&&<p>Quote valid for {Math.min(15,Math.max(0,Math.ceil((quote.expiresAt.getTime()-clock)/60000)))} minutes</p>}</div></aside></div>
    <div className="booking-actions"><Button disabled={busy || !!failedJob} variant="secondary" onClick={() => { setQuote(undefined); draft.step ? patch({ step: draft.step - 1 }) : navigate('/'); }}>Back</Button><Button disabled={busy} onClick={draft.step === 5 ? () => void pay() : next}>{busy ? 'Authorizing…' : draft.step === 5 ? failedJob ? 'Retry payment' : 'Confirm mock payment' : 'Continue'}</Button></div>
  </div>;
}






