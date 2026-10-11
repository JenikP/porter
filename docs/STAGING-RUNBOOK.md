# Isolated Porter staging

Staging is testing-only, with simulated payments. It uses its own PostgreSQL and document volumes; never point it at local or production records. No staging URLs have yet been provisioned.

## Provision four HTTPS endpoints

Choose four hostnames under a domain you control: Customer, Driver, Operations and API. Point their DNS records to a Docker-capable Linux host with inbound 80/443. Copy `deploy/staging.env.example` to a private environment file outside source control, replace example hostnames/contact values, and generate independent database/manager secrets. Database passwords in the supplied URL interpolation must be URL-safe (for example random hexadecimal). No credentials belong in Vite variables or screenshots.

```sh
docker compose -p porter-staging --env-file /private/porter-staging.env -f deploy/staging.compose.yaml config --quiet
docker compose -p porter-staging --env-file /private/porter-staging.env -f deploy/staging.compose.yaml up --build -d
```

Caddy provisions certificates and sends each website to its distinct frontend service. Frontends proxy `/api` to the one central API, keeping role sessions first-party. The API also has its own HTTPS endpoint. Only ingress publishes ports. PostgreSQL and API stay on the internal network. Secure/HttpOnly cookies, explicit allowed origins, application roles, server-derived ownership and CSRF protection remain active. Manager bootstrap creates a missing account only; changing environment values is not password reset.

Staging fixes `PORTER_ENV=staging`, `ALLOW_SIMULATORS=true` and `PAYMENT_PROVIDER=simulator`. The server refuses a live payment adapter in staging. Routes/notifications remain simulations; production-mode recovery does not display development links and needs a verified email gateway before it can be accepted as working. The frontend builds contain public paths only. The connected demo is excluded.

## Persistence, migrations and initial data

Use PostgreSQL 17 and the dedicated `staging-database` volume. Startup establishes existing baseline tables and records migrations in `schema_migrations`; migration 2 adds ownership/session/outbox indexes idempotently. No existing local SQLite rows are copied, removed or overwritten. Only the current Melbourne rate-card seed and configured Manager are initially created. Register fresh staging customers/drivers with fabricated evidence. `npm run test:staging` deliberately creates labeled test accounts and test financial records; use a dedicated staging database.

Documents use a dedicated private volume at `/data/private-uploads`, writable by the container's non-root account. Metadata remains in PostgreSQL. Existing inline database upload data remains readable. For a production object-storage service, configure the server-only HTTPS gateway adapter and secret token; it must implement authenticated private `PUT/GET /objects/{id}` with stable IDs and return raw file bytes. No vendor-specific object storage is connected yet.

## Backup and safe restore drill

Schedule encrypted off-host backups, quiescing mutations while taking the database/file snapshot. Install PostgreSQL client tools compatible with the server. Set `DATABASE_URL` and `DOCUMENT_STORAGE_PATH` privately on the backup runner, with filesystem access to the private document volume.

```sh
node scripts/staging-backup.mjs backup /private/backups/porter-staging-YYYY-MM-DD
# Provision an EMPTY disposable PostgreSQL database and set PORTER_RESTORE_DATABASE_URL.
node scripts/staging-backup.mjs verify-restore /private/backups/porter-staging-YYYY-MM-DD
```

The backup includes a custom database dump, table row/checksum manifest, private file copy and file hashes. Restore refuses a nonempty target or the source URL. It restores the disposable database and checks all table row hashes and referenced document file hashes. It never restores over the running marketplace. An HTTP/object-storage deployment requires its own provider backup/recovery drill; the helper reports incomplete coverage rather than silently skipping it. CI runs a PostgreSQL 17 recovery drill against isolated test data. A hosted staging recovery drill must still be performed after provisioning, including container restart and mounting a restored private volume.

## Verify staging and cross-device behavior

Check all four actual HTTPS URLs, `/api/health` (database query, environment, simulator status), restricted routes, invalid-cookie/CSRF/ownership cases and authorized `/api/operations/health`. API failures include an `X-Request-ID` header/body correlation ID; structured logs contain path without query parameters, method and status, not passwords/document content.

Set the real `PORTER_STAGING_API_URL` ending in `/api` plus `PORTER_STAGING_ADMIN_EMAIL` and `PORTER_STAGING_ADMIN_PASSWORD` through private process environment, then run:

```sh
npm run test:staging
```

The command requires HTTPS, reports staging/PostgreSQL/simulator status, and uses independent authenticated cookie contexts for new Customer/Driver and Manager. It exercises driver application/approval, quote/payment simulation, offer acceptance, every delivery transition, proof, dispute resolution and logout/re-login persistence. It emits `docs/progress/staging/remote-acceptance.json` only after success. It does not claim physical-device or remotely controlled restart testing. Local production-bundle acceptance separately exercises actual browser screens, API restart, Support permissions, retry and privacy.

On physical devices, use separate Customer and Driver browsers/native apps and a third Admin session. Repeat the lifecycle and check visible status updates, refresh, logout/login and a controlled API restart. Test camera/photo selection, interrupted uploads, denied permissions, GPS consent and network recovery. For native builds, compile the web with the actual HTTPS `VITE_API_URL` and configure explicit native origins/cross-site session handling; do not ship relative `/api` bundles as connected native apps. Verify real WebView cookies before claiming device readiness.

## Mobile compilation

Android requires JDK 21 and SDK platform 36. Both debug APKs were built locally; signing/release/device acceptance remain. Set `JAVA_HOME`/`ANDROID_HOME`, build the current web bundles, then `npm run build:android` (or append `-- customer` / `-- driver`). Generated APKs stay in ignored native build outputs. The helper checks real APK existence, not just Capacitor sync. iOS requires a macOS host, compatible Xcode, Apple provisioning and a signing account; Windows cannot compile an IPA.

## Missing external setup

Supply a hosting provider/account, domain/DNS access, a Docker-capable host or equivalent container platform, PostgreSQL provisioning and private secret injection. Configure backup destination/encryption/retention and monitoring alerts. For recovery/outbound notifications supply a verified email gateway; maps, payments and push provider accounts remain outside this simulator staging milestone. Sites inspection found no existing Porter Site. Publishing standalone static files without a reachable central API would not fulfill this staging milestone.
