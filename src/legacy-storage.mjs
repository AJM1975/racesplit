// Read-only legacy import. Never delete or overwrite racesplit-v3.
export const LEGACY_KEY = 'racesplit-v3';
export function inspectLegacy(raw) {
  if (raw == null) return { found: false, races: [], templates: [], active: null };
  let state;
  try { state = JSON.parse(raw); } catch { throw new Error('Legacy RaceSplit data is not valid JSON'); }
  if (!state || typeof state !== 'object' || Array.isArray(state)) throw new Error('Invalid legacy state');
  const races = Array.isArray(state.history) ? state.history : [];
  const templates = Array.isArray(state.customTemplates) ? state.customTemplates : [];
  const active = state.start != null ? {
    start: state.start, ends: Array.isArray(state.ends) ? state.ends : [],
    pausedAt: state.pausedAt ?? null, pausedMs: state.pausedMs ?? 0,
    finished: !!state.finished, athlete: state.athlete ?? '', selected: state.selected ?? null,
    draft: state.draft ?? null
  } : null;
  return { found: true, races, templates, active };
}
export function elapsedAt({ start, ends = [], pausedAt = null, pausedMs = 0, finished = false }, now) {
  if (start == null) return 0;
  if (finished) return ends.at(-1) ?? 0;
  return Math.max(0, (pausedAt ?? now) - start - pausedMs);
}
