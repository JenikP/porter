import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db';
import { AuthRequest } from '../middleware/auth';
import { getMetrics, getAnalytics } from '../analytics/events';

const router = Router();

// Overview dashboard
router.get('/overview', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'MANAGER_ADMIN' && req.user.role !== 'SUPPORT_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const metrics = getMetrics();
  const recentJobs = db.prepare(`
    SELECT j.id, j.status, j.price, j.created_at, u.name as customer_name, du.name as driver_name
    FROM jobs j
    JOIN users u ON j.customer_id = u.id
    LEFT JOIN driver_profiles dp ON j.driver_id = dp.id
    LEFT JOIN users du ON dp.user_id = du.id
    ORDER BY j.created_at DESC LIMIT 10
  `).all();
  res.json({ metrics, recentJobs });
});

// All jobs
router.get('/jobs', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'MANAGER_ADMIN' && req.user.role !== 'SUPPORT_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { status, search, page = '1', limit = '50' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  let query = `
    SELECT j.*, u.name as customer_name, u.email as customer_email,
           dp.id as driver_profile_id, du.name as driver_name
    FROM jobs j
    JOIN users u ON j.customer_id = u.id
    LEFT JOIN driver_profiles dp ON j.driver_id = dp.id
    LEFT JOIN users du ON dp.user_id = du.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (status) { query += ' AND j.status = ?'; params.push(status); }
  if (search) { query += ' AND (j.id LIKE ? OR j.pickup_address LIKE ? OR j.dropoff_address LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  const total = (db.prepare(`SELECT COUNT(*) as n FROM (${query})`, ...params).get(...params) as any).n;
  query += ` ORDER BY j.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit as string), offset);
  const jobs = db.prepare(query).all(...params);
  res.json({ items: jobs, total, page: parseInt(page as string), pageSize: parseInt(limit as string) });
});

// Admin: update job status
router.post('/jobs/:id/status', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'MANAGER_ADMIN' && req.user.role !== 'SUPPORT_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { status, notes } = req.body;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any;
  if (!job) return res.status(404).json({ error: 'Job not found' });

  db.prepare('UPDATE jobs SET status = ?, admin_notes = ?, updated_at = datetime("now") WHERE id = ?')
    .run(status, notes || job.admin_notes, req.params.id);
  db.prepare(`INSERT INTO job_events (id, job_id, from_status, to_status, actor_type, actor_id) VALUES (?, ?, ?, ?, 'ADMIN', ?)`
    .run(uuid(), req.params.id, job.status, status, req.user.userId));
  db.prepare(`INSERT INTO audit_logs (id, admin_id, action, entity_type, entity_id, old_value, new_value) VALUES (?, ?, 'JOB_STATUS_CHANGE', 'jobs', ?, ?, ?)`
    .run(uuid(), req.user.userId, req.params.id, JSON.stringify({ status: job.status }), JSON.stringify({ status }));

  res.json({ message: 'Job status updated' });
});

// Admin: manual assign driver
router.post('/jobs/:id/assign', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'MANAGER_ADMIN' && req.user.role !== 'SUPPORT_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { driverId } = req.body;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(req.params.id) as any;
  if (!job) return res.status(404).json({ error: 'Job not found' });

  db.prepare('UPDATE jobs SET driver_id = ?, status = ? WHERE id = ?').run(driverId, 'ASSIGNED', req.params.id);
  db.prepare(`INSERT INTO job_events (id, job_id, from_status, to_status, actor_type, actor_id) VALUES (?, ?, ?, 'ASSIGNED', 'ADMIN', ?)`
    .run(uuid(), req.params.id, job.status, req.user.userId));
  db.prepare(`INSERT INTO audit_logs (id, admin_id, action, entity_type, entity_id, new_value) VALUES (?, ?, 'MANUAL_DRIVER_ASSIGN', 'jobs', ?, ?)`
    .run(uuid(), req.user.userId, req.params.id, JSON.stringify({ driverId }));

  res.json({ message: 'Driver assigned' });
});

// Admin: resolve dispute
router.post('/disputes/:id/resolve', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'MANAGER_ADMIN' && req.user.role !== 'SUPPORT_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { decision, refundAmount, driverDeduction } = req.body;
  const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(req.params.id) as any;
  if (!dispute) return res.status(404).json({ error: 'Dispute not found' });

  db.prepare(`UPDATE disputes SET status = 'RESOLVED', decision = ?, refund_amount = ?, driver_deduction = ?, resolved_by = ?, resolved_at = datetime('now') WHERE id = ?`)
    .run(decision, refundAmount || 0, driverDeduction || 0, req.user.userId, req.params.id);
  db.prepare(`UPDATE jobs SET status = 'RESOLVED' WHERE id = ?`).run(dispute.job_id);

  db.prepare(`INSERT INTO audit_logs (id, admin_id, action, entity_type, entity_id, new_value) VALUES (?, ?, 'DISPUTE_RESOLVED', 'disputes', ?, ?)`
    .run(uuid(), req.user.userId, req.params.id, JSON.stringify({ decision, refundAmount, driverDeduction })));

  res.json({ message: 'Dispute resolved' });
});

// Admin: update pricing
router.post('/pricing/rate-card', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'MANAGER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const values = req.body;

  const existing = db.prepare('SELECT MAX(version) as v FROM rate_cards').get() as any;
  const newVersion = (existing?.v || 0) + 1;

  // Deactivate current
  db.prepare('UPDATE rate_cards SET is_active = 0 WHERE is_active = 1').run();

  const id = uuid();
  db.prepare(`
    INSERT INTO rate_cards (id, version, effective_from, is_active, created_by,
      base_fare_bike_or_car, base_fare_van_or_ute, per_km_rate, per_minute_rate,
      flexible_window_multiplier, within_3_hours_multiplier, within_1_hour_multiplier,
      stairs_per_flight, helper_charge, free_waiting_minutes, waiting_per_minute,
      min_price_bike_or_car, min_price_van_or_ute, commission_percent, service_area_name)
    VALUES (?, ?, datetime('now'), 1, ?,
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, newVersion, req.user.userId,
    values.baseFareBikeOrCar, values.baseFareVanOrUte, values.perKmRate, values.perMinuteRate,
    values.flexibleWindowMultiplier, values.within3HoursMultiplier, values.within1HourMultiplier,
    values.stairsPerFlight, values.helperCharge, values.freeWaitingMinutes, values.waitingPerMinute,
    values.minPriceBikeOrCar, values.minPriceVanOrUte, values.commissionPercent, values.serviceAreaName || 'Melbourne');

  db.prepare(`INSERT INTO audit_logs (id, admin_id, action, entity_type, entity_id, new_value) VALUES (?, ?, 'RATE_CARD_UPDATED', 'rate_cards', ?, ?)`
    .run(uuid(), req.user.userId, id, JSON.stringify(values)));

  res.json({ message: 'Rate card created', id, version: newVersion });
});

// Admin: get rate card
router.get('/pricing/rate-card', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const card = db.prepare('SELECT * FROM rate_cards WHERE is_active = 1 ORDER BY version DESC LIMIT 1').get();
  res.json(card);
});

// Audit logs
router.get('/audit', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'MANAGER_ADMIN' && req.user.role !== 'SUPPORT_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { page = '1', limit = '50' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  const logs = db.prepare(`
    SELECT al.*, u.name as admin_name
    FROM audit_logs al
    JOIN users u ON al.admin_id = u.id
    ORDER BY al.created_at DESC LIMIT ? OFFSET ?
  `).all(parseInt(limit as string), offset);
  res.json(logs);
});

// Customers list
router.get('/customers', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'MANAGER_ADMIN' && req.user.role !== 'SUPPORT_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const customers = db.prepare(`
    SELECT u.id, u.name, u.email, u.phone, u.created_at,
           cp.type, cp.business_name, cp.abn,
           (SELECT COUNT(*) FROM jobs WHERE customer_id = u.id) as total_jobs,
           (SELECT SUM(price) FROM jobs WHERE customer_id = u.id AND status NOT IN ('CANCELLED')) as total_spend
    FROM users u
    JOIN customer_profiles cp ON u.id = cp.user_id
    WHERE u.role = 'CUSTOMER'
    ORDER BY u.created_at DESC
  `).all();
  res.json(customers);
});

// Analytics
router.get('/analytics', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { event, from, to, limit } = req.query;
  res.json(getAnalytics({ event: event as string, from: from as string, to: to as string, limit: limit ? parseInt(limit as string) : 100 }));
});

export default router;
