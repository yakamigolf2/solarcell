import { NextResponse } from 'next/server';
import { recordError } from '@/lib/errors';

/** Collects Content-Security-Policy-Report-Only violations into the error log, so the policy can be tightened safely. */
export async function POST(req: Request) {
  const text = await req.text().catch(() => '');
  if (!text || text.length > 8000) return new NextResponse(null, { status: 204 });
  try {
    const body = JSON.parse(text);
    const rep = body['csp-report'] || (Array.isArray(body) ? body[0]?.body : body.body) || {};
    const directive = rep['effective-directive'] || rep['violated-directive'] || rep.effectiveDirective || '';
    const blocked = rep['blocked-uri'] || rep.blockedURL || '';
    const page = rep['document-uri'] || rep.documentURL || '';
    if (directive) await recordError({ message: `CSP (report-only): ${directive} blocked ${String(blocked).slice(0, 200)}`, source: 'client', url: String(page).replace(/^https?:\/\/[^/]+/, '').slice(0, 200) });
  } catch { /* ignore malformed reports */ }
  return new NextResponse(null, { status: 204 });
}
