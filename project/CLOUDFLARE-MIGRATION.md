# RaceSplit Cloudflare migration — implementation baseline

Status: planning branch only; production unchanged.
Date: 2026-10-10

## Confirmed product decisions
- Public self-service registration with Google OAuth or verified email/password; no Cloudflare Access policies for athletes.
- Early Access opt-in available to any registered user.
- One account can manage/timing multiple athlete profiles.
- Results private by default; explicitly revocable sharing.
- Timing and local race storage fully usable without network or account.

## Audit findings
- Current GitHub Pages site uses static index.html, with inline timer JavaScript.
- Current persistent state uses localStorage key `racesplit-v3` for templates, race history, and active timing.
- Timer computes elapsed time using Date.now(), split ends, pause timestamps and paused duration.
- Feedback page posts to an existing external endpoint; preserve until Cloudflare-to-Zuvlo route is verified.
- Existing architecture documentation describes Porkbun DNS, GitHub Pages and Cloudflare Web Analytics; verify actual DNS ownership before cutover.
- No package.json at repository root; build pipeline must be introduced.

## Proposed components
- Cloudflare Workers Static Assets frontend and Workers API.
- D1 for identities, athlete profiles, event snapshots, results, split events, corrections, sharing grants, feature flags and feedback outbox.
- Better Auth with Google and verified email/password; Resend for verification and password recovery.
- IndexedDB for durable race state and an idempotent synchronisation queue; service worker caches the timer shell.
- R2 for feedback screenshots and future imports.
- Staging environment with separate D1/R2, secrets and deployment; production gated by approval.
- Zuvlo integration through server-side Worker with durable retry queue; never expose Zuvlo credentials in browser.

## Migration order
1. Baseline tests for start, split, pause/resume, undo, edit, finish, saved history, custom templates, exports and feedback.
2. Add project tooling and isolated Cloudflare staging configuration; leave DNS/production untouched.
3. Extract timing engine and introduce IndexedDB with one-time non-destructive import from `racesplit-v3`.
4. Introduce D1 schema, authentication and athlete ownership; add idempotent sync with conflict handling.
5. Add opt-in beta flags, feature/version metadata and screenshot feedback to Zuvlo.
6. Test offline recovery, cross-account isolation, rollback, backups and restoration.
7. Switch production after verification and explicit approval.

## Safety gates
- Do not overwrite or clear legacy localStorage until verified migration and user confirmation.
- Store immutable template snapshots with results; track timing corrections as append-only events.
- Keep timing operational when authentication/API/Zuvlo is unavailable.
- Never deploy experimental timing logic to all users without regression tests.
- Rotate previously shared Cloudflare API credentials before production configuration.

## Staging deployment note
- Cloudflare Workers Builds production branch is configured to `feature/cloudflare-platform-foundation`.
- Worker deploy command should be `npx wrangler deploy` (without `--env staging`), because the staging Worker name is defined directly in `wrangler.jsonc`.
- Verify that `.git/config` is inaccessible after deploying the public-only assets directory.
