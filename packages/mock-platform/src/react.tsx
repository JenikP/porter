import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import {
  loadMockPlatformState,
  MOCK_PLATFORM_STORAGE_KEY,
  resetMockPlatformState,
  saveMockPlatformState,
} from './persistence';
import { deserializeMockPlatformState } from './serialization';
import { createMockPlatformActions, driverHasValidDocuments } from './store';
import type { MockPlatformActions, MockPlatformContextValue, MockPlatformState } from './store';

const MockPlatformContext = createContext<MockPlatformContextValue | undefined>(undefined);

export function MockPlatformProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<MockPlatformState>(() => loadMockPlatformState());
  const latest = useRef(state);
  const update: React.Dispatch<React.SetStateAction<MockPlatformState>> = (action) => {
    const next = typeof action === 'function' ? action(latest.current) : action;
    latest.current = next;
    setState(next);
  };

  useEffect(() => {
    saveMockPlatformState(state);
  }, [state]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== MOCK_PLATFORM_STORAGE_KEY || !event.newValue) {
        return;
      }
      try {
        update(deserializeMockPlatformState(event.newValue));
      } catch {
        return;
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const actions = useMemo(() => createMockPlatformActions(update), []);
  const value = useMemo(() => ({ ...state, ...actions }), [state, actions]);

  return <MockPlatformContext.Provider value={value}>{children}</MockPlatformContext.Provider>;
}

export function useMockPlatform(): MockPlatformContextValue {
  const context = useContext(MockPlatformContext);
  if (!context) {
    throw new Error('useMockPlatform must be used within MockPlatformProvider');
  }
  return context;
}

export function useMockPlatformState(): MockPlatformState {
  const platform = useMockPlatform();
  return {
    customers: platform.customers,
    drivers: platform.drivers,
    vehicles: platform.vehicles,
    jobs: platform.jobs,
    jobItems: platform.jobItems,
    jobEvents: platform.jobEvents,
    quotes: platform.quotes,
    driverOffers: platform.driverOffers,
    rateCards: platform.rateCards,
    payments: platform.payments,
    payouts: platform.payouts,
    disputes: platform.disputes,
    ratings: platform.ratings,
    notifications: platform.notifications,
    driverDocuments: platform.driverDocuments,
    jobProofs: platform.jobProofs,
    auditLogs: platform.auditLogs,
  };
}

export function useMockPlatformActions(): MockPlatformActions {
  const platform = useMockPlatform();
  return {
    createJob: platform.createJob,
    updateCustomer: platform.updateCustomer,
    updateDriverProfile: platform.updateDriverProfile,
    updateVehicle: platform.updateVehicle,
    submitDriverDocument: platform.submitDriverDocument,
    reviewDispute: platform.reviewDispute,
    processPayout: platform.processPayout,
    setDemoConnection: platform.setDemoConnection,
    updateJobStatus: platform.updateJobStatus,
    createQuote: platform.createQuote,
    createJobItem: platform.createJobItem,
    acceptDriverOffer: platform.acceptDriverOffer,
    declineDriverOffer: platform.declineDriverOffer,
    createDriverOffer: platform.createDriverOffer,
    assignDriver: platform.assignDriver,
    reassignDriver: platform.reassignDriver,
    cancelJob: platform.cancelJob,
    returnJobToSearching: platform.returnJobToSearching,
    createDispute: platform.createDispute,
    resolveDispute: platform.resolveDispute,
    updateRateCard: platform.updateRateCard,
    publishRateCard: platform.publishRateCard,
    approveDriver: platform.approveDriver,
    rejectDriver: platform.rejectDriver,
    suspendDriver: platform.suspendDriver,
    updateDriverDocument: platform.updateDriverDocument,
    markDriverOnline: platform.markDriverOnline,
    markDriverOffline: platform.markDriverOffline,
    authorizePayment: platform.authorizePayment,
    capturePayment: platform.capturePayment,
    refundPayment: platform.refundPayment,
    createRating: platform.createRating,
    addJobProof: platform.addJobProof,
    bookDelivery: platform.bookDelivery,
    canDriverGoOnline: platform.canDriverGoOnline,
    searchDrivers: platform.searchDrivers,
  };
}

export function useDriverEligibility(driverId: string) {
  const state = useMockPlatformState();
  return driverHasValidDocuments(state, driverId);
}

export function useResetMockPlatform() {
  const [, setTick] = useState(0);
  return () => {
    resetMockPlatformState();
    window.location.reload();
    setTick((n) => n + 1);
  };
}
