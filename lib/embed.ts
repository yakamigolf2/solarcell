/** Turns a pasted YouTube / Vimeo link into a safe embed URL. Anything else returns null (never trust arbitrary iframes). */
export function toEmbedUrl(input: string): string | null {
  let u: URL;
  try { u = new URL(input.trim()); } catch { return null; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
  const host = u.hostname.replace(/^www\.|^m\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v');
    else { const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([\w-]{6,})/); id = m ? m[1] : null; }
  }
  if (id && /^[\w-]{6,20}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`;
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const m = u.pathname.match(/(\d{5,})/);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
  }
  return null;
}
