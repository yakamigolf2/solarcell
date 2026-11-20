import { reportError } from '@/lib/report-error';
import { type SlipCheck } from '@/lib/slipok';
import { installmentAmount, LEGACY_STATUS, quoteTotals, STATUSES as JOB_STATUSES, type QuoteApproval, type Receipt, type Status as JobStatus } from '@/lib/job';
import { type SpecGroup } from '@/components/admin/GroupsEditor';
import type { Attachment } from '@/lib/quote-pdf';

// ---------- Safe helpers: every risky spot is guarded ----------
// Falls back instead of crashing the screen, but reports the error so it is no longer silent.
export function safe<T>(fn: () => T, fallback: T): T { try { return fn(); } catch (e) { reportError(e, 'safe'); return fallback; } }
export function safeNum(v: any, fallback = 0): number { const n = Number(v); return Number.isFinite(n) ? n : fallback; }

// ---------- API (records only, guarded) ----------
export async function callApi(action: string, args: any) {
  const controller = new AbortController();
  const timer = setTimeout(() => { try { controller.abort(); } catch { /* ignore */ } }, 8000);
  try {
    const res = await fetch("/api/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, args }), signal: controller.signal });
    const json = await res.json().catch(() => ({} as any));
    if (!res.ok || (json as any).error) throw Object.assign(new Error((json as any).error || `API error ${res.status}`), { status: res.status, code: (json as any).code });
    return (json as any).data;
  } finally { clearTimeout(timer); }
}
export async function createRow(collection: string, value: any, key: string) { return callApi("records.create", { collection, value, idempotency_key: key }); }
export async function replaceRow(collection: string, id: string, value: any, expectedUpdatedAt?: string) { return callApi("records.replace", { collection, id, value, expected_updated_at: expectedUpdatedAt }); }
export const isConflict = (e: unknown) => (e as any)?.code === 'conflict';

// ---------- Types ----------
export type Status = JobStatus;
export type QuoteItem = { name: string; qty: number; price: number; discount?: number; vatPct?: number; details?: string[]; groups?: SpecGroup[] };
export type Payment = { label: string; pct: number; status: 'ยังไม่โอน' | 'โอนแล้ว' | 'รอตรวจสอบ' | 'ยืนยันแล้ว'; slip: string; due: string; receipt?: Receipt; slipCheck?: SlipCheck };
export type ElecStep = { label: string; done: boolean; date: string; note: string };
export type Contact = { date: string; type: string; note: string };
export type NoteHistoryItem = { date: string; text: string };
export type PhotoGroup = 'before' | 'after';
export type SitePhoto = { id: string; group: PhotoGroup; url: string; caption: string; date: string; photographer: string; category: string };
export type ChecklistItem = { id: string; group: PhotoGroup; label: string; done: boolean };
export type Job = {
  customer: string; phone: string; line: string; address: string; mapUrl?: string; quoteApproval?: QuoteApproval | null; saleId?: string; saleName?: string; techId?: string; techName?: string; installDate?: string; installDays?: number; leadSource?: string; source?: string; publicToken?: string; handover?: { name: string; signedAt: string; signature: string } | null; building: string; bill: number; roofArea: number; roofDir: string; meter: string; need: string;
  status: Status; created: string; kw: number; panels: number; inverter: string; roofStruct: string; cable: number; photos: string; surveyNote: string;
  items: QuoteItem[]; discount: number; labor: number; payments: Payment[]; elecWanted: boolean; elec: ElecStep[]; contacts: Contact[]; nextAppt: string; attach: string; customerNote: string; noteHistory: NoteHistoryItem[];
  sitePhotos: SitePhoto[]; photoChecklist: ChecklistItem[];
  quoteDocNo?: string; quoteIssueDate?: string; quoteAcceptDate?: string; quoteValidUntil?: string; quoteRef?: string;
  customerTaxId?: string; customerAttn?: string; contactBackName?: string; contactBackPhone?: string; contactBackEmail?: string;
  quoteNote1?: string; quoteNote2?: string; quoteRemark?: string; attachments?: Attachment[];
};
export type Rec = { id: string; value: Job; updatedAt?: string };
export type CompanySettings = { address: string; phone: string; taxId: string; email?: string };
export type Role = 'Admin' | 'Sale' | 'Technician' | 'Accountant';
export type PermKey = 'customers_view' | 'customers_create' | 'customers_edit' | 'customers_delete' | 'orders_view' | 'orders_create' | 'orders_edit' | 'orders_delete' | 'orders_change_status' | 'quotes_view' | 'quotes_create' | 'quotes_edit' | 'quotes_approve' | 'finance_view' | 'finance_confirm' | 'finance_edit_installments' | 'electric_view' | 'electric_update' | 'photos_view' | 'photos_upload' | 'photos_delete' | 'users_view' | 'users_manage' | 'settings_view' | 'settings_edit' | 'news_manage' | 'projects_manage' | 'products_manage' | 'clients_manage';
export type Permissions = Record<PermKey, boolean>;
export type AppUser = { name: string; username: string; password: string; phone: string; email: string; role: Role; status: 'ใช้งาน' | 'ปิดใช้งาน'; created: string; lastLogin: string; permissions: Permissions ; lineLinked?: boolean; lineName?: string; linePicture?: string };
export type UserRec = { id: string; value: AppUser };

export const ALL_PERMS: PermKey[] = ['customers_view', 'customers_create', 'customers_edit', 'customers_delete', 'orders_view', 'orders_create', 'orders_edit', 'orders_delete', 'orders_change_status', 'quotes_view', 'quotes_create', 'quotes_edit', 'quotes_approve', 'finance_view', 'finance_confirm', 'finance_edit_installments', 'electric_view', 'electric_update', 'photos_view', 'photos_upload', 'photos_delete', 'users_view', 'users_manage', 'settings_view', 'settings_edit', 'news_manage', 'projects_manage', 'products_manage', 'clients_manage'];
export function permsFrom(list: PermKey[]): Permissions { const o = {} as Permissions; ALL_PERMS.forEach(k => o[k] = list.includes(k)); return o; }
export const ROLE_PERMS: Record<Role, Permissions> = {
  Admin: permsFrom(ALL_PERMS),
  Sale: permsFrom(['customers_view', 'customers_create', 'customers_edit', 'orders_view', 'orders_create', 'orders_edit', 'orders_change_status', 'quotes_view', 'quotes_create', 'quotes_edit', 'finance_view', 'electric_view', 'photos_view', 'settings_view']),
  Technician: permsFrom(['customers_view', 'orders_view', 'orders_edit', 'orders_change_status', 'quotes_view', 'electric_view', 'electric_update', 'photos_view', 'photos_upload']),
  Accountant: permsFrom(['customers_view', 'orders_view', 'quotes_view', 'finance_view', 'finance_confirm', 'finance_edit_installments', 'electric_view', 'photos_view', 'settings_view']),
};
export const ROLE_LABEL: Record<Role, string> = { Admin: 'ผู้ดูแลระบบ', Sale: 'ฝ่ายขาย', Technician: 'ช่าง', Accountant: 'บัญชี' };
export const PERM_GROUPS: { module: string; items: { key: PermKey; label: string }[] }[] = [
  { module: 'ลูกค้า', items: [{ key: 'customers_view', label: 'ดู' }, { key: 'customers_create', label: 'สร้าง' }, { key: 'customers_edit', label: 'แก้ไข' }, { key: 'customers_delete', label: 'ลบ' }] },
  { module: 'ออเดอร์ / งานติดตั้ง', items: [{ key: 'orders_view', label: 'ดู' }, { key: 'orders_create', label: 'สร้าง' }, { key: 'orders_edit', label: 'แก้ไข' }, { key: 'orders_delete', label: 'ลบ' }, { key: 'orders_change_status', label: 'เปลี่ยนสถานะ' }] },
  { module: 'ใบเสนอราคา', items: [{ key: 'quotes_view', label: 'ดู' }, { key: 'quotes_create', label: 'สร้าง' }, { key: 'quotes_edit', label: 'แก้ไข' }, { key: 'quotes_approve', label: 'อนุมัติ' }] },
  { module: 'การเงิน', items: [{ key: 'finance_view', label: 'ดู' }, { key: 'finance_confirm', label: 'ยืนยันการโอน' }, { key: 'finance_edit_installments', label: 'แก้ไขงวด' }] },
  { module: 'งานการไฟฟ้า', items: [{ key: 'electric_view', label: 'ดู' }, { key: 'electric_update', label: 'อัปเดต' }] },
  { module: 'ภาพหน้างาน', items: [{ key: 'photos_view', label: 'ดู' }, { key: 'photos_upload', label: 'อัปโหลด' }, { key: 'photos_delete', label: 'ลบ' }] },
  { module: 'จัดการผู้ใช้', items: [{ key: 'users_view', label: 'ดู' }, { key: 'users_manage', label: 'จัดการ' }] },
  { module: 'ข่าวสารบนเว็บไซต์', items: [{ key: 'news_manage', label: 'จัดการข่าว' }, { key: 'projects_manage', label: 'จัดการผลงาน' }, { key: 'products_manage', label: 'จัดการอุปกรณ์' }, { key: 'clients_manage', label: 'จัดการลูกค้าของเรา' }] },
  { module: 'ตั้งค่าระบบ', items: [{ key: 'settings_view', label: 'ดู' }, { key: 'settings_edit', label: 'แก้ไข' }] },
];
export const SAMPLE_USERS: AppUser[] = [
  { name: 'ผู้ดูแลระบบ BGE', username: 'admin', password: '', phone: '081-000-0001', email: 'admin@bge.co.th', role: 'Admin', status: 'ใช้งาน', created: '2026-05-01', lastLogin: '2026-05-20 09:00', permissions: ROLE_PERMS.Admin },
  { name: 'คุณนิด ฝ่ายขาย', username: 'sale1', password: '', phone: '082-111-2233', email: 'sale1@bge.co.th', role: 'Sale', status: 'ใช้งาน', created: '2026-05-02', lastLogin: '2026-05-19 14:20', permissions: ROLE_PERMS.Sale },
  { name: 'คุณต้น ฝ่ายขาย', username: 'sale2', password: '', phone: '082-222-3344', email: 'sale2@bge.co.th', role: 'Sale', status: 'ใช้งาน', created: '2026-05-03', lastLogin: '2026-05-18 10:05', permissions: ROLE_PERMS.Sale },
  { name: 'ช่างเอก ทีมติดตั้ง', username: 'tech1', password: '', phone: '083-333-4455', email: 'tech1@bge.co.th', role: 'Technician', status: 'ใช้งาน', created: '2026-05-02', lastLogin: '2026-05-20 08:15', permissions: ROLE_PERMS.Technician },
  { name: 'ช่างบี ทีมติดตั้ง', username: 'tech2', password: '', phone: '083-444-5566', email: 'tech2@bge.co.th', role: 'Technician', status: 'ใช้งาน', created: '2026-05-04', lastLogin: '2026-05-17 16:40', permissions: ROLE_PERMS.Technician },
  { name: 'คุณฝ้าย บัญชี', username: 'account1', password: '', phone: '084-555-6677', email: 'account1@bge.co.th', role: 'Accountant', status: 'ใช้งาน', created: '2026-05-02', lastLogin: '2026-05-19 11:30', permissions: ROLE_PERMS.Accountant },
];
export function normalizeUser(v: any): AppUser {
  return safe(() => {
    const base = { ...(v || {}) } as AppUser;
    if (!base.permissions) base.permissions = ROLE_PERMS[(base.role as Role)] || permsFrom([]);
    ALL_PERMS.forEach(k => { if (typeof base.permissions[k] !== 'boolean') base.permissions[k] = !!(ROLE_PERMS[base.role as Role] || {})[k]; });
    if (!base.status) base.status = 'ใช้งาน';
    return base;
  }, { ...SAMPLE_USERS[0] });
}

export const LINE_RESULT: Record<string, string> = {
  linked: 'เชื่อมบัญชี LINE แล้ว ครั้งหน้าเข้าสู่ระบบด้วย LINE ได้เลย',
  notlinked: 'บัญชี LINE นี้ยังไม่ได้เชื่อมกับผู้ใช้ในระบบ: เข้าสู่ระบบด้วยรหัสผ่านก่อน แล้วกด "เชื่อมบัญชี LINE" ที่หน้าโปรไฟล์',
  taken: 'บัญชี LINE นี้เชื่อมกับผู้ใช้อื่นในระบบแล้ว',
  cancelled: 'ยกเลิกการเข้าสู่ระบบด้วย LINE',
  disabled: 'ระบบยังไม่ได้ตั้งค่า LINE Login',
  'disabled-user': 'บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
  error: 'เข้าสู่ระบบด้วย LINE ไม่สำเร็จ กรุณาลองใหม่',
};

export const COMPANY_NAME = 'BGE - BETTER GROUP ENGINEERING CO., LTD.';
export const COMPANY_SHORT = 'BETTER GROUP ENGINEERING CO., LTD.';
export const STATUSES: Status[] = [...JOB_STATUSES];
export const STATUS_COLOR: Record<string, string> = { 'ลีดใหม่': '#DBEAFE', 'ให้ติดต่อใหม่/ติดต่อไม่ได้': '#FEF3C7', 'รอใบเสนอราคาเบื้องต้น': '#EDE9FE', 'สำรวจหน้างาน': '#E0F2FE', 'รอใบเสนอราคาสุดท้าย': '#F3E8FF', 'รอแก้ไขใบเสนอราคา': '#FCE7F3', 'เสนอราคาแล้ว': '#D1FAE5', 'ตกลงจ้าง': '#CCFBF1', 'ปฏิเสธการจ้าง': '#FFE4E6', 'รอยื่นกู้ธนาคาร': '#FEF9C3', 'รอผลกู้ธนาคาร': '#FDE68A', 'ยื่นกู้ไม่ผ่าน': '#FECACA', 'มัดจำแล้ว': '#CFFAFE', 'รอนัดวันติดตั้ง': '#E0E7FF', 'รอติดตั้ง': '#E2E8F0', 'อยู่ระหว่างการติดตั้ง': '#BAE6FD', 'ติดตั้งแล้วเสร็จ': '#BBF7D0', 'กำลังตรวจรับงานติดตั้ง': '#A7F3D0', 'ชำระเงินผู้รับเหมาแล้ว': '#D1FAE5', 'ลูกค้าชำระเงินแล้ว': '#DCFCE7', 'รอยื่นการไฟฟ้า': '#E9D5FF', 'อยู่ระหว่างยื่นการไฟฟ้า': '#DDD6FE', 'ยื่นการไฟฟ้าแล้วเสร็จ': '#C4B5FD' };

export type CatalogItem = { name: string; price: number; code: string; category: string; keywords?: string };
export const CATALOG: CatalogItem[] = [
  { name: 'แผงโซลาร์ 580W Tier 1', price: 6500, code: 'PV-580', category: 'แผงโซลาร์', keywords: 'แผงโซลาร์ แผง 580' },
  { name: 'แผงโซลาร์ 620W Tier 1', price: 7200, code: 'PV-620', category: 'แผงโซลาร์', keywords: 'แผงโซลาร์ แผง 620' },
  { name: 'อินเวอร์เตอร์ 5kW', price: 42000, code: 'INV-5', category: 'อินเวอร์เตอร์', keywords: 'อินเวอร์เตอร์' },
  { name: 'อินเวอร์เตอร์ 10kW', price: 68000, code: 'INV-10', category: 'อินเวอร์เตอร์', keywords: 'อินเวอร์เตอร์' },
  { name: 'อินเวอร์เตอร์ 15kW', price: 92000, code: 'INV-15', category: 'อินเวอร์เตอร์', keywords: 'อินเวอร์เตอร์' },
  { name: 'แบตเตอรี่ 5kWh', price: 85000, code: 'BAT-5', category: 'แบตเตอรี่', keywords: 'แบตเตอรี่ แบต' },
  { name: 'แบตเตอรี่ 10kWh', price: 145000, code: 'BAT-10', category: 'แบตเตอรี่', keywords: 'แบตเตอรี่ แบต' },
  { name: 'โครงยึดหลังคา (Mounting + ราง)', price: 18000, code: 'MNT-01', category: 'โครงยึดหลังคา', keywords: 'โครงยึดหลังคา' },
  { name: 'สายไฟ + ท่อร้อยสาย', price: 12000, code: 'CAB-01', category: 'สายไฟ', keywords: 'สายไฟ' },
  { name: 'เบรกเกอร์ / ตู้ MDB / กันฟ้า', price: 16000, code: 'BRK-01', category: 'เบรกเกอร์', keywords: 'เบรกเกอร์' },
  { name: 'Wallbox EV', price: 45000, code: 'EV-01', category: 'EV Charger', keywords: 'Wallbox EV' },
  { name: 'Optimizer', price: 2800, code: 'OPT-01', category: 'อุปกรณ์เสริม', keywords: 'Optimizer' },
  { name: 'ระบบ Monitoring', price: 9000, code: 'MON-01', category: 'อุปกรณ์เสริม', keywords: 'Monitoring' },
  { name: 'ค่าแรงติดตั้ง', price: 25000, code: 'LAB-01', category: 'บริการ', keywords: 'ค่าแรงติดตั้ง' },
  { name: 'ค่าดำเนินการ PEA', price: 8000, code: 'PEA-01', category: 'ค่าดำเนินการ', keywords: 'PEA' },
];
export function calcTotal(j: Job) {
  return safe(() => {
    const t = quoteTotals(j);
    return { sub: t.gross, after: t.net, vat: t.vat, total: t.total };
  }, { sub: 0, after: 0, vat: 0, total: 0 });
}
export function paymentAmounts(j: Job) { return safe(() => { return (j.payments || []).map(p => ({ ...p, amount: p.receipt ? p.receipt.amount : installmentAmount(j, p.pct).amount })); }, []); }
export function elecTemplate(): ElecStep[] { return [{ label: 'ยื่นคำร้อง', done: false, date: '', note: '' }, { label: 'ตรวจเอกสาร', done: false, date: '', note: '' }, { label: 'ติดตั้งมิเตอร์ขายไฟ', done: false, date: '', note: '' }, { label: 'อนุมัติขนานไฟ', done: false, date: '', note: '' }, { label: 'เริ่มขายไฟ', done: false, date: '', note: '' }]; }
export function payTemplate(): Payment[] { return [{ label: 'งวดที่ 1 • มัดจำ', pct: 30, status: 'ยังไม่โอน', slip: '', due: '' }, { label: 'งวดที่ 2 • ติดตั้ง', pct: 40, status: 'ยังไม่โอน', slip: '', due: '' }, { label: 'งวดที่ 3 • ส่งมอบ', pct: 30, status: 'ยังไม่โอน', slip: '', due: '' }]; }
export function defaultChecklist(): ChecklistItem[] { return [{ id: 'ck-before-angles', group: 'before', label: 'ก่อนติดตั้ง 4 มุม', done: false }, { id: 'ck-before-roof', group: 'before', label: 'หลังคาใกล้–ไกล', done: false }, { id: 'ck-before-meter', group: 'before', label: 'มิเตอร์ไฟ', done: false }, { id: 'ck-after-panels', group: 'after', label: 'หลังติดตั้งแผงครบ', done: false }, { id: 'ck-after-inverter', group: 'after', label: 'Inverter', done: false }, { id: 'ck-after-combiner', group: 'after', label: 'ตู้ Combiner', done: false }, { id: 'ck-after-sign', group: 'after', label: 'ป้ายงาน', done: false }, { id: 'ck-after-customer', group: 'after', label: 'ลูกค้ายืนถ่ายกับงาน', done: false }]; }
export const PHOTO_CATEGORIES = ['หลังคา', 'แผง', 'Inverter', 'ตู้ไฟ', 'พื้นที่ติดตั้ง', 'หน้างานโดยรวม', 'อื่น ๆ'];

export function normalizeJob(v: any): Job {
  return safe(() => {
    const base = { ...(v || {}) } as Job;
    // Records created elsewhere (e.g. the public quote form) may be partial: fill every missing field so no screen can crash on undefined.
    const d = emptyJob() as any;
    const b = base as any;
    Object.keys(d).forEach(k => {
      const wantArray = Array.isArray(d[k]);
      if (b[k] === undefined || b[k] === null || (wantArray && !Array.isArray(b[k]))) b[k] = k === 'items' ? [] : k === 'labor' || k === 'discount' ? 0 : wantArray ? JSON.parse(JSON.stringify(d[k])) : d[k];
    });
    if (!Array.isArray(base.sitePhotos)) base.sitePhotos = [];
    if (!Array.isArray(base.photoChecklist) || base.photoChecklist.length === 0) base.photoChecklist = defaultChecklist();
    if (typeof base.customerNote !== 'string') base.customerNote = '';
    if (!Array.isArray(base.noteHistory)) base.noteHistory = [];
    if (!Array.isArray(base.items)) base.items = [];
    base.items = base.items.map((it: any) => ({ ...it, discount: typeof it.discount === 'number' ? it.discount : 0, vatPct: typeof it.vatPct === 'number' ? it.vatPct : 7, details: Array.isArray(it.details) ? it.details : [], groups: Array.isArray(it.groups) ? it.groups.map((g: any) => ({ title: String(g?.title || ''), lines: Array.isArray(g?.lines) ? g.lines.map(String) : [], warranty: String(g?.warranty || '') })) : [] }));
    if (typeof base.quoteNote1 !== 'string') base.quoteNote1 = SPEC_QUOTE_NOTE1;
    if (typeof base.quoteNote2 !== 'string') base.quoteNote2 = SPEC_QUOTE_NOTE2;
    base.status = LEGACY_STATUS[base.status as string] || base.status;
    if (!STATUSES.includes(base.status)) base.status = 'ลีดใหม่';
    return base;
  }, emptyJob());
}
export function photoCounts(j: Job) { return safe(() => ({ before: j.sitePhotos.filter(p => p.group === 'before').length, after: j.sitePhotos.filter(p => p.group === 'after').length, total: j.sitePhotos.length }), { before: 0, after: 0, total: 0 }); }
export function photoStatus(j: Job) {
  const c = photoCounts(j);
  if (c.before > 0 && c.after > 0) return { label: 'มีภาพครบ', cls: 'bg-emerald-100 text-emerald-700' };
  if (c.before === 0 && c.after === 0) return { label: 'ขาดภาพทั้งสอง', cls: 'bg-rose-50 text-rose-600' };
  if (c.before === 0) return { label: 'ขาดภาพก่อนติด', cls: 'bg-amber-100 text-amber-800' };
  return { label: 'ขาดภาพหลังติด', cls: 'bg-amber-100 text-amber-800' };
}
export function samplePhotos(jobLabel: string, items: { group: PhotoGroup; caption: string; date: string; photographer: string; category: string }[]): SitePhoto[] {
  return safe(() => items.map((it, i) => ({ id: `sample-photo-${jobLabel}-${i}`, group: it.group, url: '', caption: it.caption, date: it.date, photographer: it.photographer, category: it.category })), []);
}

export const SPEC_SELLER = { name: 'บริษัท เบทเทอร์ กรุ๊ป เอ็นจิเนียริ่ง จำกัด', address: 'เลขที่ 71/2 หมู่ที่ 3 ตำบลลาดหลุมแก้ว อำเภอลาดหลุมแก้ว จังหวัดปทุมธานี 12140', phone: '0886936699', email: 'info.bge.energy@gmail.com', taxId: '0105562117061' };
export const SPEC_QUOTE_DETAILS = [
  'เซลล์แสงอาทิตย์ ยี่ห้อ Longi Solar ขนาด 645 วัตต์ มาตรฐาน Tier.1 (Solar Panel) จำนวน 20 แผ่น รับประกัน 15 ปี ประกันประสิทธิภาพ (Efficiency output) 30 ปี',
  'อินเวอร์เตอร์ ยี่ห้อ Sigenergy ขนาด 10.0kW (Hybrid inverter) รับประกัน 10 ปี',
  'แบตเตอรี่ลิเธียม ยี่ห้อ Sigenergy ขนาด 9.04kWh (Lithium Battery) จำนวน 1 ระบบ',
  'ชุดควบคุมการสำรองไฟฟ้าในบ้าน (Gateway Homepro) จำนวน 1 ระบบ',
  'อุปกรณ์ป้องกันไฟฟ้าย้อนกลับ (Zero export) จำนวน 1 ระบบ',
  'อุปกรณ์ยึดเซลล์แสงอาทิตย์ (Mounting) จำนวน 1 ระบบ',
  'สายไฟฟ้ากระแสตรง (DC Cable) จำนวน 1 ระบบ',
  'สายไฟฟ้ากระแสสลับ (AC Cable) จำนวน 1 ระบบ',
  'อุปกรณ์ร้อยสายไฟฟ้าตามสายภายนอก (Wiring equipment) จำนวน 1 ระบบ',
  'ตู้ควบคุมไฟฟ้า (AC/DC Combiner) จำนวน 1 ชุด',
  'ระบบกราวด์ (Ground system) จำนวน 1 ระบบ',
  'ค่าขนส่ง (Transportation) จำนวน 1 งาน',
  'ค่าติดตั้ง (Installation) จำนวน 1 งาน',
  'ค่าดำเนินการขออนุญาตหน่วยงานที่เกี่ยวข้อง // รับประกันงานติดตั้ง 2 ปี',
  'งานบำรุงรักษา 2 ปี (Operation and Maintenance) // ล้างแผงโซลาร์ 1 ครั้ง',
];
export const SPEC_QUOTE_ITEM: QuoteItem = { name: 'ติดตั้งโซลาร์เซลล์ ระบบไฮบริด ขนาดไม่น้อยกว่า 12.9 kWp 3Phase + BESS 9.04kWh (รองรับการเชื่อมต่อ SigenStor EVDC / เครื่องชาร์จรถไฟฟ้า)', qty: 1, price: 387850.47, discount: 4672.90, vatPct: 7, details: [...SPEC_QUOTE_DETAILS] };
export const SPEC_QUOTE_NOTE1 = '***ดำเนินการขออนุญาตหน่วยงานต่างๆที่เกี่ยวข้อง (Permit & Licensing) ***';
export const SPEC_QUOTE_NOTE2 = '***ฟรี!!! ตาข่ายกันนกใต้แผงโซลาร์เซลล์ (งานติดตั้งเป็นไปตามเงื่อนไขของบริษัท) (Anti bird netting) ***';
export const SAMPLES: Job[] = [
  { customer: 'คุณ กาจ วิจิตรโรจน์', phone: '089-944-1004', line: '', address: 'เลขที่ 55/51 ม.9 ถ.กาญจนาภิเษก แขวงทวีวัฒนา เขตทวีวัฒนา กรุงเทพมหานคร 10170', building: 'บ้าน', bill: 0, roofArea: 0, roofDir: 'ทิศใต้', meter: '15/45', need: 'ใช้เอง', status: 'เสนอราคาแล้ว', created: '2026-08-17', kw: 12.9, panels: 20, inverter: 'Sigenergy 10.0kW', roofStruct: '', cable: 0, photos: '', surveyNote: '', customerNote: '', noteHistory: [], items: [{ ...SPEC_QUOTE_ITEM, details: [...SPEC_QUOTE_DETAILS] }], discount: 0, labor: 0, payments: payTemplate(), elecWanted: false, elec: elecTemplate(), contacts: [], nextAppt: '2026-08-24', attach: '', sitePhotos: [], photoChecklist: defaultChecklist(), quoteDocNo: 'QO-26080007', quoteIssueDate: '17/08/2026', quoteAcceptDate: '', quoteValidUntil: '24/08/2026', quoteRef: '', customerTaxId: '-', customerAttn: '-', contactBackName: 'รัชกร แฟงสาตุ', contactBackPhone: '0827411072', contactBackEmail: 'info.bge.energy@gmail.com', quoteNote1: SPEC_QUOTE_NOTE1, quoteNote2: SPEC_QUOTE_NOTE2 },
  { customer: 'คุณสมชาย ใจดี', phone: '081-234-5678', line: '@somchai', address: 'ซ.ลาดพร้าว 71 กรุงเทพฯ', building: 'บ้าน', bill: 4200, roofArea: 65, roofDir: 'ทิศใต้', meter: '15/45', need: 'ใช้เอง + ขายไฟ', status: 'ลีดใหม่', created: '2026-05-10', kw: 5.8, panels: 10, inverter: 'Inverter 5kW', roofStruct: 'กระเบื้องลอนคู่', cable: 28, photos: '', surveyNote: 'หลังคาแข็งแรง มีเงาต้นไม้เล็กน้อย', customerNote: 'ลูกค้าอยากติด 10kW เน้นประหยัดค่าไฟกลางวัน', noteHistory: [], items: [{ name: 'แผงโซลาร์ 580W Tier 1', qty: 10, price: 6500 }, { name: 'Inverter 5kW', qty: 1, price: 42000 }, { name: 'โครง Mounting + ราง', qty: 1, price: 18000 }, { name: 'สายไฟ + ท่อร้อยสาย', qty: 1, price: 12000 }], discount: 5000, labor: 25000, payments: payTemplate(), elecWanted: true, elec: elecTemplate(), contacts: [{ date: '2026-05-10', type: 'โทร', note: 'ลูกค้าสนใจติดตั้ง 5-6kW' }], nextAppt: '2026-05-20', attach: '', sitePhotos: samplePhotos('somchai', [{ group: 'before', caption: 'ภาพหลังคาก่อนติดตั้ง — มุมกว้าง', date: '2026-05-10', photographer: 'ช่างทีม A', category: 'หลังคา' }, { group: 'after', caption: 'แผงติดตั้งเสร็จ — มุมกว้าง', date: '2026-05-28', photographer: 'ช่างทีม A', category: 'แผง' }]), photoChecklist: defaultChecklist() },
  { customer: 'คุณนภา สุขสันต์', phone: '089-111-2233', line: '@napa', address: 'หมู่บ้านพฤกษา บางใหญ่ นนทบุรี', building: 'บ้าน', bill: 2800, roofArea: 48, roofDir: 'ทิศตะวันตก', meter: '15/45', need: 'ใช้เอง', status: 'รอใบเสนอราคาเบื้องต้น', created: '2026-05-09', kw: 5.2, panels: 9, inverter: 'Inverter 5kW', roofStruct: 'เมทัลชีท', cable: 22, photos: '', surveyNote: '', customerNote: 'ขอใบเสนอราคา 2 แบบเปรียบเทียบ', noteHistory: [], items: [{ name: 'แผงโซลาร์ 580W Tier 1', qty: 9, price: 6500 }, { name: 'Inverter 5kW', qty: 1, price: 42000 }], discount: 3000, labor: 22000, payments: payTemplate(), elecWanted: false, elec: elecTemplate(), contacts: [], nextAppt: '2026-05-18', attach: '', sitePhotos: [], photoChecklist: defaultChecklist() },
  { customer: 'คุณวิชัย โรงงานพลาสติก', phone: '02-123-4567', line: '@wichai.factory', address: 'นิคมฯ บางปู สมุทรปราการ', building: 'โรงงาน', bill: 38000, roofArea: 520, roofDir: 'ทิศใต้', meter: '30/100', need: 'ใช้เอง + ขายไฟ', status: 'สำรวจหน้างาน', created: '2026-05-08', kw: 52, panels: 84, inverter: 'Inverter 15kW', roofStruct: 'เมทัลชีท โรงงาน', cable: 120, photos: '', surveyNote: 'พื้นที่กว้าง', customerNote: '', noteHistory: [], items: [{ name: 'แผงโซลาร์ 620W Tier 1', qty: 84, price: 7200 }, { name: 'Inverter 15kW', qty: 4, price: 92000 }], discount: 25000, labor: 85000, payments: payTemplate(), elecWanted: true, elec: elecTemplate(), contacts: [], nextAppt: '2026-05-22', attach: '', sitePhotos: [], photoChecklist: defaultChecklist() },
  { customer: 'คุณมานี รีสอร์ทเขาใหญ่', phone: '089-555-4433', line: '@manee.resort', address: 'อ.ปากช่อง นครราชสีมา', building: 'บ้าน', bill: 9200, roofArea: 120, roofDir: 'ทิศใต้', meter: '30/100', need: 'ใช้เอง', status: 'ตกลงจ้าง', created: '2026-05-05', kw: 12.2, panels: 21, inverter: 'Inverter 10kW', roofStruct: 'กระเบื้องลอนคู่', cable: 45, photos: '', surveyNote: '', customerNote: '', noteHistory: [], items: [{ name: 'แผงโซลาร์ 580W Tier 1', qty: 21, price: 6500 }, { name: 'Inverter 10kW', qty: 2, price: 68000 }], discount: 12000, labor: 42000, payments: payTemplate(), elecWanted: false, elec: elecTemplate(), contacts: [], nextAppt: '2026-05-25', attach: '', sitePhotos: [], photoChecklist: defaultChecklist() },
];

export const fmt = (n: number) => safe(() => new Intl.NumberFormat('th-TH').format(Math.round(safeNum(n))), '0');
export const fmtBaht = (n: number) => `฿${fmt(n)}`;
export const fmt2 = (n: number) => safe(() => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(safeNum(n)), '0.00');
export const fmtQty = (n: number) => fmt2(n);
export const SPEC_CUSTOMER = { name: 'คุณ กาจ วิจิตรโรจน์', address: 'เลขที่ 55/51 ม.9 ถ.กาญจนาภิเษก แขวงทวีวัฒนา เขตทวีวัฒนา กรุงเทพมหานคร 10170', phone: '089-944-1004', taxId: '-', attn: '-' };
export function quoteRowNet(it: QuoteItem) { return safeNum(it.qty) * safeNum(it.price) - safeNum(it.discount); }
export function quoteSummary(j: Job) {
  return safe(() => {
    const gross = (j.items || []).reduce((s, i) => s + safeNum(i.qty) * safeNum(i.price), 0) + safeNum(j.labor);
    const itemDiscount = (j.items || []).reduce((s, i) => s + safeNum(i.discount), 0);
    const totalDiscount = itemDiscount + safeNum(j.discount);
    const net = Math.max(0, gross - totalDiscount);
    const vat = Math.round(net * 0.07 * 100) / 100;
    return { gross, totalDiscount, net, vat, total: Math.round((net + vat) * 100) / 100 };
  }, { gross: 0, totalDiscount: 0, net: 0, vat: 0, total: 0 });
}
export function resolveSeller(c: CompanySettings) { return { name: SPEC_SELLER.name, address: (c && c.address) || SPEC_SELLER.address, phone: (c && c.phone) || SPEC_SELLER.phone, email: (c && c.email) || SPEC_SELLER.email, taxId: (c && c.taxId) || SPEC_SELLER.taxId }; }
export function resolveQuoteDoc(j: Job, fallbackNo: string) { return { docNo: j.quoteDocNo || 'QO-26080007', issueDate: j.quoteIssueDate || '17/08/2026', acceptDate: j.quoteAcceptDate || '', validUntil: j.quoteValidUntil || '24/08/2026', ref: j.quoteRef || '', fallbackNo }; }
export function resolveCustomer(j: Job) { const isSpec = String(j.customer || '').includes('กาจ'); return { name: j.customer || SPEC_CUSTOMER.name, address: j.address || SPEC_CUSTOMER.address, phone: j.phone || SPEC_CUSTOMER.phone, taxId: j.customerTaxId !== undefined && j.customerTaxId !== '' ? j.customerTaxId : (isSpec ? SPEC_CUSTOMER.taxId : '-'), attn: j.customerAttn !== undefined && j.customerAttn !== '' ? j.customerAttn : (isSpec ? SPEC_CUSTOMER.attn : '-') }; }
export function resolveContactBack(j: Job) { return { name: j.contactBackName || 'รัชกร แฟงสาตุ', phone: j.contactBackPhone || '0827411072', email: j.contactBackEmail || 'info.bge.energy@gmail.com' }; }
export const emptyJob = (): Job => ({ customer: '', phone: '', line: '', address: '', building: 'บ้าน', bill: 0, roofArea: 0, roofDir: 'ทิศใต้', meter: '15/45', need: 'ใช้เอง', status: 'ลีดใหม่', created: safe(() => new Date().toISOString().slice(0, 10), '2026-08-17'), kw: 0, panels: 0, inverter: 'Inverter 5kW', roofStruct: '', cable: 0, photos: '', surveyNote: '', customerNote: '', noteHistory: [], items: [{ name: 'แผงโซลาร์ 580W Tier 1', qty: 10, price: 6500 }, { name: 'Inverter 5kW', qty: 1, price: 42000 }], discount: 0, labor: 25000, payments: payTemplate(), elecWanted: false, elec: elecTemplate(), contacts: [], nextAppt: '', attach: '', sitePhotos: [], photoChecklist: defaultChecklist(), quoteDocNo: '', quoteIssueDate: '', quoteAcceptDate: '', quoteValidUntil: '', quoteRef: '', customerTaxId: '-', customerAttn: '-', contactBackName: 'รัชกร แฟงสาตุ', contactBackPhone: '0827411072', contactBackEmail: 'info.bge.energy@gmail.com', quoteNote1: SPEC_QUOTE_NOTE1, quoteNote2: SPEC_QUOTE_NOTE2 });
export const emptyCompany = (): CompanySettings => ({ address: '', phone: '', taxId: '', email: '' });
export const emptyAppUser = (): AppUser => ({ name: '', username: '', password: '', phone: '', email: '', role: 'Sale', status: 'ใช้งาน', created: '2026-05-01', lastLogin: '—', permissions: ROLE_PERMS.Sale });
