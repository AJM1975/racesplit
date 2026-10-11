// Pure queue helpers; no network access and no dependency on authentication.
export function enqueue(queue, item) {
  if (!item || typeof item.id !== 'string' || !item.id) throw new TypeError('Queue item needs an id');
  if (queue.some(existing => existing.id === item.id)) return queue;
  return [...queue, { ...item, attempts: 0, queuedAt: new Date().toISOString() }];
}
export function nextPending(queue, now = Date.now()) {
  return queue.find(item => !item.blocked && (!item.retryAt || Date.parse(item.retryAt) <= now)) || null;
}
export function markDelivered(queue, id) { return queue.filter(item => item.id !== id); }
export function markConflict(queue, id, serverRevision) {
  return queue.map(item => item.id === id ? { ...item, blocked: 'revision-conflict', serverRevision } : item);
}
export function markRetry(queue, id, now = Date.now()) {
  return queue.map(item => {
    if (item.id !== id) return item;
    const attempts = (item.attempts || 0) + 1;
    const delay = Math.min(3600000, 1000 * 2 ** Math.min(attempts, 12));
    return { ...item, attempts, retryAt: new Date(now + delay).toISOString() };
  });
}
export async function flushQueue(queue, send, now = Date.now()) {
  let current = queue;
  while (true) {
    const item = nextPending(current, now);
    if (!item) return current;
    let response;
    try { response = await send(item); } catch { return markRetry(current, item.id, now); }
    if (response.status === 409) return markConflict(current, item.id, response.revision ?? null);
    if (response.status === 401 || response.status === 403) return current; // Login required; don't consume or retry aggressively.
    if ([400,404,413,422].includes(response.status)) { current=current.map(q=>q.id===item.id?{...q,blocked:'invalid-request',error:response.error||'Upload rejected'}:q); continue; }
    if (response.ok) { current = markDelivered(current, item.id); continue; }
    return markRetry(current, item.id, now);
  }
}
