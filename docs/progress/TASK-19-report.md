# TASK 19 — CUSTOMER HELP + ACCOUNT

Status: PASS

## What was built
Help FAQs and job issue links; persistent personal/business/ABN profile, saved-address add/remove, notification preference and reversible local deletion request. All customer routes have real UI and navigation.

## Files created
- apps/customer-web/src/pages/HelpPage.tsx
- apps/customer-web/src/pages/AccountPage.tsx
- docs/progress/TASK-19-report.md

## Files modified
- apps/customer-web/src/app.tsx
- packages/mock-platform/src/store.ts
- packages/shared/src/index.ts

## Commands and tests run
Connected shell typecheck; rendered verification completed

## Test results
PASS — Browser personal/business profile, ABN, saved address and deletion/restoration passed; Help routes checked.

Final verification: npm run typecheck (zero errors), npm run build (all nine workspaces), npm test (18 passed, zero failed), npm run test:e2e (five suites), node scripts/production-smoke.mjs (four production bundles). See the corresponding output logs and result JSON in docs/progress.

## Assumptions
Frontend-only Melbourne simulation; AUD; configurable prototype rules, no external services.

## Unresolved issues / limitations
No remaining blocking issue in this task. Integrations are simulated, storage is browser-local, and cross-port standalone apps retain separate origin storage; use the connected demo for shared role state. See FINAL-BUILD-REPORT.md for prototype limits.

## Safe to continue
Yes; continue sequentially, repairing failures.

## Next task
20
