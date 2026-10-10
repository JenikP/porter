# Task 05 — Customer Home

**Status:** PASS

## What was built
- Customer Home screen with Porter branding, primary booking CTA, and pickup/drop-off quick start fields.
- Active delivery card driven by shared mock platform jobs and driver rating.
- Recent deliveries list from completed Melbourne jobs in mock seed data.
- Saved addresses from the demo customer profile.
- Proof-of-delivery trust messaging via `Alert`.
- Bottom navigation (Home, Jobs, Help, Account) with React Router routes.
- Expanded mock seed with two completed Melbourne jobs for recent history.

## Files created
- `apps/customer-web/src/pages/HomePage.tsx`
- `apps/customer-web/src/pages/PlaceholderPage.tsx`
- `docs/progress/TASK-05-report.md`

## Files modified
- `apps/customer-web/src/app.tsx`
- `apps/customer-web/src/main.tsx`
- `packages/mock-platform/src/seed.ts`
- `docs/progress/BUILD-STATUS.md`

## Commands run
- `npm run typecheck`

## Tests run
- `npm run typecheck`

## Test results
- PASS — zero TypeScript errors.

## Assumptions made
- Demo customer identity is `customer_001` from mock seed (single-customer prototype session).
- Jobs/Help/Account routes use lightweight placeholders until Tasks 06+ flesh out booking and account flows.
- “Book a delivery” and “Continue to item details” buttons are visual entry points wired in Task 06.

## Unresolved issues
- Booking CTAs do not yet navigate into the multi-step booking flow (Task 06).

## Next task
- Task 06 — Customer booking: addresses step.
