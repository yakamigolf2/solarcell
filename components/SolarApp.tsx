'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, LayoutDashboard, Users, ClipboardList, FileText, Wallet, Zap, Settings, Menu, X, Phone, MapPin, Calendar, Eye, Pencil, Trash2, Sun, TrendingUp, Clock, AlertTriangle, CheckCircle2, Circle, Building2, Home, Factory, Briefcase, Save, Camera, Copy, ExternalLink, NotebookPen, LogOut, ShieldCheck, UserCog, Lock, KeyRound, User as UserIcon, Mail, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '@/lib/upload';

// ---------- Safe helpers: every risky spot is guarded ----------
function safe<T>(fn: () => T, fallback: T): T { try { return fn(); } catch { return fallback; } }
function safeNum(v: any, fallback = 0): number { const n = Number(v); return Number.isFinite(n) ? n : fallback; }

// ---------- API (records only, guarded) ----------
async function callApi(action: string, args: any) {
  const controller = new AbortController();
  const timer = setTimeout(() => { try { controller.abort(); } catch { /* ignore */ } }, 8000);
  try {
    const res = await fetch("/api/actions", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, args }), signal: controller.signal });
    const json = await res.json().catch(() => ({} as any));
    if (!res.ok || (json as any).error) throw new Error((json as any).error || `API error ${res.status}`);
    return (json as any).data;
  } finally { clearTimeout(timer); }
}
async function createRow(collection: string, value: any, key: string) { return callApi("records.create", { collection, value, idempotency_key: key }); }
async function replaceRow(collection: string, id: string, value: any) { return callApi("records.replace", { collection, id, value }); }

// ---------- Types ----------
type Status = 'ลีดใหม่' | 'ติดต่อแล้ว' | 'สำรวจหน้างาน' | 'รอเสนอราคา' | 'เสนอราคาแล้ว' | 'ตกลงจ้าง' | 'มัดจำแล้ว' | 'รอติดตั้ง' | 'ติดตั้งแล้ว' | 'ยื่นการไฟฟ้า' | 'ส่งมอบงาน';
type QuoteItem = { name: string; qty: number; price: number; discount?: number; vatPct?: number; details?: string[] };
type Payment = { label: string; pct: number; status: 'ยังไม่โอน' | 'โอนแล้ว' | 'รอตรวจสอบ' | 'ยืนยันแล้ว'; slip: string; due: string };
type ElecStep = { label: string; done: boolean; date: string; note: string };
type Contact = { date: string; type: string; note: string };
type NoteHistoryItem = { date: string; text: string };
type PhotoGroup = 'before' | 'after';
type SitePhoto = { id: string; group: PhotoGroup; url: string; caption: string; date: string; photographer: string; category: string };
type ChecklistItem = { id: string; group: PhotoGroup; label: string; done: boolean };
type Job = {
  customer: string; phone: string; line: string; address: string; building: string; bill: number; roofArea: number; roofDir: string; meter: string; need: string;
  status: Status; created: string; kw: number; panels: number; inverter: string; roofStruct: string; cable: number; photos: string; surveyNote: string;
  items: QuoteItem[]; discount: number; labor: number; payments: Payment[]; elecWanted: boolean; elec: ElecStep[]; contacts: Contact[]; nextAppt: string; attach: string; customerNote: string; noteHistory: NoteHistoryItem[];
  sitePhotos: SitePhoto[]; photoChecklist: ChecklistItem[];
  quoteDocNo?: string; quoteIssueDate?: string; quoteAcceptDate?: string; quoteValidUntil?: string; quoteRef?: string;
  customerTaxId?: string; customerAttn?: string; contactBackName?: string; contactBackPhone?: string; contactBackEmail?: string;
  quoteNote1?: string; quoteNote2?: string;
};
type Rec = { id: string; value: Job };
type CompanySettings = { address: string; phone: string; taxId: string; email?: string };
type Role = 'Admin' | 'Sale' | 'Technician' | 'Accountant';
type PermKey = 'customers_view' | 'customers_create' | 'customers_edit' | 'customers_delete' | 'orders_view' | 'orders_create' | 'orders_edit' | 'orders_delete' | 'orders_change_status' | 'quotes_view' | 'quotes_create' | 'quotes_edit' | 'quotes_approve' | 'finance_view' | 'finance_confirm' | 'finance_edit_installments' | 'electric_view' | 'electric_update' | 'photos_view' | 'photos_upload' | 'photos_delete' | 'users_view' | 'users_manage' | 'settings_view' | 'settings_edit';
type Permissions = Record<PermKey, boolean>;
type AppUser = { name: string; username: string; password: string; phone: string; email: string; role: Role; status: 'ใช้งาน' | 'ปิดใช้งาน'; created: string; lastLogin: string; permissions: Permissions };
type UserRec = { id: string; value: AppUser };

const ALL_PERMS: PermKey[] = ['customers_view', 'customers_create', 'customers_edit', 'customers_delete', 'orders_view', 'orders_create', 'orders_edit', 'orders_delete', 'orders_change_status', 'quotes_view', 'quotes_create', 'quotes_edit', 'quotes_approve', 'finance_view', 'finance_confirm', 'finance_edit_installments', 'electric_view', 'electric_update', 'photos_view', 'photos_upload', 'photos_delete', 'users_view', 'users_manage', 'settings_view', 'settings_edit'];
function permsFrom(list: PermKey[]): Permissions { const o = {} as Permissions; ALL_PERMS.forEach(k => o[k] = list.includes(k)); return o; }
const ROLE_PERMS: Record<Role, Permissions> = {
  Admin: permsFrom(ALL_PERMS),
  Sale: permsFrom(['customers_view', 'customers_create', 'customers_edit', 'orders_view', 'orders_create', 'orders_edit', 'orders_change_status', 'quotes_view', 'quotes_create', 'quotes_edit', 'finance_view', 'electric_view', 'photos_view', 'settings_view']),
  Technician: permsFrom(['customers_view', 'orders_view', 'orders_edit', 'orders_change_status', 'quotes_view', 'electric_view', 'electric_update', 'photos_view', 'photos_upload']),
  Accountant: permsFrom(['customers_view', 'orders_view', 'quotes_view', 'finance_view', 'finance_confirm', 'finance_edit_installments', 'electric_view', 'photos_view', 'settings_view']),
};
const ROLE_LABEL: Record<Role, string> = { Admin: 'ผู้ดูแลระบบ', Sale: 'ฝ่ายขาย', Technician: 'ช่าง', Accountant: 'บัญชี' };
const PERM_GROUPS: { module: string; items: { key: PermKey; label: string }[] }[] = [
  { module: 'ลูกค้า', items: [{ key: 'customers_view', label: 'ดู' }, { key: 'customers_create', label: 'สร้าง' }, { key: 'customers_edit', label: 'แก้ไข' }, { key: 'customers_delete', label: 'ลบ' }] },
  { module: 'ออเดอร์ / งานติดตั้ง', items: [{ key: 'orders_view', label: 'ดู' }, { key: 'orders_create', label: 'สร้าง' }, { key: 'orders_edit', label: 'แก้ไข' }, { key: 'orders_delete', label: 'ลบ' }, { key: 'orders_change_status', label: 'เปลี่ยนสถานะ' }] },
  { module: 'ใบเสนอราคา', items: [{ key: 'quotes_view', label: 'ดู' }, { key: 'quotes_create', label: 'สร้าง' }, { key: 'quotes_edit', label: 'แก้ไข' }, { key: 'quotes_approve', label: 'อนุมัติ' }] },
  { module: 'การเงิน', items: [{ key: 'finance_view', label: 'ดู' }, { key: 'finance_confirm', label: 'ยืนยันการโอน' }, { key: 'finance_edit_installments', label: 'แก้ไขงวด' }] },
  { module: 'งานการไฟฟ้า', items: [{ key: 'electric_view', label: 'ดู' }, { key: 'electric_update', label: 'อัปเดต' }] },
  { module: 'ภาพหน้างาน', items: [{ key: 'photos_view', label: 'ดู' }, { key: 'photos_upload', label: 'อัปโหลด' }, { key: 'photos_delete', label: 'ลบ' }] },
  { module: 'จัดการผู้ใช้', items: [{ key: 'users_view', label: 'ดู' }, { key: 'users_manage', label: 'จัดการ' }] },
  { module: 'ตั้งค่าระบบ', items: [{ key: 'settings_view', label: 'ดู' }, { key: 'settings_edit', label: 'แก้ไข' }] },
];
export const SAMPLE_USERS: AppUser[] = [
  { name: 'ผู้ดูแลระบบ BGE', username: 'admin', password: 'admin123', phone: '081-000-0001', email: 'admin@bge.co.th', role: 'Admin', status: 'ใช้งาน', created: '2026-05-01', lastLogin: '2026-05-20 09:00', permissions: ROLE_PERMS.Admin },
  { name: 'คุณนิด ฝ่ายขาย', username: 'sale1', password: 'sale123', phone: '082-111-2233', email: 'sale1@bge.co.th', role: 'Sale', status: 'ใช้งาน', created: '2026-05-02', lastLogin: '2026-05-19 14:20', permissions: ROLE_PERMS.Sale },
  { name: 'คุณต้น ฝ่ายขาย', username: 'sale2', password: 'sale123', phone: '082-222-3344', email: 'sale2@bge.co.th', role: 'Sale', status: 'ใช้งาน', created: '2026-05-03', lastLogin: '2026-05-18 10:05', permissions: ROLE_PERMS.Sale },
  { name: 'ช่างเอก ทีมติดตั้ง', username: 'tech1', password: 'tech123', phone: '083-333-4455', email: 'tech1@bge.co.th', role: 'Technician', status: 'ใช้งาน', created: '2026-05-02', lastLogin: '2026-05-20 08:15', permissions: ROLE_PERMS.Technician },
  { name: 'ช่างบี ทีมติดตั้ง', username: 'tech2', password: 'tech123', phone: '083-444-5566', email: 'tech2@bge.co.th', role: 'Technician', status: 'ใช้งาน', created: '2026-05-04', lastLogin: '2026-05-17 16:40', permissions: ROLE_PERMS.Technician },
  { name: 'คุณฝ้าย บัญชี', username: 'account1', password: 'acc123', phone: '084-555-6677', email: 'account1@bge.co.th', role: 'Accountant', status: 'ใช้งาน', created: '2026-05-02', lastLogin: '2026-05-19 11:30', permissions: ROLE_PERMS.Accountant },
];
function normalizeUser(v: any): AppUser {
  return safe(() => {
    const base = { ...(v || {}) } as AppUser;
    if (!base.permissions) base.permissions = ROLE_PERMS[(base.role as Role)] || permsFrom([]);
    ALL_PERMS.forEach(k => { if (typeof base.permissions[k] !== 'boolean') base.permissions[k] = !!(ROLE_PERMS[base.role as Role] || {})[k]; });
    if (!base.status) base.status = 'ใช้งาน';
    return base;
  }, { ...SAMPLE_USERS[0] });
}

const COMPANY_NAME = 'BGE - BETTER GROUP ENGINEERING CO., LTD.';
const COMPANY_SHORT = 'BETTER GROUP ENGINEERING CO., LTD.';
const STATUSES: Status[] = ['ลีดใหม่', 'ติดต่อแล้ว', 'สำรวจหน้างาน', 'รอเสนอราคา', 'เสนอราคาแล้ว', 'ตกลงจ้าง', 'มัดจำแล้ว', 'รอติดตั้ง', 'ติดตั้งแล้ว', 'ยื่นการไฟฟ้า', 'ส่งมอบงาน'];
const STATUS_COLOR: Record<string, string> = { 'ลีดใหม่': '#DBEAFE', 'ติดต่อแล้ว': '#E0E7FF', 'สำรวจหน้างาน': '#E0F2FE', 'รอเสนอราคา': '#EDE9FE', 'เสนอราคาแล้ว': '#D1FAE5', 'ตกลงจ้าง': '#CCFBF1', 'มัดจำแล้ว': '#CFFAFE', 'รอติดตั้ง': '#E2E8F0', 'ติดตั้งแล้ว': '#BBF7D0', 'ยื่นการไฟฟ้า': '#E9D5FF', 'ส่งมอบงาน': '#D1FAE5' };

type CatalogItem = { name: string; price: number; code: string; category: string; keywords?: string };
const CATALOG: CatalogItem[] = [
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
function calcTotal(j: Job) {
  return safe(() => {
    const sub = (j.items || []).reduce((s, i) => s + safeNum(i.qty) * safeNum(i.price), 0) + safeNum(j.labor);
    const after = Math.max(0, sub - safeNum(j.discount));
    const vat = Math.round(after * 0.07);
    return { sub, after, vat, total: after + vat };
  }, { sub: 0, after: 0, vat: 0, total: 0 });
}
function paymentAmounts(j: Job) { return safe(() => { const t = calcTotal(j).total; return (j.payments || []).map(p => ({ ...p, amount: Math.round(t * safeNum(p.pct) / 100) })); }, []); }
function elecTemplate(): ElecStep[] { return [{ label: 'ยื่นคำร้อง', done: false, date: '', note: '' }, { label: 'ตรวจเอกสาร', done: false, date: '', note: '' }, { label: 'ติดตั้งมิเตอร์ขายไฟ', done: false, date: '', note: '' }, { label: 'อนุมัติขนานไฟ', done: false, date: '', note: '' }, { label: 'เริ่มขายไฟ', done: false, date: '', note: '' }]; }
function payTemplate(): Payment[] { return [{ label: 'งวดที่ 1 • มัดจำ', pct: 30, status: 'ยังไม่โอน', slip: '', due: '' }, { label: 'งวดที่ 2 • ติดตั้ง', pct: 40, status: 'ยังไม่โอน', slip: '', due: '' }, { label: 'งวดที่ 3 • ส่งมอบ', pct: 30, status: 'ยังไม่โอน', slip: '', due: '' }]; }
function defaultChecklist(): ChecklistItem[] { return [{ id: 'ck-before-angles', group: 'before', label: 'ก่อนติดตั้ง 4 มุม', done: false }, { id: 'ck-before-roof', group: 'before', label: 'หลังคาใกล้–ไกล', done: false }, { id: 'ck-before-meter', group: 'before', label: 'มิเตอร์ไฟ', done: false }, { id: 'ck-after-panels', group: 'after', label: 'หลังติดตั้งแผงครบ', done: false }, { id: 'ck-after-inverter', group: 'after', label: 'Inverter', done: false }, { id: 'ck-after-combiner', group: 'after', label: 'ตู้ Combiner', done: false }, { id: 'ck-after-sign', group: 'after', label: 'ป้ายงาน', done: false }, { id: 'ck-after-customer', group: 'after', label: 'ลูกค้ายืนถ่ายกับงาน', done: false }]; }
const PHOTO_CATEGORIES = ['หลังคา', 'แผง', 'Inverter', 'ตู้ไฟ', 'พื้นที่ติดตั้ง', 'หน้างานโดยรวม', 'อื่น ๆ'];
function normalizeJob(v: any): Job {
  return safe(() => {
    const base = { ...(v || {}) } as Job;
    if (!Array.isArray(base.sitePhotos)) base.sitePhotos = [];
    if (!Array.isArray(base.photoChecklist) || base.photoChecklist.length === 0) base.photoChecklist = defaultChecklist();
    if (typeof base.customerNote !== 'string') base.customerNote = '';
    if (!Array.isArray(base.noteHistory)) base.noteHistory = [];
    if (!Array.isArray(base.items)) base.items = [];
    base.items = base.items.map((it: any) => ({ ...it, discount: typeof it.discount === 'number' ? it.discount : 0, vatPct: typeof it.vatPct === 'number' ? it.vatPct : 7, details: Array.isArray(it.details) ? it.details : [] }));
    if (typeof base.quoteNote1 !== 'string') base.quoteNote1 = SPEC_QUOTE_NOTE1;
    if (typeof base.quoteNote2 !== 'string') base.quoteNote2 = SPEC_QUOTE_NOTE2;
    return base;
  }, emptyJob());
}
function photoCounts(j: Job) { return safe(() => ({ before: j.sitePhotos.filter(p => p.group === 'before').length, after: j.sitePhotos.filter(p => p.group === 'after').length, total: j.sitePhotos.length }), { before: 0, after: 0, total: 0 }); }
function photoStatus(j: Job) {
  const c = photoCounts(j);
  if (c.before > 0 && c.after > 0) return { label: 'มีภาพครบ', cls: 'bg-emerald-100 text-emerald-700' };
  if (c.before === 0 && c.after === 0) return { label: 'ขาดภาพทั้งสอง', cls: 'bg-rose-50 text-rose-600' };
  if (c.before === 0) return { label: 'ขาดภาพก่อนติด', cls: 'bg-amber-100 text-amber-800' };
  return { label: 'ขาดภาพหลังติด', cls: 'bg-amber-100 text-amber-800' };
}
function samplePhotos(jobLabel: string, items: { group: PhotoGroup; caption: string; date: string; photographer: string; category: string }[]): SitePhoto[] {
  return safe(() => items.map((it, i) => ({ id: `sample-photo-${jobLabel}-${i}`, group: it.group, url: '', caption: it.caption, date: it.date, photographer: it.photographer, category: it.category })), []);
}

const SPEC_SELLER = { name: 'บริษัท เบทเทอร์ กรุ๊ป เอ็นจิเนียริ่ง จำกัด', address: 'เลขที่ 71/2 หมู่ที่ 3 ตำบลลาดหลุมแก้ว อำเภอลาดหลุมแก้ว จังหวัดปทุมธานี 12140', phone: '0886936699', email: 'info.bge.energy@gmail.com', taxId: '0105562117061' };
const SPEC_QUOTE_DETAILS = [
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
const SPEC_QUOTE_ITEM: QuoteItem = { name: 'ติดตั้งโซลาร์เซลล์ ระบบไฮบริด ขนาดไม่น้อยกว่า 12.9 kWp 3Phase + BESS 9.04kWh (รองรับการเชื่อมต่อ SigenStor EVDC / เครื่องชาร์จรถไฟฟ้า)', qty: 1, price: 387850.47, discount: 4672.90, vatPct: 7, details: [...SPEC_QUOTE_DETAILS] };
const SPEC_QUOTE_NOTE1 = '***ดำเนินการขออนุญาตหน่วยงานต่างๆที่เกี่ยวข้อง (Permit & Licensing) ***';
const SPEC_QUOTE_NOTE2 = '***ฟรี!!! ตาข่ายกันนกใต้แผงโซลาร์เซลล์ (งานติดตั้งเป็นไปตามเงื่อนไขของบริษัท) (Anti bird netting) ***';
export const SAMPLES: Job[] = [
  { customer: 'คุณ กาจ วิจิตรโรจน์', phone: '089-944-1004', line: '', address: 'เลขที่ 55/51 ม.9 ถ.กาญจนาภิเษก แขวงทวีวัฒนา เขตทวีวัฒนา กรุงเทพมหานคร 10170', building: 'บ้าน', bill: 0, roofArea: 0, roofDir: 'ทิศใต้', meter: '15/45', need: 'ใช้เอง', status: 'เสนอราคาแล้ว', created: '2026-08-17', kw: 12.9, panels: 20, inverter: 'Sigenergy 10.0kW', roofStruct: '', cable: 0, photos: '', surveyNote: '', customerNote: '', noteHistory: [], items: [{ ...SPEC_QUOTE_ITEM, details: [...SPEC_QUOTE_DETAILS] }], discount: 0, labor: 0, payments: payTemplate(), elecWanted: false, elec: elecTemplate(), contacts: [], nextAppt: '2026-08-24', attach: '', sitePhotos: [], photoChecklist: defaultChecklist(), quoteDocNo: 'QO-26080007', quoteIssueDate: '17/08/2026', quoteAcceptDate: '', quoteValidUntil: '24/08/2026', quoteRef: '', customerTaxId: '-', customerAttn: '-', contactBackName: 'รัชกร แฟงสาตุ', contactBackPhone: '0827411072', contactBackEmail: 'info.bge.energy@gmail.com', quoteNote1: SPEC_QUOTE_NOTE1, quoteNote2: SPEC_QUOTE_NOTE2 },
  { customer: 'คุณสมชาย ใจดี', phone: '081-234-5678', line: '@somchai', address: 'ซ.ลาดพร้าว 71 กรุงเทพฯ', building: 'บ้าน', bill: 4200, roofArea: 65, roofDir: 'ทิศใต้', meter: '15/45', need: 'ใช้เอง + ขายไฟ', status: 'ลีดใหม่', created: '2026-05-10', kw: 5.8, panels: 10, inverter: 'Inverter 5kW', roofStruct: 'กระเบื้องลอนคู่', cable: 28, photos: '', surveyNote: 'หลังคาแข็งแรง มีเงาต้นไม้เล็กน้อย', customerNote: 'ลูกค้าอยากติด 10kW เน้นประหยัดค่าไฟกลางวัน', noteHistory: [], items: [{ name: 'แผงโซลาร์ 580W Tier 1', qty: 10, price: 6500 }, { name: 'Inverter 5kW', qty: 1, price: 42000 }, { name: 'โครง Mounting + ราง', qty: 1, price: 18000 }, { name: 'สายไฟ + ท่อร้อยสาย', qty: 1, price: 12000 }], discount: 5000, labor: 25000, payments: payTemplate(), elecWanted: true, elec: elecTemplate(), contacts: [{ date: '2026-05-10', type: 'โทร', note: 'ลูกค้าสนใจติดตั้ง 5-6kW' }], nextAppt: '2026-05-20', attach: '', sitePhotos: samplePhotos('somchai', [{ group: 'before', caption: 'ภาพหลังคาก่อนติดตั้ง — มุมกว้าง', date: '2026-05-10', photographer: 'ช่างทีม A', category: 'หลังคา' }, { group: 'after', caption: 'แผงติดตั้งเสร็จ — มุมกว้าง', date: '2026-05-28', photographer: 'ช่างทีม A', category: 'แผง' }]), photoChecklist: defaultChecklist() },
  { customer: 'คุณนภา สุขสันต์', phone: '089-111-2233', line: '@napa', address: 'หมู่บ้านพฤกษา บางใหญ่ นนทบุรี', building: 'บ้าน', bill: 2800, roofArea: 48, roofDir: 'ทิศตะวันตก', meter: '15/45', need: 'ใช้เอง', status: 'ติดต่อแล้ว', created: '2026-05-09', kw: 5.2, panels: 9, inverter: 'Inverter 5kW', roofStruct: 'เมทัลชีท', cable: 22, photos: '', surveyNote: '', customerNote: 'ขอใบเสนอราคา 2 แบบเปรียบเทียบ', noteHistory: [], items: [{ name: 'แผงโซลาร์ 580W Tier 1', qty: 9, price: 6500 }, { name: 'Inverter 5kW', qty: 1, price: 42000 }], discount: 3000, labor: 22000, payments: payTemplate(), elecWanted: false, elec: elecTemplate(), contacts: [], nextAppt: '2026-05-18', attach: '', sitePhotos: [], photoChecklist: defaultChecklist() },
  { customer: 'คุณวิชัย โรงงานพลาสติก', phone: '02-123-4567', line: '@wichai.factory', address: 'นิคมฯ บางปู สมุทรปราการ', building: 'โรงงาน', bill: 38000, roofArea: 520, roofDir: 'ทิศใต้', meter: '30/100', need: 'ใช้เอง + ขายไฟ', status: 'สำรวจหน้างาน', created: '2026-05-08', kw: 52, panels: 84, inverter: 'Inverter 15kW', roofStruct: 'เมทัลชีท โรงงาน', cable: 120, photos: '', surveyNote: 'พื้นที่กว้าง', customerNote: '', noteHistory: [], items: [{ name: 'แผงโซลาร์ 620W Tier 1', qty: 84, price: 7200 }, { name: 'Inverter 15kW', qty: 4, price: 92000 }], discount: 25000, labor: 85000, payments: payTemplate(), elecWanted: true, elec: elecTemplate(), contacts: [], nextAppt: '2026-05-22', attach: '', sitePhotos: [], photoChecklist: defaultChecklist() },
  { customer: 'คุณมานี รีสอร์ทเขาใหญ่', phone: '089-555-4433', line: '@manee.resort', address: 'อ.ปากช่อง นครราชสีมา', building: 'บ้าน', bill: 9200, roofArea: 120, roofDir: 'ทิศใต้', meter: '30/100', need: 'ใช้เอง', status: 'ตกลงจ้าง', created: '2026-05-05', kw: 12.2, panels: 21, inverter: 'Inverter 10kW', roofStruct: 'กระเบื้องลอนคู่', cable: 45, photos: '', surveyNote: '', customerNote: '', noteHistory: [], items: [{ name: 'แผงโซลาร์ 580W Tier 1', qty: 21, price: 6500 }, { name: 'Inverter 10kW', qty: 2, price: 68000 }], discount: 12000, labor: 42000, payments: payTemplate(), elecWanted: false, elec: elecTemplate(), contacts: [], nextAppt: '2026-05-25', attach: '', sitePhotos: [], photoChecklist: defaultChecklist() },
];

const fmt = (n: number) => safe(() => new Intl.NumberFormat('th-TH').format(Math.round(safeNum(n))), '0');
const fmtBaht = (n: number) => `฿${fmt(n)}`;
const fmt2 = (n: number) => safe(() => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(safeNum(n)), '0.00');
const fmtQty = (n: number) => fmt2(n);
const SPEC_CUSTOMER = { name: 'คุณ กาจ วิจิตรโรจน์', address: 'เลขที่ 55/51 ม.9 ถ.กาญจนาภิเษก แขวงทวีวัฒนา เขตทวีวัฒนา กรุงเทพมหานคร 10170', phone: '089-944-1004', taxId: '-', attn: '-' };
function quoteRowNet(it: QuoteItem) { return safeNum(it.qty) * safeNum(it.price) - safeNum(it.discount); }
function quoteSummary(j: Job) {
  return safe(() => {
    const gross = (j.items || []).reduce((s, i) => s + safeNum(i.qty) * safeNum(i.price), 0) + safeNum(j.labor);
    const itemDiscount = (j.items || []).reduce((s, i) => s + safeNum(i.discount), 0);
    const totalDiscount = itemDiscount + safeNum(j.discount);
    const net = Math.max(0, gross - totalDiscount);
    const vat = Math.round(net * 0.07 * 100) / 100;
    return { gross, totalDiscount, net, vat, total: Math.round((net + vat) * 100) / 100 };
  }, { gross: 0, totalDiscount: 0, net: 0, vat: 0, total: 0 });
}
function resolveSeller(c: CompanySettings) { return { name: SPEC_SELLER.name, address: (c && c.address) || SPEC_SELLER.address, phone: (c && c.phone) || SPEC_SELLER.phone, email: (c && c.email) || SPEC_SELLER.email, taxId: (c && c.taxId) || SPEC_SELLER.taxId }; }
function resolveQuoteDoc(j: Job, fallbackNo: string) { return { docNo: j.quoteDocNo || 'QO-26080007', issueDate: j.quoteIssueDate || '17/08/2026', acceptDate: j.quoteAcceptDate || '', validUntil: j.quoteValidUntil || '24/08/2026', ref: j.quoteRef || '', fallbackNo }; }
function resolveCustomer(j: Job) { const isSpec = String(j.customer || '').includes('กาจ'); return { name: j.customer || SPEC_CUSTOMER.name, address: j.address || SPEC_CUSTOMER.address, phone: j.phone || SPEC_CUSTOMER.phone, taxId: j.customerTaxId !== undefined && j.customerTaxId !== '' ? j.customerTaxId : (isSpec ? SPEC_CUSTOMER.taxId : '-'), attn: j.customerAttn !== undefined && j.customerAttn !== '' ? j.customerAttn : (isSpec ? SPEC_CUSTOMER.attn : '-') }; }
function resolveContactBack(j: Job) { return { name: j.contactBackName || 'รัชกร แฟงสาตุ', phone: j.contactBackPhone || '0827411072', email: j.contactBackEmail || 'info.bge.energy@gmail.com' }; }
const emptyJob = (): Job => ({ customer: '', phone: '', line: '', address: '', building: 'บ้าน', bill: 0, roofArea: 0, roofDir: 'ทิศใต้', meter: '15/45', need: 'ใช้เอง', status: 'ลีดใหม่', created: safe(() => new Date().toISOString().slice(0, 10), '2026-08-17'), kw: 0, panels: 0, inverter: 'Inverter 5kW', roofStruct: '', cable: 0, photos: '', surveyNote: '', customerNote: '', noteHistory: [], items: [{ name: 'แผงโซลาร์ 580W Tier 1', qty: 10, price: 6500 }, { name: 'Inverter 5kW', qty: 1, price: 42000 }], discount: 0, labor: 25000, payments: payTemplate(), elecWanted: false, elec: elecTemplate(), contacts: [], nextAppt: '', attach: '', sitePhotos: [], photoChecklist: defaultChecklist(), quoteDocNo: '', quoteIssueDate: '', quoteAcceptDate: '', quoteValidUntil: '', quoteRef: '', customerTaxId: '-', customerAttn: '-', contactBackName: 'รัชกร แฟงสาตุ', contactBackPhone: '0827411072', contactBackEmail: 'info.bge.energy@gmail.com', quoteNote1: SPEC_QUOTE_NOTE1, quoteNote2: SPEC_QUOTE_NOTE2 });
const emptyCompany = (): CompanySettings => ({ address: '', phone: '', taxId: '', email: '' });
const emptyAppUser = (): AppUser => ({ name: '', username: '', password: '', phone: '', email: '', role: 'Sale', status: 'ใช้งาน', created: '2026-05-01', lastLogin: '—', permissions: ROLE_PERMS.Sale });

// Error boundary — never a white screen
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(p: any) { super(p); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { /* guarded: show fallback instead of white screen */ }
  render() {
    if (this.state.hasError) return <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}><h1>BGE SolarPro Backoffice</h1><p>เกิดข้อผิดพลาดชั่วคราว กรุณารีโหลดหน้าเว็บอีกครั้ง</p><button onClick={() => { try { window.location.reload(); } catch { /* ignore */ } }} style={{ padding: '10px 16px', borderRadius: 999, background: '#0B7DFF', color: '#fff', border: 0 }}>รีโหลดหน้า</button></div>;
    return this.props.children;
  }
}

function LogoText({ size = 'md' }: { size?: 'md' | 'lg' }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ background: '#0B7DFF', color: '#fff', fontWeight: 800, borderRadius: 12, padding: size === 'lg' ? '10px 14px' : '6px 10px', fontSize: size === 'lg' ? 22 : 16, letterSpacing: 1 }}>BGE</span>{size === 'lg' && <span style={{ fontWeight: 800, fontSize: 14, lineHeight: 1.2 }}>BETTER GROUP<br />ENGINEERING</span>}</div>;
}

function UploadBtn({ folder, onUrl, onError, disabled, label = 'อัปโหลดรูป' }: { folder: 'photos' | 'slips'; onUrl: (url: string) => void; onError: (m: string) => void; disabled?: boolean; label?: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[13px] font-semibold bg-white whitespace-nowrap ${disabled || busy ? 'opacity-50 pointer-events-none' : 'cursor-pointer hover:bg-gray-50'}`}>
      <Camera size={15} />{busy ? 'กำลังอัปโหลด…' : label}
      <input type="file" accept="image/*" className="hidden" disabled={disabled || busy} onChange={async e => {
        const input = e.currentTarget; const f = input.files?.[0]; if (!f) return;
        setBusy(true);
        try { onUrl(await uploadImage(f, folder)); } catch (err) { onError('อัปโหลดไม่สำเร็จ: ' + (err instanceof Error ? err.message : String(err))); }
        setBusy(false); input.value = '';
      }} />
    </label>
  );
}

export default function App() {
  return <ErrorBoundary><AppInner /></ErrorBoundary>;
}

function AppInner() {
  const [view, setView] = useState<'dashboard' | 'leads' | 'orders' | 'quotes' | 'finance' | 'electric' | 'album' | 'settings' | 'users' | 'profile'>('dashboard');
  const [records, setRecords] = useState<Rec[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [needFilter, setNeedFilter] = useState('ทั้งหมด');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Rec | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [form, setForm] = useState<Job>(emptyJob());
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [catalog] = useState(CATALOG);
  const [detailTab, setDetailTab] = useState('ข้อมูล');
  const [contactForm, setContactForm] = useState({ date: '2026-08-17', type: 'โทร', note: '' });
  const [quoteSearch, setQuoteSearch] = useState('');
  const [company, setCompany] = useState<CompanySettings>(emptyCompany());
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyBusy, setCompanyBusy] = useState(false);
  const [photoForm, setPhotoForm] = useState<Omit<SitePhoto, 'id'>>({ group: 'before', url: '', caption: '', date: '2026-08-17', photographer: '', category: 'หลังคา' });
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<SitePhoto | null>(null);
  const [confirmDeletePhotoId, setConfirmDeletePhotoId] = useState<string | null>(null);
  const [photoFilter, setPhotoFilter] = useState<'all' | 'before' | 'after'>('all');
  const [photoCategory, setPhotoCategory] = useState('ทั้งหมด');
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string; value: AppUser } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userRecords, setUserRecords] = useState<UserRec[]>([]);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [booting, setBooting] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('ทั้งหมด');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRec | null>(null);
  const [userForm, setUserForm] = useState<AppUser>(emptyAppUser());
  const [userFormError, setUserFormError] = useState<string | null>(null);
  const [userBusy, setUserBusy] = useState(false);
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<UserRec | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [profileForm, setProfileForm] = useState({ current: '', next: '', confirm: '' });
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  useEffect(() => { setEditingNote(false); setNoteDraft(''); }, [detailId]);

  const can = (k: PermKey) => !!currentUser?.value.permissions?.[k];
  const initials = (name: string) => safe(() => { const parts = String(name || '').replace(/^คุณ/, '').trim().split(/\s+/).filter(Boolean); if (parts.length === 0) return 'B'; if (parts.length === 1) return parts[0].slice(0, 2); return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase(); }, 'B');

  const reloadRecords = async () => {
    try {
      const data: any = await callApi("records.list", { collection: "solarpro_jobs" });
      const list = (data.records || []) as any[];
      setRecords(list.map((r: any) => ({ id: r.id, value: normalizeJob(r.value) })));
      return list;
    } catch (e) { throw e; }
  };
  const reloadUsers = async () => {
    const data: any = await callApi("records.list", { collection: "solarpro_users" });
    const list = (data.records || []) as any[];
    const mapped = list.map((r: any) => ({ id: r.id, value: normalizeUser(r.value) }));
    setUserRecords(mapped);
    return mapped;
  };
  const reloadCompany = async () => {
    try {
      const data: any = await callApi("records.list", { collection: "bge_company_settings" });
      const list = (data.records || []) as any[];
      if (list[0]) { setCompanyId(list[0].id); setCompany({ address: list[0].value?.address || '', phone: list[0].value?.phone || '', taxId: list[0].value?.taxId || '', email: list[0].value?.email || '' }); }
    } catch { /* keep blank until saved */ }
  };
  // Restore the session (httpOnly cookie) on first load.
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' });
        const json = await res.json().catch(() => ({} as any));
        const u = json?.data?.user;
        if (u) { setCurrentUser({ id: u.id, value: normalizeUser(u.value) }); setCurrentUserId(u.id); }
      } catch { /* show login */ }
      setBooting(false);
    })();
  }, []);
  // Load data once signed in.
  useEffect(() => {
    if (!currentUserId) return;
    (async () => {
      setLoading(true);
      try { await reloadRecords(); setApiError(null); } catch (e) { setApiError('เชื่อมต่อฐานข้อมูลไม่ได้: ' + (e instanceof Error ? e.message : String(e))); }
      setLoading(false);
      await reloadCompany();
      try { await reloadUsers(); } catch { /* users list is permission-gated */ }
    })();
  }, [currentUserId]);

  async function handleLogin(e?: React.FormEvent) {
    try {
      e?.preventDefault(); setLoginError(null);
      const u = loginUsername.trim();
      if (!u || !loginPassword) { setLoginError('กรุณากรอก Username และ Password'); return; }
      setLoginBusy(true);
      try {
        const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: u, password: loginPassword }) });
        const json = await res.json().catch(() => ({} as any));
        if (!res.ok || json.error) { setLoginError(json.error || 'เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง'); return; }
        const user = json.data.user;
        setCurrentUser({ id: user.id, value: normalizeUser(user.value) }); setCurrentUserId(user.id); setView('dashboard');
        setLoginPassword(''); setLoginError(null);
      } finally { setLoginBusy(false); }
    } catch { setLoginError('เข้าสู่ระบบไม่สำเร็จ กรุณาลองอีกครั้ง'); setLoginBusy(false); }
  }
  function logout() { try { void fetch('/api/auth/logout', { method: 'POST' }).catch(() => {}); setRecords([]); setUserRecords([]); setCurrentUser(null); setCurrentUserId(null); setDetailId(null); setQuoteId(null); setView('dashboard'); setLoginUsername(''); setLoginPassword(''); setLoginError(null); } catch { /* ignore */ } }

  async function saveUser(e?: React.FormEvent) {
    try {
      e?.preventDefault(); setUserFormError(null);
      if (!userForm.name.trim() || !userForm.username.trim()) { setUserFormError('กรุณากรอกชื่อและ Username'); return; }
      if (!editingUser && !userForm.password) { setUserFormError('กรุณากำหนด Password สำหรับผู้ใช้ใหม่'); return; }
      const dup = userRecords.find(r => String(r.value.username || '').toLowerCase() === userForm.username.trim().toLowerCase() && r.id !== editingUser?.id);
      if (dup) { setUserFormError('Username นี้มีอยู่แล้ว กรุณาใช้ Username อื่น'); return; }
      setUserBusy(true);
      const toSave: AppUser = { ...userForm, username: userForm.username.trim(), password: editingUser && !userForm.password ? editingUser.value.password : userForm.password, created: editingUser ? editingUser.value.created : '2026-05-01', lastLogin: editingUser ? editingUser.value.lastLogin : '—' };
      try {
        if (editingUser) { await replaceRow("solarpro_users", editingUser.id, toSave); if (editingUser.id === currentUserId) setCurrentUser({ id: editingUser.id, value: toSave }); }
        else { await createRow("solarpro_users", toSave, `user-${toSave.username}-${Date.now()}`); }
        await reloadUsers(); setShowUserForm(false); setEditingUser(null); setResult(editingUser ? 'อัปเดตผู้ใช้แล้ว' : 'เพิ่มผู้ใช้ใหม่แล้ว');
      } catch (err) { setUserFormError('บันทึกผู้ใช้ไม่สำเร็จ: ' + (err instanceof Error ? err.message : String(err))); }
      setUserBusy(false);
    } catch { setUserFormError('บันทึกผู้ใช้ไม่สำเร็จ'); setUserBusy(false); }
  }
  async function toggleUserActive(rec: UserRec) {
    try {
      const next = { ...rec.value, status: (rec.value.status === 'ใช้งาน' ? 'ปิดใช้งาน' : 'ใช้งาน') as AppUser['status'] };
      setUserRecords(prev => prev.map(r => r.id === rec.id ? { ...r, value: next } : r));
      try { await replaceRow("solarpro_users", rec.id, next); if (rec.id === currentUserId && next.status !== 'ใช้งาน') { setResult('บัญชีของคุณถูกปิดใช้งาน ระบบจะออกจากระบบ'); logout(); } else setResult(`${next.status === 'ใช้งาน' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} ${next.name} แล้ว`); } catch (err) { setResult('บันทึกสถานะไม่สำเร็จ: ' + (err instanceof Error ? err.message : String(err))); }
    } catch { /* ignore */ }
  }
  async function deleteUser(rec: UserRec) {
    try {
      if (rec.id === currentUserId) { setResult('ไม่สามารถลบบัญชีของตัวเองได้'); setConfirmDeleteUserId(null); return; }
      try { await callApi("records.delete", { collection: "solarpro_users", id: rec.id }); await reloadUsers(); setResult('ลบผู้ใช้แล้ว'); } catch (err) { setResult('ลบไม่สำเร็จ: ' + (err instanceof Error ? err.message : String(err))); }
      setConfirmDeleteUserId(null);
    } catch { /* ignore */ }
  }
  async function submitResetPassword() {
    try {
      if (!resetTarget) return;
      if (resetPassword.length < 4) { setUserFormError('รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร'); return; }
      const next = { ...resetTarget.value, password: resetPassword };
      try { await replaceRow("solarpro_users", resetTarget.id, next); await reloadUsers(); setResetTarget(null); setResetPassword(''); setResult(`รีเซ็ตรหัสผ่านของ ${next.name} แล้ว`); } catch (err) { setUserFormError('รีเซ็ตรหัสผ่านไม่สำเร็จ: ' + (err instanceof Error ? err.message : String(err))); }
    } catch { /* ignore */ }
  }
  async function changeOwnPassword(e?: React.FormEvent) {
    try {
      e?.preventDefault(); setProfileMsg(null);
      if (!currentUser) return;
      if (profileForm.next.length < 4) { setProfileMsg('รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร'); return; }
      if (profileForm.next !== profileForm.confirm) { setProfileMsg('รหัสผ่านใหม่กับยืนยันรหัสผ่านไม่ตรงกัน'); return; }
      setProfileBusy(true);
      try {
        const res = await fetch('/api/auth/password', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ current: profileForm.current, next: profileForm.next }) });
        const json = await res.json().catch(() => ({} as any));
        if (!res.ok || json.error) throw new Error(json.error || `API error ${res.status}`);
        setProfileForm({ current: '', next: '', confirm: '' }); setProfileMsg('เปลี่ยนรหัสผ่านสำเร็จแล้ว');
      } catch (err) { setProfileMsg('เปลี่ยนรหัสผ่านไม่สำเร็จ: ' + (err instanceof Error ? err.message : String(err))); }
      setProfileBusy(false);
    } catch { setProfileMsg('เปลี่ยนรหัสผ่านไม่สำเร็จ'); setProfileBusy(false); }
  }

  const jobs = records.map(r => r.value);
  const filtered = useMemo(() => safe(() => records.filter(r => {
    const q = search.toLowerCase();
    const hit = !q || String(r.value.customer || '').toLowerCase().includes(q) || String(r.value.phone || '').includes(q) || String(r.value.address || '').toLowerCase().includes(q) || String(r.value.customerNote || '').toLowerCase().includes(q);
    const st = statusFilter === 'ทั้งหมด' || r.value.status === statusFilter;
    const nd = needFilter === 'ทั้งหมด' || r.value.need === needFilter;
    return hit && st && nd;
  }), records), [records, search, statusFilter, needFilter]);
  const filteredUsers = useMemo(() => safe(() => userRecords.filter(r => {
    const q = userSearch.toLowerCase();
    const hit = !q || String(r.value.name || '').toLowerCase().includes(q) || String(r.value.username || '').toLowerCase().includes(q) || String(r.value.phone || '').includes(q) || String(r.value.email || '').toLowerCase().includes(q);
    const role = userRoleFilter === 'ทั้งหมด' || r.value.role === userRoleFilter;
    return hit && role;
  }), userRecords), [userRecords, userSearch, userRoleFilter]);

  const stats = useMemo(() => safe(() => {
    const totalSales = jobs.filter(j => ['ตกลงจ้าง', 'มัดจำแล้ว', 'รอติดตั้ง', 'ติดตั้งแล้ว', 'ยื่นการไฟฟ้า', 'ส่งมอบงาน'].includes(j.status)).reduce((s, j) => s + calcTotal(j).total, 0);
    const waitingMoney = jobs.reduce((s, j) => s + paymentAmounts(j).filter(p => p.status !== 'ยืนยันแล้ว').reduce((a, p) => a + p.amount, 0), 0);
    return { totalSales, newLeads: jobs.filter(j => j.status === 'ลีดใหม่').length, waitInstall: jobs.filter(j => j.status === 'รอติดตั้ง').length, waitElec: jobs.filter(j => j.status === 'ยื่นการไฟฟ้า').length, waitingMoney, near: jobs.filter(j => !!j.nextAppt).length };
  }, { totalSales: 0, newLeads: 0, waitInstall: 0, waitElec: 0, waitingMoney: 0, near: 0 }), [jobs]);

  async function saveJob(e?: React.FormEvent) {
    try {
      e?.preventDefault();
      if (editing && !can('customers_edit')) { setResult('ไม่มีสิทธิ์แก้ไขข้อมูลลูกค้า'); return; }
      if (!editing && !can('customers_create')) { setResult('ไม่มีสิทธิ์สร้างลูกค้า'); return; }
      if (!form.customer.trim() || !form.phone.trim()) { setResult('กรุณากรอกชื่อลูกค้าและเบอร์โทร'); return; }
      setBusy(true); setResult(null);
      let saved = 0; let error: string | null = null;
      try {
        if (editing) { await replaceRow("solarpro_jobs", editing.id, form); }
        else { await createRow("solarpro_jobs", form, `job-${Date.now()}`); }
        saved += 1;
      } catch (err) { error = err instanceof Error ? err.message : String(err); }
      let reloadError: string | null = null;
      try { await reloadRecords(); } catch (err) { reloadError = err instanceof Error ? err.message : String(err); }
      setResult(saved ? `บันทึกสำเร็จ ${saved} รายการ` : `บันทึกไม่สำเร็จ: ${error || reloadError || ''}`);
      setBusy(false);
      if (saved && !error) { setShowAdd(false); setEditing(null); setForm(emptyJob()); }
    } catch { setBusy(false); setResult('บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง'); }
  }
  async function saveCompany(e?: React.FormEvent) {
    try {
      e?.preventDefault();
      if (!can('settings_edit')) { setResult('ไม่มีสิทธิ์แก้ไขตั้งค่าระบบ'); return; }
      setCompanyBusy(true); setResult(null);
      try {
        if (companyId) { await replaceRow("bge_company_settings", companyId, company); }
        else { const created: any = await createRow("bge_company_settings", company, `bge-company-${Date.now()}`); if (created?.id) setCompanyId(created.id); }
        await reloadCompany(); setResult('บันทึกข้อมูลบริษัทสำหรับใบเสนอราคาแล้ว');
      } catch (err) { setResult('บันทึกข้อมูลบริษัทไม่สำเร็จ: ' + (err instanceof Error ? err.message : String(err))); }
      setCompanyBusy(false);
    } catch { setCompanyBusy(false); }
  }
  async function updateJob(id: string, patch: Partial<Job>, opts?: { require?: PermKey }) {
    try {
      if (opts?.require && !can(opts.require)) { setResult('ไม่มีสิทธิ์'); return; }
      const rec = records.find(r => r.id === id); if (!rec) return;
      const next = { ...rec.value, ...patch };
      setRecords(prev => prev.map(r => r.id === id ? { ...r, value: next } : r));
      try { await replaceRow("solarpro_jobs", id, next); } catch (e) { setResult('บันทึกไม่สำเร็จ: ' + (e instanceof Error ? e.message : String(e))); }
    } catch { /* ignore */ }
  }
  function saveSitePhoto() {
    try {
      if (!can('photos_upload')) { setPhotoMsg('ไม่มีสิทธิ์อัปโหลดภาพหน้างาน'); return; }
      const cur = records.find(r => r.id === detailId); if (!cur) return;
      if (!photoForm.caption.trim()) { setPhotoMsg('กรุณากรอกคำอธิบายภาพ'); return; }
      const job = cur.value;
      let next: SitePhoto[];
      if (editingPhotoId) { next = job.sitePhotos.map(p => p.id === editingPhotoId ? { ...p, ...photoForm } : p); setPhotoMsg('แก้ไขภาพหน้างานแล้ว'); }
      else { next = [...job.sitePhotos, { ...photoForm, id: `photo-${Date.now()}` }]; setPhotoMsg('เพิ่มภาพหน้างานแล้ว'); }
      updateJob(cur.id, { sitePhotos: next });
      setPhotoForm({ group: photoForm.group, url: '', caption: '', date: '2026-08-17', photographer: photoForm.photographer, category: 'หลังคา' });
      setEditingPhotoId(null);
    } catch { setPhotoMsg('บันทึกภาพไม่สำเร็จ'); }
  }
  function startEditPhoto(p: SitePhoto) {
    try {
      if (!can('photos_upload')) { setPhotoMsg('ไม่มีสิทธิ์แก้ไขภาพหน้างาน'); return; }
      setEditingPhotoId(p.id); setPhotoMsg(null); setConfirmDeletePhotoId(null);
      setPhotoForm({ group: p.group, url: p.url, caption: p.caption, date: p.date, photographer: p.photographer, category: p.category });
      setPhotoFilter(p.group); setPhotoCategory('ทั้งหมด');
    } catch { /* ignore */ }
  }
  function deleteSitePhoto(photoId: string) {
    try {
      if (!can('photos_delete')) { setPhotoMsg('ไม่มีสิทธิ์ลบภาพหน้างาน'); return; }
      const cur = records.find(r => r.id === detailId); if (!cur) return;
      updateJob(cur.id, { sitePhotos: cur.value.sitePhotos.filter(p => p.id !== photoId) });
      setConfirmDeletePhotoId(null); setPhotoMsg('ลบภาพหน้างานแล้ว');
      if (lightbox?.id === photoId) setLightbox(null);
    } catch { /* ignore */ }
  }
  function toggleChecklist(itemId: string) {
    try {
      if (!can('photos_upload')) { setPhotoMsg('ไม่มีสิทธิ์อัปเดต Checklist ภาพ'); return; }
      const cur = records.find(r => r.id === detailId); if (!cur) return;
      updateJob(cur.id, { photoChecklist: cur.value.photoChecklist.map(c => c.id === itemId ? { ...c, done: !c.done } : c) });
    } catch { /* ignore */ }
  }
  function saveCustomerNote() {
    try {
      const cur = records.find(r => r.id === detailId); if (!cur) return;
      const nextNote = noteDraft.trim();
      if (nextNote === cur.value.customerNote) { setEditingNote(false); return; }
      const today = safe(() => new Date().toISOString().slice(0, 10), '2026-08-17');
      const history = cur.value.customerNote ? [...(cur.value.noteHistory || []), { date: today, text: cur.value.customerNote }] : [...(cur.value.noteHistory || [])];
      updateJob(cur.id, { customerNote: nextNote, noteHistory: history });
      setEditingNote(false); setResult('บันทึก Note การคุยกับลูกค้าแล้ว');
    } catch { /* ignore */ }
  }
  async function deleteJob(id: string) {
    try {
      if (!can('customers_delete')) { setResult('ไม่มีสิทธิ์ลบลูกค้า'); return; }
      try { await callApi("records.delete", { collection: "solarpro_jobs", id }); await reloadRecords(); setResult('ลบรายการแล้ว'); } catch (err) { setResult('ลบไม่สำเร็จ: ' + (err instanceof Error ? err.message : String(err))); }
    } catch { /* ignore */ }
  }

  const quoteNoFor = (id: string) => 'QT-' + String(id || '').slice(-4).toUpperCase();
  const detailRec = records.find(r => r.id === detailId) || null;
  const quoteRec = records.find(r => r.id === quoteId) || null;
  const quoteJobs = quoteSearch ? records.filter(r => String(r.value.customer || '').toLowerCase().includes(quoteSearch.toLowerCase())) : records;
  const allPhotos: { job: Job; photo: SitePhoto }[] = safe(() => records.flatMap(r => (r.value.sitePhotos || []).map(photo => ({ job: r.value, photo }))), []);

  const NavItem = ({ id, label, icon, badge }: { id: any; label: string; icon: React.ReactNode; badge?: number }) => (
    <button onClick={() => { try { setView(id); setSidebarOpen(false); } catch { /* ignore */ } }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[14px] font-medium transition ${view === id ? 'bg-[var(--primary)] text-white shadow-md' : 'text-[var(--ink)] hover:bg-[var(--primary-soft)]'}`}>
      {icon}<span className="flex-1">{label}</span>{typeof badge === 'number' && badge > 0 && <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${view === id ? 'bg-white text-[#0B7DFF]' : 'bg-blue-100 text-blue-700'}`}>{badge}</span>}
    </button>
  );
  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-[var(--line2)] bg-[var(--surface)] text-[14px] text-[var(--ink)]";
  const labelCls = "text-[12px] font-semibold text-[var(--muted)] mb-1 block";

  if (!currentUser) {
    if (booting) return <div className="min-h-screen flex items-center justify-center text-[var(--muted)]">กำลังโหลด…</div>;
    return (
      <div style={{ boxSizing: 'border-box', minHeight: '100vh', background: 'var(--bg)' }} className="overflow-x-clip flex items-center justify-center p-4">
        <div className="w-full max-w-[560px]">
          <div className="bg-[var(--surface)] rounded-[28px] border border-[var(--line2)] shadow-xl overflow-hidden">
            <div className="bg-gradient-to-br from-[#1E90FF] to-[#0B3D7A] text-white p-6 sm:p-8 text-center">
              <div className="bg-white rounded-2xl p-3 inline-block"><LogoText size="lg" /></div>
              <h1 className="text-[22px] font-extrabold mt-3 leading-tight">BGE SolarPro Backoffice</h1>
              <p className="text-[12px] opacity-90 mt-1">BETTER GROUP ENGINEERING CO., LTD.</p>
              <p className="text-[13px] opacity-85 mt-2">เข้าสู่ระบบเพื่อจัดการลูกค้า ออเดอร์ ใบเสนอราคา และการเงิน</p>
            </div>
            <form onSubmit={handleLogin} className="p-5 sm:p-6 space-y-3">
              <div><label className={labelCls}>Username</label><input value={loginUsername} onChange={e => { setLoginUsername(e.target.value); setLoginError(null); }} className={inputCls} placeholder="เช่น admin" autoComplete="username" /></div>
              <div><label className={labelCls}>Password</label><input type="password" value={loginPassword} onChange={e => { setLoginPassword(e.target.value); setLoginError(null); }} className={inputCls} placeholder="••••••••" autoComplete="current-password" /></div>
              {loginError && <div className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] px-3 py-2.5 rounded-xl flex gap-2"><AlertTriangle size={17} className="shrink-0" />{loginError}</div>}
              <button disabled={loginBusy} type="submit" className="w-full bg-[var(--primary)] text-white py-3 rounded-full font-bold text-[15px] disabled:opacity-50">{loginBusy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}</button>
            </form>
          </div>
          <p className="text-center text-[11px] text-[var(--muted)] mt-3">BGE • BETTER GROUP ENGINEERING CO., LTD.</p>
        </div>
      </div>
    );
  }

  return (
    <div data-safe-area-inset-root style={{ boxSizing: 'border-box', paddingTop: 'var(--safe-area-inset-top)', minHeight: '100vh', background: 'var(--bg)' }} className="overflow-x-clip">
      <header data-safe-area-sticky-top style={{ top: 'var(--safe-area-inset-top)' }} className="sticky z-30 bg-[var(--surface)]/95 backdrop-blur border-b border-[var(--line2)]">
        <div className="flex items-center gap-3 px-3 sm:px-6 h-[64px]">
          <button onClick={() => { try { setSidebarOpen(!sidebarOpen); } catch { /* ignore */ } }} className="lg:hidden p-2 rounded-lg bg-[var(--primary-soft)]" aria-label="เมนู"><Menu size={20} /></button>
          <div className="flex items-center gap-2 min-w-0"><LogoText /><div className="leading-none min-w-0"><div className="font-extrabold text-[16px] truncate">BGE <span className="text-[var(--primary)]">SolarPro</span> <span className="hidden sm:inline text-[12px] font-medium text-[var(--muted)]">Backoffice</span></div><div className="text-[11px] text-[var(--muted)] truncate">BETTER GROUP ENGINEERING CO., LTD.</div></div></div>
          <div className="flex-1 hidden md:block max-w-[420px] mx-auto relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อลูกค้า เบอร์โทร ที่อยู่…" className="w-full pl-9 pr-3 py-2.5 rounded-full border border-[var(--line2)] bg-[var(--bg)] text-[14px]" /></div>
          <div className="ml-auto md:ml-0 flex items-center gap-2">
            {can('customers_create') && <button onClick={() => { try { setForm(emptyJob()); setEditing(null); setShowAdd(true); } catch { /* ignore */ } }} className="flex items-center gap-1.5 bg-[var(--primary)] text-white px-3 sm:px-4 py-2.5 rounded-full text-[13px] font-semibold shadow"><Plus size={18} /><span className="hidden sm:inline">เพิ่มลูกค้าใหม่</span><span className="sm:hidden">เพิ่ม</span></button>}
            <button onClick={() => { try { setView('profile'); } catch { /* ignore */ } }} className="flex items-center gap-2 bg-[var(--primary-soft)] rounded-full pl-1 pr-2 py-1 text-left"><span className="w-8 h-8 rounded-full bg-[#0B3D7A] text-white flex items-center justify-center text-[12px] font-extrabold shrink-0">{initials(currentUser.value.name)}</span><span className="hidden sm:block leading-tight min-w-0"><span className="block text-[12px] font-bold truncate max-w-[120px]">{currentUser.value.name}</span><span className="block text-[10px] text-[var(--muted)]">{ROLE_LABEL[currentUser.value.role]} • {currentUser.value.username}</span></span></button>
            <button onClick={logout} className="flex items-center gap-1.5 bg-slate-800 text-white px-3 py-2.5 rounded-full text-[13px] font-semibold"><LogOut size={16} /><span className="hidden sm:inline">Logout</span></button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`fixed lg:sticky lg:top-[64px] z-40 lg:z-0 top-0 left-0 h-full lg:h-[calc(100vh-64px)] w-[260px] shrink-0 bg-[var(--surface)] border-r border-[var(--line2)] p-4 flex flex-col gap-1 transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="flex lg:hidden justify-between items-center mb-2"><span className="font-bold">เมนู</span><button onClick={() => setSidebarOpen(false)} className="p-1"><X /></button></div>
          <div className="bg-white border border-[var(--line2)] rounded-2xl p-3 mb-2"><LogoText size="lg" /><div className="mt-2 text-center"><div className="font-extrabold text-[14px] leading-tight">BGE SolarPro Backoffice</div><div className="text-[10px] text-[var(--muted)] leading-tight mt-1">BETTER GROUP ENGINEERING CO., LTD.</div></div></div>
          <div className="rounded-2xl bg-[var(--primary-soft)] p-3 mb-2 flex items-center gap-2"><span className="w-9 h-9 rounded-full bg-[#0B3D7A] text-white flex items-center justify-center text-[12px] font-extrabold shrink-0">{initials(currentUser.value.name)}</span><div className="min-w-0"><div className="font-bold text-[13px] truncate">{currentUser.value.name}</div><div className="text-[11px] text-[var(--muted)]">{ROLE_LABEL[currentUser.value.role]} • @{currentUser.value.username}</div></div></div>
          <NavItem id="dashboard" label="แดชบอร์ด" icon={<LayoutDashboard size={19} />} />
          {can('customers_view') && <NavItem id="leads" label="ลูกค้า" icon={<Users size={19} />} badge={records.length} />}
          {can('orders_view') && <NavItem id="orders" label="ออเดอร์ / งานติดตั้ง" icon={<ClipboardList size={19} />} badge={stats.waitInstall} />}
          {can('quotes_view') && <NavItem id="quotes" label="ใบเสนอราคา" icon={<FileText size={19} />} />}
          {can('finance_view') && <NavItem id="finance" label="การเงิน" icon={<Wallet size={19} />} />}
          {can('electric_view') && <NavItem id="electric" label="งานการไฟฟ้า" icon={<Zap size={19} />} badge={stats.waitElec} />}
          {can('photos_view') && <NavItem id="album" label="อัลบั้ม" icon={<Camera size={19} />} badge={allPhotos.length} />}
          {can('users_view') && <NavItem id="users" label="ผู้ใช้" icon={<UserCog size={19} />} badge={userRecords.length} />}
          {can('settings_view') && <NavItem id="settings" label="ตั้งค่าบริษัท / อุปกรณ์" icon={<Settings size={19} />} />}
          <NavItem id="profile" label="โปรไฟล์ของฉัน" icon={<UserIcon size={19} />} />
          <div className="mt-auto rounded-2xl bg-gradient-to-br from-[#1E90FF] to-[#0B7DFF] text-white p-4"><div className="flex items-center gap-2 font-bold"><Sun size={20} /> เคล็ดลับวันนี้</div><p className="text-[12px] leading-relaxed mt-1 opacity-90">หลังคาทิศใต้ให้ผลผลิตดีที่สุด ติดตามลีดภายใน 24 ชม. เพิ่มโอกาสปิดงานถึง 2 เท่า</p></div>
          <p className="text-[11px] text-center text-[var(--muted)]">BGE • BETTER GROUP ENGINEERING</p>
        </aside>
        {sidebarOpen && <button aria-label="ปิดเมนู" onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/30 z-30 lg:hidden" />}

        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 max-w-[1320px] mx-auto w-full">
          {apiError && <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 text-[13px] px-4 py-3 rounded-2xl flex gap-2"><AlertTriangle size={18} className="shrink-0" />{apiError}</div>}
          {result && <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] px-4 py-3 rounded-2xl flex justify-between gap-2"><span>{result}</span><button onClick={() => setResult(null)} className="font-bold">×</button></div>}
          {loading && <div className="py-10 text-center text-[var(--muted)]">กำลังโหลดข้อมูล…</div>}

          {view === 'dashboard' && !loading && <>
            <div className="flex flex-wrap items-end justify-between gap-3 mb-4"><div><h1 className="text-[22px] sm:text-[28px] font-extrabold leading-tight">ภาพรวมวันนี้</h1><p className="text-[13px] text-[var(--muted)]">สวัสดี {currentUser.value.name} ({ROLE_LABEL[currentUser.value.role]}) — สรุปงานขาย ติดตั้ง และการเงิน</p></div><div className="flex gap-2"><button onClick={() => setView('orders')} className="bg-[var(--dark)] text-white px-4 py-2 rounded-full text-[13px] font-semibold">ดูงานทั้งหมด →</button></div></div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {[{ label: 'ยอดขาย (งานที่ตกลงแล้ว)', val: fmtBaht(stats.totalSales), sub: `จาก ${jobs.length} งานทั้งหมด`, icon: <TrendingUp />, bg: 'from-[#1E90FF] to-[#0B7DFF]' }, { label: 'ลีดใหม่', val: String(stats.newLeads), sub: 'รอติดต่อกลับ', icon: <Users />, bg: 'from-sky-400 to-blue-600' }, { label: 'งานรอติดตั้ง', val: String(stats.waitInstall), sub: 'พร้อมเข้าหน้างาน', icon: <Clock />, bg: 'from-slate-500 to-slate-700' }, { label: 'งานรอการไฟฟ้า', val: String(stats.waitElec), sub: 'ยื่นขายไฟ / ขนานไฟ', icon: <Zap />, bg: 'from-emerald-400 to-teal-600' }, { label: 'เงินรอโอน', val: fmtBaht(stats.waitingMoney), sub: 'ยอดคงค้างทุกงวด', icon: <Wallet />, bg: 'from-blue-500 to-indigo-600' }, { label: 'ภาพหน้างานทั้งหมด', val: String(allPhotos.length), sub: 'Before / After', icon: <Camera />, bg: 'from-cyan-500 to-blue-600' }].map((c, i) => (
                <div key={i} className="bg-[var(--surface)] rounded-3xl p-4 sm:p-5 border border-[var(--line2)] shadow-sm"><div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${c.bg} text-white flex items-center justify-center mb-3`}>{c.icon}</div><div className="text-[12px] text-[var(--muted)] font-medium">{c.label}</div><div className="text-[clamp(20px,4vw,32px)] font-extrabold leading-tight [overflow-wrap:anywhere]">{c.val}</div><div className="text-[12px] text-[var(--muted)]">{c.sub}</div></div>
              ))}
            </div>
            <div className="grid lg:grid-cols-5 gap-4 mt-4">
              <div className="lg:col-span-3 bg-[var(--surface)] rounded-3xl border p-4 sm:p-5"><div className="flex justify-between items-center mb-3"><h3 className="font-bold">งานล่าสุด</h3><button onClick={() => setView('orders')} className="text-[var(--primary)] text-[13px] font-semibold">ดูทั้งหมด →</button></div>
                <div className="space-y-2">{records.slice(0, 5).map(r => (<button key={r.id} onClick={() => setDetailId(r.id)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-[var(--primary-soft)] text-left"><div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">{String(r.value.customer || '').replace('คุณ', '').trim().charAt(0)}</div><div className="flex-1 min-w-0"><div className="font-semibold text-[14px] truncate">{r.value.customer}</div><div className="text-[12px] text-[var(--muted)] truncate flex gap-1"><MapPin size={12} />{r.value.address}</div></div><span className="text-[11px] font-bold px-2 py-1 rounded-full shrink-0" style={{ background: STATUS_COLOR[r.value.status] }}>{r.value.status}</span><span className="font-bold text-[14px] hidden sm:block">{fmtBaht(calcTotal(r.value).total)}</span></button>))}</div>
              </div>
              <div className="lg:col-span-2 space-y-4"><div className="bg-[var(--surface)] rounded-3xl border p-5"><h3 className="font-bold mb-2">สัดส่วนตามสถานะ</h3>{STATUSES.filter(s => jobs.some(j => j.status === s)).map(s => { const n = jobs.filter(j => j.status === s).length; const pct = Math.round(n / Math.max(1, jobs.length) * 100); return <div key={s} className="mb-2"><div className="flex justify-between text-[12px] mb-1"><span>{s}</span><span className="font-bold">{n} งาน • {pct}%</span></div><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#0B7DFF] rounded-full" style={{ width: pct + '%' }} /></div></div>; })}</div><div className="bg-[var(--dark)] text-white rounded-3xl p-5"><div className="text-[13px] opacity-80">งานที่ต้องการขายไฟ</div><div className="text-[28px] font-extrabold">{jobs.filter(j => j.elecWanted).length} งาน <span className="text-[13px] font-medium opacity-70">จาก {jobs.length} งาน</span></div><button onClick={() => setView('electric')} className="mt-3 bg-[#1E90FF] text-white px-4 py-2 rounded-full text-[13px] font-bold w-full">ติดตามงานการไฟฟ้า →</button></div></div>
            </div>
          </>}

          {view === 'users' && <>
            <div className="flex flex-wrap gap-3 items-end justify-between mb-4"><div><h1 className="text-[24px] font-extrabold flex items-center gap-2"><UserCog className="text-[var(--primary)]" /> ผู้ใช้</h1><p className="text-[13px] text-[var(--muted)]">เฉพาะผู้ดูแลระบบ — เพิ่ม แก้ไข ปิด-เปิดใช้งาน ลบ และรีเซ็ตรหัสผ่าน</p></div>
              {can('users_manage') ? <button onClick={() => { try { setUserForm(emptyAppUser()); setEditingUser(null); setUserFormError(null); setShowUserForm(true); } catch { /* ignore */ } }} className="flex items-center gap-1.5 bg-[var(--primary)] text-white px-4 py-2.5 rounded-full text-[13px] font-bold"><Plus size={17} /> เพิ่มผู้ใช้ใหม่</button> : <span className="bg-gray-100 text-gray-400 px-4 py-2.5 rounded-full text-[13px] font-bold">+ เพิ่มผู้ใช้ใหม่</span>}
            </div>
            <div className="flex flex-col md:flex-row gap-2 mb-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="ค้นหาชื่อ Username เบอร์โทร อีเมล…" className={inputCls + ' pl-9 !rounded-full'} /></div><select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)} className={inputCls + ' md:w-[200px] !rounded-full'}><option>ทั้งหมด</option><option value="Admin">Admin</option><option value="Sale">Sale</option><option value="Technician">Technician</option><option value="Accountant">Accountant</option></select></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">{(['Admin', 'Sale', 'Technician', 'Accountant'] as Role[]).map(r => <div key={r} className="bg-[var(--surface)] rounded-2xl border p-3"><div className="text-[12px] text-[var(--muted)]">{ROLE_LABEL[r]} ({r})</div><div className="text-[20px] font-extrabold">{userRecords.filter(x => x.value.role === r).length} คน</div></div>)}</div>
            <div className="bg-[var(--surface)] rounded-3xl border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-[13px] min-w-[900px]"><thead><tr className="bg-gray-50 text-left text-[12px] text-gray-500"><th className="px-4 py-3">ชื่อ</th><th className="px-4 py-3">Username</th><th className="px-4 py-3">เบอร์โทร</th><th className="px-4 py-3">บทบาท</th><th className="px-4 py-3">สถานะ</th><th className="px-4 py-3">เข้าสู่ระบบล่าสุด</th><th className="px-4 py-3">จัดการ</th></tr></thead><tbody>
              {filteredUsers.map(r => { const u = r.value; return <tr key={r.id} className="border-t"><td className="px-4 py-3"><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-[#0B3D7A] text-white flex items-center justify-center text-[11px] font-bold shrink-0">{initials(u.name)}</span><div><div className="font-semibold">{u.name}</div><div className="text-[11px] text-gray-500">{u.email}</div></div></div></td><td className="px-4 py-3 font-medium">@{u.username}</td><td className="px-4 py-3">{u.phone}</td><td className="px-4 py-3"><span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold whitespace-nowrap">{ROLE_LABEL[u.role]} ({u.role})</span></td><td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${u.status === 'ใช้งาน' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>{u.status}</span></td><td className="px-4 py-3">{u.lastLogin}</td><td className="px-4 py-3"><div className="flex gap-1 flex-wrap">{can('users_manage') ? <><button onClick={() => { try { setEditingUser(r); setUserForm({ ...u, permissions: { ...u.permissions }, password: '' }); setUserFormError(null); setShowUserForm(true); } catch { /* ignore */ } }} className="p-2 rounded-full bg-blue-100" aria-label="แก้ไขผู้ใช้"><Pencil size={15} /></button><button onClick={() => toggleUserActive(r)} className="px-2 py-1.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">{u.status === 'ใช้งาน' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}</button><button onClick={() => { try { setResetTarget(r); setResetPassword(''); setUserFormError(null); } catch { /* ignore */ } }} className="px-2 py-1.5 rounded-full bg-violet-100 text-violet-800 text-[11px] font-bold flex items-center gap-1"><KeyRound size={13} /> รีเซ็ตรหัส</button>{confirmDeleteUserId === r.id ? <span className="flex gap-1"><button onClick={() => deleteUser(r)} className="px-2 py-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold">ยืนยันลบ</button><button onClick={() => setConfirmDeleteUserId(null)} className="px-2 py-1.5 rounded-full border text-[11px] font-bold">ยกเลิก</button></span> : <button onClick={() => setConfirmDeleteUserId(r.id)} className="p-2 rounded-full bg-red-50 text-red-600" aria-label="ลบผู้ใช้"><Trash2 size={15} /></button>}</> : <span className="text-[12px] text-gray-400">ดูอย่างเดียว</span>}</div></td></tr>; })}
            </tbody></table></div>{filteredUsers.length === 0 && <p className="text-center py-8 text-[var(--muted)]">ไม่พบผู้ใช้ตามเงื่อนไข</p>}</div>
          </>}

          {view === 'profile' && <>
            <h1 className="text-[24px] font-extrabold">โปรไฟล์ของฉัน</h1><p className="text-[13px] text-[var(--muted)] mb-4">ข้อมูลบัญชีของตัวเอง และเปลี่ยนรหัสผ่าน</p>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-[var(--surface)] rounded-3xl border p-5"><div className="flex items-center gap-3"><span className="w-14 h-14 rounded-full bg-[#0B3D7A] text-white flex items-center justify-center text-[18px] font-extrabold">{initials(currentUser.value.name)}</span><div><div className="font-extrabold text-[18px]">{currentUser.value.name}</div><div className="text-[13px] text-[var(--muted)]">@{currentUser.value.username} • {ROLE_LABEL[currentUser.value.role]}</div></div><span className="ml-auto px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold">{currentUser.value.status}</span></div>
                <div className="grid grid-cols-2 gap-3 mt-4 text-[13px]">{[['เบอร์โทร', currentUser.value.phone], ['อีเมล', currentUser.value.email], ['วันที่สร้าง', currentUser.value.created], ['เข้าสู่ระบบล่าสุด', currentUser.value.lastLogin]].map(([k, v]) => <div key={k} className="bg-gray-50 rounded-2xl p-3"><div className="text-[11px] text-gray-500">{k}</div><div className="font-semibold break-words [overflow-wrap:anywhere]">{v}</div></div>)}</div>
                <div className="mt-4"><div className="font-bold text-[14px] mb-2 flex gap-1.5 items-center"><ShieldCheck size={17} className="text-[var(--primary)]" /> สิทธิ์ของฉัน</div><div className="space-y-2">{PERM_GROUPS.map(g => <div key={g.module} className="flex flex-wrap gap-1 items-center"><span className="text-[12px] font-bold w-[130px]">{g.module}:</span>{g.items.map(it => <span key={it.key} className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${currentUser.value.permissions[it.key] ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400 line-through'}`}>{it.label}</span>)}</div>)}</div></div>
              </div>
              <form onSubmit={changeOwnPassword} className="bg-[var(--surface)] rounded-3xl border p-5"><h2 className="font-bold flex gap-2 items-center"><Lock size={18} className="text-[var(--primary)]" /> เปลี่ยนรหัสผ่านของฉัน</h2><p className="text-[12px] text-[var(--muted)] mt-1 mb-3">กรอกรหัสผ่านปัจจุบัน แล้วตั้งรหัสผ่านใหม่ (อย่างน้อย 4 ตัวอักษร)</p><div className="space-y-3"><div><label className={labelCls}>รหัสผ่านปัจจุบัน</label><input type="password" value={profileForm.current} onChange={e => setProfileForm({ ...profileForm, current: e.target.value })} className={inputCls} /></div><div><label className={labelCls}>รหัสผ่านใหม่</label><input type="password" value={profileForm.next} onChange={e => setProfileForm({ ...profileForm, next: e.target.value })} className={inputCls} /></div><div><label className={labelCls}>ยืนยันรหัสผ่านใหม่</label><input type="password" value={profileForm.confirm} onChange={e => setProfileForm({ ...profileForm, confirm: e.target.value })} className={inputCls} /></div></div>{profileMsg && <div className={`mt-3 text-[13px] px-3 py-2.5 rounded-xl ${profileMsg.includes('สำเร็จ') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>{profileMsg}</div>}<button disabled={profileBusy} type="submit" className="w-full mt-4 bg-[var(--primary)] text-white py-3 rounded-full font-bold disabled:opacity-50">{profileBusy ? 'กำลังบันทึก…' : 'เปลี่ยนรหัสผ่าน'}</button><button type="button" onClick={logout} className="w-full mt-2 py-3 rounded-full border font-bold flex justify-center gap-2"><LogOut size={17} /> ออกจากระบบ</button></form>
            </div>
          </>}

          {view === 'leads' && <>
            <div className="flex flex-wrap gap-3 items-end justify-between mb-4"><div><h1 className="text-[24px] font-extrabold">ลูกค้า</h1><p className="text-[13px] text-[var(--muted)]">ค้นหา กรอง และติดตามลูกค้าทุกคนในที่เดียว</p></div></div>
            <div className="flex flex-col md:flex-row gap-2 mb-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อ เบอร์โทร ที่อยู่…" className={inputCls + ' pl-9 !rounded-full'} /></div><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={inputCls + ' md:w-[180px] !rounded-full'}><option>ทั้งหมด</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select><select value={needFilter} onChange={e => setNeedFilter(e.target.value)} className={inputCls + ' md:w-[180px] !rounded-full'}><option>ทั้งหมด</option><option>ใช้เอง</option><option>ขายไฟ</option><option>ใช้เอง + ขายไฟ</option></select></div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">{filtered.map(r => { const v = r.value; const t = calcTotal(v); return (<article key={r.id} className="bg-[var(--surface)] rounded-3xl border p-4 flex flex-col gap-2"><div className="flex justify-between gap-2"><div className="flex gap-3 min-w-0"><div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center font-bold text-blue-700 shrink-0">{String(v.customer || '').replace('คุณ', '').trim().charAt(0)}</div><div className="min-w-0"><div className="font-bold truncate">{v.customer}</div><div className="text-[12px] text-[var(--muted)] flex gap-1"><Phone size={12} />{v.phone} • {v.line}</div></div></div><span className="text-[11px] font-bold px-2 py-1 rounded-full h-fit shrink-0" style={{ background: STATUS_COLOR[v.status] }}>{v.status}</span></div><p className="text-[13px] text-[var(--muted)] flex gap-1"><MapPin size={14} className="shrink-0 mt-0.5" />{v.address}</p>{v.customerNote && <p className="text-[12px] leading-relaxed text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-2.5 py-2">{v.customerNote}</p>}<div className="flex flex-wrap gap-1.5 text-[11px]"><span className="bg-gray-100 px-2 py-1 rounded-full">{v.building}</span><span className="bg-gray-100 px-2 py-1 rounded-full">{v.need}</span><span className="bg-gray-100 px-2 py-1 rounded-full">{v.kw || '—'} kW</span><span className="bg-gray-100 px-2 py-1 rounded-full">ค่าไฟ {fmtBaht(v.bill)}/ด.</span></div><div className="flex justify-between items-center mt-auto pt-2 border-t"><span className="font-extrabold text-[var(--primary)]">{fmtBaht(t.total)}</span><div className="flex gap-1"><button onClick={() => setDetailId(r.id)} className="p-2 rounded-full bg-gray-100" aria-label="ดูรายละเอียด"><Eye size={16} /></button>{can('customers_edit') ? <button onClick={() => { try { setForm(v); setEditing(r); setShowAdd(true); } catch { /* ignore */ } }} className="p-2 rounded-full bg-blue-100" aria-label="แก้ไข"><Pencil size={16} /></button> : <button disabled className="p-2 rounded-full bg-gray-100 text-gray-300" aria-label="แก้ไข"><Pencil size={16} /></button>}{can('customers_delete') ? <button onClick={() => deleteJob(r.id)} className="p-2 rounded-full bg-red-50 text-red-600" aria-label="ลบ"><Trash2 size={16} /></button> : <button disabled className="p-2 rounded-full bg-gray-100 text-gray-300" aria-label="ลบ"><Trash2 size={16} /></button>}</div></div></article>); })}{filtered.length === 0 && <div className="col-span-full text-center py-12 text-[var(--muted)] bg-[var(--surface)] rounded-3xl border">ไม่พบลูกค้าตามเงื่อนไขที่ค้นหา</div>}</div>
          </>}

          {view === 'orders' && <>
            <h1 className="text-[24px] font-extrabold">ออเดอร์ / งานติดตั้ง</h1><p className="text-[13px] text-[var(--muted)] mb-4">กดที่การ์ดเพื่อเปิดรายละเอียด</p>
            <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar pb-1"><button onClick={() => setStatusFilter('ทั้งหมด')} className={`px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap font-semibold ${statusFilter === 'ทั้งหมด' ? 'bg-[var(--primary)] text-white' : 'bg-white border'}`}>ทั้งหมด ({records.length})</button>{STATUSES.map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap font-semibold ${statusFilter === s ? 'bg-[var(--primary)] text-white' : 'bg-white border'}`}>{s} ({jobs.filter(j => j.status === s).length})</button>)}</div>
            <div className="flex gap-3 overflow-x-auto kanban-scroll pb-3 -mx-1 px-1">{STATUSES.filter(s => statusFilter === 'ทั้งหมด' || s === statusFilter).map(s => { const list = filtered.filter(r => r.value.status === s); return <div key={s} className="w-[280px] shrink-0 bg-[var(--surface2)] rounded-3xl border p-3"><div className="flex justify-between items-center mb-3 px-1"><span className="font-bold text-[14px]">{s}</span><span className="bg-white px-2 py-0.5 rounded-full text-[12px] font-bold">{list.length}</span></div><div className="space-y-2">{list.map(r => { const v = r.value; return (<div key={r.id} className="bg-[var(--surface)] rounded-2xl border p-3 shadow-sm"><div className="font-bold text-[14px] truncate">{v.customer}</div><div className="text-[12px] text-[var(--muted)] truncate">{v.address}</div><div className="flex justify-between mt-2 text-[12px]"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-bold">{v.kw || '—'} kW • {v.panels} แผง</span><span className="font-extrabold">{fmtBaht(calcTotal(v).total)}</span></div><div className="flex gap-1 mt-2"><button onClick={() => setDetailId(r.id)} className="flex-1 bg-[var(--dark)] text-white py-1.5 rounded-full text-[12px] font-semibold">เปิดงาน</button><select disabled={!can('orders_change_status')} value={v.status} onChange={e => updateJob(r.id, { status: e.target.value as Status }, { require: 'orders_change_status' })} className="flex-1 text-[12px] border rounded-full px-2 py-1.5 bg-white disabled:bg-gray-100"><option disabled>ย้ายสถานะ</option>{STATUSES.map(x => <option key={x}>{x}</option>)}</select></div></div>); })}{list.length === 0 && <p className="text-[12px] text-center text-[var(--muted)] py-4">ยังไม่มีงานในขั้นตอนนี้</p>}</div></div>; })}</div>
          </>}

          {view === 'quotes' && <>
            <h1 className="text-[24px] font-extrabold">ใบเสนอราคา</h1><p className="text-[13px] text-[var(--muted)] mb-4">คำนวณอัตโนมัติจากตารางอุปกรณ์ + ค่าแรง + ส่วนลด + VAT 7%</p>
            <div className="relative max-w-[420px] mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input value={quoteSearch} onChange={e => setQuoteSearch(e.target.value)} placeholder="ค้นหาลูกค้าเพื่อเปิดใบเสนอราคา…" className={inputCls + ' pl-9 !rounded-full'} /></div>
            <div className="grid md:grid-cols-2 gap-3">{quoteJobs.map(r => { const v = r.value; const t = calcTotal(v); return <div key={r.id} className="bg-[var(--surface)] rounded-3xl border p-4 flex gap-3 items-center"><div className="flex-1 min-w-0"><div className="flex gap-2 items-center flex-wrap"><span className="font-bold truncate">{v.customer}</span><span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 font-bold">QT-{r.id.slice(-4).toUpperCase()}</span></div><div className="text-[12px] text-[var(--muted)]">{v.items.length} รายการ • {v.kw} kW • {v.panels} แผง</div><div className="font-extrabold text-[var(--primary)] mt-1">{fmtBaht(t.total)} <span className="text-[11px] font-normal text-gray-400">รวม VAT แล้ว</span></div></div><button onClick={() => setQuoteId(r.id)} className="shrink-0 bg-[var(--primary)] text-white px-4 py-2.5 rounded-full text-[13px] font-bold">เปิดใบเสนอราคา</button></div>; })}</div>
          </>}

          {view === 'finance' && <>
            <h1 className="text-[24px] font-extrabold">การเงิน</h1><p className="text-[13px] text-[var(--muted)] mb-4">มัดจำ 30% / ติดตั้ง 40% / ส่งมอบ 30% — ปรับ % ได้ตามตกลง</p>
            <div className="grid lg:grid-cols-2 gap-3">{records.map(r => { const v = r.value; const pays = paymentAmounts(v); const paid = pays.filter(p => p.status === 'ยืนยันแล้ว').reduce((s, p) => s + p.amount, 0); const remain = pays.reduce((s, p) => s + p.amount, 0) - paid; return (<div key={r.id} className="bg-[var(--surface)] rounded-3xl border p-4"><div className="flex justify-between gap-2"><div><div className="font-bold">{v.customer}</div><div className="text-[12px] text-[var(--muted)]">ยอดรวม {fmtBaht(calcTotal(v).total)} • ชำระแล้ว {fmtBaht(paid)}</div></div><span className={`px-2 py-1 rounded-full text-[11px] font-bold h-fit ${remain === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>ค้าง {fmtBaht(remain)}</span></div><div className="mt-3 space-y-2">{pays.map((p, idx) => (<div key={idx} className="flex flex-wrap gap-2 items-center bg-gray-50 rounded-2xl p-2.5"><div className="flex-1 min-w-[150px]"><div className="text-[13px] font-semibold">{p.label}</div><div className="text-[12px] text-gray-500">{fmtBaht(p.amount)} • กำหนด {p.due || '—'}</div></div><input type="number" disabled={!can('finance_edit_installments')} value={p.pct} min={0} max={100} onChange={e => { const next = [...v.payments]; next[idx] = { ...next[idx], pct: Number(e.target.value) }; updateJob(r.id, { payments: next }, { require: 'finance_edit_installments' }); }} className="w-[64px] px-2 py-1.5 rounded-lg border text-[13px] disabled:bg-gray-100" /><span className="text-[12px]">%</span><select disabled={!can('finance_confirm')} value={p.status} onChange={e => { const next = [...v.payments]; next[idx] = { ...next[idx], status: e.target.value as any }; updateJob(r.id, { payments: next }, { require: 'finance_confirm' }); }} className="px-2 py-1.5 rounded-lg border text-[13px] bg-white disabled:bg-gray-100"><option>ยังไม่โอน</option><option>โอนแล้ว</option><option>รอตรวจสอบ</option><option>ยืนยันแล้ว</option></select><input disabled={!can('finance_edit_installments')} value={p.slip} placeholder="ลิงก์สลิป" onChange={e => { const next = [...v.payments]; next[idx] = { ...next[idx], slip: e.target.value }; updateJob(r.id, { payments: next }, { require: 'finance_edit_installments' }); }} className="flex-1 min-w-[120px] px-2 py-1.5 rounded-lg border text-[13px] bg-white disabled:bg-gray-100" /><UploadBtn folder="slips" label="แนบสลิป" disabled={!can('finance_edit_installments')} onError={m => setResult(m)} onUrl={url => { const next = [...v.payments]; next[idx] = { ...next[idx], slip: url }; updateJob(r.id, { payments: next }, { require: 'finance_edit_installments' }); }} />{p.slip && /^https?:\/\//.test(p.slip) && <a href={p.slip} target="_blank" rel="noreferrer" className="text-[12px] text-[var(--primary)] font-semibold underline">ดูสลิป</a>}</div>))}</div></div>); })}</div>
          </>}

          {view === 'electric' && <>
            <h1 className="text-[24px] font-extrabold">งานการไฟฟ้า</h1><p className="text-[13px] text-[var(--muted)] mb-4">ติดตามการยื่นขายไฟ — เปิด/ปิดตามความต้องการของลูกค้าแต่ละงาน</p>
            <div className="grid lg:grid-cols-2 gap-3">{records.map(r => { const v = r.value; const done = v.elec.filter(s => s.done).length; return (<div key={r.id} className="bg-[var(--surface)] rounded-3xl border p-4"><div className="flex justify-between gap-2"><div><div className="font-bold">{v.customer}</div><div className="text-[12px] text-[var(--muted)]">{v.address}</div></div><label className="flex items-center gap-2 text-[12px] font-bold shrink-0"><span>{v.elecWanted ? 'ต้องการขายไฟ' : 'ไม่ขายไฟ'}</span><button disabled={!can('electric_update')} onClick={() => updateJob(r.id, { elecWanted: !v.elecWanted }, { require: 'electric_update' })} className={`w-11 h-6 rounded-full p-0.5 transition ${v.elecWanted ? 'bg-emerald-500' : 'bg-gray-300'} disabled:opacity-50`} aria-label="สลับต้องการขายไฟ"><span className={`block w-5 h-5 bg-white rounded-full shadow transition ${v.elecWanted ? 'translate-x-5' : 'translate-x-0'}`} /></button></label></div>{v.elecWanted ? <><div className="flex justify-between text-[12px] mt-3 mb-1"><span>ความคืบหน้า</span><span className="font-bold">{done}/5 ขั้น</span></div><div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3"><div className="h-full bg-emerald-500" style={{ width: (done / 5 * 100) + '%' }} /></div><div className="space-y-2">{v.elec.map((s, idx) => (<div key={idx} className="flex gap-2 items-start bg-gray-50 rounded-xl p-2.5"><button disabled={!can('electric_update')} onClick={() => { const next = [...v.elec]; next[idx] = { ...next[idx], done: !next[idx].done }; updateJob(r.id, { elec: next }, { require: 'electric_update' }); }} className="mt-0.5 shrink-0 disabled:opacity-50" aria-label={s.label}>{s.done ? <CheckCircle2 className="text-emerald-600" size={20} /> : <Circle className="text-gray-400" size={20} />}</button><div className="flex-1 min-w-0"><div className={`text-[13px] font-semibold ${s.done ? 'line-through opacity-60' : ''}`}>{idx + 1}. {s.label}</div><input disabled={!can('electric_update')} value={s.note} placeholder="หมายเหตุ" onChange={e => { const next = [...v.elec]; next[idx] = { ...next[idx], note: e.target.value }; updateJob(r.id, { elec: next }, { require: 'electric_update' }); }} className="w-full mt-1 px-2 py-1 rounded-lg border text-[12px] bg-white disabled:bg-gray-100" /></div><input type="date" disabled={!can('electric_update')} value={s.date} onChange={e => { const next = [...v.elec]; next[idx] = { ...next[idx], date: e.target.value }; updateJob(r.id, { elec: next }, { require: 'electric_update' }); }} className="px-1.5 py-1 rounded-lg border text-[12px] bg-white disabled:bg-gray-100" /></div>))}</div></> : <p className="text-[13px] text-gray-500 mt-3 bg-gray-50 rounded-xl p-3">ลูกค้างานนี้เลือกใช้ไฟเอง ไม่ได้ยื่นขายไฟ — เปิดสวิตช์ด้านบนหากลูกค้าต้องการขายไฟในภายหลัง</p>}</div>); })}</div>
          </>}

          {view === 'album' && <>
            <h1 className="text-[24px] font-extrabold">อัลบั้ม</h1><p className="text-[13px] text-[var(--muted)] mb-4">ภาพหน้างาน Before / After จากทุกงาน — กดที่ภาพเพื่อดูรายละเอียด</p>
            <div className="flex flex-wrap gap-2 items-center mb-4"><div className="flex gap-1 bg-gray-100 rounded-full p-1">{(['all', 'before', 'after'] as const).map(f => <button key={f} onClick={() => setPhotoFilter(f)} className={`px-3 py-1.5 rounded-full text-[12px] font-bold ${photoFilter === f ? 'bg-white shadow' : 'text-gray-600'}`}>{f === 'all' ? 'ทั้งหมด' : f === 'before' ? 'Before' : 'After'}</button>)}</div><select value={photoCategory} onChange={e => setPhotoCategory(e.target.value)} className="px-3 py-2 rounded-full border text-[13px] bg-white"><option>ทั้งหมด</option>{PHOTO_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
            {allPhotos.filter(({ photo }) => (photoFilter === 'all' || photo.group === photoFilter) && (photoCategory === 'ทั้งหมด' || photo.category === photoCategory)).length === 0 && <p className="text-center py-10 text-[var(--muted)] bg-[var(--surface)] rounded-3xl border">ยังไม่มีภาพในตัวกรองนี้ — เพิ่มภาพได้จากหน้างานของลูกค้าแต่ละคน</p>}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{allPhotos.filter(({ photo }) => (photoFilter === 'all' || photo.group === photoFilter) && (photoCategory === 'ทั้งหมด' || photo.category === photoCategory)).map(({ job, photo }) => (<article key={photo.id} className="border rounded-2xl overflow-hidden bg-white flex flex-col"><button onClick={() => { try { setDetailId(records.find(r => r.value.customer === job.customer)?.id || null); setLightbox(photo); } catch { /* ignore */ } }} className="relative block w-full aspect-[4/3] bg-gradient-to-br from-slate-100 to-blue-100 overflow-hidden text-left" aria-label={`ดูรายละเอียด: ${photo.caption}`}>{photo.url ? <img src={photo.url} alt={photo.caption} loading="lazy" className="absolute inset-0 w-full h-full object-cover" /> : <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-500"><ImageIcon size={28} /><span className="text-[11px] font-bold px-2 text-center">{photo.category}</span></span>}<span className="absolute top-2 left-2 bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{photo.group === 'before' ? 'Before' : 'After'}</span></button><div className="p-2.5"><div className="font-semibold text-[13px] leading-snug">{photo.caption}</div><div className="text-[11px] text-gray-500 mt-1">{job.customer} • {photo.date || '—'} • {photo.photographer || 'ไม่ระบุผู้ถ่าย'}</div><span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1 font-semibold">{photo.category}</span></div></article>))}</div>
          </>}

          {view === 'settings' && <>
            <h1 className="text-[24px] font-extrabold">ตั้งค่าบริษัท / อุปกรณ์</h1><p className="text-[13px] text-[var(--muted)] mb-4">ข้อมูลบริษัทจะแสดงบนหัวใบเสนอราคา {!can('settings_edit') && <span className="text-amber-700 font-semibold">• บัญชีของคุณดูได้อย่างเดียว</span>}</p>
            <form onSubmit={saveCompany} className="bg-[var(--surface)] rounded-3xl border p-4 sm:p-5 mb-4"><div className="flex flex-wrap gap-3 items-start mb-4"><LogoText size="lg" /><div className="min-w-0"><h2 className="font-extrabold text-[16px] leading-tight">{COMPANY_NAME}</h2><p className="text-[12px] text-[var(--muted)] mt-1">กรอกที่อยู่ เบอร์โทร และเลขผู้เสียภาษีให้ครบก่อนออกใบเสนอราคาให้ลูกค้า</p></div></div><div className="grid sm:grid-cols-2 gap-3"><div className="sm:col-span-2"><label className={labelCls}>ที่อยู่บริษัท</label><textarea disabled={!can('settings_edit')} value={company.address} onChange={e => setCompany({ ...company, address: e.target.value })} className={inputCls} rows={2} placeholder="เช่น เลขที่ ซอย ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์" /></div><div><label className={labelCls}>เบอร์โทรบริษัท</label><input disabled={!can('settings_edit')} value={company.phone} onChange={e => setCompany({ ...company, phone: e.target.value })} className={inputCls} placeholder="เช่น 02-xxx-xxxx" /></div><div><label className={labelCls}>เลขประจำตัวผู้เสียภาษี</label><input disabled={!can('settings_edit')} value={company.taxId} onChange={e => setCompany({ ...company, taxId: e.target.value })} className={inputCls} placeholder="เช่น 0xxxxxxxxxxxx" /></div></div><button disabled={companyBusy || !can('settings_edit')} type="submit" className="mt-4 flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-full text-[13px] font-bold disabled:opacity-50"><Save size={16} />{companyBusy ? 'กำลังบันทึก…' : 'บันทึกข้อมูลบริษัท'}</button></form>
            <div className="bg-[var(--surface)] rounded-3xl border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-[13px] min-w-[560px]"><thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3">อุปกรณ์</th><th className="px-4 py-3">ราคาต่อหน่วย</th><th className="px-4 py-3">หมวด</th></tr></thead><tbody>{catalog.map((c, i) => <tr key={i} className="border-t"><td className="px-4 py-3 font-medium">{c.name}</td><td className="px-4 py-3">{fmtBaht(c.price)}</td><td className="px-4 py-3">{c.category}</td></tr>)}</tbody></table></div><div className="p-4 bg-blue-50 text-[13px] text-blue-800">VAT คงที่ 7% • ค่าแรงตั้งต้น 25,000 บาท • ส่วนลดปรับได้ในแต่ละใบเสนอราคา</div></div>
            <div className="grid sm:grid-cols-3 gap-3 mt-4">{[{ i: Building2, t: 'บ้าน', d: 'ค่าไฟเฉลี่ย 2,000–6,000 บาท/เดือน' }, { i: Factory, t: 'โรงงาน', d: 'หลังคากว้าง ต้องการกำลังผลิตสูง' }, { i: Briefcase, t: 'ออฟฟิศ', d: 'ใช้ไฟกลางวันตรงกับเวลาผลิต' }].map((x, i) => (<div key={i} className="bg-[var(--surface)] rounded-3xl border p-4"><x.i className="text-[var(--primary)] mb-2" /><div className="font-bold">{x.t}</div><p className="text-[12px] text-[var(--muted)]">{x.d}</p></div>))}</div>
          </>}
        </main>
      </div>

      {showUserForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowUserForm(false)}><div className="bg-[var(--surface)] w-full max-w-[760px] max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-4"><h2 className="text-[19px] font-extrabold">{editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</h2><button onClick={() => setShowUserForm(false)} className="p-2 bg-gray-100 rounded-full"><X size={18} /></button></div>{userFormError && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-[13px] px-3 py-2.5 rounded-xl">{userFormError}</div>}
          <form onSubmit={saveUser} className="grid sm:grid-cols-2 gap-3"><div><label className={labelCls}>ชื่อ *</label><input required value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className={inputCls} placeholder="เช่น คุณนิด ฝ่ายขาย" /></div><div><label className={labelCls}>Username *</label><input required value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} className={inputCls} placeholder="เช่น sale1" /></div><div><label className={labelCls}>Password {editingUser ? '(เว้นว่างไว้ถ้าไม่เปลี่ยน)' : '*'}</label><input type="password" required={!editingUser} value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className={inputCls} placeholder="อย่างน้อย 4 ตัวอักษร" /></div><div><label className={labelCls}>เบอร์โทร</label><input value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} className={inputCls} placeholder="08x-xxx-xxxx" /></div><div><label className={labelCls}>อีเมล</label><input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className={inputCls} placeholder="name@bge.co.th" /></div><div><label className={labelCls}>สถานะ</label><select value={userForm.status} onChange={e => setUserForm({ ...userForm, status: e.target.value as AppUser['status'] })} className={inputCls}><option>ใช้งาน</option><option>ปิดใช้งาน</option></select></div><div className="sm:col-span-2"><label className={labelCls}>บทบาท — เลือกแล้วสิทธิ์จะติ๊กอัตโนมัติตามบทบาท</label><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{(['Admin', 'Sale', 'Technician', 'Accountant'] as Role[]).map(r => <button type="button" key={r} onClick={() => { try { setUserForm({ ...userForm, role: r, permissions: { ...ROLE_PERMS[r] } }); } catch { /* ignore */ } }} className={`px-3 py-2.5 rounded-xl border text-[13px] font-bold ${userForm.role === r ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-white'}`}>{ROLE_LABEL[r]}<span className="block text-[11px] font-medium opacity-80">{r}</span></button>)}</div></div><div className="sm:col-span-2 border rounded-2xl p-3"><div className="flex justify-between items-center mb-2"><span className="font-bold text-[14px]">สิทธิ์ละเอียด (Checkbox)</span><button type="button" onClick={() => { try { setUserForm({ ...userForm, permissions: { ...ROLE_PERMS[userForm.role] } }); } catch { /* ignore */ } }} className="text-[12px] font-bold text-[var(--primary)]">รีเซ็ตตามบทบาท</button></div><div className="space-y-3">{PERM_GROUPS.map(g => <div key={g.module}><div className="text-[12px] font-bold text-[var(--muted)] mb-1">{g.module}</div><div className="flex flex-wrap gap-2">{g.items.map(it => <label key={it.key} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[12px] font-semibold cursor-pointer ${userForm.permissions[it.key] ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-white text-gray-500'}`}><input type="checkbox" checked={userForm.permissions[it.key]} onChange={e => setUserForm({ ...userForm, permissions: { ...userForm.permissions, [it.key]: e.target.checked } })} className="w-4 h-4 accent-[#0B7DFF]" />{it.label}</label>)}</div></div>)}</div></div><div className="sm:col-span-2 flex gap-2 pt-1"><button type="button" onClick={() => setShowUserForm(false)} className="flex-1 py-3 rounded-full border font-bold">ยกเลิก</button><button disabled={userBusy} type="submit" className="flex-1 py-3 rounded-full bg-[var(--primary)] text-white font-bold disabled:opacity-50">{userBusy ? 'กำลังบันทึก…' : 'บันทึกผู้ใช้'}</button></div></form></div></div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setResetTarget(null)}><div className="bg-[var(--surface)] w-full max-w-[420px] rounded-3xl p-5" onClick={e => e.stopPropagation()}><h2 className="font-extrabold text-[18px]">รีเซ็ตรหัสผ่าน</h2><p className="text-[13px] text-[var(--muted)] mt-1">{resetTarget.value.name} (@{resetTarget.value.username})</p>{userFormError && <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 text-[13px] px-3 py-2.5 rounded-xl">{userFormError}</div>}<label className={labelCls + ' mt-3'}>รหัสผ่านใหม่</label><input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} className={inputCls} placeholder="อย่างน้อย 4 ตัวอักษร" /><div className="flex gap-2 mt-4"><button onClick={() => setResetTarget(null)} className="flex-1 py-2.5 rounded-full border font-bold">ยกเลิก</button><button onClick={submitResetPassword} className="flex-1 py-2.5 rounded-full bg-[var(--primary)] text-white font-bold">บันทึกรหัสใหม่</button></div></div></div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowAdd(false)}><div className="bg-[var(--surface)] w-full max-w-[720px] max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-4"><h2 className="text-[19px] font-extrabold">{editing ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}</h2><button onClick={() => setShowAdd(false)} className="p-2 bg-gray-100 rounded-full"><X size={18} /></button></div>
          <form onSubmit={saveJob} className="grid sm:grid-cols-2 gap-3"><div><label className={labelCls}>ชื่อลูกค้า *</label><input required value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} className={inputCls} placeholder="เช่น คุณสมชาย ใจดี" /></div><div><label className={labelCls}>เบอร์โทร *</label><input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="081-xxx-xxxx" /></div><div><label className={labelCls}>LINE</label><input value={form.line} onChange={e => setForm({ ...form, line: e.target.value })} className={inputCls} placeholder="@line" /></div><div><label className={labelCls}>ประเภทอาคาร</label><select value={form.building} onChange={e => setForm({ ...form, building: e.target.value })} className={inputCls}><option>บ้าน</option><option>โรงงาน</option><option>ออฟฟิศ</option></select></div><div className="sm:col-span-2"><label className={labelCls}>ที่อยู่ติดตั้ง</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputCls} placeholder="บ้านเลขที่ ซอย ถนน จังหวัด" /></div><div><label className={labelCls}>ค่าไฟเฉลี่ย / เดือน (บาท)</label><input type="number" value={form.bill} onChange={e => setForm({ ...form, bill: Number(e.target.value) })} className={inputCls} /></div><div><label className={labelCls}>พื้นที่หลังคา (ตร.ม.)</label><input type="number" value={form.roofArea} onChange={e => setForm({ ...form, roofArea: Number(e.target.value) })} className={inputCls} /></div><div><label className={labelCls}>ทิศหลังคา</label><select value={form.roofDir} onChange={e => setForm({ ...form, roofDir: e.target.value })} className={inputCls}><option>ทิศใต้</option><option>ทิศตะวันออก</option><option>ทิศตะวันตก</option><option>ทิศเหนือ</option></select></div><div><label className={labelCls}>ประเภทมิเตอร์</label><select value={form.meter} onChange={e => setForm({ ...form, meter: e.target.value })} className={inputCls}><option>15/45</option><option>30/100</option><option>TOU</option></select></div><div><label className={labelCls}>ความต้องการ</label><select value={form.need} onChange={e => setForm({ ...form, need: e.target.value })} className={inputCls}><option>ใช้เอง</option><option>ขายไฟ</option><option>ใช้เอง + ขายไฟ</option></select></div><div><label className={labelCls}>สถานะ</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status })} className={inputCls}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div><div className="sm:col-span-2 grid sm:grid-cols-2 gap-3"><div><label className={labelCls}>นัดหมายครั้งต่อไป</label><input type="date" value={form.nextAppt} onChange={e => setForm({ ...form, nextAppt: e.target.value })} className={inputCls} /></div><div><label className={labelCls}>รายละเอียดความต้องการของลูกค้า / อื่นๆ</label><textarea value={form.customerNote} onChange={e => setForm({ ...form, customerNote: e.target.value })} className={inputCls + ' min-h-[108px] resize-y whitespace-pre-wrap'} rows={4} placeholder="สรุปที่คุยกับลูกค้า..." /></div></div><div className="sm:col-span-2 flex gap-2 pt-2"><button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-full border font-bold">ยกเลิก</button><button disabled={busy} type="submit" className="flex-1 py-3 rounded-full bg-[var(--primary)] text-white font-bold disabled:opacity-50">{busy ? 'กำลังบันทึก…' : 'บันทึกข้อมูล'}</button></div></form></div></div>
      )}

      {detailRec && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setDetailId(null)}><div className="bg-[var(--surface)] w-full max-w-[860px] max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 bg-[var(--surface)] p-5 pb-3 border-b flex justify-between gap-3"><div><div className="flex gap-2 items-center flex-wrap"><h2 className="text-[20px] font-extrabold">{detailRec.value.customer}</h2><span className="text-[11px] px-2 py-1 rounded-full font-bold" style={{ background: STATUS_COLOR[detailRec.value.status] }}>{detailRec.value.status}</span></div><p className="text-[13px] text-[var(--muted)]">{detailRec.value.phone} • {detailRec.value.line} • {detailRec.value.address}</p></div><button onClick={() => setDetailId(null)} className="p-2 bg-gray-100 rounded-full h-fit"><X size={18} /></button></div>
          <div className="mx-5 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 font-bold text-[14px] text-amber-900"><NotebookPen size={18} className="text-amber-600" /> บันทึกการคุยกับลูกค้า</div>{!editingNote && <button onClick={() => { try { setNoteDraft(detailRec.value.customerNote || ''); setEditingNote(true); } catch { /* ignore */ } }} className="flex items-center gap-1 bg-white border border-amber-300 text-amber-800 px-3 py-1.5 rounded-full text-[12px] font-bold"><Pencil size={13} /> แก้ไข Note</button>}</div>
            {editingNote ? <div className="mt-3"><textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)} rows={4} placeholder="สรุปที่คุยกับลูกค้า..." className="w-full px-3 py-2.5 rounded-xl border border-amber-300 bg-white text-[14px] min-h-[108px] resize-y whitespace-pre-wrap" /><div className="flex gap-2 mt-2"><button onClick={saveCustomerNote} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-full text-[13px] font-bold">บันทึก Note</button><button onClick={() => setEditingNote(false)} className="flex-1 py-2 rounded-full border border-amber-300 bg-white font-bold text-[13px]">ยกเลิก</button></div><p className="text-[11px] text-amber-700 mt-2">Note เดิมจะถูกเก็บไว้ในประวัติอัตโนมัติเมื่อบันทึก Note ใหม่</p></div> : <p className="text-[13px] leading-relaxed text-amber-900 whitespace-pre-wrap mt-2">{detailRec.value.customerNote || 'ยังไม่มีบันทึกการคุยกับลูกค้า — กด “แก้ไข Note” เพื่อสรุปสิ่งที่คุยกับลูกค้าไว้ที่นี่'}</p>}
            {detailRec.value.noteHistory && detailRec.value.noteHistory.length > 0 && <div className="mt-3 pt-3 border-t border-amber-200"><div className="text-[12px] font-bold text-amber-800 mb-2">ประวัติ Note เก่า ({detailRec.value.noteHistory.length})</div><div className="space-y-2">{[...detailRec.value.noteHistory].reverse().map((h, i) => <div key={i} className="bg-white/80 border border-amber-100 rounded-xl px-3 py-2"><div className="text-[11px] font-semibold text-amber-700">{h.date || '—'}</div><div className="text-[13px] leading-relaxed text-gray-800 whitespace-pre-wrap">{h.text}</div></div>)}</div></div>}
          </div>
          <div className="px-5 pt-3 flex gap-2 overflow-x-auto no-scrollbar">{['ข้อมูล', 'สำรวจ', 'เสนอราคา', 'การเงิน', 'การไฟฟ้า', 'ประวัติติดต่อ', 'ภาพหน้างาน'].filter(t => t === 'ข้อมูล' || t === 'ประวัติติดต่อ' || (t === 'สำรวจ' && can('orders_view')) || (t === 'เสนอราคา' && can('quotes_view')) || (t === 'การเงิน' && can('finance_view')) || (t === 'การไฟฟ้า' && can('electric_view')) || (t === 'ภาพหน้างาน' && can('photos_view'))).map(t => <button key={t} onClick={() => setDetailTab(t)} className={`px-3 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap ${detailTab === t ? 'bg-[var(--primary)] text-white' : 'bg-gray-100'}`}>{t}</button>)}</div>
          <div className="p-5">
            {detailTab === 'ข้อมูล' && <div className="grid sm:grid-cols-2 gap-3 text-[14px]">{[['ประเภทอาคาร', detailRec.value.building], ['ค่าไฟเฉลี่ย', fmtBaht(detailRec.value.bill) + '/เดือน'], ['พื้นที่หลังคา', detailRec.value.roofArea + ' ตร.ม.'], ['ทิศหลังคา', detailRec.value.roofDir], ['ประเภทมิเตอร์', detailRec.value.meter], ['ความต้องการ', detailRec.value.need], ['วันที่สร้าง', detailRec.value.created], ['นัดครั้งต่อไป', detailRec.value.nextAppt || '—']].map(([k, v], i) => <div key={i} className="bg-gray-50 rounded-2xl p-3"><div className="text-[12px] text-gray-500">{k}</div><div className="font-semibold">{v}</div></div>)}<div className="sm:col-span-2"><label className={labelCls}>เปลี่ยนสถานะงาน</label><select disabled={!can('orders_change_status')} value={detailRec.value.status} onChange={e => updateJob(detailRec.id, { status: e.target.value as Status }, { require: 'orders_change_status' })} className={inputCls + ' disabled:bg-gray-100'}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div><div className="sm:col-span-2"><label className={labelCls}>นัดหมายครั้งต่อไป</label><input type="date" disabled={!can('orders_edit')} value={detailRec.value.nextAppt} onChange={e => updateJob(detailRec.id, { nextAppt: e.target.value }, { require: 'orders_edit' })} className={inputCls + ' disabled:bg-gray-100'} /></div></div>}
            {detailTab === 'สำรวจ' && <div className="space-y-3"><div className="grid sm:grid-cols-3 gap-3">{([['ขนาดติดตั้ง (kW)', 'kw'], ['จำนวนแผง', 'panels'], ['ระยะสายไฟ (ม.)', 'cable']] as const).map(([label, key]) => <div key={key}><label className={labelCls}>{label}</label><input type="number" disabled={!can('orders_edit')} value={(detailRec.value as any)[key]} onChange={e => updateJob(detailRec.id, { [key]: Number(e.target.value) } as any, { require: 'orders_edit' })} className={inputCls + ' disabled:bg-gray-100'} /></div>)}</div><div className="grid sm:grid-cols-2 gap-3"><div><label className={labelCls}>Inverter</label><select disabled={!can('orders_edit')} value={detailRec.value.inverter} onChange={e => updateJob(detailRec.id, { inverter: e.target.value }, { require: 'orders_edit' })} className={inputCls + ' disabled:bg-gray-100'}><option>Inverter 5kW</option><option>Inverter 10kW</option><option>Inverter 15kW</option></select></div><div><label className={labelCls}>โครงสร้างหลังคา</label><input disabled={!can('orders_edit')} value={detailRec.value.roofStruct} onChange={e => updateJob(detailRec.id, { roofStruct: e.target.value }, { require: 'orders_edit' })} className={inputCls + ' disabled:bg-gray-100'} placeholder="เช่น กระเบื้องลอนคู่" /></div></div><div><label className={labelCls}>หมายเหตุสำรวจ</label><textarea disabled={!can('orders_edit')} value={detailRec.value.surveyNote} onChange={e => updateJob(detailRec.id, { surveyNote: e.target.value }, { require: 'orders_edit' })} className={inputCls + ' disabled:bg-gray-100'} rows={3} /></div></div>}
            {detailTab === 'เสนอราคา' && <div><QuotePaper job={detailRec.value} company={company} quoteNo={quoteNoFor(detailRec.id)} /><div className="mt-3 border rounded-2xl p-3"><QuoteEditor job={detailRec.value} onChange={(patch) => updateJob(detailRec.id, patch)} onOpenQuote={() => { setQuoteId(detailRec.id); }} catalog={catalog} canEdit={can('quotes_edit')} /></div></div>}
            {detailTab === 'การเงิน' && <div className="space-y-2">{paymentAmounts(detailRec.value).map((p, i) => <div key={i} className="flex flex-wrap gap-2 items-center bg-gray-50 rounded-2xl p-3"><div className="flex-1 min-w-[160px]"><div className="font-semibold text-[14px]">{p.label} • {p.pct}%</div><div className="text-[12px] text-gray-500">{fmtBaht(p.amount)}</div></div><select disabled={!can('finance_confirm')} value={p.status} onChange={e => { const n = [...detailRec.value.payments]; n[i] = { ...n[i], status: e.target.value as any }; updateJob(detailRec.id, { payments: n }, { require: 'finance_confirm' }); }} className="border rounded-lg px-2 py-2 text-[13px] bg-white disabled:bg-gray-100"><option>ยังไม่โอน</option><option>โอนแล้ว</option><option>รอตรวจสอบ</option><option>ยืนยันแล้ว</option></select><input disabled={!can('finance_edit_installments')} value={p.slip} placeholder="ลิงก์สลิป" onChange={e => { const n = [...detailRec.value.payments]; n[i] = { ...n[i], slip: e.target.value }; updateJob(detailRec.id, { payments: n }, { require: 'finance_edit_installments' }); }} className="flex-1 min-w-[130px] px-2 py-2 border rounded-lg text-[13px] bg-white disabled:bg-gray-100" /><UploadBtn folder="slips" label="แนบสลิป" disabled={!can('finance_edit_installments')} onError={m => setResult(m)} onUrl={url => { const n = [...detailRec.value.payments]; n[i] = { ...n[i], slip: url }; updateJob(detailRec.id, { payments: n }, { require: 'finance_edit_installments' }); }} />{p.slip && /^https?:\/\//.test(p.slip) && <a href={p.slip} target="_blank" rel="noreferrer" className="text-[12px] text-[var(--primary)] font-semibold underline">ดูสลิป</a>}</div>)}</div>}
            {detailTab === 'การไฟฟ้า' && <div><label className="flex gap-2 items-center font-bold mb-3"><input type="checkbox" disabled={!can('electric_update')} checked={detailRec.value.elecWanted} onChange={e => updateJob(detailRec.id, { elecWanted: e.target.checked }, { require: 'electric_update' })} className="w-5 h-5 accent-emerald-600" /> ลูกค้าต้องการขายไฟ</label>{detailRec.value.elecWanted && detailRec.value.elec.map((s, i) => <div key={i} className="flex gap-2 items-center bg-gray-50 rounded-xl p-3 mb-2"><button disabled={!can('electric_update')} onClick={() => { const n = [...detailRec.value.elec]; n[i] = { ...n[i], done: !n[i].done }; updateJob(detailRec.id, { elec: n }, { require: 'electric_update' }); }}>{s.done ? <CheckCircle2 className="text-emerald-600" /> : <Circle className="text-gray-400" />}</button><span className="flex-1 text-[14px] font-medium">{s.label}</span><input type="date" disabled={!can('electric_update')} value={s.date} onChange={e => { const n = [...detailRec.value.elec]; n[i] = { ...n[i], date: e.target.value }; updateJob(detailRec.id, { elec: n }, { require: 'electric_update' }); }} className="border rounded-lg px-1 py-1 text-[12px] disabled:bg-gray-100" /></div>)}</div>}
            {detailTab === 'ประวัติติดต่อ' && <div><div className="space-y-2 mb-4">{detailRec.value.contacts.map((c, i) => <div key={i} className="flex gap-3"><div className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] mt-1.5 shrink-0" /><div><div className="text-[12px] text-gray-500">{c.date} • {c.type}</div><div className="text-[14px]">{c.note}</div></div></div>)}{detailRec.value.contacts.length === 0 && <p className="text-[13px] text-gray-500 mb-3">ยังไม่มีประวัติการติดต่อ</p>}<div className="bg-blue-50 rounded-2xl p-3 grid sm:grid-cols-3 gap-2"><input type="date" value={contactForm.date} onChange={e => setContactForm({ ...contactForm, date: e.target.value })} className="px-2 py-2 border rounded-lg bg-white text-[13px]" /><select value={contactForm.type} onChange={e => setContactForm({ ...contactForm, type: e.target.value })} className="px-2 py-2 border rounded-lg bg-white text-[13px]"><option>โทร</option><option>LINE</option><option>เข้าพบ</option></select><input value={contactForm.note} onChange={e => setContactForm({ ...contactForm, note: e.target.value })} placeholder="บันทึกการติดต่อ…" className="px-2 py-2 border rounded-lg bg-white text-[13px] sm:col-span-2" /><button onClick={() => { try { if (!contactForm.note.trim()) return; updateJob(detailRec.id, { contacts: [...detailRec.value.contacts, contactForm] }); setContactForm({ date: '2026-08-17', type: 'โทร', note: '' }); } catch { /* ignore */ } }} className="bg-[var(--primary)] text-white py-2 rounded-full font-bold text-[13px]">+ เพิ่มประวัติ</button></div></div></div>}
            {detailTab === 'ภาพหน้างาน' && <div className="space-y-4"><div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 text-[13px] text-blue-800 flex gap-2"><Camera size={18} className="shrink-0 mt-0.5" /><span>อัลบั้มภาพหน้างาน Before / After — ระบบนี้ยังไม่รองรับการถ่ายหรืออัปโหลดรูปโดยตรง กรุณาใส่ลิงก์รูปภาพ (Image URL) พร้อมคำอธิบาย วันที่ และผู้ถ่าย</span></div>{photoMsg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] px-3 py-2 rounded-xl flex justify-between gap-2"><span>{photoMsg}</span><button onClick={() => setPhotoMsg(null)} className="font-bold">×</button></div>}
              <div className="grid grid-cols-3 gap-2"><div className="bg-slate-50 rounded-2xl p-3 text-center"><div className="text-[11px] text-gray-500">ภาพก่อนติดตั้ง</div><div className="text-[22px] font-extrabold">{photoCounts(detailRec.value).before} <span className="text-[12px] font-medium text-gray-500">รูป</span></div><div className="text-[11px] text-gray-500">Before</div></div><div className="bg-blue-50 rounded-2xl p-3 text-center"><div className="text-[11px] text-gray-500">ภาพหลังติดตั้ง</div><div className="text-[22px] font-extrabold text-[var(--primary)]">{photoCounts(detailRec.value).after} <span className="text-[12px] font-medium text-gray-500">รูป</span></div><div className="text-[11px] text-gray-500">After</div></div><div className="bg-emerald-50 rounded-2xl p-3 text-center"><div className="text-[11px] text-gray-500">สถานะภาพ</div><div className="mt-1"><span className={`px-2 py-1 rounded-full text-[11px] font-bold ${photoStatus(detailRec.value).cls}`}>{photoStatus(detailRec.value).label}</span></div></div></div>
              {can('photos_upload') ? <div className="bg-[var(--surface)] border rounded-3xl p-4"><h3 className="font-bold text-[15px] mb-1">{editingPhotoId ? 'แก้ไขภาพหน้างาน' : 'เพิ่มภาพหน้างาน'}</h3><p className="text-[12px] text-gray-500 mb-3">กรอกคำอธิบายภาพเป็นหลัก — แนบรูปได้ถ้ามี (ถ้าไม่มีรูป จะแสดงเป็นการ์ดรายละเอียดภาพแทน)</p><div className="grid sm:grid-cols-2 gap-3"><div><label className={labelCls}>กลุ่มภาพ</label><select value={photoForm.group} onChange={e => setPhotoForm({ ...photoForm, group: e.target.value as PhotoGroup })} className={inputCls}><option value="before">ภาพก่อนติดตั้ง (Before)</option><option value="after">ภาพหลังติดตั้ง (After)</option></select></div><div><label className={labelCls}>หมวดหมู่</label><select value={photoForm.category} onChange={e => setPhotoForm({ ...photoForm, category: e.target.value })} className={inputCls}>{PHOTO_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div><div><label className={labelCls}>วันที่ถ่าย</label><input type="date" value={photoForm.date} onChange={e => setPhotoForm({ ...photoForm, date: e.target.value })} className={inputCls} /></div><div><label className={labelCls}>ผู้ถ่าย (ช่างคนไหน)</label><input value={photoForm.photographer} onChange={e => setPhotoForm({ ...photoForm, photographer: e.target.value })} className={inputCls} placeholder="เช่น ช่างทีม A / ชื่อช่าง" /></div><div className="sm:col-span-2"><label className={labelCls}>รูปภาพ</label><div className="flex flex-wrap items-center gap-3"><UploadBtn folder="photos" label="เลือก/ถ่ายรูป" onError={m => setPhotoMsg(m)} onUrl={url => setPhotoForm(f => ({ ...f, url }))} />{photoForm.url ? <img src={photoForm.url} alt="ตัวอย่างรูป" className="h-16 w-24 object-cover rounded-lg border" /> : <span className="text-[12px] text-gray-500">ยังไม่ได้เลือกรูป (ไม่บังคับ)</span>}{photoForm.url && <button type="button" onClick={() => setPhotoForm(f => ({ ...f, url: '' }))} className="text-[12px] text-rose-600 font-semibold">ลบรูป</button>}</div></div><div className="sm:col-span-2"><label className={labelCls}>คำอธิบายภาพ *</label><input value={photoForm.caption} onChange={e => setPhotoForm({ ...photoForm, caption: e.target.value })} className={inputCls} placeholder="เช่น ภาพหลังคา มุมกว้างก่อนติดตั้ง" /></div></div><div className="flex gap-2 mt-3"><button onClick={saveSitePhoto} className="flex-1 bg-[var(--primary)] text-white py-2.5 rounded-full font-bold text-[13px]">{editingPhotoId ? 'บันทึกการแก้ไข' : '+ เพิ่มภาพ'}</button>{editingPhotoId && <button onClick={() => { try { setEditingPhotoId(null); setPhotoForm({ group: 'before', url: '', caption: '', date: '2026-08-17', photographer: '', category: 'หลังคา' }); } catch { /* ignore */ } }} className="px-4 py-2.5 rounded-full border font-bold text-[13px]">ยกเลิก</button>}</div></div> : <div className="bg-gray-50 border rounded-2xl p-3 text-[13px] text-gray-500">บัญชีของคุณดูภาพหน้างานได้อย่างเดียว</div>}
              <div className="flex flex-wrap gap-2 items-center"><div className="flex gap-1 bg-gray-100 rounded-full p-1">{(['all', 'before', 'after'] as const).map(f => <button key={f} onClick={() => setPhotoFilter(f)} className={`px-3 py-1.5 rounded-full text-[12px] font-bold ${photoFilter === f ? 'bg-white shadow' : 'text-gray-600'}`}>{f === 'all' ? 'ทั้งหมด' : f === 'before' ? 'Before' : 'After'}</button>)}</div><select value={photoCategory} onChange={e => setPhotoCategory(e.target.value)} className="px-3 py-2 rounded-full border text-[13px] bg-white"><option>ทั้งหมด</option>{PHOTO_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
              {(['before', 'after'] as PhotoGroup[]).filter(g => photoFilter === 'all' || photoFilter === g).map(g => { const list = detailRec.value.sitePhotos.filter(p => p.group === g && (photoCategory === 'ทั้งหมด' || p.category === photoCategory)); return <section key={g} className="border rounded-3xl overflow-hidden"><div className={`px-4 py-3 flex justify-between items-center ${g === 'before' ? 'bg-slate-800 text-white' : 'bg-[var(--primary)] text-white'}`}><div><div className="font-bold">{g === 'before' ? 'ภาพก่อนติดตั้ง (Before)' : 'ภาพหลังติดตั้ง (After)'}</div><div className="text-[12px] opacity-80">{g === 'before' ? 'ภาพหลังคา ตู้ไฟ พื้นที่ติดตั้ง และหน้างานโดยรวม' : 'ภาพแผงที่ติดตั้งเสร็จ Inverter ตู้ไฟหลังติดตั้ง และมุมกว้างหลังส่งงาน'}</div></div><span className="bg-white/20 px-2.5 py-1 rounded-full text-[12px] font-bold shrink-0">{list.length} รูป</span></div><div className="p-3">{list.length === 0 && <p className="text-[13px] text-gray-500 text-center py-6">ยังไม่มีภาพในกลุ่มนี้</p>}<div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{list.map(p => (<article key={p.id} className="border rounded-2xl overflow-hidden bg-white flex flex-col"><button onClick={() => setLightbox(p)} className="relative block w-full aspect-[4/3] bg-gradient-to-br from-slate-100 to-blue-100 overflow-hidden text-left" aria-label={`ดูรูปใหญ่: ${p.caption}`}>{p.url ? <img src={p.url} alt={p.caption} loading="lazy" className="absolute inset-0 w-full h-full object-cover" /> : <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-500"><ImageIcon size={28} /><span className="text-[11px] font-bold px-2 text-center">{p.category}</span></span>}<span className="absolute top-2 left-2 bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{p.group === 'before' ? 'Before' : 'After'}</span></button><div className="p-2.5 flex-1 flex flex-col gap-1"><div className="font-semibold text-[13px] leading-snug">{p.caption}</div><div className="text-[11px] text-gray-500">{p.date || '—'} • {p.photographer || 'ไม่ระบุผู้ถ่าย'}</div><span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded-full w-fit font-semibold">{p.category}</span>{confirmDeletePhotoId === p.id ? <div className="flex gap-1 mt-auto pt-1"><button onClick={() => deleteSitePhoto(p.id)} className="flex-1 bg-red-600 text-white py-1.5 rounded-full text-[12px] font-bold">ยืนยันลบ</button><button onClick={() => setConfirmDeletePhotoId(null)} className="flex-1 border py-1.5 rounded-full text-[12px] font-bold">ยกเลิก</button></div> : <div className="flex gap-1 mt-auto pt-1"><button disabled={!can('photos_upload')} onClick={() => startEditPhoto(p)} className="flex-1 bg-blue-50 text-blue-700 py-1.5 rounded-full text-[12px] font-bold disabled:bg-gray-100 disabled:text-gray-400">แก้ไข</button><button disabled={!can('photos_delete')} onClick={() => setConfirmDeletePhotoId(p.id)} className="flex-1 bg-red-50 text-red-600 py-1.5 rounded-full text-[12px] font-bold disabled:bg-gray-100 disabled:text-gray-400">ลบ</button></div>}</div></article>))}</div></div></section>; })}
              <div className="border rounded-3xl p-4"><div className="flex justify-between items-center mb-1"><h3 className="font-bold flex gap-2 items-center"><CheckCircle2 size={18} className="text-emerald-600" /> Checklist ถ่ายภาพมาตรฐาน</h3><span className="text-[12px] font-bold bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">{detailRec.value.photoChecklist.filter(c => c.done).length}/{detailRec.value.photoChecklist.length} ข้อ</span></div><div className="grid sm:grid-cols-2 gap-2">{(['before', 'after'] as PhotoGroup[]).map(g => (<div key={g} className="bg-gray-50 rounded-2xl p-3"><div className="font-bold text-[13px] mb-2">{g === 'before' ? 'ก่อนติดตั้ง' : 'หลังติดตั้ง'}</div><div className="space-y-2">{detailRec.value.photoChecklist.filter(c => c.group === g).map(c => (<button key={c.id} disabled={!can('photos_upload')} onClick={() => toggleChecklist(c.id)} className="w-full flex gap-2 items-center text-left bg-white border rounded-xl px-3 py-2 disabled:opacity-60"><span className="shrink-0">{c.done ? <CheckCircle2 className="text-emerald-600" size={20} /> : <Circle className="text-gray-400" size={20} />}</span><span className={`text-[13px] font-medium ${c.done ? 'line-through opacity-60' : ''}`}>{c.label}</span></button>))}</div></div>))}</div></div>
            </div>}
          </div>
        </div></div>
      )}

      {lightbox && detailRec && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4" onClick={() => setLightbox(null)}><div className="bg-white w-full max-w-[720px] max-h-[92vh] overflow-y-auto rounded-3xl" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center p-4 border-b"><span className={`px-2 py-1 rounded-full text-[12px] font-bold ${lightbox.group === 'before' ? 'bg-slate-800 text-white' : 'bg-[var(--primary)] text-white'}`}>{lightbox.group === 'before' ? 'ภาพก่อนติดตั้ง (Before)' : 'ภาพหลังติดตั้ง (After)'}</span><button onClick={() => setLightbox(null)} className="p-2 bg-gray-100 rounded-full"><X size={18} /></button></div><div className="p-4"><div className="font-bold text-[16px]">{lightbox.caption}</div><div className="text-[13px] text-gray-500 mt-1">หมวดหมู่ {lightbox.category} • วันที่ {lightbox.date || '—'} • ผู้ถ่าย {lightbox.photographer || '—'}</div>{lightbox.url && <img src={lightbox.url} alt={lightbox.caption} className="w-full max-h-[60vh] object-contain rounded-xl mb-2 bg-black/5" />}{lightbox.url && <a href={lightbox.url} target="_blank" rel="noopener" className="inline-flex gap-1 items-center text-[var(--primary)] font-bold text-[13px] mt-2"><ExternalLink size={14} /> เปิดลิงก์รูปภาพ</a>}<div className="flex gap-2 mt-4"><button disabled={!can('photos_upload')} onClick={() => { try { startEditPhoto(lightbox); setLightbox(null); } catch { /* ignore */ } }} className="flex-1 bg-blue-50 text-blue-700 py-2.5 rounded-full font-bold text-[13px] disabled:bg-gray-100 disabled:text-gray-400">แก้ไขภาพนี้</button><button onClick={() => setLightbox(null)} className="flex-1 border py-2.5 rounded-full font-bold text-[13px]">ปิด</button></div></div></div></div>
      )}

      {quoteRec && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setQuoteId(null)}><div className="bg-white text-gray-900 w-full max-w-[820px] max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl" onClick={e => e.stopPropagation()}><div className="p-5 sm:p-7"><div className="flex justify-end mb-2"><button onClick={() => setQuoteId(null)} className="p-2 bg-gray-100 rounded-full"><X size={18} /></button></div><QuotePaper job={quoteRec.value} company={company} quoteNo={quoteNoFor(quoteRec.id)} /><div className="space-y-2 mt-4"><button disabled={!can('quotes_edit')} onClick={() => { try { setDetailId(quoteRec.id); setQuoteId(null); setDetailTab('เสนอราคา'); } catch { /* ignore */ } }} className="w-full py-3 rounded-full border font-bold disabled:bg-gray-100 disabled:text-gray-400 text-[13px]">แก้ไขใบเสนอราคา</button></div>{can('quotes_approve') ? <button onClick={() => { try { setResult('อนุมัติใบเสนอราคา QT-' + quoteRec.id.slice(-4).toUpperCase() + ' แล้ว'); setQuoteId(null); } catch { /* ignore */ } }} className="w-full mt-2 py-3 rounded-full bg-emerald-600 text-white font-bold flex justify-center gap-2"><CheckCircle2 size={18} /> อนุมัติใบเสนอราคา</button> : <p className="text-center text-[12px] text-gray-400 mt-2">ปุ่มอนุมัติต้องใช้สิทธิ์ “อนุมัติ” ใบเสนอราคา</p>}</div></div></div>
      )}
    </div>
  );
}

// ---------- Quote preview image: drawn with plain canvas, no external library ----------
function wrapCanvasText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  try {
    const words = String(text || '').split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let line = '';
    words.forEach((word) => {
      if (ctx.measureText(word).width > maxWidth) {
        if (line) { lines.push(line); line = ''; }
        let part = '';
        Array.from(word).forEach((ch) => {
          if (ctx.measureText(part + ch).width > maxWidth && part) { lines.push(part); part = ch; } else part += ch;
        });
        if (part) line = part;
        return;
      }
      const next = line ? line + ' ' + word : word;
      if (ctx.measureText(next).width > maxWidth && line) { lines.push(line); line = word; } else line = next;
    });
    if (line) lines.push(line);
    return lines.length ? lines : [''];
  } catch { return [String(text || '')]; }
}
function renderQuotePng(job: Job, seller: any, doc: any, cust: any, back: any, pays: any[], qs: any): string {
  const canvas = document.createElement('canvas');
  canvas.width = 794; canvas.height = 1400;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('สร้างรูปไม่สำเร็จ');
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, 794, 1400);
  ctx.fillStyle = '#111111'; ctx.textBaseline = 'top';
  let y = 28;
  ctx.fillStyle = '#0B7DFF'; ctx.fillRect(36, y, 64, 36);
  ctx.fillStyle = '#FFFFFF'; ctx.font = '800 20px system-ui, sans-serif'; ctx.fillText('BGE', 48, y + 8);
  ctx.fillStyle = '#111111'; ctx.font = '800 13px system-ui, sans-serif'; ctx.fillText('BETTER GROUP', 110, y); ctx.fillText('ENGINEERING', 110, y + 17);
  ctx.fillStyle = '#0B7DFF'; ctx.font = '800 36px system-ui, sans-serif'; ctx.textAlign = 'right'; ctx.fillText('ใบเสนอราคา', 758, y - 2); ctx.textAlign = 'left';
  y += 52;
  ctx.fillStyle = '#111111'; ctx.font = '12.5px system-ui, sans-serif';
  const sellerLines = ['ผู้ขาย :', 'ที่อยู่ :', SPEC_SELLER.name, 'เลขที่ 71/2 หมู่ที่ 3 ตำบลลาดหลุมแก้ว', 'อำเภอลาดหลุมแก้ว จังหวัดปทุมธานี', '12140', 'เลขที่ภาษี : ' + SPEC_SELLER.taxId + ' (สำนักงานใหญ่)', SPEC_SELLER.phone, SPEC_SELLER.email];
  sellerLines.forEach((line) => { ctx.fillText(line, 36, y); y += 19; });
  y += 5;
  ctx.fillStyle = '#F2F2F2'; ctx.fillRect(36, y, 722, 88);
  ctx.fillStyle = '#111111'; ctx.font = '12px system-ui, sans-serif';
  const docLines = ['เลขที่เอกสาร: ' + doc.docNo, 'วันที่ออก: ' + doc.issueDate, 'ใช้ได้ถึง: ' + doc.validUntil, 'อ้างอิง: ' + (doc.ref || '')];
  docLines.forEach((line, i) => { ctx.fillText(line, 52, y + 6 + i * 19); });
  y += 104;
  ctx.font = '700 12px system-ui, sans-serif'; ctx.fillText('ลูกค้า: ' + cust.name, 36, y); y += 18;
  ctx.font = '12px system-ui, sans-serif';
  wrapCanvasText(ctx, 'ที่อยู่: ' + (cust.address || ''), 722).forEach((line) => { ctx.fillText(line, 36, y); y += 17; });
  ctx.fillText('เลขภาษี: ' + cust.taxId + '  เรียน: ' + cust.attn + '  เบอร์ลูกค้า ' + cust.phone, 36, y); y += 18;
  ctx.fillText('ติดต่อกลับที่: ' + back.name + ' / ' + back.phone + ' / ' + back.email, 36, y); y += 26;
  ctx.fillStyle = '#EDEDED'; ctx.fillRect(36, y, 722, 28);
  ctx.fillStyle = '#111111'; ctx.font = '700 12px system-ui, sans-serif';
  ctx.fillText('คำอธิบาย', 44, y + 6); ctx.textAlign = 'right'; ctx.fillText('จำนวน', 470, y + 6); ctx.fillText('ราคา', 566, y + 6); ctx.fillText('ส่วนลด', 652, y + 6); ctx.fillText('มูลค่าก่อนภาษี', 750, y + 6); ctx.textAlign = 'left';
  y += 36; ctx.font = '12px system-ui, sans-serif';
  (job.items || []).forEach((it: any, i: number) => {
    if (y > 980) return;
    const rowTop = y;
    ctx.font = '700 12px system-ui, sans-serif';
    wrapCanvasText(ctx, (i + 1) + '. ' + it.name, 400).forEach((line) => { ctx.fillText(line, 36, y); y += 17; });
    ctx.font = '12px system-ui, sans-serif';
    (it.details || []).slice(0, 4).forEach((d: string) => {
      wrapCanvasText(ctx, d, 400).forEach((line) => { if (y <= 1000) { ctx.fillText(line, 52, y); y += 16; } });
    });
    ctx.textAlign = 'right';
    ctx.fillText(fmtQty(it.qty), 470, rowTop); ctx.fillText(fmt2(it.price), 566, rowTop); ctx.fillText(fmt2(it.discount || 0), 652, rowTop); ctx.fillText(fmt2(quoteRowNet(it)), 750, rowTop);
    ctx.textAlign = 'left'; y += 8;
  });
  y += 6;
  wrapCanvasText(ctx, job.quoteNote1 || '', 722).forEach((line) => { ctx.fillText(line, 36, y); y += 17; });
  wrapCanvasText(ctx, job.quoteNote2 || '', 722).forEach((line) => { ctx.fillText(line, 36, y); y += 17; });
  y += 10; ctx.textAlign = 'right';
  ctx.fillText('มูลค่าก่อนภาษี  ' + fmt2(qs.net), 758, y); y += 20;
  ctx.fillText('VAT 7%  ' + fmt2(qs.vat), 758, y); y += 22;
  ctx.font = '800 15px system-ui, sans-serif'; ctx.fillText('ยอดรวมทั้งสิ้น  ' + fmt2(qs.total), 758, y); ctx.textAlign = 'left'; ctx.font = '12px system-ui, sans-serif';
  y += 34; ctx.font = '700 12px system-ui, sans-serif'; ctx.fillText('เงื่อนไขการชำระเงิน', 36, y); y += 20; ctx.font = '12px system-ui, sans-serif';
  pays.forEach((p: any) => { ctx.fillText(p.label + '  ' + p.pct + '%  •  ' + fmtBaht(p.amount) + '  •  ' + p.status, 36, y); y += 18; });
  y += 34; ctx.fillText('ผู้เสนอราคา', 140, y); ctx.fillText('ลูกค้าตกลงจ้าง', 540, y);
  ctx.strokeStyle = '#9CA3AF'; ctx.beginPath(); ctx.moveTo(60, y + 34); ctx.lineTo(300, y + 34); ctx.moveTo(460, y + 34); ctx.lineTo(700, y + 34); ctx.stroke();
  return canvas.toDataURL('image/png');
}
// ---------- Quote: plain HTML only. No canvas export library, no external fonts ----------
function QuotePaper({ job, company, quoteNo }: { job: Job; company: CompanySettings; quoteNo: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [previewMsg, setPreviewMsg] = useState<string | null>(null);
  const qs = quoteSummary(job);
  const seller = SPEC_SELLER; void company;
  const doc = resolveQuoteDoc(job, quoteNo);
  const cust = resolveCustomer(job);
  const back = resolveContactBack(job);
  const pays = paymentAmounts(job);
  const quoteText = safe(() => {
    const lines: string[] = [];
    lines.push('BGE - BETTER GROUP ENGINEERING CO., LTD.');
    lines.push('ผู้ขาย :');
    lines.push('ที่อยู่ :');
    lines.push(`${seller.name}`);
    lines.push('เลขที่ 71/2 หมู่ที่ 3 ตำบลลาดหลุมแก้ว');
    lines.push('อำเภอลาดหลุมแก้ว จังหวัดปทุมธานี');
    lines.push('12140');
    lines.push(`เลขที่ภาษี : ${seller.taxId} (สำนักงานใหญ่)`);
    lines.push(`${seller.phone}`);
    lines.push(`${seller.email}`);
    lines.push(`ใบเสนอราคา เลขที่ ${doc.docNo} วันที่ออก ${doc.issueDate} ใช้ได้ถึง ${doc.validUntil}`);
    lines.push(`ลูกค้า ${cust.name} ที่อยู่ ${cust.address} เบอร์ ${cust.phone} เลขภาษี ${cust.taxId} เรียน ${cust.attn}`);
    (job.items || []).forEach((it, i) => { lines.push(`${i + 1}. ${it.name} จำนวน ${fmtQty(it.qty)} ราคา ${fmt2(it.price)} ส่วนลด ${fmt2(it.discount || 0)} VAT ${it.vatPct ?? 7}% มูลค่าก่อนภาษี ${fmt2(quoteRowNet(it))}`); (it.details || []).forEach((d, di) => lines.push(`  ${di + 1}. ${d}`)); });
    lines.push(`มูลค่าก่อนภาษี ${fmt2(qs.net)} VAT 7% ${fmt2(qs.vat)} ยอดรวมทั้งสิ้น ${fmt2(qs.total)}`);
    lines.push(job.quoteNote1 || '');
    lines.push(job.quoteNote2 || '');
    return lines.join('\n');
  }, 'BGE ใบเสนอราคา');
  function handleSaveQuote() {
    try {
      setPreviewMsg(null); setPreviewError(false);
      try {
        const url = renderQuotePng(job, seller, doc, cust, back, pays, qs);
        setPreviewUrl(url);
      } catch { setPreviewUrl(null); setPreviewError(true); setPreviewMsg('สร้างรูปตัวอย่างไม่สำเร็จ — กดค้างที่รูปเพื่อเซฟเอง'); }
      setShowPreview(true);
    } catch { setPreviewUrl(null); setPreviewError(true); setShowPreview(true); }
  }
  function handleDownloadPng() {
    try {
      if (!previewUrl) { setPreviewMsg('สร้างรูปไม่สำเร็จ — กดค้างที่รูปเพื่อเซฟเอง'); return; }
      const safeName = String(cust.name || 'ลูกค้า').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'ลูกค้า';
      const safeNo = String(doc.docNo || '').replace(/[\\/:*?"<>|]+/g, '-').trim() || 'QO';
      const a = document.createElement('a');
      a.href = previewUrl; a.download = `BGE-ใบเสนอราคา-${safeName}-${safeNo}.png`;
      document.body.appendChild(a); a.click(); a.remove();
      setMsg('บันทึกรูปภาพสำเร็จ'); setShowPreview(false); setPreviewUrl(null);
    } catch { setPreviewMsg('บันทึกรูปไม่สำเร็จ — กดค้างที่รูปเพื่อเซฟเอง'); }
  }
  async function handleCopyQuote() {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') { await navigator.clipboard.writeText(quoteText); setMsg('คัดลอกข้อความใบเสนอราคาแล้ว — วาง (Paste) ใน LINE / แชท / เอกสารได้เลย'); return; }
      const ta = document.createElement('textarea'); ta.value = quoteText; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); setMsg('คัดลอกข้อความใบเสนอราคาแล้ว');
    } catch { setMsg('คัดลอกไม่สำเร็จ — กดปุ่ม “บันทึกรูปภาพใบเสนอราคา” แทน'); }
  }
  return (
    <div className="bg-[#E9EDF2] p-3 sm:p-4 rounded-[24px] overflow-x-clip">
      <div className="max-w-[800px] mx-auto mb-2 flex flex-wrap gap-2 items-center">
        <button type="button" onClick={handleSaveQuote} className="bg-[#0B7DFF] hover:bg-[#095FC4] text-white px-5 py-3 rounded-full text-[14px] font-bold shadow flex items-center gap-2"><Camera size={18} />บันทึกรูปภาพใบเสนอราคา</button>
        <button type="button" onClick={handleCopyQuote} className="bg-white border-2 border-[#0B7DFF] text-[#0B7DFF] px-4 py-2.5 rounded-full text-[13px] font-bold flex items-center gap-1.5"><Copy size={15} />คัดลอกรูปภาพ</button>
      </div>
      {msg && <div role="status" className="max-w-[800px] mx-auto mb-2 px-4 py-3 rounded-2xl text-[13px] font-semibold bg-emerald-50 border border-emerald-200 text-emerald-800">{msg}</div>}
      <div id="quotation-paper" className="bg-white text-[#111111] mx-auto w-full max-w-[800px] rounded-[4px] shadow-[0_18px_45px_rgba(15,35,60,0.18)]" style={{ fontFamily: 'system-ui, sans-serif', width: '100%', maxWidth: 800, padding: '24px 28px', margin: '0 auto', height: 'auto' }}>
        <div className="flex justify-between items-start gap-3 mb-3"><div className="flex items-center gap-2 shrink-0"><span className="flex items-center justify-center bg-[#0B7DFF] text-white font-extrabold rounded-[10px] text-[20px] tracking-wide" style={{ height: 48, minWidth: 64, padding: '0 10px' }}>BGE</span><span className="font-extrabold text-[13px] leading-[1.2]">BETTER GROUP<br />ENGINEERING</span></div><h3 className="text-[30px] sm:text-[36px] font-extrabold leading-none text-[#0B7DFF] whitespace-nowrap pt-1">ใบเสนอราคา</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-[12.5px] leading-[1.5]">
          <div className="min-w-0" style={{ fontSize: '12.5px', lineHeight: 1.5 }}><div>ผู้ขาย :</div><div>ที่อยู่ :</div><div>บริษัท เบทเทอร์ กรุ๊ป เอ็นจิเนียริ่ง จำกัด</div><div>เลขที่ 71/2 หมู่ที่ 3 ตำบลลาดหลุมแก้ว</div><div>อำเภอลาดหลุมแก้ว จังหวัดปทุมธานี</div><div>12140</div><div>เลขที่ภาษี : 0105562117061 (สำนักงานใหญ่)</div><div>0886936699</div><div className="[overflow-wrap:anywhere]">info.bge.energy@gmail.com</div></div>
          <div className="bg-[#F2F2F2] p-[10px]"><div className="flex justify-between gap-2"><span>เลขที่เอกสาร:</span><b>{doc.docNo}</b></div><div className="flex justify-between gap-2"><span>วันที่ออก:</span><span>{doc.issueDate}</span></div><div className="flex justify-between gap-2"><span>วันที่ครบรับ:</span><span>{doc.acceptDate || ''}</span></div><div className="flex justify-between gap-2"><span>ใช้ได้ถึง:</span><span>{doc.validUntil}</span></div><div className="flex justify-between gap-2"><span>อ้างอิง:</span><span>{doc.ref || ''}</span></div></div>
        </div>
        <div className="mt-[10px] mb-3 text-[12.5px] leading-[1.4] border-t border-gray-200 pt-2">
          <div><span className="font-bold">ลูกค้า: </span>{cust.name}</div>
          <div><span className="font-bold">ที่อยู่: </span><span className="[overflow-wrap:anywhere]">{cust.address}</span></div>
          <div className="flex flex-wrap gap-x-6"><span><b>เลขภาษี: </b>{cust.taxId}</span><span><b>เรียน: </b>{cust.attn}</span><span><b>เบอร์ลูกค้า </b>{cust.phone}</span></div>
          <div className="mt-2"><span className="font-bold">ติดต่อกลับที่: </span>ชื่อ {back.name} / เบอร์ {back.phone} / อีเมล <span className="[overflow-wrap:anywhere]">{back.email}</span></div>
        </div>
        <div className="mb-2" style={{ overflowX: 'auto' }}>
          <table className="w-full text-[12.5px] min-w-[620px]" style={{ borderCollapse: 'collapse', tableLayout: 'fixed', width: '100%' }}>
            <colgroup><col style={{ width: '42%' }} /><col style={{ width: '12%' }} /><col style={{ width: '15%' }} /><col style={{ width: '13%' }} /><col style={{ width: '18%' }} /></colgroup>
            <thead><tr><th style={{ height: 28, padding: '6px 8px', verticalAlign: 'middle', background: '#F2F2F2', borderBottom: '1px solid #ccc', textAlign: 'left' }}>คำอธิบาย</th><th style={{ height: 28, padding: '6px 8px', verticalAlign: 'middle', background: '#F2F2F2', borderBottom: '1px solid #ccc', textAlign: 'center' }}>จำนวน</th><th style={{ height: 28, padding: '6px 8px', verticalAlign: 'middle', background: '#F2F2F2', borderBottom: '1px solid #ccc', textAlign: 'right' }}>ราคา</th><th style={{ height: 28, padding: '6px 8px', verticalAlign: 'middle', background: '#F2F2F2', borderBottom: '1px solid #ccc', textAlign: 'right' }}>ส่วนลด</th><th style={{ height: 28, padding: '6px 8px', verticalAlign: 'middle', background: '#F2F2F2', borderBottom: '1px solid #ccc', textAlign: 'right' }}>มูลค่าก่อนภาษี</th></tr></thead>
            <tbody>
              {(job.items || []).map((it, i) => <tr key={i}><td style={{ height: 'auto', minHeight: 32, padding: 8, verticalAlign: 'middle', borderBottom: '1px solid #eee', lineHeight: 1.4, textAlign: 'left' }}><div className="font-bold">{i + 1}. {it.name}</div>{(it.details || []).length > 0 && <ol className="mt-1 space-y-0.5 list-none text-[11.5px] leading-[1.4]">{(it.details || []).map((d, di) => <li key={di} className="[overflow-wrap:anywhere]">{di + 1}. {d}</li>)}</ol>}</td><td style={{ height: 'auto', minHeight: 32, padding: 8, verticalAlign: 'middle', borderBottom: '1px solid #eee', lineHeight: 1.4, textAlign: 'center' }}>{fmtQty(it.qty)}</td><td style={{ height: 'auto', minHeight: 32, padding: 8, verticalAlign: 'middle', borderBottom: '1px solid #eee', lineHeight: 1.4, textAlign: 'right' }}>{fmt2(it.price)}</td><td style={{ height: 'auto', minHeight: 32, padding: 8, verticalAlign: 'middle', borderBottom: '1px solid #eee', lineHeight: 1.4, textAlign: 'right' }}>{fmt2(it.discount || 0)}</td><td style={{ height: 'auto', minHeight: 32, padding: 8, verticalAlign: 'middle', borderBottom: '1px solid #eee', lineHeight: 1.4, textAlign: 'right', fontWeight: 600 }}>{fmt2(quoteRowNet(it))}</td></tr>)}
              {job.labor > 0 && <tr><td style={{ height: 'auto', minHeight: 32, padding: 8, verticalAlign: 'middle', borderBottom: '1px solid #eee', lineHeight: 1.4, textAlign: 'left' }}>ค่าแรงติดตั้ง</td><td style={{ height: 'auto', minHeight: 32, padding: 8, verticalAlign: 'middle', borderBottom: '1px solid #eee', lineHeight: 1.4, textAlign: 'center' }}>1.00</td><td style={{ height: 'auto', minHeight: 32, padding: 8, verticalAlign: 'middle', borderBottom: '1px solid #eee', lineHeight: 1.4, textAlign: 'right' }}>{fmt2(job.labor)}</td><td style={{ height: 'auto', minHeight: 32, padding: 8, verticalAlign: 'middle', borderBottom: '1px solid #eee', lineHeight: 1.4, textAlign: 'right' }}>0.00</td><td style={{ height: 'auto', minHeight: 32, padding: 8, verticalAlign: 'middle', borderBottom: '1px solid #eee', lineHeight: 1.4, textAlign: 'right', fontWeight: 600 }}>{fmt2(job.labor)}</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="my-2 text-[11px] leading-[1.4]"><div className="font-bold">{job.quoteNote1 || SPEC_QUOTE_NOTE1}</div><div className="font-bold">{job.quoteNote2 || SPEC_QUOTE_NOTE2}</div></div>
        <div className="flex justify-end mb-2"><div className="w-full sm:w-[340px] text-[12.5px] leading-[1.4]"><div className="flex justify-between py-0.5"><span>มูลค่าก่อนภาษี</span><b>{fmt2(qs.net)}</b></div><div className="flex justify-between py-0.5"><span>VAT 7%</span><b>{fmt2(qs.vat)}</b></div><div className="flex justify-between items-center border-t border-gray-400 pt-1.5 mt-1"><span className="font-extrabold">ยอดรวมทั้งสิ้น</span><span className="font-extrabold text-[17px]">{fmt2(qs.total)}</span></div></div></div>
        {job.customerNote && <div className="mb-2 bg-[#FFFBEB] border border-amber-200 rounded-xl p-2 text-[12.5px] leading-[1.4]"><b>Note ความต้องการลูกค้า</b><div className="whitespace-pre-wrap [overflow-wrap:anywhere] mt-0.5">{job.customerNote}</div></div>}
        <div className="mb-2"><div className="font-bold text-[11px] mb-1">เงื่อนไขการชำระเงิน</div><div className="grid sm:grid-cols-3 gap-2 text-[11px] leading-[1.4]">{pays.map((p, i) => <div key={i} className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-[6px]"><div className="font-bold">{p.label}</div><div>{p.pct}% • {fmtBaht(p.amount)}</div><div className="text-gray-500">สถานะ: {p.status}</div></div>)}</div></div>
        <div className="flex gap-4 sm:gap-8 mt-[28px] text-center text-[12.5px] leading-[1.4]"><div className="flex-1"><div className="border-b border-dashed border-gray-400 h-[32px] mx-auto" style={{ width: 180 }} /><div className="mt-2 font-bold">ผู้เสนอราคา</div><div className="text-[12px] text-gray-500">BETTER GROUP ENGINEERING CO., LTD.</div></div><div className="flex-1"><div className="border-b border-dashed border-gray-400 h-[32px] mx-auto" style={{ width: 180 }} /><div className="mt-2 font-bold">ลูกค้าตกลงจ้าง</div><div className="text-[12px] text-gray-500">ลงชื่อผู้อนุมัติ</div></div></div>
      </div>
      {showPreview && (
        <div className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => { try { setShowPreview(false); } catch { /* ignore */ } }}>
          <div className="bg-white w-full max-w-[860px] max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center gap-3"><div><h3 className="font-extrabold text-[17px]">ตัวอย่างรูปภาพใบเสนอราคา</h3><p className="text-[12px] text-gray-500">ตรวจสอบโลโก้ BGE ด้านบน และข้อความให้ครบก่อนบันทึก</p></div><button onClick={() => { try { setShowPreview(false); } catch { /* ignore */ } }} className="p-2 bg-gray-100 rounded-full shrink-0" aria-label="ปิด"><X size={18} /></button></div>
            <div className="p-4">
              {previewError && <div className="mb-3 bg-amber-50 border border-amber-200 text-amber-800 text-[13px] px-3 py-2.5 rounded-xl">สร้างรูปตัวอย่างไม่สำเร็จ — กดค้างที่รูปเพื่อเซฟเอง</div>}
              {previewMsg && <div className="mb-3 bg-amber-50 border border-amber-200 text-amber-800 text-[13px] px-3 py-2.5 rounded-xl">{previewMsg}</div>}
              {previewUrl ? <img src={previewUrl} alt={`ตัวอย่างใบเสนอราคา ${cust.name}`} className="w-full rounded-xl border shadow-sm bg-white" /> : <pre className="whitespace-pre-wrap text-[12px] leading-relaxed bg-gray-50 border rounded-xl p-3 [overflow-wrap:anywhere]">{quoteText}</pre>}
              <button type="button" onClick={handleDownloadPng} disabled={!previewUrl} className="w-full mt-4 bg-[#0B7DFF] hover:bg-[#095FC4] text-white py-3.5 rounded-full text-[15px] font-bold shadow disabled:opacity-50 disabled:bg-gray-300">บันทึกรูปนี้ลงเครื่อง</button>
              <p className="text-center text-[12px] text-gray-500 mt-2">ไฟล์ PNG ชื่อ BGE-ใบเสนอราคา-{cust.name}-{doc.docNo}.png</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Equipment picker: plain <select> + simple text filter input ----------
function QuoteEditor({ job, onChange, onOpenQuote, catalog, canEdit }: { job: Job; onChange: (p: Partial<Job>) => void; onOpenQuote: () => void; catalog: CatalogItem[]; canEdit: boolean }) {
  const [filter, setFilter] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [qty, setQty] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [addedMsg, setAddedMsg] = useState<string | null>(null);
  const filteredCatalog = safe(() => { const q = filter.toLowerCase().trim(); if (!q) return catalog; return catalog.filter(c => `${c.name} ${c.code} ${c.category}`.toLowerCase().includes(q)); }, catalog);
  function handleSelect(name: string) {
    try {
      setSelectedName(name); setAddedMsg(null);
      const found = catalog.find(c => c.name === name);
      if (found) setUnitPrice(found.price);
    } catch { /* ignore */ }
  }
  function handleAdd() {
    try {
      if (!canEdit) return;
      const name = selectedName.trim();
      if (!name) { setAddedMsg('เลือกอุปกรณ์จากช่องเลือกก่อน'); return; }
      const qtySafe = Math.max(1, Number(qty) || 1);
      onChange({ items: [...(job.items || []), { name, qty: qtySafe, price: Number(unitPrice) || 0 }] });
      setAddedMsg(`เพิ่ม “${name}” × ${qtySafe} ลงใบเสนอราคาแล้ว`);
      setSelectedName(''); setUnitPrice(0); setQty(1);
    } catch { setAddedMsg('เพิ่มอุปกรณ์ไม่สำเร็จ'); }
  }
  const inputE = "w-full px-3 py-2.5 border rounded-xl mt-1 text-[14px] bg-white disabled:bg-gray-100";
  const labelE = "text-[12px] font-semibold text-gray-500";
  const docE = resolveQuoteDoc(job, '');
  return <div>
    <div className="border rounded-2xl p-3 mb-3 bg-white"><div className="font-bold text-[14px] mb-2">หัวเอกสารใบเสนอราคา</div><div className="grid sm:grid-cols-2 gap-3"><div><label className={labelE}>เลขที่เอกสาร</label><input disabled={!canEdit} value={docE.docNo} onChange={e => onChange({ quoteDocNo: e.target.value })} className={inputE} /></div><div><label className={labelE}>วันที่ออก</label><input disabled={!canEdit} value={docE.issueDate} onChange={e => onChange({ quoteIssueDate: e.target.value })} className={inputE} placeholder="17/08/2026" /></div><div><label className={labelE}>วันที่ครบรับ</label><input disabled={!canEdit} value={docE.acceptDate} onChange={e => onChange({ quoteAcceptDate: e.target.value })} className={inputE} /></div><div><label className={labelE}>ใช้ได้ถึง</label><input disabled={!canEdit} value={docE.validUntil} onChange={e => onChange({ quoteValidUntil: e.target.value })} className={inputE} /></div><div className="sm:col-span-2"><label className={labelE}>อ้างอิง</label><input disabled={!canEdit} value={docE.ref} onChange={e => onChange({ quoteRef: e.target.value })} className={inputE} /></div></div></div>
    <div className="border rounded-2xl p-3 mb-3 bg-blue-50"><div className="font-bold text-[14px] mb-2">เพิ่มอุปกรณ์ลงใบเสนอราคา</div>
      <div><label className={labelE}>ค้นหาอุปกรณ์ (พิมพ์เพื่อกรอง)</label><input value={filter} onChange={e => { try { setFilter(e.target.value); } catch { /* ignore */ } }} className={inputE} placeholder="เช่น แผง อินเวอร์เตอร์ แบต" /></div>
      <div className="grid sm:grid-cols-3 gap-3 mt-2"><div><label className={labelE}>เลือกอุปกรณ์</label><select value={selectedName} onChange={e => handleSelect(e.target.value)} className={inputE}><option value="">— เลือกอุปกรณ์ —</option>{filteredCatalog.map(c => <option key={c.code + c.name} value={c.name}>{c.name} — {fmtBaht(c.price)}</option>)}</select></div><div><label className={labelE}>จำนวน</label><input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} className={inputE} /></div><div><label className={labelE}>ราคาต่อหน่วย</label><input type="number" value={unitPrice} onChange={e => setUnitPrice(Number(e.target.value))} className={inputE} /></div></div>
      {addedMsg && <p className="text-[13px] text-emerald-700 mt-2">{addedMsg}</p>}
      <button type="button" disabled={!canEdit} onClick={handleAdd} className="mt-3 w-full sm:w-auto bg-[var(--primary)] text-white px-5 py-2.5 rounded-full font-bold text-[13px] disabled:opacity-50">+ เพิ่มลงใบเสนอราคา</button>
    </div>
    <div className="space-y-2">{(job.items || []).map((it, i) => <div key={i} className="flex flex-wrap gap-2 items-center bg-gray-50 rounded-2xl p-3"><div className="flex-1 min-w-[180px]"><input disabled={!canEdit} value={it.name} onChange={e => { const n = [...job.items]; n[i] = { ...n[i], name: e.target.value }; onChange({ items: n }); }} className="w-full px-2 py-1.5 border rounded-lg text-[13px] bg-white disabled:bg-gray-100" />{(it.details || []).length > 0 && <p className="text-[11px] text-gray-500 mt-1">มีรายละเอียด {(it.details || []).length} ข้อ</p>}</div><input type="number" disabled={!canEdit} value={it.qty} onChange={e => { const n = [...job.items]; n[i] = { ...n[i], qty: Number(e.target.value) }; onChange({ items: n }); }} className="w-[70px] px-2 py-1.5 border rounded-lg text-[13px] bg-white disabled:bg-gray-100" /><input type="number" disabled={!canEdit} value={it.price} onChange={e => { const n = [...job.items]; n[i] = { ...n[i], price: Number(e.target.value) }; onChange({ items: n }); }} className="w-[120px] px-2 py-1.5 border rounded-lg text-[13px] bg-white disabled:bg-gray-100" /><input type="number" disabled={!canEdit} value={it.discount || 0} onChange={e => { const n = [...job.items]; n[i] = { ...n[i], discount: Number(e.target.value) }; onChange({ items: n }); }} className="w-[110px] px-2 py-1.5 border rounded-lg text-[13px] bg-white disabled:bg-gray-100" placeholder="ส่วนลด" />{canEdit && <button type="button" onClick={() => { try { onChange({ items: job.items.filter((_, x) => x !== i) }); } catch { /* ignore */ } }} className="p-2 rounded-full bg-red-50 text-red-600" aria-label="ลบรายการ"><Trash2 size={15} /></button>}</div>)}
    </div>
    <div className="grid sm:grid-cols-2 gap-3 mt-3"><div><label className={labelE}>ค่าแรงติดตั้ง</label><input type="number" disabled={!canEdit} value={job.labor} onChange={e => onChange({ labor: Number(e.target.value) })} className={inputE} /></div><div><label className={labelE}>ส่วนลดรวม</label><input type="number" disabled={!canEdit} value={job.discount} onChange={e => onChange({ discount: Number(e.target.value) })} className={inputE} /></div></div>
    <button type="button" onClick={onOpenQuote} className="w-full mt-4 bg-[var(--dark)] text-white py-3 rounded-full font-bold text-[13px]">เปิดใบเสนอราคาแบบเต็ม</button>
  </div>;
}
