export {
  MockPlatformProvider,
  useMockPlatform,
  useMockPlatformActions,
  useMockPlatformState,
  useDriverEligibility,
  useResetMockPlatform,
} from './react';
export { createMockPlatformActions, driverHasValidDocuments } from './store';
export type {
  MockPlatformActions,
  MockPlatformContextValue,
  MockPlatformState,
  JobProof,
} from './store';
export {
  loadMockPlatformState,
  resetMockPlatformState,
  saveMockPlatformState,
  MOCK_PLATFORM_STORAGE_KEY,
} from './persistence';
export { createSeedMockPlatformState } from './seed';
export { MockPlatformSummary } from './MockPlatformSummary';
export { PlatformGate, PlatformErrorBoundary } from './PlatformGate';
export {
  DEMO_ADMIN_ID,
  DEMO_CUSTOMER_ID,
  DEMO_CUSTOMER_USER_ID,
  DEMO_DRIVER_2_ID,
  DEMO_DRIVER_ID,
} from './types';
