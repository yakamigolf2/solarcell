/** LINE Messaging API push (LINE Notify was shut down in 2025). No-op until LINE_CHANNEL_ACCESS_TOKEN and LINE_TO are set. */
export function lineConfigured() {
  return !!(process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_TO);
}

export async function notifyLine(text: string): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const targets = (process.env.LINE_TO || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!token || !targets.length) return false;
  let ok = true;
  for (const to of targets) {
    try {
      const res = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ to, messages: [{ type: 'text', text: text.slice(0, 4900) }] }),
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) { ok = false; console.error('LINE push failed', res.status, await res.text().catch(() => '')); }
    } catch (e) { ok = false; console.error('LINE push failed', e); }
  }
  return ok;
}

export const adminUrl = () => `${process.env.APP_URL || 'https://beg-solarcell.vercel.app'}/admin`;
