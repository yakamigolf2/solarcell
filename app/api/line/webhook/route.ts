import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

/**
 * LINE webhook, used only for setup: add the bot to a group (or chat with it) and type "id";
 * it replies with the ID to put in LINE_TO. Requests are verified with LINE_CHANNEL_SECRET.
 */
export async function POST(req: Request) {
  const secret = process.env.LINE_CHANNEL_SECRET, token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const raw = await req.text();
  if (!secret || !token) return NextResponse.json({ ok: true });
  const expected = createHmac('sha256', secret).update(raw).digest();
  const given = Buffer.from(req.headers.get('x-line-signature') || '', 'base64');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return NextResponse.json({ error: 'bad signature' }, { status: 401 });

  const events: any[] = JSON.parse(raw).events || [];
  for (const ev of events) {
    const asked = ev.type === 'join' || (ev.type === 'message' && ev.message?.type === 'text' && ev.message.text.trim().toLowerCase() === 'id');
    if (!asked || !ev.replyToken) continue;
    const id = ev.source?.groupId || ev.source?.roomId || ev.source?.userId || '';
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ replyToken: ev.replyToken, messages: [{ type: 'text', text: `ID สำหรับตั้งค่า LINE_TO:\n${id}` }] }),
    }).catch(() => undefined);
  }
  return NextResponse.json({ ok: true });
}
