import { db } from './index';

const schema = `
-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('CUSTOMER','DRIVER','SUPPORT_ADMIN','MANAGER_ADMIN')),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Customer profiles
CREATE TABLE IF NOT EXISTS customer_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'CONSUMER' CHECK(type IN ('CONSUMER','BUSINESS')),
  business_name TEXT,
  abn TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Saved addresses
CREATE TABLE IF NOT EXISTS saved_addresses (
  id TEXT PRIMARY KEY,
  customer_profile_id TEXT NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  is_default INTEGER DEFAULT 0
);

-- Driver profiles
CREATE TABLE IF NOT EXISTS driver_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  approval_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(approval_status IN ('PENDING','APPROVED','REJECTED')),
  is_online INTEGER DEFAULT 0,
  is_suspended INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  total_jobs INTEGER DEFAULT 0,
  cancellation_count INTEGER DEFAULT 0,
  weekly_earnings REAL DEFAULT 0,
  payout_balance REAL DEFAULT 0,
  bank_name TEXT,
  account_number TEXT,
  bsb TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY,
  driver_id TEXT NOT NULL REFERENCES driver_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('BIKE_OR_CAR','VAN_OR_UTE')),
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  plate TEXT NOT NULL,
  photo_url TEXT,
  is_default INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Driver documents
CREATE TABLE IF NOT EXISTS driver_documents (
  id TEXT PRIMARY KEY,
  driver_id TEXT NOT NULL REFERENCES driver_profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('IDENTITY','LICENCE','VEHICLE_REGISTRATION','INSURANCE','ABN','OTHER')),
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','REJECTED','EXPIRED','ACTION_REQUIRED')),
  expiry_date TEXT,
  reviewed_by TEXT,
  review_notes TEXT,
  reviewed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Rate cards
CREATE TABLE IF NOT EXISTS rate_cards (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  is_active INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  -- Rate values
  base_fare_bike_or_car REAL NOT NULL,
  base_fare_van_or_ute REAL NOT NULL,
  per_km_rate REAL NOT NULL,
  per_minute_rate REAL NOT NULL,
  flexible_window_multiplier REAL NOT NULL,
  within_3_hours_multiplier REAL NOT NULL,
  within_1_hour_multiplier REAL NOT NULL,
  stairs_per_flight REAL NOT NULL,
  helper_charge REAL NOT NULL,
  free_waiting_minutes INTEGER NOT NULL,
  waiting_per_minute REAL NOT NULL,
  min_price_bike_or_car REAL NOT NULL,
  min_price_van_or_ute REAL NOT NULL,
  commission_percent REAL NOT NULL,
  service_area_name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Jobs
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES users(id),
  driver_id TEXT REFERENCES driver_profiles(id),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK(status IN (
    'DRAFT','QUOTED','BOOKED','SEARCHING','ASSIGNED','EN_ROUTE_TO_PICKUP','AT_PICKUP',
    'PICKED_UP','EN_ROUTE_TO_DROPOFF','AT_DROPOFF','DELIVERED','COMPLETED',
    'CANCELLED','UNMATCHED','DISPUTED','RESOLVED'
  )),
  pickup_address TEXT NOT NULL,
  pickup_lat REAL NOT NULL,
  pickup_lng REAL NOT NULL,
  pickup_notes TEXT,
  dropoff_address TEXT NOT NULL,
  dropoff_lat REAL NOT NULL,
  dropoff_lng REAL NOT NULL,
  dropoff_notes TEXT,
  recipient_name TEXT,
  recipient_phone TEXT,
  recipient_code TEXT,
  vehicle_class TEXT NOT NULL CHECK(vehicle_class IN ('BIKE_OR_CAR','VAN_OR_UTE')),
  time_option TEXT NOT NULL CHECK(time_option IN ('FLEXIBLE_WINDOW','WITHIN_3_HOURS','WITHIN_1_HOUR')),
  stairs INTEGER DEFAULT 0,
  helper_required INTEGER DEFAULT 0,
  quote_id TEXT,
  price REAL NOT NULL,
  commission REAL NOT NULL,
  driver_earnings REAL NOT NULL,
  payment_id TEXT,
  dispute_id TEXT,
  customer_rating_id TEXT,
  driver_rating_id TEXT,
  admin_notes TEXT,
  estimated_distance_km REAL,
  estimated_duration_minutes REAL,
  scheduled_pickup_window_start TEXT,
  scheduled_pickup_window_end TEXT,
  actual_pickup_time TEXT,
  actual_delivery_time TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Job items
CREATE TABLE IF NOT EXISTS job_items (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  size TEXT NOT NULL CHECK(size IN ('ENVELOPE','SMALL','MEDIUM','LARGE','BULKY')),
  weight_kg REAL,
  quantity INTEGER DEFAULT 1,
  photos TEXT DEFAULT '[]',
  notes TEXT
);

-- Job events (audit trail)
CREATE TABLE IF NOT EXISTS job_events (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK(actor_type IN ('CUSTOMER','DRIVER','ADMIN','SYSTEM')),
  actor_id TEXT,
  metadata TEXT DEFAULT '{}',
  lat REAL,
  lng REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Driver offers
CREATE TABLE IF NOT EXISTS driver_offers (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  driver_id TEXT NOT NULL REFERENCES driver_profiles(id),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','ACCEPTED','DECLINED','TIMED_OUT')),
  earnings REAL NOT NULL,
  offered_at TEXT DEFAULT (datetime('now')),
  responded_at TEXT,
  expires_at TEXT NOT NULL
);

-- Quotes
CREATE TABLE IF NOT EXISTS quotes (
  id TEXT PRIMARY KEY,
  customer_id TEXT NOT NULL REFERENCES users(id),
  pickup_address TEXT NOT NULL,
  dropoff_address TEXT NOT NULL,
  vehicle_class TEXT NOT NULL,
  time_option TEXT NOT NULL,
  stairs INTEGER DEFAULT 0,
  helper_required INTEGER DEFAULT 0,
  distance_km REAL NOT NULL,
  duration_minutes REAL NOT NULL,
  price REAL NOT NULL,
  price_breakdown TEXT NOT NULL,
  rate_card_version_id TEXT,
  expires_at TEXT NOT NULL,
  valid_until TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  customer_id TEXT NOT NULL REFERENCES users(id),
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','AUTHORIZED','CAPTURED','FAILED','REFUNDED','PARTIALLY_REFUNDED')),
  provider TEXT NOT NULL DEFAULT 'simulator',
  provider_payment_id TEXT,
  authorized_at TEXT,
  captured_at TEXT,
  refunded_at TEXT,
  refund_amount REAL,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Refunds
CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL REFERENCES payments(id),
  job_id TEXT NOT NULL REFERENCES jobs(id),
  amount REAL NOT NULL,
  reason TEXT NOT NULL,
  processed_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Payouts
CREATE TABLE IF NOT EXISTS payouts (
  id TEXT PRIMARY KEY,
  driver_id TEXT NOT NULL REFERENCES driver_profiles(id),
  amount REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','PROCESSING','COMPLETED','FAILED')),
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  jobs_included TEXT DEFAULT '[]',
  processed_at TEXT,
  provider_payout_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Ratings
CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  rater_type TEXT NOT NULL CHECK(rater_type IN ('CUSTOMER','DRIVER')),
  rater_id TEXT NOT NULL,
  target_id TEXT NOT NULL,
  stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(job_id, rater_type)
);

-- Disputes
CREATE TABLE IF NOT EXISTS disputes (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL UNIQUE REFERENCES jobs(id),
  reason TEXT NOT NULL CHECK(reason IN ('DAMAGE','LATENESS','BEHAVIOUR','WRONG_ITEM','FAILED_PICKUP','FAILED_DELIVERY','OTHER')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN','UNDER_REVIEW','RESOLVED')),
  customer_photos TEXT DEFAULT '[]',
  admin_notes TEXT,
  decision TEXT,
  refund_amount REAL,
  driver_deduction REAL,
  resolved_by TEXT,
  resolved_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  channel TEXT NOT NULL DEFAULT 'IN_APP' CHECK(channel IN ('PUSH','SMS','EMAIL','IN_APP')),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data TEXT DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','SENT','FAILED')),
  sent_at TEXT,
  failure_reason TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  ip_address TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
  id TEXT PRIMARY KEY,
  event TEXT NOT NULL,
  user_id TEXT,
  job_id TEXT,
  metadata TEXT DEFAULT '{}',
  timestamp TEXT DEFAULT (datetime('now'))
);

-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jobs_customer ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_driver ON jobs(driver_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_driver_offers_job ON driver_offers(job_id);
CREATE INDEX IF NOT EXISTS idx_driver_offers_driver ON driver_offers(driver_id);
CREATE INDEX IF NOT EXISTS idx_ratings_target ON ratings(target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
`;

export function runMigrations() {
  db.exec(schema);
  console.log('Migrations complete');
}
