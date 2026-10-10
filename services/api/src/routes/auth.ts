import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db';
import { generateToken } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { email, phone, password, name, role } = req.body;
  if (!password || !name || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!['CUSTOMER', 'DRIVER'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE email = ? OR phone = ?')
    .get(email || '', phone || '');
  if (existing) {
    return res.status(409).json({ error: 'Account already exists' });
  }
  const { v4: uuid } = await import('uuid');
  const userId = uuid();
  const passwordHash = bcrypt.hashSync(password, 10);
  db.prepare(`INSERT INTO users (id, email, phone, password_hash, name, role) VALUES (?, ?, ?, ?, ?, ?)`
    .run(userId, email || null, phone || null, passwordHash, name, role));

  if (role === 'CUSTOMER') {
    const { v4: uuid } = await import('uuid');
    db.prepare(`INSERT INTO customer_profiles (id, user_id, type) VALUES (?, ?, 'CONSUMER')`)
      .run(uuid(), userId);
  } else if (role === 'DRIVER') {
    const { v4: uuid } = await import('uuid');
    db.prepare(`INSERT INTO driver_profiles (id, user_id, approval_status) VALUES (?, ?, 'PENDING')`)
      .run(uuid(), userId);
  }

  const token = generateToken(userId, role, email || phone || '');
  res.status(201).json({ token, userId, role });
});

router.post('/login', (req: Request, res: Response) => {
  const { email, phone, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ? OR phone = ?')
    .get(email || '', phone || '') as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = generateToken(user.id, user.role, user.email || user.phone || '');
  res.json({ token, userId: user.id, role: user.role, name: user.name, email: user.email });
});

router.get('/me', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const user = db.prepare('SELECT id, email, phone, name, role, created_at FROM users WHERE id = ?')
    .get(req.user.userId) as any;
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.delete('/account', (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  db.prepare('DELETE FROM users WHERE id = ?').run(req.user.userId);
  res.json({ message: 'Account deleted' });
});

export default router;
