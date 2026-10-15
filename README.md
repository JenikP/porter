# Porter

Three independent account-based web applications sharing one persistent central API. The original connected frontend-only prototype remains a separate development demo.

## Run locally

Requires Node 22 (22.16 or newer) and npm.

```sh
npm ci
npm run dev
```

- Customer: http://127.0.0.1:5173 — register a personal or business account.
- Driver: http://127.0.0.1:5174 — register, complete onboarding and submit documents.
- Operations: http://127.0.0.1:5175 — dedicated administrator sign-in, no public registration.
- API: http://127.0.0.1:3001/api/health — persistent local SQLite database in ignored `.data/`.

The first API startup creates ignored `.env.launch` with a random manager password and the development manager email. Read that local file to sign in; never commit it. Document approval and driver approval must happen in Operations before a driver can go online. Registered accounts begin with empty records. The test harness creates isolated fixture accounts and databases, separate from your normal development records.

Each app can start on its own with `npm run dev:customer`, `dev:driver` or `dev:admin`; run `npm run dev:api` alongside it. Each app has separate routes, environment template and `dist` output. **Development / QA role preview only:** `apps/porter-web` is an internal combined preview, never a production entry point or native app. Its visible DEVELOPMENT PREVIEW banner and role switcher are exclusive to that workspace. The connected demo runs with `npm run dev:demo` at http://127.0.0.1:5176 and retains role switching and localStorage; it is excluded from `build:production` and deployment configuration.

## Verify

```sh
npm run typecheck
npm run build
npm test
npm run test:providers
npm run test:separation
npm run test:launch
node scripts/production-smoke.mjs
```

`test:separation` builds each production app in a disposable directory with all sibling app directories absent. Reusable delivery presentation lives in `packages/marketplace-ui`; shared baseline CSS lives in `packages/ui/src/application.css`, with the approved Premium V2 layer applied last. `test:launch` starts an isolated API and all three apps, then verifies real independent accounts and the delivery/dispute lifecycle. Production smoke uses already-built bundles. On Windows the harness uses installed Edge. Elsewhere use `PORTER_PLAYWRIGHT_PATH=playwright PORTER_BROWSER_CHANNEL=chromium` after `npx playwright install chromium`. The PostgreSQL CI workflow sets these automatically. For preserved-demo checks, start `dev:demo` then run `npm run test:e2e`.

## Deployment and mobile

See [launch runbook](docs/LAUNCH-RUNBOOK.md), [mobile architecture](docs/MOBILE-FOUNDATIONS.md), [phase reports](docs/progress/LAUNCH-ROADMAP.md) and [launch checklist](docs/LAUNCH-READINESS.md). Production requires PostgreSQL, HTTPS, separately provisioned manager access and configured external gateways. Docker/CI configuration is prepared; hosting has not been provisioned. Payment, routing, recovery and outbound delivery channels use clearly labeled simulators locally. This branch is not approved for real customer launch.
