import { createSeedMockPlatformState, MOCK_PLATFORM_STORAGE_KEY } from './seed';
import { deserializeMockPlatformState, serializeMockPlatformState } from './serialization';
import type { MockPlatformState } from './types';

export { MOCK_PLATFORM_STORAGE_KEY };

function getStorage(): Storage | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    const storage = window.localStorage;
    const probeKey = '__porter_mock_platform_probe__';
    storage.setItem(probeKey, '1');
    storage.removeItem(probeKey);
    return storage;
  } catch {
    return undefined;
  }
}

function mergeWithSeed(parsed: Partial<MockPlatformState>): MockPlatformState {
  const seed = createSeedMockPlatformState();
  return {
    demoSettings: parsed.demoSettings ?? { connection: 'online' },
    customers: parsed.customers ?? seed.customers,
    drivers: parsed.drivers ?? seed.drivers,
    vehicles: parsed.vehicles ?? seed.vehicles,
    jobs: parsed.jobs ?? seed.jobs,
    jobItems: parsed.jobItems ?? seed.jobItems,
    jobEvents: parsed.jobEvents ?? seed.jobEvents,
    quotes: parsed.quotes ?? seed.quotes,
    driverOffers: parsed.driverOffers ?? seed.driverOffers,
    rateCards: parsed.rateCards ?? seed.rateCards,
    payments: parsed.payments ?? seed.payments,
    payouts: parsed.payouts ?? seed.payouts,
    disputes: parsed.disputes ?? seed.disputes,
    ratings: parsed.ratings ?? seed.ratings,
    notifications: parsed.notifications ?? seed.notifications,
    driverDocuments: parsed.driverDocuments ?? seed.driverDocuments,
    jobProofs: parsed.jobProofs ?? seed.jobProofs,
    auditLogs: parsed.auditLogs ?? seed.auditLogs,
  };
}

export function loadMockPlatformState(): MockPlatformState {
  const storage = getStorage();
  if (!storage) {
    return createSeedMockPlatformState();
  }

  try {
    const raw = storage.getItem(MOCK_PLATFORM_STORAGE_KEY);
    if (!raw) {
      return createSeedMockPlatformState();
    }
    return mergeWithSeed(deserializeMockPlatformState(raw));
  } catch {
    return createSeedMockPlatformState();
  }
}

export function saveMockPlatformState(state: MockPlatformState): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(MOCK_PLATFORM_STORAGE_KEY, serializeMockPlatformState(state));
  } catch {
    return;
  }
}

export function resetMockPlatformState(): MockPlatformState {
  const seed = createSeedMockPlatformState();
  saveMockPlatformState(seed);
  return seed;
}
