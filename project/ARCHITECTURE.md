# RaceSplit Architecture

## Staging platform (2026-10-10)

Branch `feature/cloudflare-platform-foundation` uses a Cloudflare Worker for static PWA assets and cookie-authenticated APIs backed by staging D1. Authentication, athlete management and sync implementation and verification limits are recorded in [SPRINT-AUTH-SYNC.md](SPRINT-AUTH-SYNC.md).

The timer and device history work independently of authentication. LocalStorage remains the primary immediate snapshot, IndexedDB supplies recovery, and a persistent per-account outbox sends race snapshots with mutation IDs and expected revisions. OAuth and verification credentials remain server-side. Production is unchanged.

## Current production architecture

RaceSplit is currently a single-page browser application hosted on GitHub Pages.

### Hosting
- GitHub repository: `AJM1975/racesplit`
- Branch: `main`
- Entry point: `index.html`
- Custom domain: `racesplit.app`
- DNS: Porkbun
- Hosting: GitHub Pages
- Analytics: Cloudflare Web Analytics

### Storage
Current user data is stored locally in the browser/device.

Primary data concepts:

#### Event Template
Defines what will be timed.

Typical fields:
- template ID
- name
- source / built-in vs custom
- sequence of activities
- run blocks
- transition blocks
- activity labels / distance / reps
- timing configuration

#### Race Result
Represents one completed or saved attempt.

A result should contain:
- athlete
- event name
- event/template snapshot
- start time
- total elapsed time
- individual split timestamps
- calculated split durations
- corrections
- run/station/transition totals

**Important:** results should contain an event snapshot rather than only a reference to a template. This protects historical results when templates are later edited.

## Timing model

Race timing should be based on timestamps rather than incrementing counters.

Conceptually:

`split duration = current split timestamp - previous split timestamp`

`accumulated time = current timestamp - race start - paused duration`

This makes corrections, undo and pause safer than relying on continuously accumulated counters.

## Event engine

The timer should operate on a generic ordered sequence:

`Run → Activity → Transition → Run → Activity ...`

Each item should carry a type such as:
- run
- activity
- transition
- custom

The core engine should not depend on DEKA names.

## Built-in templates

Built-in templates are immutable starting points:
- DEKA MILE
- DEKA FIT
- DEKA STRONG

Users can edit a copy through **Save As**, never overwrite the built-in definition.

## Future architecture triggers

Consider moving beyond the single-file app when any of these become important:
- user accounts,
- cloud sync,
- shared templates,
- multi-user collaboration,
- server-side analytics,
- live timing across devices.

At that point split into:
- frontend application,
- persistence/API layer,
- authentication,
- database.

Until then, keeping RaceSplit lightweight and client-side reduces complexity and makes race-day reliability easier.
