# RaceSplit staging release gates
Production remains on GitHub Pages. No production cutover without explicit approval.

## Offline
- [x] iPhone standalone launch tested in airplane mode (user-confirmed 2026-10-10)
- [ ] Test refresh/relaunch during an active race and validate elapsed time
- [ ] Test iOS restart and storage eviction
- [ ] Validate IndexedDB snapshots match legacy localStorage and restore without overwriting existing state
- [ ] Test PWA upgrade while offline

## Database and authentication
- [x] Draft D1 relational schema with per-user ownership and private sharing grants
- [ ] Create isolated staging D1, bind as DB, apply migration
- [ ] Integrate vetted auth library, verified email/password, Google OAuth, secure session cookies
- [ ] Test user isolation, CSRF, rate limiting, token rotation, account deletion

## Sync and sharing
- [ ] Implement authenticated idempotent writes with revision conflict checks
- [ ] Build client outbox, retry/backoff, offline conflict UI
- [ ] Implement random opaque share tokens stored as hashes, expiry/revocation
- [ ] Cross-device and revoked-link tests

## Feedback
- [ ] Validate existing Zuvlo endpoint, project routing, and authentication
- [ ] Add durable server outbox and scheduled delivery with safe retry
- [ ] Preserve existing feedback integration until verified

## D1 staging deployment
- Cloudflare build deploy command configured by operator to run remote D1 migrations before Worker deployment (2026-10-10).
- Validate the build log and `/api/storage/health` before using any cloud tables.
- After successful migration, restore deploy command to `npx wrangler deploy`; run migrations as a controlled separate step on future releases.
