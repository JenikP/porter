import { DisputeStatus, JobStatus, OfferStatus } from '@porter/shared';
import { useMockPlatform } from './react';

export function MockPlatformSummary({ role }: { role: 'customer' | 'driver' | 'admin' }) {
  const { jobs, drivers, disputes, driverOffers, auditLogs } = useMockPlatform();

  const activeJob = jobs.find((job) => job.status !== JobStatus.COMPLETED && job.status !== JobStatus.CANCELLED);
  const onlineDrivers = drivers.filter((driver) => driver.isOnline && !driver.isSuspended).length;
  const pendingOffers = driverOffers.filter((offer) => offer.status === OfferStatus.PENDING).length;

  return (
    <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      <p className="font-semibold text-slate-900">Connected mock platform ({role})</p>
      <ul className="mt-2 space-y-1">
        <li>Jobs in state: {jobs.length}</li>
        <li>Active job: {activeJob ? `${activeJob.pickupAddress.split(',')[0]} → ${activeJob.status}` : 'None'}</li>
        <li>Drivers online: {onlineDrivers}</li>
        <li>Pending driver offers: {pendingOffers}</li>
        <li>Open disputes: {disputes.filter((d) => d.status === DisputeStatus.OPEN).length}</li>
        <li>Audit events: {auditLogs.length}</li>
      </ul>
      <p className="mt-2 text-xs text-slate-500">
        Shared via one MockPlatformProvider on the same origin. Prefer the connected demo at{' '}
        <code className="rounded bg-white px-1">/customer</code>,{' '}
        <code className="rounded bg-white px-1">/driver</code>,{' '}
        <code className="rounded bg-white px-1">/admin</code>.
      </p>
    </section>
  );
}
