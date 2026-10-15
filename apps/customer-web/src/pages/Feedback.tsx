import { useState } from 'react';
import { useMockPlatform } from '@porter/mock-platform';
import { DisputeReason, type Job } from '@porter/shared';

export function Feedback({ job }: { job: Job }) {
 const p = useMockPlatform();
 const [stars,setStars] = useState(5);
 const [comment,setComment] = useState('');
 const [reason,setReason] = useState(DisputeReason.DAMAGE);
 const [description,setDescription] = useState('');
 const [photos,setPhotos] = useState<string[]>([]);
 const [error,setError] = useState('');
 const [showDispute,setShowDispute] = useState(false);
 const rating = p.ratings.find(r => r.id === job.customerRatingId);
 const run = async (f: () => void) => { try { await f(); setError(''); } catch(e) { setError(e instanceof Error ? e.message : 'Unable to save feedback'); } };
 return <section className="panel feedback-panel">
  <div className="section-heading"><div><p className="eyebrow">DELIVERY COMPLETE</p><h2>How was your delivery?</h2></div>{rating && <span className="badge">Rated {rating.stars}/5</span>}</div>
  {rating ? <p className="success">Thanks for your feedback{rating.comment ? ` · ${rating.comment}` : ''}</p> : <>
    <fieldset><legend>Rate your driver</legend><div className="rating-stars">{[1,2,3,4,5].map(s => <button key={s} className={stars >= s ? 'rating-star selected' : 'rating-star'} aria-label={`${s} star rating`} aria-pressed={stars === s} onClick={() => setStars(s)}>★</button>)}</div></fieldset>
    <label>Comment <span className="muted">(optional)</span><textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="What stood out about the delivery?"/></label>
    <button className="primary" onClick={() => run(async () => { if (!job.driverId) throw new Error('No driver to rate'); await p.createRating({ jobId: job.id, raterType: 'CUSTOMER', raterId: job.customerId, targetId: job.driverId, stars, comment }); })}>Submit rating</button>
  </>}
  {!job.disputeId && <div className="dispute-entry">
    <div><p className="eyebrow">SOMETHING NOT RIGHT?</p><h3>Report an issue</h3><p className="muted">Damage, a wrong item, lateness or driver behaviour can be reviewed by Operations.</p></div>
    <button className={showDispute ? 'secondary' : 'dispute-button'} onClick={() => setShowDispute(v => !v)}>{showDispute ? 'Close issue form' : 'Raise a dispute'}</button>
  </div>}
  {!job.disputeId && showDispute && <div className="dispute-form">
    <label>Issue type<select value={reason} onChange={e => setReason(e.target.value as DisputeReason)}>{[DisputeReason.DAMAGE,DisputeReason.LATENESS,DisputeReason.BEHAVIOUR,DisputeReason.WRONG_ITEM].map(r => <option key={r}>{r.replaceAll('_',' ')}</option>)}</select></label>
    <label>Tell us what happened<textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what happened and what you expected." required/></label>
    <label>Evidence photo <span className="muted">(optional)</span><input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 500000 || !f.type.startsWith('image/')) { setError('Use an image smaller than 500 KB'); return; } const reader = new FileReader(); reader.onload = () => setPhotos([String(reader.result)]); reader.readAsDataURL(f); }}/></label>
    {photos.map(src => <img className="proof" key={src.slice(-30)} src={src} alt="Issue evidence"/>)}
    <button className="primary" disabled={description.trim().length < 10} onClick={() => run(async () => await p.createDispute({ jobId: job.id, reason, description, customerPhotos: photos }))}>Submit issue for review</button>
    <p className="muted">Operations will review the delivery timeline and handover evidence. The decision will appear on this delivery.</p>
  </div>}
  {job.disputeId && <p className="success">Your issue has been submitted. Track the review and final decision in this delivery.</p>}
  {error && <p className="error" role="alert">{error}</p>}
 </section>;
}