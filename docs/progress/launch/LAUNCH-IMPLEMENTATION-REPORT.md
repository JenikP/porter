# Porter launch implementation checkpoint

Verified 11 October 2026 (Australia/Sydney), branch `launch-development`. This is working launch development, not a declaration that Porter is ready for paying customers.

## Running software

`npm run dev` starts a real central API at port 3001 and independent Customer (5173), Driver (5174) and Operations (5175) apps. All have their own access/session/logout experience and build output. Register your own Customer/Driver account. Manager development credentials are generated in ignored `.env.launch`; no password is included in source/reports. Local marketplace data persists in ignored `.data/porter-launch.sqlite`. Production has a PostgreSQL adapter and requires a configured database.

Normal apps use API state, not localStorage marketplace records or demo account IDs. One customer's data cannot be read by another customer; a driver receives only its offers/assignments/profile. Manager and Support roles are distinct on the server. The original connected mock demo still works at port 5176 via `npm run dev:demo`, with its original role switch and localStorage, and is excluded from production deployment.

## Gates

| Phase | Status | Evidence and boundary |
|---|---|---|
| 1 — separate applications | PASS | Independent branded access, own-account routing, approval, logout and role enforcement verified |
| 2 — central data/auth | PASS | SQLite and PostgreSQL central persistence/authorization acceptance PASS; release security/migrations/hosting remain |
| 3 — customer | PARTIAL | Central booking-to-dispute lifecycle PASS; real routing/maps/payment integration remains |
| 4 — driver | PARTIAL | Central onboarding/offers/proofs/earnings/GPS PASS; native device/background/provider verification remains |
| 5 — operations | PARTIAL | Review, two-driver dispatch, finance, pricing snapshots, reports/CSV and audit PASS locally; hosted operations controls remain |
| 6 — providers | PARTIAL | HTTP contracts, simulator, durable outbox and signed/idempotent confirmation tests PASS; no live vendor configured |
| 7 — mobile/launch | PARTIAL | Separate Android/iOS projects generated/synced; web install/offline and deployment/CI foundations; no binary/device/hosted release |

All seven phase reports are under this directory. Full source inventory is [changed-files.txt](changed-files.txt). Existing Stage 1 domain logic, UI components and working features were reused; no scratch rebuild or live-provider claim was made.

## Verification

- `npm run typecheck`: zero errors across web/shared/API workspace checks. Frontend/shared code is TypeScript; API ES modules use Node syntax checks, not strict TypeScript semantic checking.
- `npm run build`: all buildable workspaces pass, including four web outputs and central API bundle. Native wrappers expose sync/open scripts and require platform SDK compilation separately.
- `npm test`: 18 domain/invariant tests pass.
- `npm run test:providers`: HTTP fixture contract test passes for routing/recovery, financial operations and EMAIL/SMS/PUSH; unavailable provider errors and stable keys asserted.
- Preserved-demo `npm run test:e2e`: all five suites pass, including full lifecycle, reassignment, 64 responsive/label/keyboard screen checks, error/loading/empty states and forms.
- Production-bundle `node scripts/production-smoke.mjs`: 20 acceptance groups pass across independent browser contexts. The scenario includes Customer A registration/booking/payment, Driver B approval/acceptance/proofs/completion, Customer A updates/rating/Under Review, Admin C refund decision, refresh/re-login/API restart, unrelated-account isolation, concurrent acceptance, Driver C central reassignment, payout duplication rejection, quote snapshots, document expiry, signed webhook replay, foreground GPS consent and offline recovery.
- Both native workspace `sync` commands succeed for generated Android/iOS projects and camera/geolocation/push plugins. No APK/IPA or physical device test is claimed.

Browser plugin was unavailable, so Playwright with Edge was used. Desktop/mobile screenshots and [acceptance-results.json](acceptance-results.json) record real loaded screens. Final auth/customer/driver/admin screenshots were visually inspected; transient restart errors were corrected/recovered before final capture.

## Visual review

The generated customer sign-in concept is retained in `concepts/customer-sign-in.png`. Fidelity ledger: forest/ivory split composition and lime CTA retained; large Inter typography and quiet form labels retained; route motif implemented as a simple code-native diagram; spacing/header contrast corrected to fill the viewport; mobile stacks the story and form with comfortable touch targets. Intentional difference: abstract route rather than a realistic map, so the interface does not imply a configured maps service. Existing Crisp Productivity workspaces remain distinct by role.

## Actual connection versus simulation

Genuinely connected locally: account authentication, private sessions and uploads, ownership/permissions, all marketplace/financial records, foreground GPS coordinates, independent-app polling, central admin decisions, persistence and audit. In-app notifications and delivery queue are real stored records. SQLite is a real development database.

Simulated by default: payment authorization/capture/refund/payout settlement, route distance/ETA/address suggestions, recovery mail and outbound delivery channels. HTTP adapters were tested with fixtures, not real merchant/maps/mail/SMS/APNs/FCM accounts. Map graphics are illustrative. Native camera/GPS/push bridge code exists but device/provider receipt is unverified. All four Docker images build successfully in CI; HTTPS deployment has not been provisioned. PostgreSQL 17 CI acceptance passed in run 38055860622; no production database is provisioned.

Remaining release work is explicit in [LAUNCH-READINESS.md](../../LAUNCH-READINESS.md): hosted API/database/backups, provider sandboxes/tokenization/reconciliation, precise service-area routing/maps, security and data retention controls, native SDK/signing/device tests and background-location consent, operational/legal/privacy/insurance/store approvals. Aggregate marketplace storage is transactional but needs normalized/indexed migrations before scale. No real-customer launch PASS is recorded.

## Resume

Keep this branch and the preserved demo. Retain the passing PostgreSQL CI gate for future changes, then provision gateway sandboxes and HTTPS staging without exposing secrets. Repeat the same independent-browser lifecycle against staging and the native real-device matrix. Read [runbook](../../LAUNCH-RUNBOOK.md) and [mobile setup](../../MOBILE-FOUNDATIONS.md) before deploying. Do not repeat completed prototype tasks or silently mark external gates complete.

CI evidence: [PostgreSQL acceptance run](https://github.com/JenikP/porter/actions/runs/38055860622) PASS for commit 0740525. Credential review found only documented placeholder/template URLs and the disposable CI database password; no live tokens, keys or personal credentials were staged.

Deployment-image CI: https://github.com/JenikP/porter/actions/runs/38056401627 — PASS on 34c2c31, including real PostgreSQL, production bundle acceptance and API/Customer/Driver/Admin Docker builds. Later privacy/preference checks are saved in a follow-up commit.

Final source CI: [run 38056890011](https://github.com/JenikP/porter/actions/runs/38056890011) PASS on `c13ea39`. Clean installation, all workspace typechecks/builds, 18 domain tests, provider contracts, 20 production-browser acceptance groups against PostgreSQL 17 and all four Docker image builds succeeded. Machine-readable evidence: ci-results.json. Actual local startup/recovery/registration boundaries were checked after restarting the final committed API. Main remains at original `d64c8c2`; changes are pushed only to `launch-development`.