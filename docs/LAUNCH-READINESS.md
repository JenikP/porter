# Real customer launch checklist

Local software milestones are not approval to accept live deliveries or money.

- [x] Three independent account-based web apps; no public admin signup or customer/driver admin links.
- [x] Central session-derived ownership, persistent marketplace state and cross-browser lifecycle verification.
- [x] Server-calculated quote snapshots, document eligibility, handover proofs, disputes and financial invariants.
- [x] Separate native project files and permission bridges; web offline/private-data behavior verified.
- [x] Deployment and PostgreSQL CI configuration, server environment templates and central health reporting.
- [ ] Provision production PostgreSQL, backups, restore test, encrypted storage and reviewed migration from local data.
- [ ] Normalize/index marketplace tables; pagination, load/race testing and versioned migrations before scale.
- [ ] Hosted HTTPS Customer/Driver/Operations and central API; DNS, TLS, ingress, secret rotation and infrastructure alerts.
- [ ] Actual merchant/payment provider integration, payment-method tokenization, sandbox lifecycle, settlement, refunds, payout holds, reconciliation and webhook signing contract.
- [ ] Exact geocoding/service-area validation, verified route distance/ETA, maps display and production location provider.
- [ ] Verified recovery mail, delivery email/SMS, APNs and FCM; retry/escalation and notification preference review.
- [ ] Admin MFA, email/phone verification, distributed abuse/rate limits, session controls, independent penetration/security review.
- [ ] Private object storage, file content verification/malware scanning and sensitive-document retention/deletion.
- [ ] Finalize Stage 1 service area, vehicle constraints, fares, cancellation/waiting rules, support limits and operational escalation.
- [ ] Legal/privacy/terms/insurance/driver arrangements and payment/tax/business obligations reviewed by qualified advisers.
- [ ] Customer support ownership, dispute evidence policy, incident playbooks and driver onboarding/training.
- [ ] SDK compilation, signing, real-device session/camera/GPS/push/offline QA; background tracking design and consent approval.
- [ ] Store accounts, confirmed bundle IDs/brand assets, privacy disclosures, accessibility review and app-store approval.

These dependencies require external accounts, decisions and verified environments. None is silently marked complete. They are separate from the original frontend-only prototype's completed build tasks.

## 11 October 2026 onboarding and staging checkpoint

- [x] New-driver seven-step onboarding, current prototype terms, private file uploads, complete application submission and Manager approval verified through the running persistent central API.
- [x] Private local document storage and server content-signature validation; configurable HTTPS object-storage gateway contract tested with a fixture.
- [x] Isolated staging Compose/TLS configuration, simulator-only payment guard, migration tracking and backup/restore tooling prepared.
- [x] Isolated PostgreSQL 17 CI acceptance, database/private-file recovery checks and Caddy/Compose/container validation verified; hosted recovery remains pending.
- [x] Customer and Driver Android debug APKs compiled with JDK 21 / SDK 36; actual APK existence verified.
- [ ] Provision and verify four public staging HTTPS URLs and persistent PostgreSQL/document volumes.
- [ ] Perform hosted encrypted off-host backup/restore drill and operational alert delivery.
- [ ] Run remote staging acceptance and controlled deployed API restart verification.
- [ ] Physical Android/iOS WebView session, camera/file selection, GPS, notification and offline tests; iOS binary/release signing.

Reports: `docs/progress/DRIVER-ONBOARDING-REPORT.md` (central workflow PASS), `docs/progress/STAGING-IMPLEMENTATION-REPORT.md` (staging PARTIAL), `docs/STAGING-RUNBOOK.md`. Older unchecked launch items remain intentionally open where provider/infrastructure/security/legal/device verification is still missing.
