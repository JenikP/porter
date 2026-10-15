# Premium V2 separation and CI repair — 15 October 2026

Local verification: PASS. Rebased onto remote 5c2d925, preserving the concurrent fresh Figma export alignment and internal QA labelling; all required local checks were rerun after integration. Existing draft PR: https://github.com/JenikP/porter/pull/1, design/porter-premium-v2 into launch-development. No merge performed. GitHub Actions results must be read from the run for the pushed commit; local Windows tests do not substitute for the Linux/PostgreSQL job.

## Final architecture

One platform, three separate user products: Customer, Driver and Admin each retain their own main.tsx, fixed Application role, routes, authentication, workspace build and dist output. No preview role selector or development banner appears in those account applications. Customer and Driver Capacitor configs point exclusively to their matching web dist directories and retain distinct app IDs. No native binaries were rebuilt or physical devices retested for this change.

The import audit found Driver and Admin depended on Customer JobDetail helpers, a shared detail component and Customer CSS. The unchanged formatting/detail presentation now lives in packages/marketplace-ui. Customer injects its existing rating/dispute panel through a presentation callback; Admin uses the same detail view without customer feedback. Baseline CSS moved unchanged into packages/ui/src/application.css (only its relative font URL adjusted). Premium V2 remains the final styling layer. No backend, domain, schema, pricing, accounting, auth, API, Neon or Cloudflare configuration changed.

apps/porter-web is Development / QA role preview only, visibly labelled DEVELOPMENT PREVIEW, excluded from production/native entrypoints. Its legacy desktop navigation overlap is corrected in preview-only CSS. Mobile booking controls and Driver hero negative margins are corrected; Admin charts stack at mobile widths. Existing premium visual direction is preserved.

## Test repairs and evidence

Updated only intentional copy: Customer heading and Send something, Accept delivery, Comment (optional), Rated 5/5, Raise a dispute and Submit issue for review. All delivery, privacy, finance, eligibility, retry, persistence and permission assertions remain. Added transitive import graph/native-boundary regression checks and runtime assertions excluding the preview from authenticated apps. Demo origin is configurable for testing an isolated checkout without disturbing another dev server.

- npm ci: PASS, reproducible lockfile with one local shared workspace.
- npm run typecheck: PASS, zero errors.
- npm run build: PASS, all workspaces including all four web apps.
- npm test: PASS, 18 domain + 3 storage + 6 application separation tests (27 total).
- npm run test:providers: PASS, 1 simulator/provider fixture contract test.
- npm run test:separation: PASS, Customer/Driver/Admin each compiled in disposable directories with all sibling app directories absent. Added to CI.
- npm run test:launch: PASS, 25 complete independent-account acceptance groups against built bundles, isolated SQLite, real local API and separate browser contexts. Covers onboarding/upload retry/private access/admin approval, booking/quote/simulated payment, offer/address privacy, acceptance, pickup/delivery proof, recipient code, earnings/payout, rating/dispute/admin resolution, reassignment/concurrent acceptance, pricing versions, expiry, roles, recovery and restart persistence.
- npm run test:e2e: PASS, all five suites: delivery lifecycle, interventions, smoke, error states and forms. Smoke includes 64 responsive/label/keyboard checks at 320/390/1440px. Error suite verifies failed payment/retry, expired quote/document and offline recovery.
- Reduced-motion browser check: PASS, Customer page animation resolves to none; screenshots captured at 390px mobile and 1440px desktop; zero browser runtime errors. No blank page or framework overlay in smoke checks.
- git diff --check: PASS.

Environment: Windows, Node 22, Playwright with installed Edge. Browser plugin not available. Local preview tested at http://127.0.0.1:5196; independent built apps tested at ports 5183/5184/5185 with isolated API 3002. Screenshot and JSON evidence retained outside source under C:/Users/patel/.codex/visualizations/2026/10/10/01a12485-e76c-7d22-a0a9-d7236011e6d3/premium-v2-ci/.

Remaining scope: no public deployment or Android device acceptance performed; payments, routing and outbound notifications remain the existing labelled simulators. The original Desktop/Porter checkout and its uncommitted work were preserved using an isolated worktree.

## Exact source files changed

- `.github/workflows/launch.yml`
- `README.md`
- `apps/admin-web/package.json`
- `apps/admin-web/src/Audit.tsx`
- `apps/admin-web/src/Customers.tsx`
- `apps/admin-web/src/Disputes.tsx`
- `apps/admin-web/src/DriverApplications.tsx`
- `apps/admin-web/src/Jobs.tsx`
- `apps/admin-web/src/LegacyDrivers.tsx`
- `apps/admin-web/src/Overview.tsx`
- `apps/admin-web/src/Payments.tsx`
- `apps/admin-web/src/Pricing.tsx`
- `apps/admin-web/src/Reports.tsx`
- `apps/admin-web/src/app.tsx`
- `apps/customer-web/package.json`
- `apps/customer-web/src/pages/JobDetail.tsx`
- `apps/customer-web/src/styles.css`
- `apps/driver-web/package.json`
- `apps/driver-web/src/ActiveJob.tsx`
- `apps/driver-web/src/Earnings.tsx`
- `apps/driver-web/src/LegacyDocuments.tsx`
- `apps/driver-web/src/OfferPanel.tsx`
- `apps/driver-web/src/app.tsx`
- `apps/porter-web/src/main.tsx`
- `apps/porter-web/src/preview.css`
- `docs/progress/PREMIUM-V2-SEPARATION-CI.md`
- `package-lock.json`
- `package.json`
- `packages/marketplace-ui/package.json`
- `packages/marketplace-ui/src/JobDetail.tsx`
- `packages/marketplace-ui/src/format.ts`
- `packages/marketplace-ui/src/index.ts`
- `packages/marketplace-ui/tsconfig.json`
- `packages/ui/src/application.css`
- `packages/ui/src/premium-v2.css`
- `scripts/capture-pages.mjs`
- `scripts/check-independent-builds.mjs`
- `scripts/e2e.mjs`
- `scripts/error-states.mjs`
- `scripts/forms.mjs`
- `scripts/interventions.mjs`
- `scripts/launch-check.mjs`
- `scripts/smoke.mjs`
- `scripts/vite-aliases.ts`
- `tests/app-separation.test.mjs`
