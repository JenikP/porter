import { db } from '../db';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcryptjs';

export function seed() {
  console.log('Seeding database...');

  // Clear existing data
  db.exec('DELETE FROM sessions');
  db.exec('DELETE FROM audit_logs');
  db.exec('DELETE FROM notifications');
  db.exec('DELETE FROM disputes');
  db.exec('DELETE FROM ratings');
  db.exec('DELETE FROM payouts');
  db.exec('DELETE FROM refunds');
  db.exec('DELETE FROM payments');
  db.exec('DELETE FROM driver_offers');
  db.exec('DELETE FROM job_events');
  db.exec('DELETE FROM job_items');
  db.exec('DELETE FROM jobs');
  db.exec('DELETE FROM quotes');
  db.exec('DELETE FROM vehicles');
  db.exec('DELETE FROM driver_documents');
  db.exec('DELETE FROM driver_profiles');
  db.exec('DELETE FROM customer_profiles');
  db.exec('DELETE FROM saved_addresses');
  db.exec('DELETE FROM users');
  db.exec('DELETE FROM rate_cards');

  const now = new Date().toISOString();

  // === RATE CARD ===
  const rateCardId = uuid();
  db.prepare(`
    INSERT INTO rate_cards (id, version, effective_from, is_active, created_by,
      base_fare_bike_or_car, base_fare_van_or_ute, per_km_rate, per_minute_rate,
      flexible_window_multiplier, within_3_hours_multiplier, within_1_hour_multiplier,
      stairs_per_flight, helper_charge, free_waiting_minutes, waiting_per_minute,
      min_price_bike_or_car, min_price_van_or_ute, commission_percent, service_area_name)
    VALUES (?, 1, ?, 1, NULL,
      8.00, 15.00, 1.80, 0.50,
      0.85, 1.00, 1.50,
      3.00, 25.00, 5, 1.00,
      15.00, 25.00, 20.00, 'Footscray-CBD-Richmond')
  `).run(rateCardId, now);

  // === USERS ===
  const pwHash = bcrypt.hashSync('password123', 10);

  const customerUserId = uuid();
  const businessUserId = uuid();
  const driverUserId1 = uuid();
  const driverUserId2 = uuid();
  const driverUserId3 = uuid();
  const pendingDriverId = uuid();
  const supportAdminId = uuid();
  const managerAdminId = uuid();

  // Consumer customer
  db.prepare(`INSERT INTO users (id, email, phone, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    .run(customerUserId, 'sam.marketplace@example.com', '+61412345678', pwHash, 'Sam Morrison', 'CUSTOMER', now));

  // Business customer — furniture store in Richmond
  db.prepare(`INSERT INTO users (id, email, phone, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    .run(businessUserId, 'jo@richmondfurnitures.com', '+61422345678', pwHash, 'Jo Di Stefano', 'CUSTOMER', now));

  // Approved driver — Dan with van/ute
  db.prepare(`INSERT INTO users (id, email, phone, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    .run(driverUserId1, 'dan.driver@example.com', '+61433334444', pwHash, 'Dan Kowalski', 'DRIVER', now));

  // Approved driver — Nina with bike/car
  db.prepare(`INSERT INTO users (id, email, phone, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    .run(driverUserId2, 'nina.driver@example.com', '+61433335555', pwHash, 'Nina Patel', 'DRIVER', now));

  // Approved driver — expired document
  db.prepare(`INSERT INTO users (id, email, phone, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    .run(driverUserId3, 'alex.driver@example.com', '+61433336666', pwHash, 'Alex Turner', 'DRIVER', now));

  // Pending driver
  db.prepare(`INSERT INTO users (id, email, phone, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    .run(pendingDriverId, 'mike.pending@example.com', '+61433337777', pwHash, 'Mike Reynolds', 'DRIVER', now));

  // Support admin
  db.prepare(`INSERT INTO users (id, email, phone, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    .run(supportAdminId, 'support@porter.delivery', '+61440000001', pwHash, 'Casey Morgan', 'SUPPORT_ADMIN', now));

  // Manager admin
  db.prepare(`INSERT INTO users (id, email, phone, password_hash, name, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
    .run(managerAdminId, 'admin@porter.delivery', '+61440000002', pwHash, 'Riley Chen', 'MANAGER_ADMIN', now));

  // === CUSTOMER PROFILES ===
  const customerProfileId = uuid();
  const businessProfileId = uuid();

  db.prepare(`INSERT INTO customer_profiles (id, user_id, type, created_at) VALUES (?, ?, 'CONSUMER', ?)`
    .run(customerProfileId, customerUserId, now));
  db.prepare(`INSERT INTO customer_profiles (id, user_id, type, business_name, abn, created_at) VALUES (?, ?, 'BUSINESS', 'Richmond Furniture Co.', 12345678912, ?)`
    .run(businessProfileId, businessUserId, now));

  // === DRIVER PROFILES ===
  const driverProfileId1 = uuid();
  const driverProfileId2 = uuid();
  const driverProfileId3 = uuid();
  const pendingDriverProfileId = uuid();

  db.prepare(`INSERT INTO driver_profiles (id, user_id, approval_status, is_online, rating, total_jobs, payout_balance, bank_name, account_number, bsb, created_at) VALUES (?, ?, 'APPROVED', 1, 4.8, 127, 385.50, 'Commonwealth Bank', '43215678', '062000', ?)`
    .run(driverProfileId1, driverUserId1, now));
  db.prepare(`INSERT INTO driver_profiles (id, user_id, approval_status, is_online, rating, total_jobs, payout_balance, bank_name, account_number, bsb, created_at) VALUES (?, ?, 'APPROVED', 0, 4.6, 83, 142.00, 'ANZ', '98765432', '013000', ?)`
    .run(driverProfileId2, driverUserId2, now));
  db.prepare(`INSERT INTO driver_profiles (id, user_id, approval_status, is_online, rating, total_jobs, payout_balance, bank_name, account_number, bsb, created_at) VALUES (?, ?, 'APPROVED', 0, 4.9, 201, 0, 'Westpac', '11223344', '032000', ?)`
    .run(driverProfileId3, driverUserId3, now));
  db.prepare(`INSERT INTO driver_profiles (id, user_id, approval_status, is_online, rating, total_jobs, payout_balance, bank_name, account_number, bsb, created_at) VALUES (?, ?, 'PENDING', 0, 0, 0, 0, '', '', '', ?)`
    .run(pendingDriverProfileId, pendingDriverId, now));

  // === VEHICLES ===
  const vehicleId1 = uuid();
  const vehicleId2 = uuid();
  const vehicleId3 = uuid();

  db.prepare(`INSERT INTO vehicles (id, driver_id, type, make, model, year, plate, is_default) VALUES (?, ?, 'VAN_OR_UTE', 'Toyota', 'HiAce', 2021, 'ABC-123', 1)`
    .run(vehicleId1, driverProfileId1));
  db.prepare(`INSERT INTO vehicles (id, driver_id, type, make, model, year, plate, is_default) VALUES (?, ?, 'BIKE_OR_CAR', 'Honda', 'CBR600', 2022, 'XYZ-789', 1)`
    .run(vehicleId2, driverProfileId2));
  db.prepare(`INSERT INTO vehicles (id, driver_id, type, make, model, year, plate, is_default) VALUES (?, ?, 'VAN_OR_UTE', 'Ford', 'Transit', 2020, 'DEF-456', 1)`
    .run(vehicleId3, driverProfileId3));

  // === DRIVER DOCUMENTS ===
  // Dan — all approved
  db.prepare(`INSERT INTO driver_documents (id, driver_id, type, file_url, status, expiry_date, reviewed_at) VALUES (?, ?, 'LICENCE', '/uploads/dan-licence.jpg', 'APPROVED', '2027-06-01', ?)`
    .run(uuid(), driverProfileId1, now));
  db.prepare(`INSERT INTO driver_documents (id, driver_id, type, file_url, status, expiry_date, reviewed_at) VALUES (?, ?, 'INSURANCE', '/uploads/dan-insurance.jpg', 'APPROVED', '2026-12-31', ?)`
    .run(uuid(), driverProfileId1, now));

  // Alex — expired document
  db.prepare(`INSERT INTO driver_documents (id, driver_id, type, file_url, status, expiry_date, reviewed_at) VALUES (?, ?, 'LICENCE', '/uploads/alex-licence.jpg', 'EXPIRED', '2026-01-01', ?)`
    .run(uuid(), driverProfileId3, now));
  db.prepare(`INSERT INTO driver_documents (id, driver_id, type, file_url, status, expiry_date, reviewed_at) VALUES (?, ?, 'INSURANCE', '/uploads/alex-insurance.jpg', 'APPROVED', '2027-03-15', ?)`
    .run(uuid(), driverProfileId3, now));

  // Pending driver — all pending
  db.prepare(`INSERT INTO driver_documents (id, driver_id, type, file_url, status) VALUES (?, ?, 'LICENCE', '/uploads/mike-licence.jpg', 'PENDING')`
    .run(uuid(), pendingDriverProfileId));
  db.prepare(`INSERT INTO driver_documents (id, driver_id, type, file_url, status) VALUES (?, ?, 'INSURANCE', '/uploads/mike-insurance.jpg', 'PENDING')`
    .run(uuid(), pendingDriverProfileId));

  // === SAMPLE JOBS ===
  const makeJob = (id: string, customerId: string, status: string, driverId: string | null, address: string, dropoff: string, price: number, created: string) => {
    db.prepare(`
      INSERT INTO jobs (id, customer_id, driver_id, status, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng,
        vehicle_class, time_option, stairs, helper_required, price, commission, driver_earnings, payment_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'VAN_OR_UTE', 'WITHIN_3_HOURS', 0, 0, ?, ?, ?, NULL, ?)
    `).run(id, customerId, driverId, status, address, -37.8136, 144.9631, dropoff, -37.8184, 144.9672, price, price * 0.2, price * 0.8, created);
  };

  // Completed job — Richmond to Footscray couch delivery
  const job1Id = uuid();
  makeJob(job1Id, businessUserId, 'COMPLETED', driverProfileId1,
    '12 Swan St, Richmond VIC 3121',
    '45 Irving St, Footscray VIC 3011',
    51, new Date(Date.now() - 86400000 * 3).toISOString());

  db.prepare(`INSERT INTO job_items (id, job_id, description, size, weight_kg, quantity, photos) VALUES (?, ?, 'Three-seater couch, charcoal fabric', 'LARGE', 45, 1, '[]')`)
    .run(uuid(), job1Id);

  // Active job — searching
  const job2Id = uuid();
  makeJob(job2Id, customerUserId, 'SEARCHING', null,
    '88 Bourke St, Melbourne VIC 3000',
    '32 Church St, Richmond VIC 3121',
    41, new Date(Date.now() - 600000).toISOString());

  db.prepare(`INSERT INTO job_items (id, job_id, description, size, weight_kg, quantity, photos) VALUES (?, ?, 'Dining table (disassembled)', 'LARGE', 30, 1, '[]')`)
    .run(uuid(), job2Id);

  // Assigned job
  const job3Id = uuid();
  makeJob(job3Id, businessUserId, 'ASSIGNED', driverProfileId1,
    '5 High St, Prahran VIC 3181',
    '88 Bourke St, Melbourne VIC 3000',
    51, new Date(Date.now() - 300000).toISOString());

  db.prepare(`INSERT INTO job_items (id, job_id, description, size, weight_kg, quantity, photos) VALUES (?, ?, 'Antique wardrobe', 'BULKY', 80, 1, '[]')`)
    .run(uuid(), job3Id);

  // At pickup
  const job4Id = uuid();
  makeJob(job4Id, customerUserId, 'AT_PICKUP', driverProfileId2,
    '12 Swan St, Richmond VIC 3121',
    '56A Victoria St, Footscray VIC 3011',
    41, new Date(Date.now() - 900000).toISOString());

  db.prepare(`INSERT INTO job_items (id, job_id, description, size, weight_kg, quantity, photos) VALUES (?, ?, 'Espresso machine + accessories', 'MEDIUM', 18, 1, '[]')`)
    .run(uuid(), job4Id);

  // Disputed job
  const job5Id = uuid();
  const disputeId = uuid();
  makeJob(job5Id, customerUserId, 'DISPUTED', driverProfileId2,
    '200 Chapel St, Prahran VIC 3181',
    '45 Irving St, Footscray VIC 3011',
    51, new Date(Date.now() - 86400000).toISOString());

  db.prepare(`INSERT INTO disputes (id, job_id, reason, description, status, customer_photos) VALUES (?, ?, 'DAMAGE', 'Corner of the bookshelf was chipped during transport. Photos attached.', 'UNDER_REVIEW', '[]')`)
    .run(disputeId, job5Id);

  db.prepare(`UPDATE jobs SET dispute_id = ? WHERE id = ?`).run(disputeId, job5Id);

  // Unmatched job
  const job6Id = uuid();
  makeJob(job6Id, customerUserId, 'UNMATCHED', null,
    '1 Spring St, Melbourne VIC 3000',
    '99 Lygon St, Carlton VIC 3053',
    41, new Date(Date.now() - 1800000).toISOString());

  // Cancelled job
  const job7Id = uuid();
  makeJob(job7Id, customerUserId, 'CANCELLED', null,
    '100 Collins St, Melbourne VIC 3000',
    '15 Acland St, St Kilda VIC 3182',
    41, new Date(Date.now() - 3600000).toISOString());

  // === RATINGS ===
  db.prepare(`INSERT INTO ratings (id, job_id, rater_type, rater_id, target_id, stars, comment, created_at) VALUES (?, ?, 'CUSTOMER', ?, ?, 5, 'Dan was careful with the furniture and on time.', ?)`
    .run(uuid(), job1Id, customerUserId, driverUserId1, now);

  console.log('Seed complete.');
  console.log('Demo accounts (password: password123):');
  console.log('  Consumer:     sam.marketplace@example.com');
  console.log('  Business:     jo@richmondfurnitures.com');
  console.log('  Driver (van): dan.driver@example.com');
  console.log('  Driver (car): nina.driver@example.com');
  console.log('  Driver (exp): alex.driver@example.com');
  console.log('  Support admin: support@porter.delivery');
  console.log('  Manager admin: admin@porter.delivery');
}
