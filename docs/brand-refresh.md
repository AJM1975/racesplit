# RaceSplit staging brand preview

Baseline: `70b2e03962de3b71a37adf04583c85117cebcfe3`.
Branch: `feature/brand-ui-refresh`. Production/main are not changed.

Reference: approved “RaceSplit: Every Split Counts.png”, 10 October 2026.
SVG mark is a vector reconstruction of the angular RS / split-marker reference,
not an original vector supplied by the designer. Review it on staging before acceptance.
Palette: electric orange #FF641C, midnight navy #101722, near-white #F7F8FA,
graphite #2A2F36, steel #9AA3AD. Accessible orange text uses #A83700 in
light mode and #FF8B55 in dark mode. System fonts keep the app self-contained offline;
Sora from the reference is not bundled.

## Review and instant revert

Use Design → Current design to restore the previous timer appearance immediately.
The preference persists on this device. New design defaults to Automatic appearance
and follows system light/dark mode. Explicit Light/Dark are also available.
Race Mode uses a high-contrast dark surface, bigger timing displays and large controls.
Exit Race Mode restores the regular layout without restarting the race.
Appearance settings use a separate `racesplit-appearance-v1` localStorage key;
they do not modify races, sync queues, athlete profiles or authentication.

## Deployment rollback

Revert the branding commit on the staging branch and let the existing staging build run.
Do not reset/force-push, alter D1, clear localStorage or delete race data.
Bump the service-worker cache version when reverting so old cached branding is replaced.
The original icon.svg is preserved. Native Home Screen icons may require re-adding
an installed shortcut to change its icon; the in-app design switch does not change that OS icon.

## Verification

40 tests: existing timer/storage/auth/sync suite, persisted design rollback, appearance
changes preserving displayed timing, Race Mode toggle, offline asset inventory and
AA text/action contrast. Main labels and buttons use >=48px targets; split edits >=44px.
Browser layout and physical iPhone/outdoor readability require staging visual validation.
No database migration, external font request or change to server endpoints.
# Header simplification after design approval

The user approved the new design and requested removal of the old/new selector. The refreshed appearance is now always selected, including when a device previously saved `current`. The sun/Auto/moon control is in the top-right brand row. The optional high-visibility view is a compact Race view / Standard view toggle beside Goal/PR setup. Preview helper text is hidden. These changes do not alter account, race or target storage. The earlier immediate UI-switch instructions below describe the initial evaluation build only; rollback is now by a Git revert and service-worker cache bump. Keep the recorded baseline and do not delete local data during rollback.

## Compact header account control

The full email address is removed from the persistent race header. A compact Signed in / Sign in account disclosure sits beside Ready/Live/Paused. Opening it shows the email, Account & sync link, and Sign out for an authenticated user. The existing logout workflow is reused, including its busy-sync guard. Saved device races and persisted pending uploads are not deleted by this UI change. Account management remains available in the existing Account & cloud sync section.
