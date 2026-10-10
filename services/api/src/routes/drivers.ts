import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Get driver profile
router.get('/profile', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.prepare(`
    SELECT dp.*, u.name, u.email, u.phone
    FROM driver_profiles dp
    JOIN users u ON dp.user_id = u.id
    WHERE dp.user_id = ?
  `).get(req.user.userId) as any;
  if (!profile) return res.status(404).json({ error: 'Driver profile not found' });

  const vehicles = db.prepare('SELECT * FROM vehicles WHERE driver_id = ?').all(profile.id);
  const documents = db.prepare('SELECT * FROM driver_documents WHERE driver_id = ?').all(profile.id);
  res.json({ ...profile, vehicles, documents });
});

// Update online status
router.post('/status', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { isOnline } = req.body;

  // Check for expired documents
  if (isOnline) {
    const profile = db.prepare('SELECT id FROM driver_profiles WHERE user_id = ?').get(req.user.userId) as any;
    if (profile) {
      const expired = db.prepare(`SELECT id, type FROM driver_documents WHERE driver_id = ? AND status = 'EXPIRED'`)
        .all(profile.id) as any[];
      if (expired.length > 0) {
        return res.status(400).json({ error: 'Cannot go online: expired documents', documents: expired });
      }
      const pending = db.prepare(`SELECT id, type FROM driver_documents WHERE driver_id = ? AND status = 'PENDING'`)
        .all(profile.id) as any[];
      if (pending.length > 0) {
        return res.status(400).json({ error: 'Cannot go online: documents still pending review', documents: pending });
      }
    }
  }

  const profile = db.prepare('SELECT id FROM driver_profiles WHERE user_id = ?').get(req.user.userId) as any;
  if (!profile) return res.status(404).json({ error: 'Driver profile not found' });

  db.prepare('UPDATE driver_profiles SET is_online = ? WHERE id = ?').run(isOnline ? 1 : 0, profile.id);
  res.json({ isOnline });
});

// Get available jobs (for driver)
router.get('/jobs/available', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.prepare('SELECT id FROM driver_profiles WHERE user_id = ?').get(req.user.userId) as any;
  if (!profile) return res.status(404).json({ error: 'Driver profile not found' });

  const jobs = db.prepare(`
    SELECT j.id, j.pickup_address, j.dropoff_address, j.vehicle_class, j.time_option,
           j.price, j.driver_earnings, j.stairs, j.helper_required, j.created_at,
           u.name as customer_name
    FROM jobs j
    JOIN users u ON j.customer_id = u.id
    WHERE j.status = 'SEARCHING'
    AND j.vehicle_class IN (
      SELECT type FROM vehicles WHERE driver_id = ? AND is_default = 1
    )
    ORDER BY j.created_at ASC
  `).all(profile.id);

  res.json(jobs);
});

// Accept job offer
router.post('/jobs/:id/accept', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { id: jobId } = req.params;
  const profile = db.prepare('SELECT id FROM driver_profiles WHERE user_id = ?').get(req.user.userId) as any;
  if (!profile) return res.status(404).json({ error: 'Driver profile not found' });

  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND status = ?').get(jobId, 'SEARCHING') as any;
  if (!job) return res.status(404).json({ error: 'Job not found or not available' });

  // Check driver's vehicles match
  const vehicle = db.prepare('SELECT type FROM vehicles WHERE driver_id = ? AND is_default = 1').get(profile.id) as any;
  if (!vehicle || vehicle.type !== job.vehicle_class) {
    return res.status(400).json({ error: 'Vehicle type mismatch' });
  }

  // Assign driver
  db.prepare('UPDATE jobs SET driver_id = ?, status = ? WHERE id = ?')
    .run(profile.id, 'ASSIGNED', jobId);

  // Record events
  db.prepare(`INSERT INTO job_events (id, job_id, from_status, to_status, actor_type, actor_id) VALUES (?, ?, 'SEARCHING', 'ASSIGNED', 'DRIVER', ?)`
    .run(uuid(), jobId, req.user.userId));
  db.prepare(`INSERT INTO job_events (id, job_id, from_status, to_status, actor_type, actor_id) VALUES (?, ?, NULL, 'ASSIGNED', 'SYSTEM', NULL)`
    .run(uuid(), jobId));

  res.json({ message: 'Job accepted', status: 'ASSIGNED' });
});

// Update job status (driver actions)
router.post('/jobs/:id/status', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { id: jobId } = req.params;
  const { status, lat, lng, notes } = req.body;

  const validStatuses = [
    'EN_ROUTE_TO_PICKUP', 'AT_PICKUP', 'PICKED_UP',
    'EN_ROUTE_TO_DROPOFF', 'AT_DROPOFF', 'DELIVERED'
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const profile = db.prepare('SELECT id FROM driver_profiles WHERE user_id = ?').get(req.user.userId) as any;
  if (!profile) return res.status(404).json({ error: 'Driver profile not found' });

  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND driver_id = ?').get(jobId, profile.id) as any;
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const prevStatus = job.status;
  const updateData: any = { status };
  if (status === 'DELIVERED') {
    updateData.actual_delivery_time = new Date().toISOString();
  }

  const sets = Object.entries(updateData).map(([k]) => `${k} = ?`).join(', ');
  db.prepare(`UPDATE jobs SET ${sets}, updated_at = datetime('now') WHERE id = ?`)
    .run(...Object.values(updateData), jobId);

  db.prepare(`INSERT INTO job_events (id, job_id, from_status, to_status, actor_type, actor_id, lat, lng) VALUES (?, ?, ?, ?, 'DRIVER', ?, ?, ?)`
    .run(uuid(), jobId, prevStatus, status, req.user.userId, lat || null, lng || null));

  res.json({ message: 'Status updated', status });
});

// Get earnings
router.get('/earnings', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.prepare('SELECT * FROM driver_profiles WHERE user_id = ?').get(req.user.userId) as any;
  if (!profile) return res.status(404).json({ error: 'Driver profile not found' });

  const jobs = db.prepare(`
    SELECT j.id, j.price, j.driver_earnings, j.status, j.actual_delivery_time, j.created_at
    FROM jobs j WHERE j.driver_id = ? AND j.status IN ('COMPLETED','ASSIGNED','EN_ROUTE_TO_PICKUP','AT_PICKUP','PICKED_UP','EN_ROUTE_TO_DROPOFF','AT_DROPOFF','DELIVERED')
    ORDER BY j.created_at DESC LIMIT 30
  `).all(profile.id);

  res.json({ profile, recentJobs: jobs });
});

// Admin: list all drivers
router.get('/admin/list', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  if (req.user.role !== 'MANAGER_ADMIN' && req.user.role !== 'SUPPORT_ADMIN') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const drivers = db.prepare(`
    SELECT dp.*, u.name, u.email, u.phone, u.created_at as user_created_at
    FROM driver_profiles dp
    JOIN users u ON dp.user_id = u.id
    ORDER BY dp.created_at DESC
  `).all();
  res.json(drivers);
});

// Admin: approve/reject driver
router.post('/admin/:id/approve', (req: AuthRequest, res: Response) => {
  if (!req.user || req.user.role !== 'MANAGER_ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { status } = req.body;
  if (!['APPROVED', 'REJECTED'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE driver_profiles SET approval_status = ?, updated_at = datetime("now") WHERE id = ?')
    .run(status, req.params.id);

  // Audit
  db.prepare(`INSERT INTO audit_logs (id, admin_id, action, entity_type, entity_id, new_value) VALUES (?, ?, ?, 'driver_profiles', ?, ?)`
    .run(uuid(), req.user.userId, `DRIVER_${status}`, req.params.id, JSON.stringify({ status })));

  res.json({ message: `Driver ${status.toLowerCase()}` });
});

export default router;
