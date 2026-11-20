/** Browser side: send an error to /api/errors once per kind per page load (max 20), without ever throwing. */
const sent = new Set<string>();

export function reportError(err: unknown, where = '') {
  try {
    if (typeof window === 'undefined' || sent.size >= 20) return;
    const e = err instanceof Error ? err : new Error(typeof err === 'string' ? err : JSON.stringify(err));
    const message = `${where ? `[${where}] ` : ''}${e.message}`.slice(0, 500);
    if (sent.has(message)) return;
    sent.add(message);
    const body = JSON.stringify({ message, stack: (e.stack || '').slice(0, 3000), url: location.pathname });
    if (!navigator.sendBeacon?.('/api/errors', new Blob([body], { type: 'application/json' }))) {
      void fetch('/api/errors', { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => undefined);
    }
  } catch { /* reporting must never break the page */ }
}
