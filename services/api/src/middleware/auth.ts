import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { loadConfig } from '@porter/config';

export interface AuthPayload {
  userId: string;
  role: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.substring(7);
  try {
    const cfg = loadConfig();
    const payload = jwt.verify(token, cfg.jwtSecret) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export function generateToken(userId: string, role: string, email: string): string {
  const cfg = loadConfig();
  return jwt.sign({ userId, role, email }, cfg.jwtSecret, { expiresIn: cfg.jwtExpiresIn });
}
