# RaceSplit Decision Log

This file records important product and architecture decisions so they do not have to be re-litigated later.

## 2026-10-04 — RaceSplit becomes broader than DEKA MILE

**Decision:** Build the product as a multi-event race timer rather than a DEKA MILE-only timer.

**Reason:** The same timing engine can support DEKA FIT, DEKA STRONG and custom fitness events.

---

## 2026-10-04 — Show current split and accumulated time together

**Decision:** The primary timing view displays both clocks at the same time.

**Reason:** During an event the timer needs to know how the current segment is progressing without losing sight of total race time.

---

## 2026-10-04 — Templates are the core event model

**Decision:** Every event is effectively a template. Users can start from a built-in template, edit it and choose **Save As**.

**Reason:** This is simpler and more flexible than having a special one-off custom event mode.

---

## 2026-10-04 — Built-in templates remain locked

**Decision:** DEKA MILE, DEKA FIT and DEKA STRONG cannot be overwritten.

**Reason:** A user should always have a reliable original definition available. Custom variants are created using **Save As**.

---

## 2026-10-04 — Track runs and transitions independently

**Decision:** Event configuration can choose whether runs, transitions, both or neither are timed as separate splits.

**Reason:** Different fitness event formats need different levels of timing detail.

---

## 2026-10-04 — Historical results store event snapshots

**Decision:** A result stores the event configuration used when that attempt was performed.

**Reason:** Editing a saved template later must not change the meaning of old race results.

---

## 2026-10-04 — Local-first MVP

**Decision:** Keep templates and race history on-device initially.

**Reason:** It keeps the MVP fast, inexpensive, reliable and usable without introducing login/backend complexity too early.

---

## 2026-10-04 — RaceSplit domain

**Decision:** Primary brand/domain is **RaceSplit** at **racesplit.app**.

**Reason:** The name clearly describes split timing while remaining broad enough for multiple event formats.


## 2026-10-10 — Staging authentication and cloud synchronisation

Accounts are optional for timing. Email accounts require verification; Google uses PKCE and browser-bound state. Sessions use server-revocable HttpOnly cookies. Existing password and Google identities are never automatically linked by matching email.

Only explicitly owned races upload automatically. Anonymous device history requires explicit confirmation before account association. Race mutations carry a stable operation ID and expected revision; conflicts retain both copies rather than silently overwriting. Deleted races use tombstones and revision checks.

Production remains unchanged pending provider, D1 and physical iPhone validation.
