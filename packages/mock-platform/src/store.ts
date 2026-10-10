import type { Dispatch, SetStateAction } from 'react';
import {
  DisputeStatus,
  DocumentStatus,
  DocumentType,
  DriverApprovalStatus,
  JobStatus,
  NotificationChannel,
  NotificationStatus,
  OfferStatus,
  PaymentStatus,
  PayoutStatus,
  TimeOption,
  VehicleClass,
  type Dispute,
  type DisputeReason,
  type DriverDocument,
  type DriverOffer,
  type Job,
  type JobEvent,
  type JobItem,
  type Payment,
  type Quote,
  type RateCard,
  type Rating,
} from '@porter/shared';
import type { JobProof, MockPlatformState } from './types';
import { DEMO_ADMIN_ID } from './types';

export type { MockPlatformState, JobProof } from './types';

export type MockPlatformActions = {
  createJob: (input: Partial<Job> & { customerId: string }) => Job;
  updateJobStatus: (
    jobId: string,
    status: JobStatus,
    actor?: JobEvent['actorType'],
    actorId?: string,
    recipientCode?: string,
  ) => void;
  createQuote: (input: Partial<Quote> & { customerId: string }) => Quote;
  createJobItem: (input: Partial<JobItem> & { jobId: string; description: string }) => JobItem;
  acceptDriverOffer: (offerId: string) => void;
  declineDriverOffer: (offerId: string) => void;
  createDriverOffer: (input: {
    jobId: string;
    driverId: string;
    earnings: number;
    expiresInSeconds?: number;
  }) => DriverOffer;
  assignDriver: (jobId: string, driverId: string, reason?: string) => void;
  reassignDriver: (jobId: string, driverId: string, reason?: string) => void;
  cancelJob: (jobId: string, actor?: JobEvent['actorType'], actorId?: string) => void;
  returnJobToSearching: (jobId: string, reason?: string) => void;
  createDispute: (input: {
    jobId: string;
    reason: DisputeReason;
    description: string;
  } & Partial<Dispute>) => Dispute;
  resolveDispute: (
    disputeId: string,
    resolution: string,
    options?: { refundAmount?: number; driverDeduction?: number; adminNotes?: string },
  ) => void;
  updateRateCard: (rateCardId: string, patch: Partial<RateCard>, reason?: string) => void;
  publishRateCard: (values: RateCard['values'], createdBy?: string, effectiveFrom?: Date) => RateCard;
  approveDriver: (driverId: string) => void;
  rejectDriver: (driverId: string) => void;
  suspendDriver: (driverId: string, reason?: string) => void;
  updateDriverDocument: (documentId: string, patch: Partial<DriverDocument>) => void;
  markDriverOnline: (driverId: string) => { ok: boolean; reason?: string };
  markDriverOffline: (driverId: string) => void;
  authorizePayment: (input: {
    jobId: string;
    customerId: string;
    amount: number;
    fail?: boolean;
  }) => Payment;
  capturePayment: (paymentId: string) => void;
  refundPayment: (paymentId: string, amount: number, reason?: string) => void;
  createRating: (input: Omit<Rating, 'id' | 'createdAt'> & { id?: string }) => Rating;
  addJobProof: (input: Omit<JobProof, 'id' | 'createdAt' | 'photoUrl'> & {
    photoUrl?: string;
  }) => JobProof;
  bookDelivery: (input: {
    customerId: string;
    quote: Quote;
    item: {
      description: string;
      size: JobItem['size'];
      weightKg?: number;
      quantity: number;
      photos: string[];
      notes?: string;
    };
    jobFields: Partial<Job>;
    paymentFail?: boolean;
  }) => { job: Job; payment: Payment; offer?: DriverOffer };
  canDriverGoOnline: (driverId: string) => { ok: boolean; reason?: string };
  searchDrivers: (jobId: string) => void;
  updateCustomer: (id: string, patch: Partial<MockPlatformState['customers'][number]>, actor?: 'CUSTOMER' | 'ADMIN') => void;
  updateDriverProfile: (id: string, patch: Partial<MockPlatformState['drivers'][number]>) => void;
  updateVehicle: (driverId: string, patch: Partial<MockPlatformState['vehicles'][number]>) => void;
  submitDriverDocument: (driverId: string, type: DocumentType, fileUrl: string, expiryDate?: Date) => void;
  reviewDispute: (id: string, notes: string) => void;
  processPayout: (id: string) => void;
  setDemoConnection: (mode: 'online' | 'slow' | 'offline') => void;
};

export type MockPlatformContextValue = MockPlatformState & MockPlatformActions;

type Updater = Dispatch<SetStateAction<MockPlatformState>>;

const now = () => new Date();
const createId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

function findOrThrow<T extends { id: string }>(items: T[], id: string, label: string): T {
  const item = items.find((entry) => entry.id === id);
  if (!item) {
    throw new Error(`${label} not found: ${id}`);
  }
  return item;
}

function appendAudit(
  state: MockPlatformState,
  action: string,
  entityType: string,
  entityId: string,
  reason?: string,
  oldValue?: Record<string, unknown>,
  newValue?: Record<string, unknown>,
): MockPlatformState {
  return {
    ...state,
    auditLogs: [
      {
        id: createId('audit'),
        adminId: DEMO_ADMIN_ID,
        action,
        entityType,
        entityId,
        oldValue,
        newValue,
        reason,
        createdAt: now(),
      },
      ...state.auditLogs,
    ],
  };
}

function appendJobEvent(
  state: MockPlatformState,
  jobId: string,
  toStatus: JobStatus,
  actorType: JobEvent['actorType'],
  actorId?: string,
  metadata?: Record<string, unknown>,
): MockPlatformState {
  const job = findOrThrow(state.jobs, jobId, 'Job');
  const event: JobEvent = {
    id: createId('evt'),
    jobId,
    fromStatus: state.jobEvents.filter(e => e.jobId === jobId).slice(-1)[0]?.toStatus ?? null,
    toStatus,
    actorType,
    actorId,
    metadata,
    createdAt: now(),
  };
  return {
    ...state,
    jobEvents: [...state.jobEvents, event],
  };
}

function pushNotification(
  state: MockPlatformState,
  userId: string,
  type: string,
  title: string,
  body: string,
): MockPlatformState {
  return {
    ...state,
    notifications: [
      {
        id: createId('notif'),
        userId,
        channel: NotificationChannel.IN_APP,
        type,
        title,
        body,
        status: NotificationStatus.SENT,
        sentAt: now(),
        createdAt: now(),
      },
      ...state.notifications,
    ],
  };
}

export function driverHasValidDocuments(state: MockPlatformState, driverId: string): {
  ok: boolean;
  reason?: string;
} {
  const driver = state.drivers.find((d) => d.id === driverId);
  if (!driver) {
    return { ok: false, reason: 'Driver not found' };
  }
  if (driver.isSuspended) {
    return { ok: false, reason: 'Driver is suspended' };
  }
  if (driver.approvalStatus !== DriverApprovalStatus.APPROVED) {
    return { ok: false, reason: 'Driver is not approved' };
  }
  if (!driver.termsAccepted) return { ok:false,reason:'Accept the driver terms before going online' };
  const docs = state.driverDocuments.filter((doc) => doc.driverId === driverId);
  if ([DocumentType.IDENTITY,DocumentType.LICENCE,DocumentType.VEHICLE_REGISTRATION,DocumentType.INSURANCE,DocumentType.ABN].some(type => !docs.some(d => d.type === type))) return { ok: false, reason: 'Required identity, licence, registration, insurance and ABN documents must be submitted' };
  if (docs.length === 0) {
    return { ok: false, reason: 'No documents on file' };
  }
  const today = now();
  for (const doc of docs) {
    if (doc.status !== DocumentStatus.APPROVED) {
      return { ok: false, reason: `Document ${doc.type} is ${doc.status}` };
    }
    if (doc.expiryDate && doc.expiryDate < today) {
      return { ok: false, reason: `Document ${doc.type} has expired` };
    }
  }
  return { ok: true };
}

function defaultJobFields(input: Partial<Job> & { customerId: string }): Job {
  const timestamp = now();
  return {
    id: input.id ?? createId('job'),
    customerId: input.customerId,
    driverId: input.driverId,
    status: input.status ?? JobStatus.DRAFT,
    pickupAddress: input.pickupAddress ?? '120 Collins St, Melbourne VIC 3000',
    pickupLat: input.pickupLat ?? -37.8136,
    pickupLng: input.pickupLng ?? 144.9631,
    pickupNotes: input.pickupNotes,
    dropoffAddress: input.dropoffAddress ?? '700 Bourke St, Docklands VIC 3008',
    dropoffLat: input.dropoffLat ?? -37.8183,
    dropoffLng: input.dropoffLng ?? 144.946,
    dropoffNotes: input.dropoffNotes,
    recipientName: input.recipientName,
    recipientPhone: input.recipientPhone,
    recipientCode: input.recipientCode,
    vehicleClass: input.vehicleClass ?? VehicleClass.BIKE_OR_CAR,
    timeOption: input.timeOption ?? TimeOption.WITHIN_3_HOURS,
    stairs: input.stairs ?? 0,
    helperRequired: input.helperRequired ?? false,
    quoteId: input.quoteId ?? createId('quote'),
    price: input.price ?? 24.5,
    commission: input.commission ?? 4.9,
    driverEarnings: input.driverEarnings ?? 19.6,
    paymentId: input.paymentId,
    disputeId: input.disputeId,
    customerRatingId: input.customerRatingId,
    driverRatingId: input.driverRatingId,
    adminNotes: input.adminNotes,
    estimatedDistanceKm: input.estimatedDistanceKm ?? 2.4,
    estimatedDurationMinutes: input.estimatedDurationMinutes ?? 12,
    scheduledPickupWindowStart: input.scheduledPickupWindowStart,
    scheduledPickupWindowEnd: input.scheduledPickupWindowEnd,
    actualPickupTime: input.actualPickupTime,
    actualDeliveryTime: input.actualDeliveryTime,
    createdAt: input.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

function validateAssignment(state: MockPlatformState, jobId: string, driverId: string) {
 const job = findOrThrow(state.jobs,jobId,'Job');
 if (![JobStatus.SEARCHING,JobStatus.UNMATCHED,JobStatus.ASSIGNED,JobStatus.EN_ROUTE_TO_PICKUP,JobStatus.AT_PICKUP].includes(job.status)) throw new Error('Reassignment is only allowed before pickup');
 if (!driverHasValidDocuments(state,driverId).ok) throw new Error('Driver must have approved current documents');
 if (!state.vehicles.some(v => v.driverId === driverId && (v.type === job.vehicleClass || v.type === VehicleClass.VAN_OR_UTE))) throw new Error('Driver vehicle cannot carry this delivery');
 if (state.jobs.some(j => j.id !== jobId && j.driverId === driverId && [JobStatus.ASSIGNED,JobStatus.EN_ROUTE_TO_PICKUP,JobStatus.AT_PICKUP,JobStatus.PICKED_UP,JobStatus.EN_ROUTE_TO_DROPOFF,JobStatus.AT_DROPOFF,JobStatus.DELIVERED].includes(j.status))) throw new Error('Driver already has an active delivery');
}

export function createMockPlatformActions(update: Updater): MockPlatformActions {
  return {
    setDemoConnection(mode) { update(state => ({ ...state,demoSettings:{ connection:mode } })); },
    processPayout(id) { update(state => { const payout = findOrThrow(state.payouts,id,'Payout'); if (payout.status === PayoutStatus.COMPLETED) throw new Error('Payout already processed'); if (state.disputes.some(d => payout.jobsIncluded.includes(d.jobId) && d.status !== DisputeStatus.RESOLVED)) throw new Error('Resolve the dispute hold before paying out'); return appendAudit({ ...state,payouts:state.payouts.map(p => p.id === id ? { ...p,status:PayoutStatus.COMPLETED,processedAt:now(),updatedAt:now() } : p),drivers:state.drivers.map(d => d.id === payout.driverId ? { ...d,payoutBalance:Math.max(0,d.payoutBalance - payout.amount),updatedAt:now() } : d) },'PROCESS_PAYOUT','Payout',id,'Simulated payout', { status:payout.status },{ status:PayoutStatus.COMPLETED,amount:payout.amount }); }); },
    reviewDispute(id,notes) { update(state => { const old = findOrThrow(state.disputes,id,'Dispute'); if (old.status === DisputeStatus.RESOLVED) throw new Error('Resolved disputes cannot be edited'); return appendAudit({ ...state,disputes:state.disputes.map(d => d.id === id ? { ...d,adminNotes:notes,status:DisputeStatus.UNDER_REVIEW,updatedAt:now() } : d) },'REVIEW_DISPUTE','Dispute',id,notes,{ status:old.status },{ status:DisputeStatus.UNDER_REVIEW }); }); },
    updateDriverProfile(id, patch) {
      update(state => ({ ...state, drivers: state.drivers.map(d => d.id === id ? { ...d, ...patch, id, userId: d.userId, updatedAt: now() } : d) }));
    },
    updateVehicle(driverId,patch) {
      update(state => { const old = state.vehicles.find(v => v.driverId === driverId); return { ...state, vehicles: old ? state.vehicles.map(v => v.id === old.id ? { ...v,...patch,id:v.id,driverId,updatedAt:now() } : v) : [...state.vehicles,{ id:createId('vehicle'),driverId,type:VehicleClass.BIKE_OR_CAR,make:'Toyota',model:'Corolla',year:2021,plate:'DEMO',isDefault:true,createdAt:now(),updatedAt:now(),...patch }] }; });
    },
    submitDriverDocument(driverId,type,fileUrl,expiryDate) {
      update(state => { const old = state.driverDocuments.find(d => d.driverId === driverId && d.type === type); const doc: DriverDocument = { id:old?.id ?? createId('doc'),driverId,type,fileUrl,expiryDate,status:DocumentStatus.PENDING,createdAt:old?.createdAt ?? now(),updatedAt:now() }; return { ...state, driverDocuments:old ? state.driverDocuments.map(d => d.id === old.id ? doc : d) : [...state.driverDocuments,doc], drivers:state.drivers.map(d => d.id === driverId ? { ...d,isOnline:false,approvalStatus:DriverApprovalStatus.PENDING,updatedAt:now() } : d) }; });
    },
    updateCustomer(id, patch, actor = 'CUSTOMER') {
      update(state => { const old = findOrThrow(state.customers,id,'Customer'); const next = { ...state, customers: state.customers.map(c => c.id === id ? { ...c, ...patch, id, userId: c.userId, updatedAt: now() } : c) }; return actor === 'ADMIN' ? appendAudit(next,'UPDATE_CUSTOMER','Customer',id,patch.accountFlag,{ accountFlag: old.accountFlag },{ accountFlag: patch.accountFlag }) : next; });
    },
    createJob(input) {
      const job = defaultJobFields(input);
      update((state) =>
        appendJobEvent(
          { ...state, jobs: [...state.jobs, job] },
          job.id,
          job.status,
          'CUSTOMER',
          job.customerId,
        ),
      );
      return job;
    },

    updateJobStatus(jobId, status, actor = 'SYSTEM', actorId, recipientCode) {
      update((state) => {
        const job = findOrThrow(state.jobs, jobId, 'Job');
        if (job.status === status) return state;
        const route = [JobStatus.ASSIGNED, JobStatus.EN_ROUTE_TO_PICKUP, JobStatus.AT_PICKUP, JobStatus.PICKED_UP, JobStatus.EN_ROUTE_TO_DROPOFF, JobStatus.AT_DROPOFF, JobStatus.DELIVERED, JobStatus.COMPLETED];
        if (route.includes(status) && route.indexOf(status) !== route.indexOf(job.status) + 1) throw new Error('Invalid job status transition');
        if (actor === 'DRIVER' && actorId !== job.driverId) throw new Error('This job belongs to another driver');
        if (status === JobStatus.PICKED_UP && !state.jobProofs.some(p => p.jobId === jobId && p.type === 'pickup')) throw new Error('Pickup proof is required');
        if ([JobStatus.DELIVERED, JobStatus.COMPLETED].includes(status) && !state.jobProofs.some(p => p.jobId === jobId && p.type === 'delivery')) throw new Error('Delivery proof is required');
        if (status === JobStatus.DELIVERED && job.recipientCode && recipientCode !== job.recipientCode) throw new Error('Recipient code does not match');
        const patch: Partial<Job> = { status, updatedAt: now() };
        if (status === JobStatus.PICKED_UP) {
          patch.actualPickupTime = now();
        }
        if (status === JobStatus.DELIVERED || status === JobStatus.COMPLETED) {
          patch.actualDeliveryTime = now();
        }
        if (status === JobStatus.COMPLETED) {
          const payment = state.payments.find((p) => p.id === job.paymentId);
          let next = {
            ...state,
            payouts: [...state.payouts, { id: createId('payout'), driverId: job.driverId!, amount: job.driverEarnings, status: PayoutStatus.PENDING, periodStart: now(), periodEnd: now(), jobsIncluded: [jobId], createdAt: now(), updatedAt: now() }],
            jobs: state.jobs.map((entry) =>
              entry.id === jobId ? { ...job, ...patch } : entry,
            ),
            payments: payment
              ? state.payments.map((p) =>
                  p.id === payment.id
                    ? { ...p, status: PaymentStatus.CAPTURED, capturedAt: now(), updatedAt: now() }
                    : p,
                )
              : state.payments,
            drivers: state.drivers.map((d) =>
              d.id === job.driverId
                ? {
                    ...d,
                    totalJobs: d.totalJobs + 1,
                    weeklyEarnings: d.weeklyEarnings + job.driverEarnings,
                    payoutBalance: d.payoutBalance + job.driverEarnings,
                    updatedAt: now(),
                  }
                : d,
            ),
          };
          next = appendJobEvent(next, jobId, status, actor, actorId);
          return next;
        }
        const withStatus: MockPlatformState = {
          ...state,
          jobs: state.jobs.map((entry) =>
            entry.id === jobId ? { ...job, ...patch } : entry,
          ),
        };
        return appendJobEvent(withStatus, jobId, status, actor, actorId);
      });
    },

    createQuote(input) {
      const timestamp = now();
      let created!: Quote;

      update((state) => {
        const rateCardVersionId =
          input.rateCardVersionId ??
          state.rateCards.find((card) => card.isActive)?.id ??
          state.rateCards[0]?.id ??
          createId('rate_card');

        created = {
          pickupAddress: '120 Collins St, Melbourne VIC 3000',
          dropoffAddress: '700 Bourke St, Docklands VIC 3008',
          vehicleClass: VehicleClass.BIKE_OR_CAR,
          timeOption: TimeOption.WITHIN_3_HOURS,
          stairs: 0,
          helperRequired: false,
          distanceKm: 2.4,
          durationMinutes: 12,
          price: 24.5,
          priceBreakdown: {
            baseFare: 8,
            distanceFare: 6.4,
            timeFare: 2.4,
            urgencyMultiplier: 1,
            stairsCharge: 0,
            helperCharge: 0,
            waitingCharge: 0,
            subtotal: 24.5,
            commission: 4.9,
            total: 24.5,
          },
          expiresAt: new Date(timestamp.getTime() + 60 * 60 * 1000),
          validUntil: new Date(timestamp.getTime() + 60 * 60 * 1000),
          createdAt: timestamp,
          ...input,
          id: input.id ?? createId('quote'),
          customerId: input.customerId,
          rateCardVersionId,
        };

        return {
          ...state,
          quotes: [...state.quotes, created],
        };
      });

      return created;
    },

    createJobItem(input) {
      const item: JobItem = {
        id: input.id ?? createId('item'),
        jobId: input.jobId,
        description: input.description,
        size: input.size ?? ('SMALL' as JobItem['size']),
        weightKg: input.weightKg,
        quantity: input.quantity ?? 1,
        photos: input.photos ?? [],
        notes: input.notes,
      };
      update((state) => ({ ...state, jobItems: [...state.jobItems, item] }));
      return item;
    },

    createDriverOffer({ jobId, driverId, earnings, expiresInSeconds = 30 }) {
      const offeredAt = now();
      const offer: DriverOffer = {
        id: createId('offer'),
        jobId,
        driverId,
        status: OfferStatus.PENDING,
        earnings,
        offeredAt,
        expiresAt: new Date(offeredAt.getTime() + expiresInSeconds * 1000),
      };
      update((state) => ({ ...state, driverOffers: [...state.driverOffers, offer] }));
      return offer;
    },

    acceptDriverOffer(offerId) {
      update((state) => {
        const offer = findOrThrow(state.driverOffers, offerId, 'Driver offer');
        const job = findOrThrow(state.jobs, offer.jobId, 'Job');
        if (offer.status !== OfferStatus.PENDING || offer.expiresAt <= now() || job.status !== JobStatus.SEARCHING) throw new Error('This offer is no longer available');
        const driver = findOrThrow(state.drivers, offer.driverId, 'Driver');
        if (!driver.isOnline || !driverHasValidDocuments(state, driver.id).ok) throw new Error('Go online with approved current documents first');
        if (state.jobs.some(j => j.driverId === driver.id && [JobStatus.ASSIGNED, JobStatus.EN_ROUTE_TO_PICKUP, JobStatus.AT_PICKUP, JobStatus.PICKED_UP, JobStatus.EN_ROUTE_TO_DROPOFF, JobStatus.AT_DROPOFF, JobStatus.DELIVERED].includes(j.status))) throw new Error('Finish your active delivery first');
        const customer = state.customers.find((c) => c.id === job.customerId);
        const respondedAt = now();
        let next: MockPlatformState = {
          ...state,
          driverOffers: state.driverOffers.map((entry) =>
            entry.id === offerId
              ? { ...entry, status: OfferStatus.ACCEPTED, respondedAt }
              : entry.jobId === offer.jobId && entry.status === OfferStatus.PENDING
                ? { ...entry, status: OfferStatus.TIMED_OUT, respondedAt }
                : entry,
          ),
          jobs: state.jobs.map((entry) =>
            entry.id === job.id
              ? {
                  ...entry,
                  driverId: offer.driverId,
                  status: JobStatus.ASSIGNED,
                  updatedAt: respondedAt,
                }
              : entry,
          ),
        };
        next = appendJobEvent(next, job.id, JobStatus.ASSIGNED, 'DRIVER', offer.driverId, {
          offerId,
        });
        if (customer) {
          next = pushNotification(
            next,
            customer.userId,
            'DRIVER_ASSIGNED',
            'Driver assigned',
            'Your Porter driver is on the way to pickup.',
          );
        }
        return next;
      });
    },

    declineDriverOffer(offerId) {
      update((state) => {
        const offer = findOrThrow(state.driverOffers, offerId, 'Driver offer');
        return {
          ...state,
          driverOffers: state.driverOffers.map((entry) =>
            entry.id === offerId
              ? { ...entry, status: OfferStatus.DECLINED, respondedAt: now() }
              : entry,
          ),
        };
      });
    },

    assignDriver(jobId, driverId, reason) {
      update((state) => {
        validateAssignment(state,jobId,driverId);
        const job = findOrThrow(state.jobs, jobId, 'Job');
        let next: MockPlatformState = {
          ...state,
          jobs: state.jobs.map((entry) =>
            entry.id === jobId
              ? { ...job, driverId, status: JobStatus.ASSIGNED, updatedAt: now() }
              : entry,
          ),
        };
        next = appendJobEvent(next, jobId, JobStatus.ASSIGNED, 'ADMIN', DEMO_ADMIN_ID, {
          driverId,
        });
        next = appendAudit(
          next,
          'ASSIGN_DRIVER',
          'Job',
          jobId,
          reason,
          { driverId: job.driverId },
          { driverId },
        );
        return next;
      });
    },

    reassignDriver(jobId, driverId, reason) {
      update((state) => {
        validateAssignment(state,jobId,driverId);
        const job = findOrThrow(state.jobs, jobId, 'Job');
        const previousDriverId = job.driverId;
        let next: MockPlatformState = {
          ...state,
          jobs: state.jobs.map((entry) =>
            entry.id === jobId
              ? { ...job, driverId, status: JobStatus.ASSIGNED, updatedAt: now() }
              : entry,
          ),
        };
        next = appendJobEvent(next, jobId, JobStatus.ASSIGNED, 'ADMIN', DEMO_ADMIN_ID, {
          reassigned: true,
          driverId,
        });
        next = appendAudit(
          next,
          'REASSIGN_DRIVER',
          'Job',
          jobId,
          reason ?? 'Manual reassignment',
          { driverId: previousDriverId },
          { driverId },
        );
        return next;
      });
    },

    cancelJob(jobId, actor = 'CUSTOMER', actorId) {
      update((state) => {
        const job = findOrThrow(state.jobs, jobId, 'Job');
        if (job.status === JobStatus.CANCELLED) return state;
        if (![JobStatus.SEARCHING,JobStatus.UNMATCHED,JobStatus.QUOTED,JobStatus.BOOKED,JobStatus.ASSIGNED,JobStatus.EN_ROUTE_TO_PICKUP,JobStatus.AT_PICKUP].includes(job.status)) throw new Error('After pickup, report a problem for operations to review');
        const fee = actor === 'CUSTOMER' && job.driverId ? Math.round(job.price * .1 * 100) / 100 : 0;
        let next: MockPlatformState = {
          ...state,
          driverOffers:state.driverOffers.map(o => o.jobId === jobId && o.status === OfferStatus.PENDING ? { ...o,status:OfferStatus.TIMED_OUT } : o),
          payments:state.payments.map(p => p.id === job.paymentId && p.status !== PaymentStatus.FAILED ? { ...p,status:fee > 0 ? PaymentStatus.PARTIALLY_REFUNDED : PaymentStatus.REFUNDED,refundAmount:p.amount - fee,refundedAt:now(),updatedAt:now() } : p),
          jobs: state.jobs.map((entry) =>
            entry.id === jobId
              ? { ...job, status: JobStatus.CANCELLED, updatedAt: now() }
              : entry,
          ),
        };
        next = appendJobEvent(next, jobId, JobStatus.CANCELLED, actor, actorId ?? job.customerId);
        if (actor === 'ADMIN') next = appendAudit(next,'CANCEL_JOB','Job',jobId,'Admin cancellation',{ status:job.status },{ status:JobStatus.CANCELLED,refund:job.price - fee });
        return next;
      });
    },

    returnJobToSearching(jobId, reason) {
      update((state) => {
        const job = findOrThrow(state.jobs, jobId, 'Job');
        if (![JobStatus.QUOTED,JobStatus.SEARCHING,JobStatus.UNMATCHED,JobStatus.ASSIGNED,JobStatus.EN_ROUTE_TO_PICKUP,JobStatus.AT_PICKUP].includes(job.status)) throw new Error('Cannot return a collected or closed delivery to search');
        let next: MockPlatformState = {
          ...state,
          driverOffers: state.driverOffers.map(o => o.jobId === jobId ? { ...o,status:OfferStatus.TIMED_OUT } : o),
          drivers: state.drivers.map(d => d.id === job.driverId ? { ...d,cancellationCount:d.cancellationCount + 1,updatedAt:now() } : d),
          jobs: state.jobs.map((entry) =>
            entry.id === jobId
              ? { ...job, driverId: undefined, status: JobStatus.SEARCHING, updatedAt: now() }
              : entry,
          ),
        };
        next = appendJobEvent(next, jobId, JobStatus.SEARCHING, 'SYSTEM', undefined, { reason });
        return next;
      });
    },

    createDispute(input) {
      const dispute: Dispute = {
        id: input.id ?? createId('dispute'),
        jobId: input.jobId,
        reason: input.reason,
        description: input.description,
        status: input.status ?? DisputeStatus.OPEN,
        customerPhotos: input.customerPhotos ?? [],
        adminNotes: input.adminNotes,
        decision: input.decision,
        refundAmount: input.refundAmount,
        driverDeduction: input.driverDeduction,
        resolvedBy: input.resolvedBy,
        resolvedAt: input.resolvedAt,
        createdAt: input.createdAt ?? now(),
        updatedAt: now(),
      };

      update((state) => {
        const job = findOrThrow(state.jobs,input.jobId,'Job');
        if (job.disputeId) throw new Error('This delivery already has an issue report');
        if (input.description.trim().length < 10) throw new Error('Please describe the issue in at least 10 characters');
        const held = state.payouts.filter(p => p.jobsIncluded.includes(job.id) && p.status === PayoutStatus.PENDING).reduce((s,p) => s + p.amount,0);
        let next: MockPlatformState = {
          ...state,
          drivers: state.drivers.map(d => d.id === job.driverId ? { ...d,payoutBalance: Math.max(0,d.payoutBalance - held),updatedAt: now() } : d),
          disputes: [...state.disputes, dispute],
          jobs: state.jobs.map((job) =>
            job.id === dispute.jobId
              ? { ...job, disputeId: dispute.id, status: JobStatus.DISPUTED, updatedAt: now() }
              : job,
          ),
        };
        next = appendJobEvent(next, dispute.jobId, JobStatus.DISPUTED, 'CUSTOMER');
        return next;
      });

      return dispute;
    },

    resolveDispute(disputeId, resolution, options) {
      update((state) => {
        const dispute = findOrThrow(state.disputes, disputeId, 'Dispute');
        if (dispute.status === DisputeStatus.RESOLVED) throw new Error('Dispute already resolved');
        const resolvedAt = now();
        const job = state.jobs.find((j) => j.id === dispute.jobId);
        if (!job) throw new Error('Disputed job missing');
        const refund = options?.refundAmount ?? 0; const deduction = options?.driverDeduction ?? 0;
        if (refund < 0 || refund > job.price || deduction < 0 || deduction > job.driverEarnings) throw new Error('Refund or driver adjustment is outside the saved job amount');
        const payment = state.payments.find(p => p.id === job.paymentId);
        if (refund > 0 && (!payment || payment.status === PaymentStatus.FAILED || refund > payment.amount - (payment.refundAmount ?? 0))) throw new Error('Refund exceeds the remaining paid amount');
        const held = state.payouts.filter(p => p.jobsIncluded.includes(job.id) && p.status === PayoutStatus.PENDING).reduce((s,p) => s + p.amount,0);
        let next: MockPlatformState = {
          ...state,
          drivers: state.drivers.map(d => d.id === job.driverId ? { ...d,payoutBalance: Math.max(0,d.payoutBalance + held - deduction),weeklyEarnings: Math.max(0,d.weeklyEarnings - deduction),updatedAt:resolvedAt } : d),
          payouts: state.payouts.map(p => p.jobsIncluded.includes(job.id) && p.status === PayoutStatus.PENDING ? { ...p,amount:Math.max(0,p.amount - deduction),updatedAt:resolvedAt } : p),
          disputes: state.disputes.map((entry) =>
            entry.id === disputeId
              ? {
                  ...dispute,
                  status: DisputeStatus.RESOLVED,
                  decision: resolution,
                  refundAmount: options?.refundAmount ?? dispute.refundAmount,
                  driverDeduction: options?.driverDeduction ?? dispute.driverDeduction,
                  adminNotes: options?.adminNotes ?? dispute.adminNotes,
                  resolvedBy: DEMO_ADMIN_ID,
                  resolvedAt,
                  updatedAt: resolvedAt,
                }
              : entry,
          ),
          jobs: state.jobs.map((j) =>
            j.id === dispute.jobId ? { ...j, status: JobStatus.RESOLVED, updatedAt: resolvedAt } : j,
          ),
        };
        if (options?.refundAmount && job?.paymentId) {
          next = {
            ...next,
            payments: next.payments.map((p) =>
              p.id === job.paymentId
                ? {
                    ...p,
                    status:
                      (p.refundAmount ?? 0) + options.refundAmount! >= p.amount
                        ? PaymentStatus.REFUNDED
                        : PaymentStatus.PARTIALLY_REFUNDED,
                    refundAmount: (p.refundAmount ?? 0) + options.refundAmount!,
                    refundedAt: resolvedAt,
                    updatedAt: resolvedAt,
                  }
                : p,
            ),
          };
        }
        next = appendJobEvent(next,dispute.jobId,JobStatus.RESOLVED,'ADMIN',DEMO_ADMIN_ID,{ decision:resolution });
        const customer = state.customers.find(c => c.id === job.customerId);
        if (customer) next = pushNotification(next,customer.userId,'DISPUTE_RESOLVED','Your issue has been resolved',resolution);
        next = appendAudit(
          next,
          'RESOLVE_DISPUTE',
          'Dispute',
          disputeId,
          resolution,
          { status: dispute.status },
          { status: DisputeStatus.RESOLVED, refundAmount: options?.refundAmount },
        );
        return next;
      });
    },

    updateRateCard(rateCardId, patch, reason) {
      update((state) => {
        const existing = findOrThrow(state.rateCards, rateCardId, 'Rate card');
        let next: MockPlatformState = {
          ...state,
          rateCards: state.rateCards.map((entry) =>
            entry.id === rateCardId ? { ...entry, ...patch, updatedAt: now() } : entry,
          ),
        };
        next = appendAudit(
          next,
          'UPDATE_RATE_CARD',
          'RateCard',
          rateCardId,
          reason,
          { values: existing.values as unknown as Record<string, unknown> },
          patch as Record<string, unknown>,
        );
        return next;
      });
    },

    publishRateCard(values, createdBy = DEMO_ADMIN_ID, effectiveFrom = now()) {
      if (Number.isNaN(effectiveFrom.getTime()) || Object.values(values).some(v => typeof v === 'number' && (!Number.isFinite(v) || v < 0)) || values.commissionPercent > 100) throw new Error('Rate values must be finite, nonnegative and commission no greater than 100%');
      const card: RateCard = {
        id: createId('rate_card'),
        version: 0,
        effectiveFrom,
        isActive: effectiveFrom <= now(),
        createdBy,
        values,
        createdAt: now(),
        updatedAt: now(),
      };
      let created = card;
      update((state) => {
        const nextVersion =
          Math.max(0, ...state.rateCards.map((c) => c.version)) + 1;
        created = { ...card, version: nextVersion };
        let next: MockPlatformState = {
          ...state,
          rateCards: [
            created,
            ...state.rateCards.map((c) =>
              c.isActive && card.isActive ? { ...c, isActive: false, effectiveTo: effectiveFrom, updatedAt: now() } : c,
            ),
          ],
        };
        next = appendAudit(next, 'PUBLISH_RATE_CARD', 'RateCard', created.id, 'New rate card version', undefined, {
          version: nextVersion,
        });
        return next;
      });
      return created;
    },

    approveDriver(driverId) {
      update((state) => {
        const d = findOrThrow(state.drivers,driverId,'Driver');
        if (!d.termsAccepted) throw new Error('Driver must accept the terms first');
        const eligible = driverHasValidDocuments({ ...state,drivers:state.drivers.map(d => d.id === driverId ? { ...d,approvalStatus:DriverApprovalStatus.APPROVED } : d) },driverId);
        if (!eligible.ok) throw new Error(eligible.reason);
        let next: MockPlatformState = {
          ...state,
          drivers: state.drivers.map((entry) =>
            entry.id === driverId
              ? { ...entry, approvalStatus: DriverApprovalStatus.APPROVED, updatedAt: now() }
              : entry,
          ),
        };
        next = appendAudit(next, 'APPROVE_DRIVER', 'Driver', driverId, 'Reviewed current documents and terms', { approvalStatus:d.approvalStatus }, { approvalStatus:DriverApprovalStatus.APPROVED });
        return next;
      });
    },

    rejectDriver(driverId) {
      update((state) => {
        const old = findOrThrow(state.drivers,driverId,'Driver');
        let next: MockPlatformState = {
          ...state,
          drivers: state.drivers.map((entry) =>
            entry.id === driverId
              ? {
                  ...entry,
                  approvalStatus: DriverApprovalStatus.REJECTED,
                  isOnline: false,
                  updatedAt: now(),
                }
              : entry,
          ),
        };
        next = appendAudit(next, 'REJECT_DRIVER', 'Driver', driverId,'Driver review rejected',{ approvalStatus:old.approvalStatus },{ approvalStatus:DriverApprovalStatus.REJECTED,isOnline:false });
        return next;
      });
    },

    suspendDriver(driverId, reason) {
      update((state) => {
        const old = findOrThrow(state.drivers,driverId,'Driver');
        let next: MockPlatformState = {
          ...state,
          drivers: state.drivers.map((entry) =>
            entry.id === driverId
              ? { ...entry, isSuspended: true, isOnline: false, updatedAt: now() }
              : entry,
          ),
        };
        next = appendAudit(next, 'SUSPEND_DRIVER', 'Driver', driverId, reason,{ isSuspended:old.isSuspended,isOnline:old.isOnline },{ isSuspended:true,isOnline:false });
        return next;
      });
    },

    updateDriverDocument(documentId, patch) {
      update(state => { const doc = findOrThrow(state.driverDocuments,documentId,'Document'); const nextDoc = { ...doc,...patch,updatedAt:now() }; let next = { ...state,driverDocuments:state.driverDocuments.map(d => d.id === documentId ? nextDoc : d),drivers:state.drivers.map(d => d.id === doc.driverId && (nextDoc.status !== DocumentStatus.APPROVED || (nextDoc.expiryDate && nextDoc.expiryDate < now())) ? { ...d,isOnline:false,updatedAt:now() } : d) }; return appendAudit(next,'REVIEW_DOCUMENT','DriverDocument',documentId,patch.reviewNotes,{ status:doc.status },{ status:nextDoc.status }); });
    },

    markDriverOnline(driverId) {
      let result: { ok: boolean; reason?: string } = { ok: false, reason: 'Unknown' };
      update((state) => {
        result = driverHasValidDocuments(state, driverId);
        if (!result.ok) {
          return state;
        }
        return {
          ...state,
          drivers: state.drivers.map((entry) =>
            entry.id === driverId ? { ...entry, isOnline: true, updatedAt: now() } : entry,
          ),
        };
      });
      return result;
    },

    markDriverOffline(driverId) {
      update((state) => ({
        ...state,
        drivers: state.drivers.map((entry) =>
          entry.id === driverId ? { ...entry, isOnline: false, updatedAt: now() } : entry,
        ),
      }));
    },

    authorizePayment({ jobId, customerId, amount, fail }) {
      const payment: Payment = {
        id: createId('payment'),
        jobId,
        customerId,
        amount,
        status: fail ? PaymentStatus.FAILED : PaymentStatus.AUTHORIZED,
        provider: 'simulator',
        authorizedAt: fail ? undefined : now(),
        createdAt: now(),
        updatedAt: now(),
      };
      update((state) => ({
        ...state,
        payments: [...state.payments, payment],
        jobs: state.jobs.map((j) =>
          j.id === jobId ? { ...j, paymentId: payment.id, updatedAt: now() } : j,
        ),
      }));
      return payment;
    },

    capturePayment(paymentId) {
      update((state) => ({
        ...state,
        payments: state.payments.map((p) =>
          p.id === paymentId
            ? { ...p, status: PaymentStatus.CAPTURED, capturedAt: now(), updatedAt: now() }
            : p,
        ),
      }));
    },

    refundPayment(paymentId, amount, reason) {
      update((state) => {
        const payment = findOrThrow(state.payments, paymentId, 'Payment');
        if (!Number.isFinite(amount) || amount <= 0 || amount > payment.amount - (payment.refundAmount ?? 0) || payment.status === PaymentStatus.FAILED) throw new Error('Refund must be within the remaining paid amount');
        const totalRefund = amount + (payment.refundAmount ?? 0);
        let next: MockPlatformState = {
          ...state,
          payments: state.payments.map((p) =>
            p.id === paymentId
              ? {
                  ...p,
                  status:
                    totalRefund >= p.amount
                      ? PaymentStatus.REFUNDED
                      : PaymentStatus.PARTIALLY_REFUNDED,
                  refundAmount: totalRefund,
                  refundedAt: now(),
                  updatedAt: now(),
                }
              : p,
          ),
        };
        next = appendAudit(
          next,
          'REFUND_PAYMENT',
          'Payment',
          paymentId,
          reason,
          { amount: payment.amount },
          { refundAmount: amount },
        );
        return next;
      });
    },

    createRating(input) {
      if (!Number.isInteger(input.stars) || input.stars < 1 || input.stars > 5) throw new Error('Rating must be 1–5 stars');
      const rating: Rating = {
        id: input.id ?? createId('rating'),
        jobId: input.jobId,
        raterType: input.raterType,
        raterId: input.raterId,
        targetId: input.targetId,
        stars: input.stars,
        comment: input.comment,
        createdAt: now(),
      };
      update((state) => {
        const job = state.jobs.find((j) => j.id === rating.jobId);
        if (!job || ![JobStatus.COMPLETED,JobStatus.DELIVERED,JobStatus.DISPUTED,JobStatus.RESOLVED].includes(job.status)) throw new Error('Complete delivery before rating');
        if (state.ratings.some(r => r.jobId === input.jobId && r.raterType === input.raterType)) throw new Error('This delivery already has your rating');
        return {
          ...state,
          ratings: [...state.ratings, rating],
          jobs: state.jobs.map((j) =>
            j.id === rating.jobId
              ? {
                  ...j,
                  customerRatingId:
                    rating.raterType === 'CUSTOMER' ? rating.id : j.customerRatingId,
                  driverRatingId: rating.raterType === 'DRIVER' ? rating.id : j.driverRatingId,
                  updatedAt: now(),
                }
              : j,
          ),
          drivers:
            rating.raterType === 'CUSTOMER' && job?.driverId
              ? state.drivers.map((d) => {
                  if (d.id !== job.driverId) return d;
                  const prior = state.ratings.filter(
                    (r) => r.targetId === d.id && r.raterType === 'CUSTOMER',
                  );
                  const totalStars =
                    prior.reduce((sum, r) => sum + r.stars, 0) + rating.stars;
                  const count = prior.length + 1;
                  return { ...d, rating: Math.round((totalStars / count) * 100) / 100 };
                })
              : state.drivers,
        };
      });
      return rating;
    },

    addJobProof(input) {
      const proof: JobProof = {
        id: createId('proof'),
        jobId: input.jobId,
        type: input.type,
        label: input.label,
        photoUrl: input.photoUrl ?? 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380"><rect width="600" height="380" fill="#e4ecde"/><text x="60" y="200" font-size="30">Simulated handover evidence</text></svg>'),
        note: input.note,
        createdAt: now(),
      };
      update((state) => ({ ...state, jobProofs: [...state.jobProofs.filter(p => p.jobId !== proof.jobId || p.type !== proof.type), proof] }));
      return proof;
    },

    bookDelivery({ customerId, quote, item, jobFields, paymentFail }) {
      if (quote.expiresAt <= now()) throw new Error('Quote expired; refresh it first');
      let result!: { job: Job; payment: Payment; offer?: DriverOffer };

      update((state) => {
        const jobId = createId('job');
        const paymentId = createId('payment');
        const timestamp = now();
        const job = defaultJobFields({
          ...jobFields,
          id: jobId,
          customerId,
          quoteId: quote.id,
          price: quote.price,
          commission: quote.priceBreakdown.commission,
          driverEarnings: Math.round((quote.price - quote.priceBreakdown.commission) * 100) / 100,
          paymentId,
          status: paymentFail ? JobStatus.QUOTED : JobStatus.SEARCHING,
          pickupAddress: quote.pickupAddress,
          dropoffAddress: quote.dropoffAddress,
          vehicleClass: quote.vehicleClass,
          timeOption: quote.timeOption,
          stairs: quote.stairs,
          helperRequired: quote.helperRequired,
          estimatedDistanceKm: quote.distanceKm,
          estimatedDurationMinutes: quote.durationMinutes,
        });
        const payment: Payment = {
          id: paymentId,
          jobId,
          customerId,
          amount: quote.price,
          status: paymentFail ? PaymentStatus.FAILED : PaymentStatus.AUTHORIZED,
          provider: 'simulator',
          authorizedAt: paymentFail ? undefined : timestamp,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        const jobItem: JobItem = {
          id: createId('item'),
          jobId,
          description: item.description,
          size: item.size,
          weightKg: item.weightKg,
          quantity: item.quantity,
          photos: item.photos,
          notes: item.notes,
        };

        let next: MockPlatformState = {
          ...state,
          quotes: state.quotes.some((q) => q.id === quote.id)
            ? state.quotes
            : [...state.quotes, quote],
          jobs: [...state.jobs, job],
          jobItems: [...state.jobItems, jobItem],
          payments: [...state.payments, payment],
        };
        next = appendJobEvent(next, jobId, job.status, 'CUSTOMER', customerId);

        let offer: DriverOffer | undefined;
        if (!paymentFail) {
          const onlineDriver =
            state.drivers.find(
              (d) =>
                d.isOnline &&
                !d.isSuspended &&
                d.approvalStatus === DriverApprovalStatus.APPROVED &&
                driverHasValidDocuments(state, d.id).ok &&
                state.vehicles.some(v => v.driverId === d.id && (v.type === job.vehicleClass || v.type === VehicleClass.VAN_OR_UTE)) &&
                !state.jobs.some(j => j.driverId === d.id && [JobStatus.ASSIGNED, JobStatus.EN_ROUTE_TO_PICKUP, JobStatus.AT_PICKUP, JobStatus.PICKED_UP, JobStatus.EN_ROUTE_TO_DROPOFF, JobStatus.AT_DROPOFF, JobStatus.DELIVERED].includes(j.status)),
            );

          if (onlineDriver) {
            const offeredAt = now();
            offer = {
              id: createId('offer'),
              jobId,
              driverId: onlineDriver.id,
              status: OfferStatus.PENDING,
              earnings: job.driverEarnings,
              offeredAt,
              expiresAt: new Date(offeredAt.getTime() + 120_000),
            };
            next = { ...next, driverOffers: [...next.driverOffers, offer] };
          }
        }

        result = { job, payment, offer };
        return next;
      });

      return result;
    },

    searchDrivers(jobId) {
      update(state => {
        const job = findOrThrow(state.jobs, jobId, 'Job');
        if (![JobStatus.SEARCHING, JobStatus.UNMATCHED].includes(job.status)) return state;
        if (!state.payments.some(p => p.jobId === jobId && p.status === PaymentStatus.AUTHORIZED)) return state;
        const pending = state.driverOffers.filter(o => o.jobId === jobId && o.status === OfferStatus.PENDING && o.expiresAt > now());
        if (pending.length) return state;
        const candidates = state.drivers.filter(d => d.isOnline && driverHasValidDocuments(state,d.id).ok && state.vehicles.some(v => v.driverId === d.id && (v.type === job.vehicleClass || v.type === VehicleClass.VAN_OR_UTE)) && !state.driverOffers.some(o => o.jobId === jobId && o.driverId === d.id && o.status === OfferStatus.DECLINED) && !state.jobs.some(j => j.driverId === d.id && [JobStatus.ASSIGNED, JobStatus.EN_ROUTE_TO_PICKUP, JobStatus.AT_PICKUP, JobStatus.PICKED_UP, JobStatus.EN_ROUTE_TO_DROPOFF, JobStatus.AT_DROPOFF, JobStatus.DELIVERED].includes(j.status)));
        const status = candidates.length ? JobStatus.SEARCHING : JobStatus.UNMATCHED;
        let next = { ...state, jobs: state.jobs.map(j => j.id === jobId ? { ...j, status, updatedAt: now() } : j), driverOffers: state.driverOffers.map(o => o.jobId === jobId && o.status === OfferStatus.PENDING ? { ...o, status: OfferStatus.TIMED_OUT } : o).concat(candidates.slice(0,1).map(d => ({ id: createId('offer'), jobId, driverId: d.id, earnings: job.driverEarnings, status: OfferStatus.PENDING, offeredAt: now(), expiresAt: new Date(Date.now() + 120000) }))) };
        if (job.status !== status) next = appendJobEvent(next,jobId,status,'SYSTEM');
        return next;
      });
    },

    canDriverGoOnline(driverId) {
      // Evaluated against latest state via a synchronous snapshot read in the action factory
      // by re-loading from the updater is not possible; callers should prefer
      // driverHasValidDocuments(useMockPlatformState(), driverId).
      // This method mirrors markDriverOnline permission checks without mutating.
      const snapshot = loadLatestState(update);
      return driverHasValidDocuments(snapshot, driverId);
    },
  };
}

function loadLatestState(update: Updater): MockPlatformState {
  let snapshot!: MockPlatformState;
  update((state) => {
    snapshot = state;
    return state;
  });
  return snapshot;
}
