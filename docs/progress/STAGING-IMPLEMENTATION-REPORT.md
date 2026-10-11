# Staging implementation and cross-device readiness

Milestone status: **PARTIAL**. Local implementation and test infrastructure are complete; no public HTTPS staging environment has been provisioned or claimed. Verified 11 October 2026, branch `launch-development`.

## Work completed

Separate staging Compose configuration defines Customer, Driver, Operations and a central API behind Caddy TLS ingress, plus an isolated PostgreSQL 17 database and private document volume. Development remains local SQLite; deployment uses PostgreSQL. Production and staging settings are distinct. Staging explicitly enforces simulated payments and refuses a live payment adapter. No public client credential or test password is embedded in builds.

The reused PostgreSQL adapter now records versioned additive migrations and indexes. Existing baseline tables/data remain compatible; the migration never destroys or imports local records. Initial staging state has the Melbourne rate card and configured Manager, with fresh Customer/Driver registration used for testing. Marketplace data remains a locked JSON aggregate; relational normalization before scale is still outstanding.

Backup tooling creates a custom PostgreSQL dump, table count/checksum manifest, private document snapshot and file hashes. Restore requires a distinct empty disposable database and checks restored data/file hashes; it refuses existing data. CI runs this against PostgreSQL 17 with matching client tools. Hosted scheduled/encrypted off-host backups, restore mounting and recovery objectives still require infrastructure setup. Object-storage backup/recovery requires its provider-specific drill.

API health now executes a database query and reports environment/storage/provider status. Failures include a correlation ID and structured method/path/status diagnostics without query parameters, credentials or document contents. Existing authenticated Operations health, telemetry counters and outbox status remain. Upload failures retain earlier files and provide retry feedback; database availability failures return a readable retry message.

`npm run test:staging` prepares an HTTPS-only remote acceptance scenario using independent authenticated contexts. It requires actual staging URLs/Manager credentials through private environment variables and checks PostgreSQL/staging/simulator status before creating test data. It exercises a newly registered driver application/approval and customer booking through proof/dispute/re-login. It has not been run against a public environment because none exists.

## Deployed services and exact URLs

| Service | Running locally | Public staging |
|---|---|---|
| Customer | http://127.0.0.1:5173 | Not provisioned |
| Driver | http://127.0.0.1:5174 | Not provisioned |
| Operations | http://127.0.0.1:5175 | Not provisioned |
| Central API | http://127.0.0.1:3001/api | Not provisioned |

The existing local persistent records were retained. Domains in `deploy/staging.env.example` are illustrative placeholders, not reachable staging URLs. Sites inspection returned no existing Porter Site. Static hosting alone cannot run this Node API/PostgreSQL architecture; no disconnected frontend was published as a functioning marketplace.

## Automated evidence

- `npm run typecheck`: zero errors; API `.mjs` uses syntax checks, frontend/shared TypeScript is checked strictly.
- `npm run build`: every buildable workspace passes.
- `npm test`: 18 domain tests and 3 document-storage tests pass.
- `npm run test:providers`: HTTP integration contracts/failures pass, using fixtures rather than live vendor accounts.
- `npm run test:launch` and `node scripts/production-smoke.mjs`: independent browser accounts exercise new registration, terms/version/refresh, profile, private files, approval, booking/quote/simulated payment, offer acceptance, visible Customer assignment and status updates, proofs, completion, Admin dispute/refund resolution, re-login and central API restart persistence. Additional isolation, Support/Manager permissions, concurrent acceptance, quote snapshots, expiry, payouts, notification preferences and retry checks pass. An 800 KB PDF with generic mobile picker MIME is also covered.

The final local production-bundle run passes 25 acceptance groups, including delayed draft-save ordering and Admin UI expiry editing/manual expiry blocking. Private identity metadata/files persist across API restart and re-login. No framework overlay or browser runtime error was observed.
- `npm run test:e2e`: all preserved connected-demo suites pass, including 64 responsive/label/keyboard checks.
- `onboarding/persistent-local-results.json`: a newly registered driver uploaded five 800 KB PDF files and was approved through the real running local API/database and Manager interface.
- PostgreSQL CI/backup/ingress/container evidence is recorded in `staging/ci-results.json` after final verification. Earlier backup tooling failures were repaired; no failed run is represented as a passing drill.

Verified CI run [38101332939](https://github.com/JenikP/porter/actions/runs/38101332939) passed the full PostgreSQL 17 browser scenario, backup/restore row and private-file checks, Caddy/Compose validation and API/Customer/Driver/Admin Docker image builds. Backup client connection fields and matching client version/runner ownership were corrected before the passing run. This demonstrates isolated CI recovery, not a hosted staging recovery event.

Browser plugin was unavailable; Playwright with Edge (local) and Chromium (CI) was used. Local browser contexts model independent accounts, not physical devices or a public network. Screenshots are referenced in `DRIVER-ONBOARDING-REPORT.md`.

## Mobile builds actually attempted

Android Studio SDK/JDK discovery found platform 33 and Java 17. The first Driver Gradle build failed because Capacitor 8 requires Java 21. A workspace-local ignored JDK 21 was obtained; Gradle installed licensed SDK platform 36/build tools. A resource-linking failure during the initial build was resolved by a clean build. Both Customer and Driver then successfully executed actual `assembleDebug`, and the final reproducible `npm run build:android` helper verified APK files. This is stronger evidence than Capacitor sync.

APKs: `apps/customer-mobile/android/app/build/outputs/apk/debug/app-debug.apk` and `apps/driver-mobile/android/app/build/outputs/apk/debug/app-debug.apk`. Actual sizes/hashes are in `staging/android-build-results.json`. These are debug artifacts, not signed release submissions. Native HTTPS API configuration and real WebView cookie/camera/location/push acceptance remain; a relative `/api` web bundle is not a connected native deployment.

`adb devices` returned no attached devices. **Physical-device tests performed: none.** No iOS binary was built: this Windows host cannot run Xcode; macOS/Xcode and Apple provisioning are required. No APK/IPA signing, store upload or background-location claim is made.

## Files changed for staging

- `deploy/{staging.compose.yaml,staging.env.example,Caddyfile.staging,Dockerfile.api,compose.yaml}`
- `services/api/src/launch/{server,database,migrations,storage}.mjs`, `services/api/.env.example`
- `scripts/{staging-backup,staging-acceptance,build-android,launch-check}.mjs`, `package.json`
- `.github/workflows/launch.yml`, `.gitignore`
- `docs/STAGING-RUNBOOK.md`, `docs/LAUNCH-READINESS.md`, this report, staging verification evidence and build status.

Onboarding UI/API changes and their full file list are documented separately in `DRIVER-ONBOARDING-REPORT.md`.

## Blockers and remaining dependencies

Provide the chosen hosting provider/account, domain/DNS ownership/access, a compatible container host (or equivalent managed API service), PostgreSQL provisioning, private secret injection and backup destination. These are external setup dependencies; source changes cannot create access to them. No real staging URL, certificate, hosted database or scheduled recovery drill exists yet.

Then deploy the prepared stack, record four exact HTTPS URLs, execute remote acceptance, restart the deployed API and verify persistent records, and perform separate physical Customer/Driver/Admin device tests. Configure a verified recovery-email gateway if recovery must be accepted in staging. Maps/routes, email/SMS/push and private object storage require verified provider configuration. Staging payments intentionally stay simulated. Infrastructure alert delivery, production security review, legal/insurance and mobile signing remain separate launch dependencies.

Definition of done remains unmet until the HTTPS environment is reachable and the real hosted/device scenario is verified. The milestone remains PARTIAL.
