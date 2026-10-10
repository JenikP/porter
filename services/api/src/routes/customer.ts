import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { db } from '../db';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Customer profile
router.get('/profile', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const profile = db.prepare(`
    SELECT cp.*, u.name, u.email, u.phone
    FROM customer_profiles cp
    JOIN users u ON cp.user_id = u.id
    WHERE cp.user_id = ?
  `).get(req.user.userId) as any;
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  const addresses = db.prepare('SELECT * FROM saved_addresses WHERE customer_profile_id = ?').all(profile.id);
  res.json({ ...profile, addresses });
});

// Update profile (business)
router.put('/profile', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { name, businessName, abn, type } = req.body;

  if (name) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user.userId);
  if (businessName || abn) {
    db.prepare(`UPDATE customer_profiles SET business_name = ?, abn = ?, updated_at = datetime('now') WHERE user_id = ?`)
      .run(businessName || null, abn || null, req.user.userId);
  }

  res.json({ message: 'Profile updated' });
});

// Rate driver
router.post('/jobs/:id/rate', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { stars, comment } = req.body;
  if (!stars || stars < 1 || stars > 5) return res.status(400).json({ error: 'Invalid stars' });

  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND customer_id = ?').get(req.params.id, req.user.userId) as any;
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (!['DELIVERED', 'COMPLETED', 'DISPUTED', 'RESOLVED'].includes(job.status)) {
    return res.status(400).json({ error: 'Cannot rate yet' });
  }

  const existing = db.prepare('SELECT id FROM ratings WHERE job_id = ? AND rater_type = ?').get(req.params.id, 'CUSTOMER');
  if (existing) return res.status(409).json({ error: 'Already rated' });

  const ratingId = uuid();
  db.prepare(`INSERT INTO ratings (id, job_id, rater_type, rater_id, target_id, stars, comment) VALUES (?, ?, 'CUSTOMER', ?, ?, ?, ?)`
    .run(ratingId, req.params.id, req.user.userId, job.driver_id, stars, comment || null));

  db.prepare('UPDATE jobs SET customer_rating_id = ? WHERE id = ?').run(ratingId, req.params.id);
  res.json({ message: 'Rating submitted', id: ratingId });
});

// Report issue
router.post('/jobs/:id/issue', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { reason, description, photos } = req.body;
  const job = db.prepare('SELECT * FROM jobs WHERE id = ? AND customer_id = ?').get(req.params.id, req.user.userId) as any;
  if (!job) return res.status(404).json({ error: 'Job not found' });

  if (job.dispute_id) {
    return res.status(400).json({ error: 'Dispute already exists' });
  }

  const disputeId = uuid();
  db.prepare(`INSERT INTO disputes (id, job_id, reason, description, customer_photos) VALUES (?, ?, ?, ?, ?)`
    .run(disputeId, req.params.id, reason, description, JSON.stringify(photos || [])));

  db.prepare('UPDATE jobs SET status = ?, dispute_id = ? WHERE id = ?').run('DISPUTED', disputeId, req.params.id);
  db.prepare(`INSERT INTO job_events (id, job_id, from_status, to_status, actor_type, actor_id) VALUES (?, ?, ?, 'DISPUTED', 'CUSTOMER', ?)`
    .run(uuid(), req.params.id, job.status, req.user.userId));

  res.status(201).json({ disputeId, message: 'Dispute created' });
});

// Saved addresses
router.post('/addresses', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { label, address, lat, lng, isDefault } = req.body;
  const profile = db.prepare('SELECT id FROM customer_profiles WHERE user_id = ?').get(req.user.userId) as any;
  if (!profile) return res.status(404).json({ error: 'Profile not found' });

  if (isDefault) {
    db.prepare('UPDATE saved_addresses SET is_default = 0 WHERE customer_profile_id = ?').run(profile.id);
  }

  const id = uuid();
  db.prepare(`INSERT INTO saved_addresses (id, customer_profile_id, label, address, lat, lng, is_default) VALUES (?, ?, ?, ?, ?, ?, ?)`
    .run(id, profile.id, label, address, lat, lng, isDefault ? 1 : 0));
  res.status(201).json({ id });
});

export default router;
