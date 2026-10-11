# Authentication, athletes and sync — 2026-10-10

Scope: feature/cloudflare-platform-foundation / PR #10 only. Production/main unchanged.

## Implemented and locally validated
- Optional email/password registration via Resend, one-hour hashed single-use verification links; email verification gates login. Repeat registration with the correct password resends verification. Generic responses avoid exposing existing verified registrations.
- Google authorization-code OAuth with PKCE and browser-bound, hashed, single-use ten-minute state; verified email required. Existing password accounts are not silently linked by email.
- Seven-day Secure/HttpOnly/SameSite cookies; session tokens stored only as SHA-256 hashes; logout revocation, expiry and verified-account enforcement.
- Origin and explicit account-identity checks on cookie-authenticated mutations, parameterized SQL, ownership checks, bounded input and persistent ten-minute/IP authentication limits.
- Multiple athlete profiles per account: add, select, rename, soft-delete. Historical races retained. Early Access opt-in.
- Save locally first, then sync owned races. Explicit confirmation before claiming anonymous device races. Account-specific persistent outbox, reconnect/foreground/periodic retry, exponential backoff, permanent validation rejection blocking.
- Mutation IDs make lost-response replay idempotent; revision checks prevent silent overwrite. Conflict UI preserves the local copy as a separate race. Soft-deletion tombstones propagate and deletion checks revisions.
- Cloud pull merges other-device results without replacing pending local changes. Race snapshots retain template/stages/splits, pause metadata and athlete association; private cloud storage by default.
- Cached PWA shell includes sync modules. Service-worker upgrades wait for existing clients to close; IndexedDB recovery runs before writing initial empty state.
- 33 Node tests including SQLite-backed migrations/API integration. Mocked Resend and Google exchanges pass. Worker dry-run builds.

## Deployment requirements / not yet validated
1. Authenticate Wrangler against the existing Cloudflare account, or use its connected build integration.
2. Run `npm run deploy:staging` (applies migration 0002 to racesplit-staging-db before deploying). Do not use production/main.
3. Configure Worker secrets `RESEND_API_KEY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`; configure `RESEND_FROM_EMAIL` with an existing verified Resend sender.
4. Register Google redirect URI `https://racesplit-staging.az-mcintosh.workers.dev/api/auth/callback/google` and staging authorized origin in Google's OAuth console.
5. Verify `/api/health` build `auth-athletes-sync-v1`, `/api/storage/health`, `/api/auth/config`; then test real email delivery, Google consent, two-account isolation and cross-device sync.
6. Physical iPhone QA: installed launch without connection, active race relaunch, pause/resume, save offline then sign in/sync, pending conflict, app upgrade and device restart. Existing prior offline-launch confirmation does not validate this sprint.
7. Zuvlo update needs an authenticated session to staging.zuvlo.fyi. Record this sprint, test evidence, commit reference and credential/device-QA blockers. Do not mark deployment/provider/iPhone verification complete.

## Remaining limitations / release gates
- No password recovery, account deletion or provider linking UI yet; these remain production release gates.
- PBKDF2-SHA256 uses 100,000 iterations (Workers native limit) with random per-password salt. Upgrade to vetted memory-hard hashing / managed identity and independent security review before production rollout.
- Authenticated offline session cannot be proven after reload: anonymous local saving still works, with explicit later claiming. Athlete creation/editing requires connectivity.
- Local results remain on a shared device after sign-out, disclosed in the UI; cookies/secrets are never stored in localStorage. Account switching never claims another owner's results.
- Cloud history currently capped at 10,000 rows; pagination, richer conflict comparison, and multi-tab local-history coordination remain future work.
- DOM tests verify offline local save, paused timer reload and IndexedDB recovery ordering. SQLite test adapter exercises SQL but is not a substitute for real D1 and physical Safari validation.

## Staging evidence after implementation commit 4494f62

- GitHub Actions push and PR checks passed.
- Existing Cloudflare integration deployed the new code: live `/api/health` returns `build: auth-athletes-sync-v1`; live page contains the account UI.
- `/api/auth/config` returns `email: false, google: false`: provider credentials are absent. These capabilities remain unverified with real providers.
- Latest Cloudflare check is marked failed after another build was triggered; no failure details are available through the GitHub connector. Deployment outcome is verified by live code, while the failed-build discrepancy remains open pending Cloudflare log access.
- Zuvlo remains behind Cloudflare Access with no authenticated session. No Zuvlo records were changed.

## Configuration alignment

Concurrent staging commits 98c0e62 and c0bf0e6 configure the public Google client ID, `/api/auth/callback/google` and `RESEND_FROM_EMAIL`. Tests and setup notes now match these values. Live OAuth start returns 302 to Google with S256 PKCE and the configured callback. Latest live config: Google enabled, email disabled. Real Google login and email delivery remain unverified.
