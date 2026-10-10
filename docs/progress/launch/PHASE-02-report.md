# Phase 2 — central authentication and data

Status: PASS for central authentication/data implementation and the verified SQLite/PostgreSQL acceptance gate. Production hosting and launch hardening remain separate release requirements.

Implemented Node HTTP API with private role-specific HttpOnly sessions, opaque random session/recovery secrets stored only as SHA-256 hashes, scrypt password hashes with per-password salts, session expiry/revocation, single-use password reset, CSRF verification, origin allowlist, request limits and account-specific state filtering. Roles and resource ownership derive from the authenticated database account. Customer input cannot set privileges, price or financial balances. Manager and Support permissions differ server-side.

Persistent tables contain accounts, sessions, recovery tokens, private uploads and idempotency commands. The central marketplace aggregate contains the existing customers, drivers, jobs, items/events, quotes/rate versions, offers, payments/refunds, payouts, proofs, ratings, disputes, notifications/documents and audit entries. Mutations run atomically through the existing tested store actions. SQLite is a development adapter; production requires PostgreSQL `DATABASE_URL`. PostgreSQL uses transaction/row locks; the complete independent-account production-bundle acceptance passed against PostgreSQL 17 in GitHub CI (run 38055860622). The aggregate storage model should be normalized/indexed before scaling.

Files: `services/api/src/launch/{server,database,policy,adapters}.mjs`, `scripts/build-api.mjs`, `scripts/init-launch.mjs`, `services/api/package.json`, `packages/app-session/src/session.tsx`, shared context export and application wiring. Legacy API sources are preserved for reference and are not mounted by this server.

Executed: `npm run typecheck` PASS; `node scripts/build-api.mjs` PASS; `node scripts/launch-check.mjs` PASS (20 workflow groups). Verified isolated Customer/Driver/Admin browser accounts, ownership/forgery checks, private document storage/review, central quote/payment/matching, delivery/proofs, dispute refund/adjustment, idempotency, document expiry and records/sessions surviving an API restart. No localStorage marketplace records are used by independent apps; the old provider remains only in the demo.

External dependencies: production PostgreSQL, HTTPS domains, email delivery and secure deployment secrets. Recovery tokens appear in development links only; production refuses simulated recovery delivery. Payment/maps/notification channels remain labelled simulators. Cookie deployment settings, MFA, distributed rate limits, normalized migrations, retention, backup/restore and a full security review remain launch work.

PostgreSQL CI evidence: https://github.com/JenikP/porter/actions/runs/38055860622 — all steps PASS, including npm ci, typecheck, build, domain/provider tests and multi-browser acceptance. Later edits add lost-response coverage; their final CI status is recorded separately.

Final PostgreSQL CI: run 38056890011 PASS on c13ea39, including active-delivery coordinate privacy, notification preferences and lost-response recovery.
