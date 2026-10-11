# Driver onboarding repair and wizard

Status: **PASS for the central application workflow**, verified 11 October 2026 on `launch-development`. This is prototype onboarding, not legal or production-provider approval.

## Root cause and reproduction

A newly registered account on the running local API/persistent SQLite database selected an 800 KB PDF scan. The browser's `uploadFile` rejected anything above 650,000 bytes; bypassing the browser produced HTTP 400 from `/api/uploads` because the server capped the data URL below 900,000 characters. The picker advertised `image/*`, including formats the API rejected. The previous acceptance suite used a tiny PNG and therefore missed realistic scan sizes. Evidence: `onboarding/reproduction.json` and `onboarding/upload-before.png`. This reproduces a concrete failure class; the reported user's original file was not available, so its exact format/size is unknown.

Additional diagnosed gaps: upload and document submission were separate requests, permitting orphaned files when the second action failed; file content was not validated; terms had only a boolean; there was no complete-application submit gate or application-state queue. Positional command expiry dates were not explicitly converted at the server boundary. Existing session ownership and database persistence were working and were retained.

## Implementation

Seven focused stages: personal/vehicle details; prototype terms; identity; licence; vehicle registration (with optional vehicle photo); insurance and ABN evidence; review/submit. The existing Stage 1 domain requires identity, licence, registration, insurance and ABN for both supported vehicle classes. No additional mandatory category was invented. Profile draft saves are debounced; navigation saves the stage through the API. Current terms require explicit acceptance, a server timestamp and version `prototype-2026-10-v1`. Refresh and re-login restore progress and uploaded metadata. Back, Continue and Save and exit retain earlier work. Current terms are not a finalized legal agreement.

PNG, JPEG, WebP and PDF files up to 5 MiB are accepted with byte-signature checking on the server. HEIC conversion guidance, filenames, image preview/PDF download, reading/saving progress, retry, removal and replacement are provided. Native camera access uses the existing permission adapter. Progress distinguishes file reading and secure saving; it is not a network byte-count progress meter.

`POST /api/driver/documents` derives the driver from the session and atomically records upload ownership, document category, filename, expiry and pending review metadata. Durable request keys prevent duplicate metadata after response loss/retry. Files go through a private local disk adapter or a configurable authenticated HTTPS object-storage gateway. Database upload records reference private objects; existing inline database files remain readable. Authenticated reads enforce owner/admin access; there is no public static document URL. Removal detaches a permitted draft document; replaced/detached file objects are retained for later retention cleanup rather than silently deleted.

Application states are Draft, Pending Review, Changes Required, Approved and Rejected, with the existing suspension flag handled separately. File success does not imply application submission or approval. Submission validates profile, vehicle, current terms and all mandatory current evidence. Admin decisions require Manager privileges; Support can inspect but cannot approve. Individual rejection/request-info requires a reason. An entire application cannot be approved until it was submitted and every mandatory document is approved/current. Changes requests persist notes, notify the driver and disable online access. Replacement resets review; resubmission returns to Pending Review. Existing expiry/offline and offer-eligibility checks remain enforced.

## Files

- `apps/driver-web/src/{Documents,OnboardingWizard,LegacyDocuments,app}.tsx`
- `apps/admin-web/src/{Drivers,DriverApplications,LegacyDrivers}.tsx`
- `apps/customer-web/src/styles.css`
- `packages/shared/src/index.ts`, `packages/app-session/src/session.tsx`
- `services/api/src/launch/{server,storage}.mjs`, `services/api/{package.json,.env.example}`
- `scripts/launch-check.mjs`, `tests/storage.test.mjs`, `package.json`
- `deploy/{Dockerfile.api,compose.yaml}` for private persistent document volume
- Screenshot/result evidence in `docs/progress/onboarding/` and refreshed launch acceptance evidence.

## Verification

- `npm run typecheck`: zero errors (strict frontend/shared TypeScript; API ES modules use syntax checks).
- `npm run build`: all workspaces build.
- `npm test`: 18 existing domain/invariant tests plus 3 private-storage tests pass.
- `npm run test:providers`: provider contract fixture passes.
- `npm run test:launch` and production-bundle `node scripts/production-smoke.mjs`: newly registered accounts complete all stages, terms gate/refresh, 800 KB PDF, all mandatory uploads, simulated storage failure/retry, server content rejection, completeness blocking, Admin private preview, rejected-document replacement, resubmission, approval, online eligibility, expiry blocking, unrelated-driver privacy, file/metadata persistence after API restart and re-login. Existing complete customer/delivery/dispute/finance/reassignment scenarios pass. No browser runtime errors.
- `npm run test:e2e`: all five preserved-demo suites pass, including 64 responsive/label/keyboard checks.
- Separate verification on the **running real local database** `.data/porter-launch.sqlite`: a genuinely new driver completes the wizard, uploads five 800 KB PDFs, submits, is reviewed/approved by the configured Manager, goes online/offline and signs out/in successfully. `onboarding/persistent-local-results.json` records this test without passwords. Existing marketplace records were preserved.

Browser plugin was not available; Playwright/Edge was used. Screenshots: `onboarding/identity-mobile.png`, `review-mobile.png`, `admin-review.png`, `approved-local-admin.png`; design reference `design-concept.png`. Loaded screens were checked at 390×844 and 1440×1000, including overflow and functioning controls.

## Limitations

Private HTTPS storage gateway contract is implemented and fixture-tested, but no external storage account is connected. Signature checks are not malware scanning or full PDF/image semantic validation. Sensitive-document retention, encrypted off-host backups, security review and finalized legal requirements remain launch dependencies. Physical native camera/file-picker/WebView acceptance is not yet performed. Simulator payments and estimated routes remain explicitly labelled. Android binaries and staging infrastructure are reported separately in the staging milestone report.
