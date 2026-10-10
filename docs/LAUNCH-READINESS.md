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
