# Porter launch development

Branch: `launch-development`. Original working prototype remains on `main` and in `apps/porter-web`.

## Dependency-ordered implementation

- [x] Review existing source, API scaffold, tests and four business PDFs.
- [x] Preserve Stage 1 vehicle classes, fixed prices, matching, proof and dispute rules.
- [x] Phase 1: independent Customer, Driver and Admin apps; registration/login/recovery/onboarding/logout; own-account routing; no public admin signup; verify real workflows.
- [ ] Phase 2: central API, persistent database, private sessions, password hashing/recovery, resource ownership and role permissions; migrate UI state to API; verify isolation and persistence.
- [ ] Phase 3: customer profile/address/booking/quote/payment/tracking/proof/history/rating/dispute/notification/cancellation integration.
- [ ] Phase 4: own driver onboarding/private uploads/approval/expiry/offers/progression/earnings/location/connection recovery.
- [ ] Phase 5: central operations, scoped Support and Manager permissions, dispatch, review, finance, rate cards, reports and audit.
- [ ] Phase 6: production-capable provider boundaries, simulator labeling, external provider setup and verified webhook/retry behavior.
- [ ] Phase 7: installable mobile foundations, permission architecture, deployment/CI, monitoring and launch checklist.
- [x] Final acceptance: three independent browser accounts complete one centrally stored delivery and dispute; refresh/re-login preserves records.

## Architecture decisions

Keep the existing React/Vite web apps and tested domain/store logic. A session-aware API context feeds their existing UI contract. Production marketplace records never load from localStorage. The development-only connected demo retains its original mock provider. PostgreSQL is the intended deployment database; SQLite using Node's built-in adapter provides immediate local persistence without a native compiler. Auth/session/recovery/uploads/idempotency tables are separate; marketplace aggregate updates are transaction-locked, with a later normalized entity migration documented before scale-up.

The legacy Express/SQLite scaffold remains on disk for reference but is not exposed by the new server: it accepted frontend identity, had incomplete ownership checks and could not safely replace the tested connected state machine. Its native SQLite package also required unavailable Visual Studio compilation on this machine. The new server reuses the working domain and state-machine implementation instead.

External credentials do not block simulator-backed development. Real payment settlement, address/geocoding providers, delivery channels, managed PostgreSQL hosting, store distribution and legal/insurance decisions must be explicitly verified before a customer launch. Phase reports under `launch/` are authoritative; an unchecked phase is not complete.

## Current gate results

Phase 1 PASS for the independent authenticated web milestone. Phases 2–7 PARTIAL for real launch: central workflows and working adapters/mobile foundations are implemented, but hosted providers, production database operations, native SDK/device verification and launch controls remain open. The reports distinguish tested local behavior from these external gates. Final independent-browser acceptance PASS with simulator providers. See launch/acceptance-results.json and launch/LAUNCH-IMPLEMENTATION-REPORT.md.

Implemented: central accounts/sessions/ownership/persistence; customer lifecycle; own driver onboarding/proofs/earnings; central admin review/finance/pricing; gateway contracts/outbox/webhooks; foreground location; PWA/native project foundations; deployment/CI configuration. Do not repeat completed prototype tasks. Resume with the unresolved checklist in docs/LAUNCH-READINESS.md, validate PostgreSQL CI, provision external provider sandboxes, then perform native and hosted acceptance.