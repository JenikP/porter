import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db';
import { AuthRequest } from '../middleware/auth';
import { canAccess } from '../middleware/rbac';
import { recordAnalytics } from '../analytics/events';

const router = Router();

// Get jobs (customers see own, drivers see own, admins see all)
router.get('/', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { status, page = '1', limit = '20' } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  let query = 'SELECT j.*, u.name as customer_name, u.phone as customer_phone FROM jobs j JOIN users u ON j.customer_id = u.id WHERE 1=1';
  const params: any[] = [];

  if (req.user.role === 'CUSTOMER' || req.user.role === 'DRIVER') {
    if (req.user.role === 'CUSTOMER') {
      query += ' AND j.customer_id = ?';
      params.push(req.user.userId);
    } else if (req.user.role === 'DRIVER') {
      const driver = db.prepare('SELECT id FROM driver_profiles WHERE user_id = ?').get(req.user.userId) as any;
      if (driver) {
        query += ' AND j.driver_id = ?';
        params.push(driver.id);
      }
    }
  }

  if (status) {
    query += ' AND j.status = ?';
    params.push(status);
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM (${query})`, ...params).get(...params) as any;
  query += ` ORDER BY j.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit as string), offset);

  const jobs = db.prepare(query).all(...params);
  res.json({ items: jobs, total: total?.count || 0, page: parseInt(page as string), pageSize: parseInt(limit as string) });
});

// Get single job
router.get('/:id', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const job = db.prepare(`
    SELECT j.*, u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
           d.user_id as driver_user_id, du.name as driver_name
    FROM jobs j
    JOIN users u ON j.customer_id = u.id
    LEFT JOIN driver_profiles dp ON j.driver_id = dp.id
    LEFT JOIN users d ON dp.user_id = d.id
    LEFT JOIN users du ON dp.user_id = du.id
    WHERE j.id = ?
  `).get(req.params.id) as any;

  if (!job) return res.status(404).json({ error: 'Job not found' });

  // Access check
  if (req.user.role === 'CUSTOMER' && job.customer_id !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });
  if (req.user.role === 'DRIVER') {
    const driver = db.prepare('SELECT id FROM driver_profiles WHERE user_id = ?').get(req.user.userId) as any;
    if (!driver || job.driver_id !== driver.id) return res.status(403).json({ error: 'Forbidden' });
  }

  // Mask customer details before acceptance
  if (req.user.role === 'DRIVER' && !['ASSIGNED', 'EN_ROUTE_TO_PICKUP', 'AT_PICKUP', 'PICKED_UP', 'EN_ROUTE_TO_DROPOFF', 'AT_DROPOFF', 'DELIVERED', 'COMPLETED', 'DISPUTED', 'RESOLVED'].includes(job.status)) {
    job.customer_phone = null;
    job.recipient_phone = null;
  }

  const items = db.prepare('SELECT * FROM job_items WHERE job_id = ?').all(req.params.id);
  const events = db.prepare('SELECT * FROM job_events WHERE job_id = ? ORDER BY created_at ASC').all(req.params.id);

  res.json({ ...job, items, events });
});

// Create booking (customer)
router.post('/', async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (!canAccess(req.user.role, 'jobs', 'write')) return res.status(403).json({ error: 'Forbidden' });

  const {
    pickupAddress, pickupLat, pickupLng, dropoffAddress, dropoffLat, dropoffLng,
    itemDescription, itemSize, weightKg, photos, timeOption, stairs, helperRequired,
    pickupNotes, dropoffNotes, recipientName, recipientPhone, vehicleClass
  } = req.body;

  if (!pickupAddress || !dropoffAddress || !itemDescription || !itemSize || !vehicleClass || !timeOption) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const jobId = uuid();
  const quoteId = 'QT-' + Date.now().toString(36).toUpperCase();

  // Get rate card for pricing
  const rateCard = db.prepare('SELECT * FROM rate_cards WHERE is_active = 1 ORDER BY version DESC LIMIT 1').get() as any;
  if (!rateCard) return res.status(500).json({ error: 'No active rate card' });

  // Quick pricing: use distance-based estimate with Zoom2u benchmarks
  const basePrice = vehicleClass === 'VAN_OR_UTE' ? rateCard.base_fare_van_or_ute : rateCard.base_fare_bike_or_car;
  const minPrice = vehicleClass === 'VAN_OR_UTE' ? rateCard.min_price_van_or_ute : rateCard.min_price_bike_or_car;
  let multiplier = rateCard.within_3_hours_multiplier;
  if (timeOption === 'FLEXIBLE_WINDOW') multiplier = rateCard.flexible_window_multiplier;
  else if (timeOption === 'WITHIN_1_HOUR') multiplier = rateCard.within_1_hour_multiplier;
  const stairsCharge = (stairs || 0) * rateCard.stairs_per_flight;
  const helperCharge = helperRequired ? rateCard.helper_charge : 0;
  const rawPrice = basePrice * multiplier + stairsCharge + helperCharge;
  const price = Math.max(rawPrice, minPrice);
  const commission = price * (rateCard.commission_percent / 100);
  const driverEarnings = price - commission;

  db.prepare(`
    INSERT INTO jobs (id, customer_id, status, pickup_address, pickup_lat, pickup_lng, pickup_notes,
      dropoff_address, dropoff_lat, dropoff_lng, dropoff_notes,
      recipient_name, recipient_phone, vehicle_class, time_option, stairs, helper_required,
      quote_id, price, commission, driver_earnings, scheduled_pickup_window_start)
    VALUES (?, ?, 'SEARCHING', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+3 hours'))
  `).run(jobId, req.user.userId, pickupAddress, pickupLat, pickupLng, pickupNotes || null,
    dropoffAddress, dropoffLat, dropoffLng, dropoffNotes || null,
    recipientName || null, recipientPhone || null, vehicleClass, timeOption, stairs || 0, helperRequired ? 1 : 0,
    quoteId, price, commission, driverEarnings);

  const itemId = uuid();
  db.prepare(`INSERT INTO job_items (id, job_id, description, size, weight_kg, quantity, photos) VALUES (?, ?, ?, ?, ?, 1, ?)`
    .run(itemId, jobId, itemDescription, itemSize, weightKg || null, JSON.stringify(photos || [])));

  // Record event
  db.prepare(`INSERT INTO job_events (id, job_id, from_status, to_status, actor_type, actor_id) VALUES (?, ?, NULL, 'SEARCHING', 'CUSTOMER', ?)`
    .run(uuid(), jobId, req.user.userId));

  // Analytics
  recordAnalytics('DriverSearchStarted', req.user.userId, jobId);

  res.status(201).json({ id: jobId, status: 'SEARCHING', price, driverEarnings });
});

export default router;
