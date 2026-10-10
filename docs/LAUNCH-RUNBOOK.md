# Launch runbook

## Applications and API

Deploy only `apps/customer-web/dist`, `apps/driver-web/dist`, `apps/admin-web/dist` and `services/api/dist`. `npm run build:production` omits the connected demo. SPA routes must fall back to each app's `index.html`. Each app should proxy its own `/api` to the same central API so sessions remain first-party. The app header chooses the intended application; the server independently derives account role and ownership from a private session.

`services/api/.env.example` describes server settings; each frontend has its own `.env.example`. Never embed payment, routing, mail or database secrets in Vite variables. `VITE_API_URL` is public. Prefer `/api`. Explicit `APP_ORIGINS` must contain the three HTTPS origins. Proxy containers are bound to loopback until an HTTPS ingress is configured. `API_HOST=0.0.0.0` is used inside containers; local API binds to loopback.

```sh
docker compose --env-file /absolute/private/porter.env -f deploy/compose.yaml up --build -d
```

Supply a database password, manager bootstrap credentials, HTTPS origins and verified gateway configuration through a secret manager/private environment file. For isolated staging only, `ALLOW_SIMULATORS=true` explicitly permits simulator defaults; password recovery still requires configured email in production mode. Containers and ingress have not been exercised locally because Docker is unavailable. Do not expose ports publicly without HTTPS and provider configuration.

## Persistence and migration

Local storage uses Node's SQLite adapter, with WAL and transaction locking. Deployment uses PostgreSQL via `DATABASE_URL`. Accounts, session hashes, recovery-token hashes, private uploads, command idempotency, device registrations, notification outbox, telemetry and webhook IDs are separate tables. All marketplace entities are currently persisted in a transaction-locked JSON aggregate. This preserves the already-tested financial/state-machine rules while migrating the UI to central data.

Before scaling, migrate jobs/events/quotes/rate cards/payments/refunds/documents/ratings/disputes/audit into indexed relational tables using versioned migrations. Keep immutable quote/job snapshots and transactional money invariants. Add object storage, malware scanning, file-signature validation, retention controls, encryption/backups and recovery drills. Do not import old browser demo records or plaintext legacy credentials into production. SQLite-to-PostgreSQL data transfer requires an explicit reviewed export/import migration; adapters are not an automatic migration tool.

## Gateway contracts

- Routing `POST ROUTING_URL`: `{pickup,dropoff}` → `{distanceKm,durationMinutes}`. Address search `GET ADDRESS_SEARCH_URL?q=...` returns string suggestions. Gateway must validate precise locations, service area and route constraints before real launch. Default suburb-based Melbourne distances are estimates.
- Payments `POST PAYMENT_URL/{authorize,capture,refund,void,payout}`: JSON AUD amount/reference plus `Idempotency-Key`; response `{ok:true,reference}`. The adapter preserves stable operation keys across retries. A real provider-specific checkout/payment-method token, merchant onboarding, reconciliation and settlement testing are still needed. No card data is collected.
- Payment confirmations `POST /api/webhooks/payments`: raw JSON `{id,type,reference,amount}` plus `X-Porter-Signature` hex HMAC SHA256 using `PAYMENT_WEBHOOK_SECRET`. Types `capture.confirmed` and `refund.confirmed` acknowledge operations already initiated through verified domain commands. They do not independently create captures/refunds. Durable IDs reject duplicate effects. Adapt the verification contract to the actual provider's signature format before connecting it.
- Notifications `POST NOTIFICATION_URL`: recovery message or `{channel,to,title,body}`; server-only bearer token. Delivery outbox includes stable `Idempotency-Key`, exponential retries and terminal FAILED state after five attempts. Enable `NOTIFICATION_CHANNELS=EMAIL,SMS,PUSH` only for supported channels. Default in-app updates are persisted; simulated outbound rows are marked SIMULATED. Recovery links appear locally only in development.

HTTP fixture tests prove these contracts and failure paths; they do not prove any merchant, maps, SMS, mail, APNs or FCM account works. External failures roll back financial commands; retries must use the same command key. Reconciliation for ambiguous provider/DB failures remains a launch requirement.

## Security and operations

Passwords use salted scrypt. Session cookies are HttpOnly, expire after seven days and become Secure in production. CSRF headers protect authenticated changes; CORS is explicitly allowlisted. Frontend profile changes cannot grant approval, online eligibility, earnings or admin role. Admin signup is disabled. Support and Manager command sets differ; support refunds have a configurable server limit and cannot deduct driver earnings.

`GET /api/health` returns service and adapter status. Authenticated Operations settings reads `/api/operations/health` for outbox and privacy-minimal runtime counters. Runtime reports contain event categories only, no exception text, addresses, passwords or tokens. Reporting/financial KPIs use central records. Add infrastructure alerts, distributed rate limits, admin MFA, verified recovery-email delivery, revocation controls, retention and security review before launch. Bootstrap credentials provision a missing manager only; changing the environment password does not silently reset an existing account.

Sites can host static frontend outputs once a publicly reachable API and cookie/CORS strategy are configured. The Node API/PostgreSQL runtime must be hosted on compatible infrastructure; no disconnected frontend has been published as a working marketplace.
