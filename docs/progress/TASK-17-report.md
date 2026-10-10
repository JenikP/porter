# TASK 17 — CUSTOMER JOBS + JOB DETAIL

Status: PASS

## What was built
Customer active and previous job lists with linked detail, suburb, price, speed and Melbourne timestamp; shared receipt and proof views.

## Files created
- apps/customer-web/src/pages/JobsPage.tsx
- docs/progress/TASK-17-report.md

## Files modified
- apps/customer-web/src/app.tsx

## Commands and tests run
Source review; rendered list/detail verification completed

## Test results
PASS — Active/previous list, detail and receipt views passed responsive and production route checks.

Final verification: npm run typecheck (zero errors), npm run build (all nine workspaces), npm test (18 passed, zero failed), npm run test:e2e (five suites), node scripts/production-smoke.mjs (four production bundles). See the corresponding output logs and result JSON in docs/progress.

## Assumptions
Frontend-only Melbourne simulation; AUD; configurable prototype rules, no external services.

## Unresolved issues / limitations
No remaining blocking issue in this task. Integrations are simulated, storage is browser-local, and cross-port standalone apps retain separate origin storage; use the connected demo for shared role state. See FINAL-BUILD-REPORT.md for prototype limits.

## Safe to continue
Yes; continue sequentially, repairing failures.

## Next task
18
