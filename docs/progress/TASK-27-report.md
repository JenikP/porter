# TASK 27 — ADMIN PRICING

Status: PASS

## What was built
Editable vehicle/distance/time/urgency/stairs/helper/waiting/minimum/commission rates, effective publication date, live price preview, immutable version history; new quotes select the current effective version, saved quotes remain fixed.

## Files created
- apps/admin-web/src/Pricing.tsx
- docs/progress/TASK-27-report.md

## Files modified
- apps/admin-web/src/app.tsx
- apps/customer-web/src/pages/BookingPage.tsx
- packages/mock-platform/src/store.ts

## Commands and tests run
Connected shell typecheck; quote snapshot tests completed

## Test results
PASS — Browser published base fare affects new quote while existing job retains $24.50; snapshot tests passed.

Final verification: npm run typecheck (zero errors), npm run build (all nine workspaces), npm test (18 passed, zero failed), npm run test:e2e (five suites), node scripts/production-smoke.mjs (four production bundles). See the corresponding output logs and result JSON in docs/progress.

## Assumptions
Frontend-only Melbourne simulation; AUD; configurable prototype rules, no external services.

## Unresolved issues / limitations
No remaining blocking issue in this task. Integrations are simulated, storage is browser-local, and cross-port standalone apps retain separate origin storage; use the connected demo for shared role state. See FINAL-BUILD-REPORT.md for prototype limits.

## Safe to continue
Yes; continue sequentially, repairing failures.

## Next task
28
