import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectLegacy, elapsedAt } from '../src/legacy-storage.mjs';
test('missing legacy state is safe', () => assert.equal(inspectLegacy(null).found, false));
test('legacy race and custom template history is retained', () => {
  const input = { history: [{ id: 'race1', ends: [1000] }], customTemplates: [{ id: 'custom1' }], start: 100, ends: [1000], pausedMs: 0 };
  const snapshot = inspectLegacy(JSON.stringify(input));
  assert.deepEqual(snapshot.races, input.history);
  assert.deepEqual(snapshot.templates, input.customTemplates);
  assert.equal(snapshot.active.start, 100);
});
test('corrupt data throws instead of silently overwriting', () => assert.throws(() => inspectLegacy('{broken')));
test('elapsed time accounts for pauses', () => assert.equal(elapsedAt({ start: 1000, pausedMs: 200 }, 2500), 1300));
test('paused clock remains frozen', () => assert.equal(elapsedAt({ start: 1000, pausedAt: 1800, pausedMs: 100 }, 5000), 700));
test('finished clock uses final split', () => assert.equal(elapsedAt({ start: 1000, finished: true, ends: [300, 700] }, 5000), 700));
