# Porter connected frontend prototype — final build report


Status: COMPLETE — READY FOR REVIEW

Crisp Productivity × Premium Logistics is applied to all three roles, with the requested forest/lime/ivory/mint palette, locally bundled Inter, a collapsible Admin sidebar, redesigned Customer booking/tracking, and action-focused Driver screens. See [UX-REDESIGN-REPORT.md](UX-REDESIGN-REPORT.md) for the completed redesign, concept comparisons, preserved functionality and final regression evidence. This supersedes the earlier blue restyle.

Verified: 10 October 2026, Australia/Sydney. The Task 03 origin limitation is repaired and Tasks 06–37 are complete. Existing Tasks 01–05 were reused; broken Home booking links were connected to the real booking flow. Every task has a report in this folder, and both build-status files are maintained.

## What was built

`apps/porter-web` is the default connected demo. Customer, Driver and Admin switch within one origin and one `MockPlatformProvider`; no role has its own copied marketplace dataset. Role changes preserve live jobs, quotes, offers, events, payments, proofs, ratings, disputes, documents, payouts and audit records. The state is persisted under `porter.mock-platform.v2`, with date revival and same-origin storage-event synchronization.

The three individual applications remain independently buildable and runnable. Their different development ports have separate browser storage; use the connected shell for the end-to-end marketplace demonstration.

| Experience | Completed functionality |
|---|---|
| Customer | Home quick start, active/recent deliveries, saved Melbourne addresses; six-step booking with validation and draft persistence; item size, quantity, weight, up to five image uploads, access notes, stairs, helper, speed and recipient details; configurable vehicle recommendation and larger-vehicle upgrade; calculated quote, breakdown, version and expiry; successful/failed mock wallet payment and same-job retry; searching, unmatched retry and assigned-driver states; cancellation, timeline, simulated map/ETA, handover proofs, receipt and refund totals; ratings, comments, issue types and evidence; Help, personal/business/ABN profile, saved-address editing, notification preference and reversible local deletion request. |
| Driver | Driver selection, identity, vehicle, approval and document status; online/offline eligibility; incoming offers with area-only information before acceptance, expiry, net earnings, accept/decline; sequential pickup/drop-off execution with proof capture or actual image upload, condition notes and recipient-code verification; completion, cancellation back to search and failed-handover/problem reports; profile/identity/vehicle/ABN onboarding, vehicle photo, terms, five required document types, expiry and resubmission; earnings, commission, deductions, payout balance, payout history, delivery history and ratings. |
| Admin | Overview, Jobs, Live Map, Drivers, Customers, Disputes, Pricing, Payments, Reports, Settings and Audit Log; searches/filters, job details, timelines, evidence and eligible assignment/reassignment; driver review, approval/rejection, suspension and document requests/reviews/expiry; business accounts and account flags; dispute notes/review/decision, full/partial refund and driver deductions; versioned rate cards, scheduled effective date and price preview; payment/refund states, dispute holds, simulated payouts; delivery/matching/cancellation/dispute/GMV/commission/earnings metrics and CSV export; append-only-style audit records and confirmed demo reset. |

Shared UX includes labelled controls, visible keyboard focus, a skip link, 44 px controls, safe-area customer navigation, mobile admin tables, reduced-motion rules, empty results, validation, payment failure, quote expiry, unmatched jobs, expired documents, a shared slow/offline/retry simulator and render-error recovery.

## Connected behavior verified

The browser walkthrough creates a delivery, calculates a quote, authorizes mock payment, sends a driver offer, accepts it, verifies the customer sees the assignment, progresses all pickup/drop-off states, saves both proofs, rejects a wrong recipient code, completes delivery with the correct code, verifies capture and earnings/payout accrual, submits a rating, opens a dispute, resolves it from Admin with a partial refund and driver deduction, and verifies the Customer sees the resolution. Persisted proof, rating, payment and audit records are asserted.

Additional browser checks verify driver cancellation and admin assignment to another driver, document expiry forcing the driver offline, document resubmission and admin approval, account edits visible to Admin, actual item image upload, updated pricing affecting new quotes while an existing job retains its saved total, failed payment retry without duplicate jobs, loading/error recovery and empty searches.

## Exact run commands

Run from the project root:

```powershell
cd C:\Users\patel\Desktop\Porter
npm install
npm run dev
```

Open **http://127.0.0.1:5173/** and use the Customer / Driver / Admin buttons at the top. The connected development server is running on that address at handoff.

Other commands:

```powershell
npm run typecheck
npm run build
npm test
# Keep npm run dev running in a separate terminal:
npm run test:e2e
node scripts/production-smoke.mjs
# Optional standalone applications, run instead of the connected demo:
npm run dev:customer
npm run dev:driver
npm run dev:admin
# Production preview of the connected application:
npm run preview --workspace=apps/porter-web
```

Customer standalone uses port 5173, Driver 5174 and Admin 5175. The default production preview is port 4173. Keep the chosen host and port consistent because browser storage is origin-specific.

Browser checks use the existing bundled Playwright runtime and installed Microsoft Edge, with no dependency download. On another machine, set `PORTER_PLAYWRIGHT_PATH` to a Playwright package directory and provide Edge. The default package path on this machine is `C:/Users/patel/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright`.

## Starting a fresh delivery demo

The seed includes an assigned job for Sam Nguyen. Finish that delivery first (its recipient code is **4821**) or use Driver → Cancel assignment, then Customer → Jobs → `job_001` → Cancel delivery. Sam is then available to accept a new car delivery. New bookings use recipient demo code **2468**.

For a van delivery, select Priya Shah in Driver and go online before booking. Admin can also manually assign an eligible driver. Admin → Settings offers a confirmed reset and the slow/offline connection simulator. Admin → Drivers → document review → Mark expired demonstrates online blocking; approving a current document restores document eligibility.

## Test and build results

| Check | Result | Evidence |
|---|---|---|
| `npm run typecheck` | PASS, zero errors in all nine workspaces | `typecheck-output.log`, `final-check-results.json` |
| `npm run build` | PASS, connected shell, all three standalone applications and all shared packages | `build-output.log` |
| `npm test` | PASS, 18 tests, zero failures | `test-output.log`, `unit-results.json` |
| Full delivery lifecycle | PASS, including pre-acceptance privacy, wrong-code rejection and customer resolution | `e2e-results.json` |
| Admin intervention | PASS, shared reassignment and audit/cancellation records | `intervention-results.json` |
| Responsive/accessibility smoke | PASS, 64 screen/label/keyboard checks at 1440, 390 and 320 px, correct page identity, no blank pages or framework overlay | `smoke-results.json` |
| Error/empty scenarios | PASS, 10 browser scenarios | `error-state-results.json` |
| Profile/onboarding/pricing forms | PASS, 6 browser scenarios | `form-results.json` |
| Actual production bundles | PASS, all four bundles load and meaningful controls respond without console errors | `production-smoke-results.json` |
| Redesign regression | PASS, 18 checks including four viewport sizes, sidebar, sorting, dark theme, quote, reduced motion and dialog focus | `ux-check-results.json` |
| Fully loaded page captures | PASS, 62 screenshots covering 31 screens in desktop/mobile, zero runtime errors | `../screenshots/manifest.json` |

The browser suites reported zero application console/runtime errors. Final redesigned screens and ImageGen references were visually inspected for Customer Home/quote/Account, Driver Home/Documents, Admin Overview/Pricing/disputes and dark Jobs, with mobile/tablet checks. Browser plugin was unavailable; regular bundled Playwright with Edge was used. No lint script was present. The updated [page gallery](../screenshots/gallery.html) and [screenshot ZIP](../Porter-All-Page-Screenshots.zip) show the current redesign; the captures below also document the original connected-flow verification.

Screenshots are saved outside the repository:

- [Customer desktop](C:/Users/patel/.codex/visualizations/2026/10/10/01a12485-e76c-7d22-a0a9-d7236011e6d3/porter-home-1440.png)
- [Completed delivery](C:/Users/patel/.codex/visualizations/2026/10/10/01a12485-e76c-7d22-a0a9-d7236011e6d3/porter-completed-desktop.png)
- [Customer mobile resolution](C:/Users/patel/.codex/visualizations/2026/10/10/01a12485-e76c-7d22-a0a9-d7236011e6d3/porter-resolved-mobile.png)
- [Admin mobile](C:/Users/patel/.codex/visualizations/2026/10/10/01a12485-e76c-7d22-a0a9-d7236011e6d3/porter-admin-390.png)

## Prototype assumptions and simulated integrations

- AUD and realistic Melbourne example addresses/partners. Address validation checks completeness and different endpoints; route distance/time comes from labelled suburb-based demo assumptions, with a configurable generic fallback. There is no geocoding, real route calculation or geofence enforcement.
- Recommendation thresholds are editable in `packages/domain/src/vehicle-recommendation.ts`: car up to 30 kg, van up to 500 kg; large/bulky items and helpers require a van. Quantity contributes aggregate weight.
- Quotes last 15 minutes; offers last 120 seconds. Benchmark pricing is seeded, editable and versioned. Existing quotes/jobs retain their saved price; future effective versions are selected for new quotes after their effective time. Scheduling input uses the device's local date/time; demonstration was run in Australia/Sydney.
- Mock wallet collects no card numbers. Completion captures the mock authorization once and creates a pending payout. Disputes hold available payout funds; resolution applies bounded cumulative refunds and driver adjustments. Payout processing is a simulation.
- Customer cancellation before assignment is free; after assignment it retains a 10% demo fee. Driver cancellation before pickup returns the same delivery to search. Failed handovers become shared operations disputes.
- Role switching replaces authentication. Contact data, document identity references, licence/insurance/ABN files and vehicle details are demo records. Document upload stores file metadata for simulated review; image uploads are actual local data URLs. Illustrated handover evidence is labelled when no real image is supplied.
- Maps, GPS, ETA, payment settlement, identity verification, SMS/push/email, bank payouts and connection errors are simulated. No backend, API keys, real provider, database or authentication service was added or used.

## Known prototype limitations and later integration work

There are no remaining known blockers to the requested local prototype flows. Browser storage has capacity limits; image uploads are limited to 500 KB each. Clearing storage or changing origin resets/separates state. Same-origin multi-tab sync is a last-writer model, not transactional multi-user synchronization. The seeded earnings aggregates include older history beyond the small visible seed ledger. Completion and dispute handling run immediately for demonstration; production dispute windows, reconciliation, settled-payout recovery and fee policy need a durable financial ledger and validated rules. Audit records are editable by someone with browser access.

Production backend work requires real authentication/authorization, database persistence, transactional matching/offer locks, job ownership checks, secure uploads, verified document review, notifications, durable audit storage and a reconciled payment/payout ledger. Real maps require geocoding, routing, live location and service-area enforcement. Real payments require a compliant provider, payment lifecycle webhooks, refunds, payout reconciliation and settlement controls. Real notifications require delivery channels and retry/consent handling.

Legal/security review is still needed for privacy and retention, business/driver terms, insurance, worker arrangements, restricted goods, dispute/refund policies, access control and production financial handling. QA here used Edge; Firefox/Safari/device hardware and a full WCAG audit remain outside this prototype verification.

All 37 task reports and the final status tables are the authoritative on-disk progress record.
