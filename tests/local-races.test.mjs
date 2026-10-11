import test from 'node:test';
import assert from 'node:assert/strict';
import { openRaceDb, importLegacyOnce } from '../src/local-races.mjs';
test('unavailable IndexedDB is reported without touching legacy storage', async () => {
  await assert.rejects(openRaceDb(null), /unavailable/);
});
test('legacy importer requires a valid database before accessing storage', async () => {
  let touched = false;
  await assert.rejects(importLegacyOnce(null, { getItem() { touched = true; } }));
  assert.equal(touched, false);
});
