import type {
  AuditLog,
  CustomerProfile,
  Dispute,
  DriverDocument,
  DriverOffer,
  DriverProfile,
  Job,
  JobEvent,
  JobItem,
  Notification,
  Payment,
  Payout,
  Quote,
  RateCard,
  Rating,
  Vehicle,
} from '@porter/shared';

export type JobProofType = 'pickup' | 'delivery';

export interface JobProof {
  id: string;
  jobId: string;
  type: JobProofType;
  label: string;
  photoUrl: string;
  note?: string;
  createdAt: Date;
}

export type MockPlatformState = {
  demoSettings?: { connection: 'online' | 'slow' | 'offline' };
  customers: CustomerProfile[];
  drivers: DriverProfile[];
  vehicles: Vehicle[];
  jobs: Job[];
  jobItems: JobItem[];
  jobEvents: JobEvent[];
  quotes: Quote[];
  driverOffers: DriverOffer[];
  rateCards: RateCard[];
  payments: Payment[];
  payouts: Payout[];
  disputes: Dispute[];
  ratings: Rating[];
  notifications: Notification[];
  driverDocuments: DriverDocument[];
  jobProofs: JobProof[];
  auditLogs: AuditLog[];
};

export const DEMO_CUSTOMER_ID = 'customer_001';
export const DEMO_CUSTOMER_USER_ID = 'user_customer_001';
export const DEMO_DRIVER_ID = 'driver_001';
export const DEMO_DRIVER_2_ID = 'driver_002';
export const DEMO_ADMIN_ID = 'admin_001';
