/**
 * SlipOK slip verification (https://slipok.com). Verify: POST https://api.slipok.com/api/line/apikey/{branchId},
 * header `x-authorization: <API key>`, multipart body with `url` (or `files` / `data`), optional `amount`, and `log`.
 * Error codes per SlipOK docs: 1012 duplicate slip, 1013 amount mismatch, 1014 receiver is not the shop's account,
 * 1010 bank needs a few minutes before the slip can be checked, 1009 bank outage (quota not used).
 */
const BASE = process.env.SLIPOK_API_BASE || 'https://api.slipok.com/api/line/apikey'; // override only for tests

export function slipOkConfigured() {
  return !!(process.env.SLIPOK_BRANCH_ID && process.env.SLIPOK_API_KEY);
}

export type SlipCheckStatus = 'ok' | 'duplicate' | 'amount_mismatch' | 'receiver_mismatch' | 'retry' | 'invalid' | 'error';

export type SlipCheck = {
  status: SlipCheckStatus;
  code: string;
  message: string;
  transRef: string;
  amount: number | null;
  transDate: string;
  transTime: string;
  sender: string;
  receiver: string;
  checkedAt: string;
  by: string;
};

const STATUS_BY_CODE: Record<string, SlipCheckStatus> = { '1012': 'duplicate', '1013': 'amount_mismatch', '1014': 'receiver_mismatch', '1009': 'retry', '1010': 'retry' };

export const SLIP_STATUS_LABEL: Record<SlipCheckStatus, string> = {
  ok: 'สลิปถูกต้อง',
  duplicate: 'สลิปซ้ำ (เคยใช้แล้ว)',
  amount_mismatch: 'ยอดเงินไม่ตรงกับงวด',
  receiver_mismatch: 'บัญชีผู้รับไม่ใช่บัญชีบริษัท',
  retry: 'ตรวจไม่ได้ชั่วคราว ลองใหม่อีกครั้ง',
  invalid: 'สลิปไม่ถูกต้อง / อ่าน QR ไม่ได้',
  error: 'ระบบตรวจสลิปขัดข้อง',
};

type Party = { displayName?: string; name?: string };
const partyName = (p?: Party) => String(p?.displayName || p?.name || '');

/** Ask SlipOK about the slip image at `url`, cross-checking `amount`. Never throws; failures come back as status 'error'. */
export async function verifySlip(url: string, amount: number, by: string): Promise<SlipCheck> {
  const base = { transRef: '', amount: null, transDate: '', transTime: '', sender: '', receiver: '', checkedAt: new Date().toISOString(), by };
  try {
    const form = new FormData();
    form.append('url', url);
    if (amount > 0) form.append('amount', String(amount));
    form.append('log', 'true'); // SlipOK keeps a log so a reused slip comes back as 1012
    const res = await fetch(`${BASE}/${process.env.SLIPOK_BRANCH_ID}`, { method: 'POST', headers: { 'x-authorization': process.env.SLIPOK_API_KEY || '' }, body: form, signal: AbortSignal.timeout(15000) });
    const body = await res.json().catch(() => null) as { success?: boolean; code?: string | number; message?: string; data?: Record<string, any> } | null;
    if (!body) return { ...base, status: 'error', code: String(res.status), message: `SlipOK ตอบกลับ ${res.status}` };
    const d = body.data || {};
    const detail = { transRef: String(d.transRef || ''), amount: typeof d.amount === 'number' ? d.amount : null, transDate: String(d.transDate || ''), transTime: String(d.transTime || ''), sender: partyName(d.sender), receiver: partyName(d.receiver) };
    if (res.ok && body.success && body.data && !body.code) return { ...base, ...detail, status: 'ok', code: '', message: 'สลิปถูกต้อง' };
    const code = String(body.code ?? res.status);
    return { ...base, ...detail, status: STATUS_BY_CODE[code] || (/^10(0[5-8]|11)$/.test(code) ? 'invalid' : 'error'), code, message: String(body.message || '') };
  } catch (e) {
    return { ...base, status: 'error', code: 'network', message: e instanceof Error ? e.message : String(e) };
  }
}

/** Remaining slips in the SlipOK package (for the monitor page). */
export async function slipOkQuota(): Promise<{ quota: number; specialQuota: number; overQuota: number } | null> {
  if (!slipOkConfigured()) return null;
  try {
    const res = await fetch(`${BASE}/${process.env.SLIPOK_BRANCH_ID}/quota`, { headers: { 'x-authorization': process.env.SLIPOK_API_KEY || '' }, signal: AbortSignal.timeout(8000) });
    const body = await res.json();
    const q = body?.data?.quota !== undefined ? body.data : body?.data?.data;
    return q ? { quota: Number(q.quota) || 0, specialQuota: Number(q.specialQuota) || 0, overQuota: Number(q.overQuota) || 0 } : null;
  } catch { return null; }
}
