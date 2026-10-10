// ============================================================
// PORTER SHARED TYPES — Source of truth for all applications
// ============================================================

// --- Enums ---

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  DRIVER = 'DRIVER',
  SUPPORT_ADMIN = 'SUPPORT_ADMIN',
  MANAGER_ADMIN = 'MANAGER_ADMIN',
}

export enum JobStatus {
  DRAFT = 'DRAFT',
  QUOTED = 'QUOTED',
  BOOKED = 'BOOKED',
  SEARCHING = 'SEARCHING',
  ASSIGNED = 'ASSIGNED',
  EN_ROUTE_TO_PICKUP = 'EN_ROUTE_TO_PICKUP',
  AT_PICKUP = 'AT_PICKUP',
  PICKED_UP = 'PICKED_UP',
  EN_ROUTE_TO_DROPOFF = 'EN_ROUTE_TO_DROPOFF',
  AT_DROPOFF = 'AT_DROPOFF',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  UNMATCHED = 'UNMATCHED',
  DISPUTED = 'DISPUTED',
  RESOLVED = 'RESOLVED',
}

export enum TimeOption {
  FLEXIBLE_WINDOW = 'FLEXIBLE_WINDOW',
  WITHIN_3_HOURS = 'WITHIN_3_HOURS',
  WITHIN_1_HOUR = 'WITHIN_1_HOUR',
}

export enum VehicleClass {
  BIKE_OR_CAR = 'BIKE_OR_CAR',
  VAN_OR_UTE = 'VAN_OR_UTE',
}

export enum ItemSize {
  ENVELOPE = 'ENVELOPE',
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  BULKY = 'BULKY',
}

export enum DocumentType {
  IDENTITY = 'IDENTITY',
  LICENCE = 'LICENCE',
  VEHICLE_REGISTRATION = 'VEHICLE_REGISTRATION',
  INSURANCE = 'INSURANCE',
  ABN = 'ABN',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
}

export enum DriverApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
}

export enum DisputeReason {
  DAMAGE = 'DAMAGE',
  LATENESS = 'LATENESS',
  BEHAVIOUR = 'BEHAVIOUR',
  WRONG_ITEM = 'WRONG_ITEM',
  FAILED_PICKUP = 'FAILED_PICKUP',
  FAILED_DELIVERY = 'FAILED_DELIVERY',
  OTHER = 'OTHER',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  CAPTURED = 'CAPTURED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum NotificationChannel {
  PUSH = 'PUSH',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  IN_APP = 'IN_APP',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  TIMED_OUT = 'TIMED_OUT',
}

// --- Interfaces ---

export interface User {
  id: string;
  email?: string;
  phone?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerProfile {
  name?: string;
  email?: string;
  phone?: string;
  notificationsEnabled?: boolean;
  accountFlag?: string;
  deletionRequested?: boolean;
  id: string;
  userId: string;
  type: 'CONSUMER' | 'BUSINESS';
  businessName?: string;
  abn?: string;
  savedAddresses: SavedAddress[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SavedAddress {
  label: string;
  address: string;
  lat: number;
  lng: number;
  isDefault: boolean;
}

export interface DriverProfile {
  name?: string;
  phone?: string;
  email?: string;
  abn?: string;
  identityNumber?: string;
  termsAccepted?: boolean;
  id: string;
  userId: string;
  approvalStatus: DriverApprovalStatus;
  isOnline: boolean;
  isSuspended: boolean;
  rating: number;
  totalJobs: number;
  cancellationCount: number;
  weeklyEarnings: number;
  payoutBalance: number;
  bankName: string;
  accountNumber: string;
  bsb: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Vehicle {
  id: string;
  driverId: string;
  type: VehicleClass;
  make: string;
  model: string;
  year: number;
  plate: string;
  photoUrl?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DriverDocument {
  id: string;
  driverId: string;
  type: DocumentType;
  fileUrl: string;
  status: DocumentStatus;
  expiryDate?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Job {
  id: string;
  customerId: string;
  driverId?: string;
  status: JobStatus;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  pickupNotes?: string;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffNotes?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientCode?: string;
  vehicleClass: VehicleClass;
  timeOption: TimeOption;
  stairs: number;
  helperRequired: boolean;
  quoteId: string;
  price: number;
  commission: number;
  driverEarnings: number;
  paymentId?: string;
  disputeId?: string;
  customerRatingId?: string;
  driverRatingId?: string;
  adminNotes?: string;
  estimatedDistanceKm?: number;
  estimatedDurationMinutes?: number;
  scheduledPickupWindowStart?: Date;
  scheduledPickupWindowEnd?: Date;
  actualPickupTime?: Date;
  actualDeliveryTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobItem {
  id: string;
  jobId: string;
  description: string;
  size: ItemSize;
  weightKg?: number;
  quantity: number;
  photos: string[];
  notes?: string;
}

export interface JobEvent {
  id: string;
  jobId: string;
  fromStatus: JobStatus | null;
  toStatus: JobStatus;
  actorType: 'CUSTOMER' | 'DRIVER' | 'ADMIN' | 'SYSTEM';
  actorId?: string;
  metadata?: Record<string, unknown>;
  lat?: number;
  lng?: number;
  createdAt: Date;
}

export interface DriverOffer {
  id: string;
  jobId: string;
  driverId: string;
  status: OfferStatus;
  earnings: number;
  offeredAt: Date;
  respondedAt?: Date;
  expiresAt: Date;
}

export interface Quote {
  id: string;
  customerId: string;
  pickupAddress: string;
  dropoffAddress: string;
  vehicleClass: VehicleClass;
  timeOption: TimeOption;
  stairs: number;
  helperRequired: boolean;
  distanceKm: number;
  durationMinutes: number;
  price: number;
  priceBreakdown: PriceBreakdown;
  rateCardVersionId: string;
  expiresAt: Date;
  validUntil: Date;
  createdAt: Date;
}

export interface PriceBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  urgencyMultiplier: number;
  stairsCharge: number;
  helperCharge: number;
  waitingCharge: number;
  subtotal: number;
  commission: number;
  total: number;
}

export interface RateCard {
  id: string;
  version: number;
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  createdBy: string;
  values: RateCardValues;
  createdAt: Date;
  updatedAt: Date;
}

export interface RateCardValues {
  // Base fares by vehicle class
  baseFareBikeOrCar: number;
  baseFareVanOrUte: number;
  // Per-km rate
  perKmRate: number;
  // Per-minute rate
  perMinuteRate: number;
  // Time multipliers
  flexibleWindowMultiplier: number;   // e.g. 0.80
  within3HoursMultiplier: number;     // e.g. 1.00
  within1HourMultiplier: number;      // e.g. 1.50
  // Add-on charges
  stairsPerFlight: number;
  helperCharge: number;
  // Waiting
  freeWaitingMinutes: number;
  waitingPerMinute: number;
  // Minimum prices
  minPriceBikeOrCar: number;
  minPriceVanOrUte: number;
  // Service area
  serviceAreaName: string;
  serviceAreaPolygon: [number, number][]; // lat/lng pairs
  // Commission
  commissionPercent: number;
}

export interface Payment {
  id: string;
  jobId: string;
  customerId: string;
  amount: number;
  status: PaymentStatus;
  provider: string; // 'simulator', 'stripe', etc.
  providerPaymentId?: string;
  authorizedAt?: Date;
  capturedAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Refund {
  id: string;
  paymentId: string;
  jobId: string;
  amount: number;
  reason: string;
  processedBy: string;
  createdAt: Date;
}

export interface Payout {
  id: string;
  driverId: string;
  amount: number;
  status: PayoutStatus;
  periodStart: Date;
  periodEnd: Date;
  jobsIncluded: string[];
  processedAt?: Date;
  providerPayoutId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Rating {
  id: string;
  jobId: string;
  raterType: 'CUSTOMER' | 'DRIVER';
  raterId: string;
  targetId: string; // driverId or customerId
  stars: number; // 1-5
  comment?: string;
  createdAt: Date;
}

export interface Dispute {
  id: string;
  jobId: string;
  reason: DisputeReason;
  description: string;
  status: DisputeStatus;
  customerPhotos: string[];
  adminNotes?: string;
  decision?: string;
  refundAmount?: number;
  driverDeduction?: number;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  channel: NotificationChannel;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  status: NotificationStatus;
  sentAt?: Date;
  failureReason?: string;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  reason?: string;
  ipAddress?: string;
  createdAt: Date;
}

// --- API Types ---

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface BookingRequest {
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  dropoffAddress: string;
  dropoffLat: number;
  dropoffLng: number;
  itemDescription: string;
  itemSize: ItemSize;
  weightKg?: number;
  photos: string[];
  timeOption: TimeOption;
  stairs: number;
  helperRequired: boolean;
  pickupNotes?: string;
  dropoffNotes?: string;
  recipientName?: string;
  recipientPhone?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface LoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

export interface RegisterRequest {
  email?: string;
  phone?: string;
  password: string;
  role: 'CUSTOMER' | 'DRIVER';
  name: string;
}

// --- Matching Types ---

export interface MatchingConfig {
  offerTimeoutSeconds: number;
  maxSearchRadiusKm: number;
  radiusExpansionSteps: number[];
  urgentJobMaxSearchMinutes: number;
  flexibleJobMaxSearchMinutes: number;
}

// --- Analytics Event Types ---

export type AnalyticsEvent =
  | 'BookingStarted'
  | 'BookingCompleted'
  | 'QuoteGenerated'
  | 'QuoteAccepted'
  | 'PaymentAuthorized'
  | 'PaymentFailed'
  | 'DriverSearchStarted'
  | 'DriverOfferSent'
  | 'DriverOfferAccepted'
  | 'DriverOfferDeclined'
  | 'DriverMatched'
  | 'JobCompleted'
  | 'JobCancelled'
  | 'JobUnmatched'
  | 'DisputeCreated'
  | 'RepeatBooking'
  | 'DriverOnline'
  | 'DriverOffline'
  | 'DocumentExpired';

export interface AnalyticsEventData {
  event: AnalyticsEvent;
  userId?: string;
  jobId?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}
