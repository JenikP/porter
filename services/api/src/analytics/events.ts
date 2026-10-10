import { db } from '../db';
import { v4 as uuid } from 'uuid';
import { AnalyticsEvent } from '@porter/shared';

const ANALYTICS_EVENTS: AnalyticsEvent[] = [
  'BookingStarted', 'BookingCompleted', 'QuoteGenerated', 'QuoteAccepted',
  'PaymentAuthorized', 'PaymentFailed', 'DriverSearchStarted',
  'DriverOfferSent', 'DriverOfferAccepted', 'DriverOfferDeclined', 'DriverMatched',
  'JobCompleted', 'JobCancelled', 'JobUnmatched', 'DisputeCreated',
  'RepeatBooking', 'DriverOnline', 'DriverOffline', 'DocumentExpired'
];

export function recordAnalytics(
  event: AnalyticsEvent,
  userId?: string,
  jobId?: string,
  metadata?: Record<string, unknown>
) {
  if (!ANALYTICS_EVENTS.includes(event)) {
    console.warn(`Unknown analytics event: ${event}`);
    return;
  }
  try {
    db.prepare(`
      INSERT INTO analytics_events (id, event, user_id, job_id, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(uuid(), event, userId || null, jobId || null, JSON.stringify(metadata || {}));
  } catch (err) {
    console.error('Failed to record analytics event', err);
  }
}

export function getAnalytics(filters: { event?: string; from?: string; to?: string; limit?: number }) {
  let query = 'SELECT * FROM analytics_events WHERE 1=1';
  const params: any[] = [];
  if (filters.event) { query += ' AND event = ?'; params.push(filters.event); }
  if (filters.from) { query += ' AND timestamp >= ?'; params.push(filters.from); }
  if (filters.to) { query += ' AND timestamp <= ?'; params.push(filters.to); }
  query += ' ORDER BY timestamp DESC';
  if (filters.limit) { query += ' LIMIT ?'; params.push(filters.limit); }
  return db.prepare(query).all(...params);
}

export function getMetrics() {
  const totalJobs = (db.prepare('SELECT COUNT(*) as n FROM jobs').get() as any).n;
  const completedJobs = (db.prepare(`SELECT COUNT(*) as n FROM jobs WHERE status = 'COMPLETED'`).get() as any).n;
  const searchingJobs = (db.prepare(`SELECT COUNT(*) as n FROM jobs WHERE status = 'SEARCHING'`).get() as any).n;
  const unmatchedJobs = (db.prepare(`SELECT COUNT(*) as n FROM jobs WHERE status = 'UNMATCHED'`).get() as any).n;
  const disputedJobs = (db.prepare(`SELECT COUNT(*) as n FROM jobs WHERE status = 'DISPUTED'`).get() as any).n;
  const activeDrivers = (db.prepare(`SELECT COUNT(*) as n FROM driver_profiles WHERE is_online = 1`).get() as any).n;
  const totalDrivers = (db.prepare(`SELECT COUNT(*) as n FROM driver_profiles WHERE approval_status = 'APPROVED'`).get() as any).n;
  const totalGMV = (db.prepare(`SELECT COALESCE(SUM(price), 0) as n FROM jobs WHERE status NOT IN ('CANCELLED')`).get() as any).n;
  const totalRevenue = (db.prepare(`SELECT COALESCE(SUM(commission), 0) as n FROM jobs WHERE status NOT IN ('CANCELLED')`).get() as any).n;
  const repeatCustomers = (db.prepare(`SELECT COUNT(DISTINCT customer_id) as n FROM jobs WHERE status = 'COMPLETED' GROUP BY customer_id HAVING COUNT(*) > 1`).get() as any[])?.length || 0;

  return {
    totalJobs, completedJobs, searchingJobs, unmatchedJobs, disputedJobs,
    activeDrivers, totalDrivers, totalGMV, totalRevenue, repeatCustomers
  };
}
