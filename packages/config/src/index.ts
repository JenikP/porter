const environment = (globalThis as unknown as { env?: Record<string, string | undefined> }).env ?? {};

export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiUrl: string;
  customerAppUrl: string;
  driverAppUrl: string;
  adminAppUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  paymentProvider: 'simulator' | 'stripe' | string;
  mapProvider: 'simulator' | 'google' | string;
  smsProvider: 'simulator' | 'twilio' | string;
  pushProvider: 'simulator' | 'firebase' | string;
  identityProvider: 'simulator' | 'checkr' | string;
  maxFileSizeMb: number;
  uploadDir: string;
  // Matching config
  matching: {
    offerTimeoutSeconds: number;
    maxSearchRadiusKm: number;
    radiusExpansionSteps: number[];
    urgentJobMaxSearchMinutes: number;
    flexibleJobMaxSearchMinutes: number;
  };
  // Pricing defaults (Zoom2u benchmarks — PROTOTYPE ONLY)
  pricingDefaults: {
    flexibleWindowMultiplier: number;
    within3HoursMultiplier: number;
    within1HourMultiplier: number;
    stairsPerFlight: number;
    helperCharge: number;
    freeWaitingMinutes: number;
    waitingPerMinute: number;
    minPriceBikeOrCar: number;
    minPriceVanOrUte: number;
    commissionPercent: number;
  };
  // Business rules
  business: {
    disputeWindowHours: number;
    cancellationFeePercent: number;
    maxItemValueAud: number;
    cancellationFreeBeforeAssigned: boolean;
  };
  // Pilot success thresholds (PROTOTYPE ASSUMPTIONS)
  pilot: {
    minCompletedJobs: number;
    minMatchRatePercent: number;
    minOnTimeRatePercent: number;
    maxDamageDisputeRatePercent: number;
    minRepeatRatePercent: number;
    minDriverWeeklyRetentionPercent: number;
    minCustomerRating: number;
    minDriverNetPerHour: number;
  };
}

export const defaultConfig: AppConfig = {
  nodeEnv: environment['NODE_ENV'] || 'development',
  port: parseInt(environment['PORT'] || '3001'),
  apiUrl: environment['API_URL'] || 'http://localhost:3001',
  customerAppUrl: environment['CUSTOMER_APP_URL'] || 'http://localhost:5173',
  driverAppUrl: environment['DRIVER_APP_URL'] || 'http://localhost:5174',
  adminAppUrl: environment['ADMIN_APP_URL'] || 'http://localhost:5175',
  jwtSecret: environment['JWT_SECRET'] || 'dev-secret-change-in-production',
  jwtExpiresIn: environment['JWT_EXPIRES_IN'] || '7d',
  paymentProvider: environment['PAYMENT_PROVIDER'] || 'simulator',
  mapProvider: environment['MAP_PROVIDER'] || 'simulator',
  smsProvider: environment['SMS_PROVIDER'] || 'simulator',
  pushProvider: environment['PUSH_PROVIDER'] || 'simulator',
  identityProvider: environment['IDENTITY_PROVIDER'] || 'simulator',
  maxFileSizeMb: parseInt(environment['MAX_FILE_SIZE_MB'] || '10'),
  uploadDir: environment['UPLOAD_DIR'] || './uploads',
  matching: {
    offerTimeoutSeconds: 30,
    maxSearchRadiusKm: 15,
    radiusExpansionSteps: [3, 5, 8, 12, 15],
    urgentJobMaxSearchMinutes: 10,
    flexibleJobMaxSearchMinutes: 60,
  },
  pricingDefaults: {
    flexibleWindowMultiplier: 0.85,
    within3HoursMultiplier: 1.0,
    within1HourMultiplier: 1.5,
    stairsPerFlight: 3.0,
    helperCharge: 25.0,
    freeWaitingMinutes: 5,
    waitingPerMinute: 1.0,
    minPriceBikeOrCar: 15.0,
    minPriceVanOrUte: 25.0,
    commissionPercent: 20,
  },
  business: {
    disputeWindowHours: 48,
    cancellationFeePercent: 50,
    maxItemValueAud: 5000,
    cancellationFreeBeforeAssigned: true,
  },
  pilot: {
    minCompletedJobs: 150,
    minMatchRatePercent: 85,
    minOnTimeRatePercent: 90,
    maxDamageDisputeRatePercent: 3,
    minRepeatRatePercent: 25,
    minDriverWeeklyRetentionPercent: 60,
    minCustomerRating: 4.5,
    minDriverNetPerHour: 25,
  },
};

export function loadConfig(): AppConfig {
  return defaultConfig;
}
