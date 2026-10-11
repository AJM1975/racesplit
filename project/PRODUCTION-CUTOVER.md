# RaceSplit production release — 11 October 2026

Approved by the user after staging review. The production release is live at https://racesplit.app as of 11 October 2026. Canonical-domain health, database readiness, both enabled authentication providers and the v23 offline assets were verified after cutover. A real Google/email sign-in and saved-race sync check on the canonical production domain remains for the user.

## Isolated resources

- Production Worker: `racesplit` (the name selected in Cloudflare).
- Production database: `racesplit-production-db`, ID `cf255b61-1bca-430b-8212-1cc3ccf11c0c` (created by the user).
- Production configuration: `wrangler.production.jsonc`.
- Staging configuration and database remain separate in `wrangler.jsonc`.
- Do not copy staging accounts, sessions or races into production automatically.

## Cloudflare build setup

Connect `AJM1975/racesplit`, branch `main`, root directory `/`, to the production Worker. No frontend build command is needed. Use `npm run deploy:production` as the deployment command for the first deployment; it applies the tracked migrations before deploying the Worker and public assets. After the first successful migration, use `npx wrangler deploy --config wrangler.production.jsonc` for routine UI releases, applying future migrations as a deliberate separate step.

Set `GOOGLE_CLIENT_SECRET` and `RESEND_API_KEY` as secrets on the production Worker. Public Google client ID, environment and sender address are in the production configuration. Secrets must not be committed. Add the production workers.dev origin and Google callback to the existing OAuth client for pre-cutover testing, then add `https://racesplit.app` and `https://racesplit.app/api/auth/callback/google` for the live domain.

Before domain cutover, verify `/api/health` reports production, `/api/storage/health` reports ready and `/api/auth/config` reports both providers enabled. Verify timing, offline shell, Google/email sign-in, athlete selection and saved-race sync. Retain the existing feedback destination and check it from the deployed feedback page.

The domain was onboarded to Cloudflare and attached to the production Worker. The production config tracks its custom domain. The existing `www` GitHub Pages record currently returns a redirect to the canonical domain; it remains in place. Email DNS records were preserved during onboarding. Keep the canonical live hostname the same so existing device localStorage remains accessible. A staging session is not a production session.

Previous apex website DNS: A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`. Previous `www` CNAME: `ajm1975.github.io`. Rollback must preserve all email records.

## Release and rollback

This sprint includes the approved RS branding, responsive header, Profile, unified Setup/Race view, themes, target times and controls, transition totals, split alignment, authentication and offline cloud sync. Password recovery, account deletion and provider linking UI remain unimplemented.

All 59 automated tests passed on the exact release candidate and staging was user reviewed. Physical iPhone checks beyond user feedback are not claimed. Close the sprint only after production is live and verified.

Previous GitHub Pages main commit: `926e255a5651dd2384a9d9ade42ec286abd8a627`. Roll back the domain route or production Worker deployment without deleting D1, saved device results or staging resources. If reverting UI assets, bump the offline cache version so clients receive the reverted assets.
