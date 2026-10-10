# TASK 20 — DRIVER ONBOARDING + DOCUMENTS

Status: PASS

## What was built
Driver profile, identity reference, ABN, vehicle and photo, driver terms, all five required document types, expiry and resubmission with shared pending admin records. Expired/rejected documents force offline.

## Files created
- apps/driver-web/src/Documents.tsx
- docs/progress/TASK-20-report.md

## Files modified
- apps/driver-web/src/app.tsx
- packages/mock-platform/src/store.ts
- packages/mock-platform/src/seed.ts
- packages/shared/src/index.ts

## Commands and tests run
Connected shell typecheck; admin review UI verification completed

## Test results
PASS — Browser onboarding save, document upload metadata/resubmission and admin approval passed.

Final verification: npm run typecheck (zero errors), npm run build (all nine workspaces), npm test (18 passed, zero failed), npm run test:e2e (five suites), node scripts/production-smoke.mjs (four production bundles). See the corresponding output logs and result JSON in docs/progress.

## Assumptions
Frontend-only Melbourne simulation; AUD; configurable prototype rules, no external services.

## Unresolved issues / limitations
No remaining blocking issue in this task. Integrations are simulated, storage is browser-local, and cross-port standalone apps retain separate origin storage; use the connected demo for shared role state. See FINAL-BUILD-REPORT.md for prototype limits.

## Safe to continue
Yes; continue sequentially, repairing failures.

## Next task
21
