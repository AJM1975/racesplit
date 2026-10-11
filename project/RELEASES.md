# RaceSplit Release Notes

## Branding, mobile race UI and cloud accounts — 11 October 2026

### Production usability follow-up

- Aligned desktop setup fields and controls, including the signed-in athlete selector.
- Simplified athlete setup: explicit Add when empty, name + Change for one athlete, selector + Add athlete for multiple athletes.
- Adding saves and selects the athlete. Matching names now offer Use existing, Add another, or Cancel in Setup and Profile; duplicate names receive numbered display labels without changing saved names. Cancel and failed requests preserve selection, and active timing locks athlete changes.
- Remembers the last selected athlete per account on the device; Profile retains rename/delete management and signed-out timing remains available.
- Validation: 70 automated tests passed, including athlete setup and explicit duplicate-choice tests.

Deployed to https://racesplit.app on Cloudflare Workers with a separate production D1 database.

- Added angular RS branding, app icons, electric orange palette and automatic light/dark appearance.
- Added compact mobile header, Profile, unified event/athlete/target setup and Race view with large timing controls.
- Added editable Goal/PR split and accumulated targets, event starter estimates, bulk run targets, saved-race import and time steppers.
- Improved transition counts for events without runs, split/total alignment and Undo icon.
- Added Google and verified email accounts, multiple athletes and offline cloud sync.
- Preserved offline timing, local results and feedback destination.

Validation: 59 automated tests, checks and deployment dry runs passed; staging was user reviewed. Live production API health, database readiness, provider configuration, offline cache assets and www redirect passed. Real production sign-in and saved-race sync still require user verification.

## MVP — 4 October 2026

### Timing
- Added live race timer.
- Added individual split capture.
- Added current split time beside accumulated event time.
- Added pause.
- Added undo.
- Added editing of recorded splits to correct early/late taps.

### Events
- Added DEKA MILE.
- Added DEKA FIT.
- Added DEKA STRONG.
- Added generic custom event building.
- Added optional run timing.
- Added optional transition timing.

### Templates
- Reworked event model around reusable templates.
- Built-in DEKA templates are protected.
- Added Blank Event and From Template workflows.
- Added Save As for custom variants.
- Added saved custom events / My Events.

### Results
- Added saved race history.
- Added CSV export.
- Added JSON export.
- Results retain the event configuration used for the race.

### Deployment
- Deployed via GitHub Pages.
- Purchased and configured **racesplit.app**.
- Added apex GitHub Pages DNS records.
- Added `www` CNAME.
- TLS/HTTPS provisioning initiated through GitHub Pages.

