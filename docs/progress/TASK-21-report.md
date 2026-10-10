# TASK 21 — DRIVER EARNINGS + HISTORY

Status: PASS

## What was built
Driver per-job gross/commission/adjustments/net, weekly balance, payouts, completed/cancelled history and ratings. New delivery completion accrues pending payout; disputes hold balance and resolution releases adjusted funds.

## Files created
- apps/driver-web/src/Earnings.tsx
- docs/progress/TASK-21-report.md

## Files modified
- apps/driver-web/src/app.tsx
- packages/mock-platform/src/store.ts

## Commands and tests run
Connected shell typecheck; financial action tests completed

## Test results
PASS — Completion, holds, deductions and payout financial assertions passed; earnings/history screens checked.

Final verification: npm run typecheck (zero errors), npm run build (all nine workspaces), npm test (18 passed, zero failed), npm run test:e2e (five suites), node scripts/production-smoke.mjs (four production bundles). See the corresponding output logs and result JSON in docs/progress.

## Assumptions
Frontend-only Melbourne simulation; AUD; configurable prototype rules, no external services.

## Unresolved issues / limitations
No remaining blocking issue in this task. Integrations are simulated, storage is browser-local, and cross-port standalone apps retain separate origin storage; use the connected demo for shared role state. See FINAL-BUILD-REPORT.md for prototype limits.

## Safe to continue
Yes; continue sequentially, repairing failures.

## Next task
22
