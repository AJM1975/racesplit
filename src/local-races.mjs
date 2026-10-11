import { inspectLegacy, LEGACY_KEY } from './legacy-storage.mjs';

export const DB_NAME = 'racesplit-local';
export const DB_VERSION = 1;
const STORE = 'records';

export function openRaceDb(indexedDB = globalThis.indexedDB) {
  if (!indexedDB) return Promise.reject(new Error('IndexedDB is unavailable'));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('RaceSplit database upgrade blocked by another tab'));
  });
}

export function transact(db, mode, operation) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    let result;
    try {
      const request = operation(store);
      if (request) {
        request.onsuccess = () => { result = request.result; };
        request.onerror = () => reject(request.error);
      }
    } catch (error) { reject(error); return; }
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('Transaction aborted'));
  });
}

export const getRecord = (db, key) => transact(db, 'readonly', store => store.get(key));
export const putRecord = (db, key, value) => transact(db, 'readwrite', store => store.put(value, key));

// A complete snapshot is saved atomically. Import is idempotent and non-destructive.
// Caller must explicitly supply localStorage and only migrate once verified.
export async function importLegacyOnce(db, storage) {
  const imported = await getRecord(db, 'legacy-import');
  if (imported) return { imported: false, reason: 'already-imported' };
  const raw = storage.getItem(LEGACY_KEY);
  const snapshot = inspectLegacy(raw);
  if (!snapshot.found) return { imported: false, reason: 'no-legacy-data' };
  await transact(db, 'readwrite', store => {
    store.put({ source: LEGACY_KEY, importedAt: new Date().toISOString(), raw }, 'legacy-import');
    store.put(snapshot, 'legacy-snapshot');
  });
  return { imported: true, races: snapshot.races.length, templates: snapshot.templates.length };
}
