# Goal and PR targets — staging

Open **Goal / PR setup** above the clocks. Choose Off, Goal only, PR only or both. Enter individual split durations, or copy a compatible saved race into Goal, PR or both and adjust it. Apply one duration to every run without changing stations or transitions. Save commits the setup; Close/Escape cancels it.

The compact comparisons sit below each live clock. Accumulated targets sum all splits through the current split, not the complete event while racing. Comparison target values are green below target, red over target and neutral when equal or not running. There is no remaining/over countdown text. Screen-reader labels describe the comparison state. At finish, accumulated colour compares against the full event target. A missing preceding duration means no complete accumulated target (shown as —). The current-split comparison is hidden at finish, since the existing current clock resets to zero.

PR is an editable personal-reference baseline selected by the user, not an automatically calculated record assembled from different races. Imports require the same ordered split names and types. Partial results preload recorded splits only. Loading or editing targets never changes the source result, live timing state, event template or cloud upload queue.

Targets use separate local storage `racesplit-targets-v1`, keyed by athlete identity and ordered split layout. They persist offline on this device. Targets are not cloud-synchronised in this version; saved races already downloaded from cloud can be used as sources. No database migration is needed.

New files are included in the versioned service-worker cache. Revert this feature commit to remove the UI; preserve the independent storage key and bump the service-worker cache version for the rollback. Production remains unchanged.

Validation: time parsing; source immutability; matching/partial/invalid imports; bulk run isolation; cumulative missing values; UI setup/save/cancel; athlete isolation; live clock preservation; existing offline/auth/sync regression suite. Real iPhone and offline/reconnect review remain useful before promotion.
## Running screen space

Start automatically selects high-visibility Race view. While running or paused, the Goal/PR setup and Standard view toolbar and its explanatory summary are hidden. A small Setup button in the header reveals this toolbar; Hide setup collapses it again. Revealing controls does not pause or change timing. At finish/reset the normal controls return. Appearance remains in the header; choosing Standard view also restores the toolbar. Setup visibility is transient, not persisted, while race view preference and timing continue to persist as before.
