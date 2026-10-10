import express from 'express';
import cors from 'cors';
import { loadConfig } from '@porter/config';
import { runMigrations } from './db/migrate';
import { seed } from './seed';
import { errorHandler, notFound } from './middleware/error';
import { authMiddleware } from './middleware/auth';

import authRoutes from './routes/auth';
import jobsRoutes from './routes/jobs';
import driversRoutes from './routes/drivers';
import adminRoutes from './routes/admin';
import customerRoutes from './routes/customer';

const cfg = loadConfig();
const app = express();

app.use(cors({
  origin: [cfg.customerAppUrl, cfg.driverAppUrl, cfg.adminAppUrl],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/jobs', authMiddleware, jobsRoutes);
app.use('/api/drivers', authMiddleware, driversRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);
app.use('/api/customer', authMiddleware, customerRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', provider: cfg.paymentProvider, timestamp: new Date().toISOString() });
});

// Simulator endpoints (labeled as simulated)
app.get('/api/simulate/maps/routes', (_req, res) => {
  res.json({
    provider: 'simulator',
    disclaimer: 'This is simulated route data. Replace with real map provider credentials for production.',
    routes: [{ distance: 5.2, duration: 15, polyline: 'simulated' }]
  });
});

app.post('/api/simulate/payments/authorize', (req, res) => {
  res.json({
    provider: 'simulator',
    disclaimer: 'Payment simulation only — no real charges. Configure real payment provider for production.',
    authorized: true,
    amount: req.body.amount,
    simulationId: 'SIM-' + Date.now()
  });
});

app.post('/api/simulate/payments/capture', (req, res) => {
  res.json({
    provider: 'simulator',
    disclaimer: 'Payment simulation only.',
    captured: true,
    simulationId: req.body.simulationId
  });
});

app.post('/api/simulate/notifications/send', (req, res) => {
  res.json({
    provider: 'simulator',
    disclaimer: 'Notification simulation only.',
    sent: true,
    simulationId: 'SIM-NOTIF-' + Date.now()
  });
});

app.use(notFound);
app.use(errorHandler);

// Initialize
const PORT = cfg.port;

function init() {
  runMigrations();
  console.log('Database ready');
}

init();

app.listen(PORT, () => {
  console.log(`Porter API running on http://localhost:${PORT}`);
  console.log(`Environment: ${cfg.nodeEnv}`);
  console.log(`Payment provider: ${cfg.paymentProvider} (${cfg.paymentProvider === 'simulator' ? 'SIMULATED — configure real provider for production' : 'REAL'})`);
});

export default app;
