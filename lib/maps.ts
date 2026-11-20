/** Google Maps link helpers (client-safe, no API key needed). */

const SHORT_HOSTS = ['maps.app.goo.gl', 'goo.gl'];

export function isShortMapLink(url: string) {
  try { const u = new URL(url.trim()); return SHORT_HOSTS.includes(u.hostname) && (u.hostname !== 'goo.gl' || u.pathname.startsWith('/maps')); } catch { return false; }
}

/** What to put after `q=` in the embed: "lat,lng" when the link has coordinates, else the place name. Null if not a Maps link. */
export function mapQuery(url: string): string | null {
  const raw = url.trim();
  if (!raw) return null;
  let u: URL;
  try { u = new URL(raw); } catch { return null; }
  if (!/(^|\.)google\.[a-z.]+$/.test(u.hostname) && !u.hostname.startsWith('maps.')) return null;
  const s = decodeURIComponent(u.href);
  const pin = s.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/); // the dropped pin, more exact than the viewport
  if (pin) return `${pin[1]},${pin[2]}`;
  for (const k of ['q', 'query', 'll', 'destination']) {
    const v = u.searchParams.get(k);
    if (v) return v;
  }
  const at = s.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) return `${at[1]},${at[2]}`;
  const place = u.pathname.match(/\/place\/([^/]+)/);
  if (place) return decodeURIComponent(place[1]).replace(/\+/g, ' ');
  return null;
}

export const mapEmbedSrc = (q: string) => `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&hl=th&output=embed`;
