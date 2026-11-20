'use client';
import MapPreview from '@/components/admin/MapPreview';
import { SLIP_STATUS_LABEL, type SlipCheck } from '@/lib/slipok';
import ReleaseNotes from '@/components/admin/ReleaseNotes';
import SystemMonitor from '@/components/admin/SystemMonitor';
import { Activity, BarChart3, CalendarDays, ChevronDown, Globe, History } from 'lucide-react';
import InstallCalendar from '@/components/admin/InstallCalendar';
import CustomerLinkBox from '@/components/admin/CustomerLinkBox';
import Reports from '@/components/admin/Reports';
import AuditLog from '@/components/admin/AuditLog';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ScopeBar, { DEFAULT_SCOPE, inScope, type Scope } from '@/components/admin/ScopeBar';
import { CLOSED_STATUSES, LEAD_SOURCES, STATUS_GROUPS, type Receipt } from '@/lib/job';
import { Search, Plus, LayoutDashboard, Users, ClipboardList, FileText, Wallet, Zap, Settings, Menu, X, Phone, MapPin, Eye, Pencil, Trash2, Sun, AlertTriangle, CheckCircle2, Circle, Building2, Factory, Briefcase, Save, Camera, ExternalLink, NotebookPen, LogOut, ShieldCheck, UserCog, Lock, KeyRound, User as UserIcon, Image as ImageIcon } from 'lucide-react';
import { MotionConfig, motion } from 'motion/react';
import EquipmentSets from '@/components/admin/EquipmentSets';
import ClientsAdmin from '@/components/admin/ClientsAdmin';
import ProductsAdmin from '@/components/admin/ProductsAdmin';
import ProjectsAdmin from '@/components/admin/ProjectsAdmin';
import NewsAdmin from '@/components/admin/NewsAdmin';
import Dashboard, { DashboardSkeleton, type DashData } from '@/components/admin/Dashboard';
import { safe, callApi, createRow, replaceRow, isConflict, Status, PhotoGroup, SitePhoto, Job, Rec, CompanySettings, Role, PermKey, AppUser, UserRec, ROLE_PERMS, ROLE_LABEL, PERM_GROUPS, normalizeUser, LINE_RESULT, COMPANY_NAME, STATUSES, STATUS_COLOR, CATALOG, calcTotal, paymentAmounts, PHOTO_CATEGORIES, normalizeJob, photoCounts, photoStatus, fmtBaht, resolveSeller, emptyJob, emptyCompany, emptyAppUser } from './solar/model';
import { LINE_GREEN, LineIcon, ErrorBoundary, LogoText, UploadBtn } from './solar/ui';
import { SOLD_STATUSES, buildHistory, QuoteWorkspace, ReceiptButton } from './solar/quote';

export default function App() {
  return <ErrorBoundary><AppInner /></ErrorBoundary>;
}

function AppInner() {
  const [view, setView] = useState<'dashboard' | 'leads' | 'orders' | 'quotes' | 'finance' | 'electric' | 'album' | 'settings' | 'users' | 'news' | 'projects' | 'products' | 'clients' | 'monitor' | 'audit' | 'calendar' | 'reports' | 'profile'>('dashboard');
  const [records, setRecords] = useState<Rec[]>([]);
  const recordsRef = useRef<Rec[]>([]);
  useEffect(() => { recordsRef.current = records; }, [records]);
  const saveQueue = useRef<Record<string, Promise<void>>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ทั้งหมด');
  const [groupFilter, setGroupFilter] = useState('ทั้งหมด');
  const [webMenuOpen, setWebMenuOpen] = useState(false);
  const [scope, setScope] = useState<Scope>(DEFAULT_SCOPE);
  const [staff, setStaff] = useState<{ id: string; name: string; role: string }[]>([]);
  const [albumConfirmId, setAlbumConfirmId] = useState<string | null>(null);
  useEffect(() => { if (['news', 'projects', 'products', 'clients'].includes(view)) setWebMenuOpen(true); }, [view]);
  const inGroup = (s: string) => groupFilter === 'ทั้งหมด' || !!STATUS_GROUPS.find(g => g.name === groupFilter)?.statuses.includes(s as Status);
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
  const [lineLoginEnabled, setLineLoginEnabled] = useState(false);
  const [slipOkEnabled, setSlipOkEnabled] = useState(false);
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
      setRecords(list.map((r: any) => ({ id: r.id, value: normalizeJob(r.value), updatedAt: r.updatedAt })));
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
        setLineLoginEnabled(!!json?.data?.lineLogin);
        setSlipOkEnabled(!!json?.data?.slipOk);
        if (u) { setCurrentUser({ id: u.id, value: normalizeUser(u.value) }); setCurrentUserId(u.id); }
        const lineResult = new URLSearchParams(window.location.search).get('line');
        if (lineResult) {
          window.history.replaceState(null, '', window.location.pathname);
          const msg = LINE_RESULT[lineResult];
          if (msg) { if (u) setResult(msg); else setLoginError(msg); }
        }
      } catch { /* show login */ }
      setBooting(false);
    })();
  }, []);
  useEffect(() => { if (!currentUserId) return; callApi('staff.list', {}).then((d: any) => setStaff(d?.staff || [])).catch(() => undefined); }, [currentUserId]);
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
      if (userForm.password && userForm.password.length < 8) { setUserFormError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
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
      if (resetPassword.length < 8) { setUserFormError('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
      const next = { ...resetTarget.value, password: resetPassword };
      try { await replaceRow("solarpro_users", resetTarget.id, next); await reloadUsers(); setResetTarget(null); setResetPassword(''); setResult(`รีเซ็ตรหัสผ่านของ ${next.name} แล้ว`); } catch (err) { setUserFormError('รีเซ็ตรหัสผ่านไม่สำเร็จ: ' + (err instanceof Error ? err.message : String(err))); }
    } catch { /* ignore */ }
  }
  async function changeOwnPassword(e?: React.FormEvent) {
    try {
      e?.preventDefault(); setProfileMsg(null);
      if (!currentUser) return;
      if (profileForm.next.length < 8) { setProfileMsg('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร'); return; }
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
  const isMine = (v: Job) => !!currentUserId && (v.saleId === currentUserId || v.techId === currentUserId);
  const scoped = useMemo(() => safe(() => {
    const hideClosed = scope.hideClosed && statusFilter === 'ทั้งหมด' && groupFilter === 'ทั้งหมด';
    return records.filter(r => inScope(r.value.created, scope) && (!hideClosed || !CLOSED_STATUSES.includes(r.value.status)) && (!scope.mine || isMine(r.value)));
  }, records), [records, scope, statusFilter, groupFilter, currentUserId]);
  // Finance never hides a finished job that still has money outstanding.
  const financeRecords = useMemo(() => safe(() => records.filter(r => inScope(r.value.created, scope) && (!scope.mine || isMine(r.value)) && (!scope.hideClosed || !CLOSED_STATUSES.includes(r.value.status) || paymentAmounts(r.value).some(p => p.status !== 'ยืนยันแล้ว' && p.amount > 0))), records), [records, scope, currentUserId]);
  const filtered = useMemo(() => safe(() => scoped.filter(r => {
    const q = search.toLowerCase();
    const hit = !q || String(r.value.customer || '').toLowerCase().includes(q) || String(r.value.phone || '').includes(q) || String(r.value.address || '').toLowerCase().includes(q) || String(r.value.customerNote || '').toLowerCase().includes(q);
    const st = (statusFilter === 'ทั้งหมด' || r.value.status === statusFilter) && inGroup(r.value.status);
    const nd = needFilter === 'ทั้งหมด' || r.value.need === needFilter;
    return hit && st && nd;
  }), scoped), [scoped, search, statusFilter, needFilter, groupFilter]);
  const filteredUsers = useMemo(() => safe(() => userRecords.filter(r => {
    const q = userSearch.toLowerCase();
    const hit = !q || String(r.value.name || '').toLowerCase().includes(q) || String(r.value.username || '').toLowerCase().includes(q) || String(r.value.phone || '').includes(q) || String(r.value.email || '').toLowerCase().includes(q);
    const role = userRoleFilter === 'ทั้งหมด' || r.value.role === userRoleFilter;
    return hit && role;
  }), userRecords), [userRecords, userSearch, userRoleFilter]);

  const stats = useMemo(() => safe(() => {
    const totalSales = jobs.filter(j => ['ตกลงจ้าง', 'รอยื่นกู้ธนาคาร', 'รอผลกู้ธนาคาร', 'มัดจำแล้ว', 'รอนัดวันติดตั้ง', 'รอติดตั้ง', 'อยู่ระหว่างการติดตั้ง', 'ติดตั้งแล้วเสร็จ', 'กำลังตรวจรับงานติดตั้ง', 'ชำระเงินผู้รับเหมาแล้ว', 'ลูกค้าชำระเงินแล้ว', 'รอยื่นการไฟฟ้า', 'อยู่ระหว่างยื่นการไฟฟ้า', 'ยื่นการไฟฟ้าแล้วเสร็จ'].includes(j.status)).reduce((s, j) => s + calcTotal(j).total, 0);
    const waitingMoney = jobs.reduce((s, j) => s + paymentAmounts(j).filter(p => p.status !== 'ยืนยันแล้ว').reduce((a, p) => a + p.amount, 0), 0);
    return { totalSales, newLeads: jobs.filter(j => j.status === 'ลีดใหม่').length, waitInstall: jobs.filter(j => ['รอนัดวันติดตั้ง', 'รอติดตั้ง', 'อยู่ระหว่างการติดตั้ง'].includes(j.status)).length, waitElec: jobs.filter(j => ['รอยื่นการไฟฟ้า', 'อยู่ระหว่างยื่นการไฟฟ้า'].includes(j.status)).length, waitingMoney, near: jobs.filter(j => !!j.nextAppt).length };
  }, { totalSales: 0, newLeads: 0, waitInstall: 0, waitElec: 0, waitingMoney: 0, near: 0 }), [jobs]);

  const ACTIVE_ST = ['ตกลงจ้าง', 'รอยื่นกู้ธนาคาร', 'รอผลกู้ธนาคาร', 'มัดจำแล้ว', 'รอนัดวันติดตั้ง', 'รอติดตั้ง', 'อยู่ระหว่างการติดตั้ง', 'ติดตั้งแล้วเสร็จ', 'กำลังตรวจรับงานติดตั้ง', 'ชำระเงินผู้รับเหมาแล้ว', 'ลูกค้าชำระเงินแล้ว', 'รอยื่นการไฟฟ้า', 'อยู่ระหว่างยื่นการไฟฟ้า'];
  const dash: DashData = useMemo(() => safe(() => {
    const TH_M = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => { const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1); return { key: d.getFullYear() * 12 + d.getMonth(), label: TH_M[d.getMonth()], count: 0 }; });
    jobs.forEach(j => { const d = new Date(j.created); if (!isNaN(d.getTime())) { const m = months.find(x => x.key === d.getFullYear() * 12 + d.getMonth()); if (m) m.count += 1; } });
    const n = (f: (j: Job) => boolean) => jobs.filter(f).length;
    const done = n(j => j.status === 'ยื่นการไฟฟ้าแล้วเสร็จ');
    return {
      greetingName: currentUser?.value.name || '', roleLabel: currentUser ? ROLE_LABEL[currentUser.value.role] : '',
      kpis: [
        { key: 'quotes', label: 'ใบเสนอราคา', value: n(j => STATUSES.indexOf(j.status) >= 2), sub: `จากทั้งหมด ${jobs.length} งาน`, tone: 'amber' },
        { key: 'leads', label: 'ลูกค้าใหม่', value: stats.newLeads, sub: 'รอติดต่อกลับ', tone: 'violet' },
        { key: 'active', label: 'โครงการที่กำลังดำเนินการ', value: n(j => ACTIVE_ST.includes(j.status)), sub: `เสร็จสิ้นแล้ว ${done} งาน`, tone: 'blue' },
        { key: 'revenue', label: 'รายได้ (งานที่ตกลงแล้ว)', value: stats.totalSales, money: true, sub: 'รวมทุกโครงการที่ตกลงจ้าง', tone: 'green' },
      ],
      extra: { waitingMoney: stats.waitingMoney, waitElec: stats.waitElec, waitInstall: stats.waitInstall },
      monthly: months.map(m => ({ label: m.label, count: m.count })),
      donut: [
        { name: 'ก่อนการขาย', value: n(j => STATUSES.indexOf(j.status) < 7), color: '#94A3B8' },
        { name: 'รอ / เตรียมติดตั้ง', value: n(j => ['ตกลงจ้าง', 'รอยื่นกู้ธนาคาร', 'รอผลกู้ธนาคาร', 'มัดจำแล้ว', 'รอนัดวันติดตั้ง', 'รอติดตั้ง'].includes(j.status)), color: '#3B82F6' },
        { name: 'กำลังดำเนินการ', value: n(j => ['อยู่ระหว่างการติดตั้ง', 'ติดตั้งแล้วเสร็จ', 'กำลังตรวจรับงานติดตั้ง', 'ชำระเงินผู้รับเหมาแล้ว', 'ลูกค้าชำระเงินแล้ว', 'รอยื่นการไฟฟ้า', 'อยู่ระหว่างยื่นการไฟฟ้า'].includes(j.status)), color: '#22C55E' },
        { name: 'เสร็จสิ้น', value: done, color: '#FBBF24' },
      ],
      recent: [...records].reverse().slice(0, 5).map(r => ({ id: r.id, name: String(r.value.customer || ''), address: String(r.value.address || ''), status: r.value.status, statusBg: STATUS_COLOR[r.value.status] || '#E2E8F0' })),
      total: jobs.length,
    } satisfies DashData;
  }, { greetingName: '', roleLabel: '', kpis: [], extra: { waitingMoney: 0, waitElec: 0, waitInstall: 0 }, monthly: [], donut: [], recent: [], total: 0 } as DashData), [jobs, records, stats, currentUser]);

  async function saveJob(e?: React.FormEvent) {
    try {
      e?.preventDefault();
      if (editing && !can('customers_edit')) { setResult('ไม่มีสิทธิ์แก้ไขข้อมูลลูกค้า'); return; }
      if (!editing && !can('customers_create')) { setResult('ไม่มีสิทธิ์สร้างลูกค้า'); return; }
      if (!form.customer.trim() || !form.phone.trim()) { setResult('กรุณากรอกชื่อลูกค้าและเบอร์โทร'); return; }
      setBusy(true); setResult(null);
      let saved = 0; let error: string | null = null;
      try {
        if (editing) { await replaceRow("solarpro_jobs", editing.id, form, editing.updatedAt); }
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
    if (opts?.require && !can(opts.require)) { setResult('ไม่มีสิทธิ์'); return; }
    const rec = recordsRef.current.find(r => r.id === id); if (!rec) return;
    const next = { ...rec.value, ...patch };
    recordsRef.current = recordsRef.current.map(r => r.id === id ? { ...r, value: next } : r);
    setRecords(recordsRef.current);
    // Saves of one job run one after another, each with the version the previous save returned.
    const run = async () => {
      const cur = recordsRef.current.find(r => r.id === id);
      try {
        const saved: any = await replaceRow("solarpro_jobs", id, cur?.value ?? next, cur?.updatedAt);
        recordsRef.current = recordsRef.current.map(r => r.id === id ? { ...r, updatedAt: saved?.updatedAt } : r);
        setRecords(recordsRef.current);
      } catch (e) {
        setResult((isConflict(e) ? '' : 'บันทึกไม่สำเร็จ: ') + (e instanceof Error ? e.message : String(e)));
        await reloadRecords().catch(() => undefined);
      }
    };
    const chain = (saveQueue.current[id] || Promise.resolve()).then(run);
    saveQueue.current[id] = chain;
    await chain;
  }
  async function checkSlip(id: string, index: number) {
    setResult('กำลังตรวจสลิปกับ SlipOK…');
    try {
      const saved: any = await callApi('slip.verify', { id, index });
      recordsRef.current = recordsRef.current.map(r => r.id === id ? { id, value: normalizeJob(saved.value), updatedAt: saved.updatedAt } : r);
      setRecords(recordsRef.current);
      const c: SlipCheck | undefined = saved.value?.payments?.[index]?.slipCheck;
      setResult(c ? (c.status === 'ok' ? `สลิปถูกต้อง ${fmtBaht(c.amount || 0)} • ยืนยันการโอนให้อัตโนมัติแล้ว` : `ตรวจสลิปไม่ผ่าน: ${SLIP_STATUS_LABEL[c.status]}${c.message ? ` (${c.message})` : ''}`) : 'ตรวจสลิปแล้ว');
    } catch (e) {
      setResult('ตรวจสลิปไม่สำเร็จ: ' + (e instanceof Error ? e.message : String(e)));
      await reloadRecords().catch(() => undefined);
    }
  }
  async function issueReceipt(id: string, index: number): Promise<Receipt | null> {
    try {
      const saved: any = await callApi('receipt.issue', { id, index });
      recordsRef.current = recordsRef.current.map(r => r.id === id ? { id, value: normalizeJob(saved.value), updatedAt: saved.updatedAt } : r);
      setRecords(recordsRef.current);
      return saved.value?.payments?.[index]?.receipt || null;
    } catch (e) {
      setResult('ออกใบเสร็จไม่สำเร็จ: ' + (e instanceof Error ? e.message : String(e)));
      await reloadRecords().catch(() => undefined);
      return null;
    }
  }
  async function approveQuote(id: string, approve: boolean) {
    try {
      const saved: any = await callApi('quote.approve', { id, approve });
      recordsRef.current = recordsRef.current.map(r => r.id === id ? { id, value: normalizeJob(saved.value), updatedAt: saved.updatedAt } : r);
      setRecords(recordsRef.current);
      setResult(approve ? 'อนุมัติใบเสนอราคาแล้ว ราคาถูกล็อก' : 'ยกเลิกการอนุมัติแล้ว แก้ไขราคาได้');
    } catch (e) {
      setResult('ดำเนินการไม่สำเร็จ: ' + (e instanceof Error ? e.message : String(e)));
      await reloadRecords().catch(() => undefined);
    }
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
  async function deleteAlbumPhoto(jobId: string, photoId: string) {
    if (!can('photos_delete')) { setResult('ไม่มีสิทธิ์ลบภาพหน้างาน'); return; }
    const cur = recordsRef.current.find(r => r.id === jobId); if (!cur) return;
    setAlbumConfirmId(null);
    await updateJob(jobId, { sitePhotos: cur.value.sitePhotos.filter(p => p.id !== photoId) });
    if (lightbox?.id === photoId) setLightbox(null);
    setResult('ลบภาพแล้ว');
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
  const allPhotos: { jobId: string; job: Job; photo: SitePhoto }[] = safe(() => records.flatMap(r => (r.value.sitePhotos || []).map(photo => ({ jobId: r.id, job: r.value, photo }))), []);

  const WEB_VIEWS: string[] = ['news', 'projects', 'products', 'clients'];
  const NavItem = ({ id, label, icon, badge }: { id: any; label: string; icon: React.ReactNode; badge?: number }) => (
    <button onClick={() => { try { setView(id); setSidebarOpen(false); } catch { /* ignore */ } }} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[14px] font-medium transition ${view === id ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-900/30' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>
      {icon}<span className="flex-1">{label}</span>{typeof badge === 'number' && badge > 0 && <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${view === id ? 'bg-white/25 text-white' : 'bg-white/15 text-white'}`}>{badge}</span>}
    </button>
  );
  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-[var(--line2)] bg-[var(--surface)] text-[14px] text-[var(--ink)]";
  const labelCls = "text-[12px] font-semibold text-[var(--muted)] mb-1 block";

  if (!currentUser) {
    if (booting) return <div className="min-h-screen flex items-center justify-center text-[var(--muted)]">กำลังโหลด…</div>;
    return (
      <main className="relative min-h-screen overflow-hidden flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-[#EEF4E8] via-[#F8F9F6] to-[#F3F6EC]">
        <div aria-hidden className="blob w-[420px] h-[420px] bg-[#72B65A] -top-28 -left-24" />
        <div aria-hidden className="blob w-[380px] h-[380px] bg-[#E8BD65] bottom-0 right-0" style={{ animationDelay: '-7s' }} />
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="relative w-full max-w-[980px] grid md:grid-cols-[1.05fr_1fr] rounded-[32px] overflow-hidden glass">
          <section className="bg-gradient-to-br from-[#123C32] to-[#1E5A46] text-white p-8 sm:p-10 flex flex-col justify-between gap-10 relative overflow-hidden">
            <div aria-hidden className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-gradient-to-br from-[#E8BD65]/50 to-transparent blur-2xl" />
            <div className="relative flex items-center gap-3"><span className="bg-white rounded-2xl p-1.5"><img src="/BGE_logo.png" alt="BGE" width={52} height={52} className="w-[52px] h-[52px] object-contain" /></span><div className="leading-tight"><div className="text-[20px] font-bold">SolarTech</div><div className="text-[12px] text-white/70">Backoffice</div></div></div>
            <div className="relative">
              <h1 className="text-[28px] sm:text-[34px] font-bold leading-tight">จัดการงานโซลาร์เซลล์<br />ครบทุกขั้นตอน</h1>
              <p className="mt-3 text-[14px] text-white/75 leading-relaxed">ลูกค้า ออเดอร์ ใบเสนอราคา การเงิน งานการไฟฟ้า และภาพหน้างาน ในที่เดียว</p>
              <ul className="mt-6 grid gap-2.5 text-[13px] text-white/85">{['ติดตามสถานะงานตั้งแต่ลีดจนส่งมอบ', 'ออกใบเสนอราคา PDF พร้อมเอกสารแนบ', 'ควบคุมสิทธิ์ตามบทบาทผู้ใช้'].map(t => <li key={t} className="flex items-center gap-2"><CheckCircle2 size={16} className="text-[#72B65A] shrink-0" />{t}</li>)}</ul>
            </div>
            <p className="relative text-[11px] text-white/55">BETTER GROUP ENGINEERING CO., LTD.</p>
          </section>
          <section className="bg-white/85 p-8 sm:p-10 flex flex-col justify-center">
            <h2 className="text-[24px] font-bold text-[#123C32]">เข้าสู่ระบบ</h2>
            <p className="text-[13px] text-[var(--muted)] mt-1">กรอกบัญชีผู้ใช้เพื่อเข้าใช้งานระบบหลังบ้าน</p>
            <form onSubmit={handleLogin} className="mt-6 space-y-4" noValidate>
              <div><label htmlFor="login-user" className={labelCls}>Username</label><div className="relative"><UserIcon size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input id="login-user" value={loginUsername} onChange={e => { setLoginUsername(e.target.value); setLoginError(null); }} className={inputCls + ' !pl-10'} placeholder="เช่น admin" autoComplete="username" autoFocus /></div></div>
              <div><label htmlFor="login-pass" className={labelCls}>Password</label><div className="relative"><Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" /><input id="login-pass" type="password" value={loginPassword} onChange={e => { setLoginPassword(e.target.value); setLoginError(null); }} className={inputCls + ' !pl-10'} placeholder="••••••••" autoComplete="current-password" /></div></div>
              {loginError && <div role="alert" className="bg-rose-50 border border-rose-200 text-rose-700 text-[13px] px-3 py-2.5 rounded-xl flex gap-2"><AlertTriangle size={17} className="shrink-0" />{loginError}</div>}
              <button disabled={loginBusy} type="submit" className="w-full py-3.5 rounded-full font-bold text-[15px] text-white bg-[#123C32] hover:bg-[#1B5446] shadow-[0_10px_24px_rgba(18,60,50,.22)] disabled:opacity-60 transition">{loginBusy ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}</button>
            </form>
            {lineLoginEnabled && <>
              <div className="flex items-center gap-3 my-4 text-[12px] text-[var(--muted)]"><span className="flex-1 h-px bg-gray-200" />หรือ<span className="flex-1 h-px bg-gray-200" /></div>
              <a href="/api/auth/line/start?mode=login" className="w-full py-3.5 rounded-full font-bold text-[15px] text-white flex items-center justify-center gap-2 hover:opacity-90 transition" style={{ background: LINE_GREEN }}><LineIcon size={20} />เข้าสู่ระบบด้วย LINE</a>
            </>}
            <a href="/" className="mt-6 text-center text-[13px] text-[var(--muted)] hover:text-[var(--primary)]">← กลับไปหน้าเว็บไซต์</a>
          </section>
        </motion.div>
      </main>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
    <div data-safe-area-inset-root style={{ boxSizing: 'border-box', paddingTop: 'var(--safe-area-inset-top)', minHeight: '100vh', background: 'var(--bg)' }} className="overflow-x-clip">
      <div className="flex">
        <aside className={`fixed lg:sticky top-0 lg:top-4 z-40 lg:z-0 left-0 lg:m-4 h-full lg:h-[calc(100vh-32px)] w-[272px] shrink-0 glass-dark text-white lg:rounded-[28px] p-4 flex flex-col gap-1 overflow-y-auto transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="flex lg:hidden justify-between items-center mb-2"><span className="font-bold">เมนู</span><button onClick={() => setSidebarOpen(false)} className="p-1" aria-label="ปิดเมนู"><X /></button></div>
          <div className="flex items-center gap-3 mb-3"><span className="bg-white rounded-2xl p-1.5 shrink-0"><img src="/BGE_logo.png" alt="BGE" width={44} height={44} className="w-11 h-11 object-contain" /></span><div className="leading-tight min-w-0"><div className="font-bold text-[17px]">SolarTech</div><div className="text-[12px] text-white/70">Backoffice</div></div></div>
          <div className="rounded-2xl bg-white/10 p-3 mb-2 flex items-center gap-2"><span className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center text-[12px] font-bold shrink-0">{initials(currentUser.value.name)}</span><div className="min-w-0"><div className="font-semibold text-[13px] truncate">{currentUser.value.name}</div><div className="text-[11px] text-white/65">{ROLE_LABEL[currentUser.value.role]} • @{currentUser.value.username}</div></div></div>
          <nav className="flex flex-col gap-1">
          <NavItem id="dashboard" label="แดชบอร์ด" icon={<LayoutDashboard size={19} />} />
          {can('customers_view') && <NavItem id="leads" label="ลูกค้า" icon={<Users size={19} />} badge={records.length} />}
          {can('orders_view') && <NavItem id="orders" label="ออเดอร์ / งานติดตั้ง" icon={<ClipboardList size={19} />} badge={stats.waitInstall} />}
          {can('quotes_view') && <NavItem id="quotes" label="ใบเสนอราคา" icon={<FileText size={19} />} />}
          {can('orders_view') && <NavItem id="calendar" label="ปฏิทินติดตั้ง" icon={<CalendarDays size={19} />} />}
          {can('finance_view') && <NavItem id="finance" label="การเงิน" icon={<Wallet size={19} />} />}
          {can('finance_view') && <NavItem id="reports" label="รายงาน" icon={<BarChart3 size={19} />} />}
          {can('electric_view') && <NavItem id="electric" label="งานการไฟฟ้า" icon={<Zap size={19} />} badge={stats.waitElec} />}
          {can('photos_view') && <NavItem id="album" label="อัลบั้ม" icon={<Camera size={19} />} badge={allPhotos.length} />}
          {(can('news_manage') || can('projects_manage') || can('products_manage') || can('clients_manage')) && <div>
            <button onClick={() => setWebMenuOpen(o => !o)} aria-expanded={webMenuOpen || WEB_VIEWS.includes(view)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[14px] font-medium transition ${WEB_VIEWS.includes(view) && !webMenuOpen ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>
              <Globe size={19} /><span className="flex-1">แก้ไขหน้าเว็บ</span><ChevronDown size={16} className={`transition-transform ${webMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            {webMenuOpen && <div className="mt-1 ml-3 pl-2 border-l border-white/15 space-y-1">
              {can('news_manage') && <NavItem id="news" label="ข่าวสาร" icon={<FileText size={17} />} />}
              {can('projects_manage') && <NavItem id="projects" label="ผลงาน" icon={<Building2 size={17} />} />}
              {can('products_manage') && <NavItem id="products" label="อุปกรณ์" icon={<Zap size={17} />} />}
              {can('clients_manage') && <NavItem id="clients" label="ลูกค้าของเรา" icon={<Users size={17} />} />}
            </div>}
          </div>}
          {can('users_view') && <NavItem id="users" label="ผู้ใช้" icon={<UserCog size={19} />} badge={userRecords.length} />}
          {can('settings_view') && <NavItem id="settings" label="ตั้งค่าบริษัท / อุปกรณ์" icon={<Settings size={19} />} />}
          {currentUser?.value.role === 'Admin' && <NavItem id="monitor" label="การใช้งานระบบ" icon={<Activity size={19} />} />}
          {(currentUser?.value.role === 'Admin' || can('users_manage')) && <NavItem id="audit" label="ประวัติการแก้ไข" icon={<History size={19} />} />}
          <NavItem id="profile" label="โปรไฟล์ของฉัน" icon={<UserIcon size={19} />} />
          </nav>
          <div className="mt-auto rounded-2xl bg-white/10 p-4"><div className="flex items-center gap-2 font-semibold text-[13px]"><Sun size={18} className="text-amber-300" /> เคล็ดลับวันนี้</div><p className="text-[12px] leading-relaxed mt-1 text-white/75">หลังคาทิศใต้ให้ผลผลิตดีที่สุด ติดตามลีดภายใน 24 ชม. เพิ่มโอกาสปิดงานถึง 2 เท่า</p></div>
          <p className="text-[11px] text-center text-white/50 mt-1">BGE • BETTER GROUP ENGINEERING</p>
        </aside>
        {sidebarOpen && <button aria-label="ปิดเมนู" onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/30 z-30 lg:hidden" />}
        <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 mx-3 sm:mx-5 lg:mx-6 mt-3 rounded-[24px] glass">
          <div className="flex items-center gap-3 px-3 sm:px-5 h-[64px]">
            <button onClick={() => { try { setSidebarOpen(!sidebarOpen); } catch { /* ignore */ } }} className="lg:hidden p-2 rounded-xl bg-white/70" aria-label="เมนู"><Menu size={20} /></button>
            <div className="lg:hidden font-bold text-[15px] truncate">BGE <span className="text-[var(--primary)]">SolarTech</span></div>
            <div className="flex-1 hidden md:block max-w-[460px] relative"><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อลูกค้า เบอร์โทร ที่อยู่…" className="w-full pl-10 pr-3 py-2.5 rounded-full border border-white/80 bg-white/70 text-[14px]" /></div>
            <div className="ml-auto flex items-center gap-2">
              {can('customers_create') && <button onClick={() => { try { setForm(emptyJob()); setEditing(null); setShowAdd(true); } catch { /* ignore */ } }} className="btn-primary flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-full text-[13px] font-semibold"><Plus size={18} /><span className="hidden sm:inline">เพิ่มลูกค้าใหม่</span><span className="sm:hidden">เพิ่ม</span></button>}
              <ReleaseNotes />
              <button onClick={() => { try { setView('profile'); } catch { /* ignore */ } }} className="flex items-center gap-2 bg-white/70 rounded-full pl-1 pr-3 py-1 text-left"><span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#102A43] to-[#0F766E] text-white flex items-center justify-center text-[12px] font-bold shrink-0">{initials(currentUser.value.name)}</span><span className="hidden sm:block leading-tight min-w-0"><span className="block text-[12px] font-semibold truncate max-w-[130px]">{currentUser.value.name}</span><span className="block text-[10px] text-[var(--muted)]">{ROLE_LABEL[currentUser.value.role]}</span></span></button>
              <button onClick={logout} aria-label="ออกจากระบบ" title="ออกจากระบบ" className="w-10 h-10 flex items-center justify-center rounded-full bg-[var(--navy)] text-white hover:opacity-90"><LogOut size={16} /></button>
            </div>
          </div>
        </header>
        <main className="flex-1 min-w-0 p-3 sm:p-5 lg:p-6 max-w-[1320px] mx-auto w-full">
          <motion.div key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}>
          {apiError && <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 text-[13px] px-4 py-3 rounded-2xl flex gap-2"><AlertTriangle size={18} className="shrink-0" />{apiError}</div>}
          {result && <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] px-4 py-3 rounded-2xl flex justify-between gap-2"><span>{result}</span><button onClick={() => setResult(null)} className="font-bold">×</button></div>}
          {loading && view !== 'dashboard' && <div aria-busy="true" className="space-y-3"><div className="skeleton h-12 w-64" /><div className="skeleton h-40" /><div className="skeleton h-40" /></div>}

          {view === 'dashboard' && (loading ? <DashboardSkeleton /> : <Dashboard d={dash} onOpen={id => setDetailId(id)} onNav={v => setView(v as any)} />)}

          {view === 'news' && can('news_manage') && <NewsAdmin />}
          {view === 'projects' && can('projects_manage') && <ProjectsAdmin />}
          {view === 'products' && can('products_manage') && <ProductsAdmin />}
          {view === 'clients' && can('clients_manage') && <ClientsAdmin />}
          {view === 'monitor' && currentUser?.value.role === 'Admin' && <SystemMonitor />}
          {view === 'audit' && (currentUser?.value.role === 'Admin' || can('users_manage')) && <AuditLog />}
          {view === 'calendar' && can('orders_view') && <InstallCalendar jobs={records.map(r => ({ id: r.id, ...r.value }))} staff={staff} waitingStatuses={['ตกลงจ้าง', 'รอยื่นกู้ธนาคาร', 'รอผลกู้ธนาคาร', 'มัดจำแล้ว', 'รอนัดวันติดตั้ง', 'รอติดตั้ง']} onOpen={id => setDetailId(id)} />}
          {view === 'reports' && can('finance_view') && <Reports jobs={jobs} soldStatuses={SOLD_STATUSES} onMessage={setResult} />}

          {view === 'users' && <>
            <div className="flex flex-wrap gap-3 items-end justify-between mb-4"><div><h1 className="text-[24px] font-extrabold flex items-center gap-2"><UserCog className="text-[var(--primary)]" /> ผู้ใช้</h1><p className="text-[13px] text-[var(--muted)]">เฉพาะผู้ดูแลระบบ — เพิ่ม แก้ไข ปิด-เปิดใช้งาน ลบ และรีเซ็ตรหัสผ่าน</p></div>
              {can('users_manage') ? <button onClick={() => { try { setUserForm(emptyAppUser()); setEditingUser(null); setUserFormError(null); setShowUserForm(true); } catch { /* ignore */ } }} className="flex items-center gap-1.5 bg-[var(--primary)] text-white px-4 py-2.5 rounded-full text-[13px] font-bold"><Plus size={17} /> เพิ่มผู้ใช้ใหม่</button> : <span className="bg-gray-100 text-gray-400 px-4 py-2.5 rounded-full text-[13px] font-bold">+ เพิ่มผู้ใช้ใหม่</span>}
            </div>
            <div className="flex flex-col md:flex-row gap-2 mb-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="ค้นหาชื่อ Username เบอร์โทร อีเมล…" className={inputCls + ' pl-9 !rounded-full'} /></div><select value={userRoleFilter} onChange={e => setUserRoleFilter(e.target.value)} className={inputCls + ' md:w-[200px] !rounded-full'}><option>ทั้งหมด</option><option value="Admin">Admin</option><option value="Sale">Sale</option><option value="Technician">Technician</option><option value="Accountant">Accountant</option></select></div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">{(['Admin', 'Sale', 'Technician', 'Accountant'] as Role[]).map(r => <div key={r} className="bg-[var(--surface)] rounded-2xl border p-3"><div className="text-[12px] text-[var(--muted)]">{ROLE_LABEL[r]} ({r})</div><div className="text-[20px] font-extrabold">{userRecords.filter(x => x.value.role === r).length} คน</div></div>)}</div>
            <div className="bg-[var(--surface)] rounded-3xl border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-[13px] min-w-[900px]"><thead><tr className="bg-gray-50 text-left text-[12px] text-gray-500"><th className="px-4 py-3">ชื่อ</th><th className="px-4 py-3">Username</th><th className="px-4 py-3">เบอร์โทร</th><th className="px-4 py-3">บทบาท</th><th className="px-4 py-3">สถานะ</th><th className="px-4 py-3">เข้าสู่ระบบล่าสุด</th><th className="px-4 py-3">จัดการ</th></tr></thead><tbody>
              {filteredUsers.map(r => { const u = r.value; return <tr key={r.id} className="border-t"><td className="px-4 py-3"><div className="flex items-center gap-2"><span className="w-8 h-8 rounded-full bg-[#0B3D7A] text-white flex items-center justify-center text-[11px] font-bold shrink-0">{initials(u.name)}</span><div><div className="font-semibold">{u.name}</div><div className="text-[11px] text-gray-500">{u.email}</div></div></div></td><td className="px-4 py-3 font-medium">@{u.username}{u.lineLinked && <span title={`เชื่อม LINE: ${u.lineName || ''}`} className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full align-middle" style={{ background: LINE_GREEN }}><LineIcon size={10} />LINE</span>}</td><td className="px-4 py-3">{u.phone}</td><td className="px-4 py-3"><span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold whitespace-nowrap">{ROLE_LABEL[u.role]} ({u.role})</span></td><td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${u.status === 'ใช้งาน' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>{u.status}</span></td><td className="px-4 py-3">{u.lastLogin}</td><td className="px-4 py-3"><div className="flex gap-1 flex-wrap">{can('users_manage') ? <><button onClick={() => { try { setEditingUser(r); setUserForm({ ...u, permissions: { ...u.permissions }, password: '' }); setUserFormError(null); setShowUserForm(true); } catch { /* ignore */ } }} className="p-2 rounded-full bg-blue-100" aria-label="แก้ไขผู้ใช้"><Pencil size={15} /></button><button onClick={() => toggleUserActive(r)} className="px-2 py-1.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">{u.status === 'ใช้งาน' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}</button><button onClick={() => { try { setResetTarget(r); setResetPassword(''); setUserFormError(null); } catch { /* ignore */ } }} className="px-2 py-1.5 rounded-full bg-violet-100 text-violet-800 text-[11px] font-bold flex items-center gap-1"><KeyRound size={13} /> รีเซ็ตรหัส</button>{confirmDeleteUserId === r.id ? <span className="flex gap-1"><button onClick={() => deleteUser(r)} className="px-2 py-1.5 rounded-full bg-red-600 text-white text-[11px] font-bold">ยืนยันลบ</button><button onClick={() => setConfirmDeleteUserId(null)} className="px-2 py-1.5 rounded-full border text-[11px] font-bold">ยกเลิก</button></span> : <button onClick={() => setConfirmDeleteUserId(r.id)} className="p-2 rounded-full bg-red-50 text-red-600" aria-label="ลบผู้ใช้"><Trash2 size={15} /></button>}</> : <span className="text-[12px] text-gray-400">ดูอย่างเดียว</span>}</div></td></tr>; })}
            </tbody></table></div>{filteredUsers.length === 0 && <p className="text-center py-8 text-[var(--muted)]">ไม่พบผู้ใช้ตามเงื่อนไข</p>}</div>
          </>}

          {view === 'profile' && <>
            <h1 className="text-[24px] font-extrabold">โปรไฟล์ของฉัน</h1><p className="text-[13px] text-[var(--muted)] mb-4">ข้อมูลบัญชีของตัวเอง และเปลี่ยนรหัสผ่าน</p>
            <div className="bg-[var(--surface)] rounded-3xl border p-5 mb-4 flex flex-wrap items-center gap-3">
              <span className="w-11 h-11 rounded-full text-white flex items-center justify-center shrink-0 overflow-hidden" style={{ background: LINE_GREEN }}>{currentUser.value.linePicture ? <img src={currentUser.value.linePicture} alt="" className="w-full h-full object-cover" /> : <LineIcon size={22} />}</span>
              <div className="flex-1 min-w-[180px]">
                <div className="font-bold">บัญชี LINE</div>
                <div className="text-[13px] text-[var(--muted)]">{currentUser.value.lineLinked ? `เชื่อมกับ ${currentUser.value.lineName || 'LINE'} แล้ว • เข้าสู่ระบบด้วย LINE ได้` : lineLoginEnabled ? 'ยังไม่ได้เชื่อม เชื่อมแล้วเข้าสู่ระบบด้วย LINE ได้โดยไม่ต้องพิมพ์รหัสผ่าน' : 'ผู้ดูแลระบบยังไม่ได้เปิดใช้ LINE Login'}</div>
              </div>
              {currentUser.value.lineLinked
                ? <button onClick={async () => { try { const res = await fetch('/api/auth/line/unlink', { method: 'POST' }); if (!res.ok) throw new Error(); setCurrentUser({ ...currentUser, value: { ...currentUser.value, lineLinked: false, lineName: undefined, linePicture: undefined } }); setResult('ยกเลิกการเชื่อมบัญชี LINE แล้ว'); } catch { setResult('ยกเลิกการเชื่อมไม่สำเร็จ'); } }} className="px-4 py-2.5 rounded-full border text-[13px] font-bold">ยกเลิกการเชื่อม</button>
                : lineLoginEnabled && <a href="/api/auth/line/start?mode=link" className="px-4 py-2.5 rounded-full text-white text-[13px] font-bold flex items-center gap-1.5" style={{ background: LINE_GREEN }}><LineIcon size={16} />เชื่อมบัญชี LINE</a>}
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="bg-[var(--surface)] rounded-3xl border p-5"><div className="flex items-center gap-3"><span className="w-14 h-14 rounded-full bg-[#0B3D7A] text-white flex items-center justify-center text-[18px] font-extrabold">{initials(currentUser.value.name)}</span><div><div className="font-extrabold text-[18px]">{currentUser.value.name}</div><div className="text-[13px] text-[var(--muted)]">@{currentUser.value.username} • {ROLE_LABEL[currentUser.value.role]}</div></div><span className="ml-auto px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold">{currentUser.value.status}</span></div>
                <div className="grid grid-cols-2 gap-3 mt-4 text-[13px]">{[['เบอร์โทร', currentUser.value.phone], ['อีเมล', currentUser.value.email], ['วันที่สร้าง', currentUser.value.created], ['เข้าสู่ระบบล่าสุด', currentUser.value.lastLogin]].map(([k, v]) => <div key={k} className="bg-gray-50 rounded-2xl p-3"><div className="text-[11px] text-gray-500">{k}</div><div className="font-semibold break-words [overflow-wrap:anywhere]">{v}</div></div>)}</div>
                <div className="mt-4"><div className="font-bold text-[14px] mb-2 flex gap-1.5 items-center"><ShieldCheck size={17} className="text-[var(--primary)]" /> สิทธิ์ของฉัน</div><div className="space-y-2">{PERM_GROUPS.map(g => <div key={g.module} className="flex flex-wrap gap-1 items-center"><span className="text-[12px] font-bold w-[130px]">{g.module}:</span>{g.items.map(it => <span key={it.key} className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${currentUser.value.permissions[it.key] ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400 line-through'}`}>{it.label}</span>)}</div>)}</div></div>
              </div>
              <form onSubmit={changeOwnPassword} className="bg-[var(--surface)] rounded-3xl border p-5"><h2 className="font-bold flex gap-2 items-center"><Lock size={18} className="text-[var(--primary)]" /> เปลี่ยนรหัสผ่านของฉัน</h2><p className="text-[12px] text-[var(--muted)] mt-1 mb-3">กรอกรหัสผ่านปัจจุบัน แล้วตั้งรหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)</p><div className="space-y-3"><div><label className={labelCls}>รหัสผ่านปัจจุบัน</label><input type="password" value={profileForm.current} onChange={e => setProfileForm({ ...profileForm, current: e.target.value })} className={inputCls} /></div><div><label className={labelCls}>รหัสผ่านใหม่</label><input type="password" value={profileForm.next} onChange={e => setProfileForm({ ...profileForm, next: e.target.value })} className={inputCls} /></div><div><label className={labelCls}>ยืนยันรหัสผ่านใหม่</label><input type="password" value={profileForm.confirm} onChange={e => setProfileForm({ ...profileForm, confirm: e.target.value })} className={inputCls} /></div></div>{profileMsg && <div className={`mt-3 text-[13px] px-3 py-2.5 rounded-xl ${profileMsg.includes('สำเร็จ') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>{profileMsg}</div>}<button disabled={profileBusy} type="submit" className="w-full mt-4 bg-[var(--primary)] text-white py-3 rounded-full font-bold disabled:opacity-50">{profileBusy ? 'กำลังบันทึก…' : 'เปลี่ยนรหัสผ่าน'}</button><button type="button" onClick={logout} className="w-full mt-2 py-3 rounded-full border font-bold flex justify-center gap-2"><LogOut size={17} /> ออกจากระบบ</button></form>
            </div>
          </>}

          {view === 'leads' && <>
            <div className="flex flex-wrap gap-3 items-end justify-between mb-4"><div><h1 className="text-[24px] font-extrabold">ลูกค้า</h1><p className="text-[13px] text-[var(--muted)]">ค้นหา กรอง และติดตามลูกค้าทุกคนในที่เดียว</p></div></div>
            <div className="flex flex-col md:flex-row gap-2 mb-4"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อ เบอร์โทร ที่อยู่…" className={inputCls + ' pl-9 !rounded-full'} /></div><select value={statusFilter} onChange={e => { setGroupFilter('ทั้งหมด'); setStatusFilter(e.target.value); }} className={inputCls + ' md:w-[180px] !rounded-full'}><option>ทั้งหมด</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select><select value={needFilter} onChange={e => setNeedFilter(e.target.value)} className={inputCls + ' md:w-[180px] !rounded-full'}><option>ทั้งหมด</option><option>ใช้เอง</option><option>ขายไฟ</option><option>ใช้เอง + ขายไฟ</option></select></div>
            <ScopeBar scope={scope} onChange={setScope} shown={filtered.length} total={records.length} />
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">{filtered.map(r => { const v = r.value; const t = calcTotal(v); return (<article key={r.id} className="bg-[var(--surface)] rounded-3xl border p-4 flex flex-col gap-2"><div className="flex justify-between gap-2"><div className="flex gap-3 min-w-0"><div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center font-bold text-blue-700 shrink-0">{String(v.customer || '').replace('คุณ', '').trim().charAt(0)}</div><div className="min-w-0"><div className="font-bold truncate">{v.customer}</div><div className="text-[12px] text-[var(--muted)] flex gap-1"><Phone size={12} />{v.phone} • {v.line}</div></div></div><span className="text-[11px] font-bold px-2 py-1 rounded-full h-fit shrink-0" style={{ background: STATUS_COLOR[v.status] }}>{v.status}</span></div><p className="text-[13px] text-[var(--muted)] flex gap-1"><MapPin size={14} className="shrink-0 mt-0.5" />{v.address}</p>{v.customerNote && <p className="text-[12px] leading-relaxed text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-2.5 py-2">{v.customerNote}</p>}<div className="flex flex-wrap gap-1.5 text-[11px]"><span className="bg-gray-100 px-2 py-1 rounded-full">{v.building}</span><span className="bg-gray-100 px-2 py-1 rounded-full">{v.need}</span><span className="bg-gray-100 px-2 py-1 rounded-full">{v.kw || '—'} kW</span><span className="bg-gray-100 px-2 py-1 rounded-full">ค่าไฟ {fmtBaht(v.bill)}/ด.</span></div><div className="flex justify-between items-center mt-auto pt-2 border-t"><span className="font-extrabold text-[var(--primary)]">{fmtBaht(t.total)}</span><div className="flex gap-1"><button onClick={() => setDetailId(r.id)} className="p-2 rounded-full bg-gray-100" aria-label="ดูรายละเอียด"><Eye size={16} /></button>{can('customers_edit') ? <button onClick={() => { try { setForm(v); setEditing(r); setShowAdd(true); } catch { /* ignore */ } }} className="p-2 rounded-full bg-blue-100" aria-label="แก้ไข"><Pencil size={16} /></button> : <button disabled className="p-2 rounded-full bg-gray-100 text-gray-300" aria-label="แก้ไข"><Pencil size={16} /></button>}{can('customers_delete') ? <button onClick={() => deleteJob(r.id)} className="p-2 rounded-full bg-red-50 text-red-600" aria-label="ลบ"><Trash2 size={16} /></button> : <button disabled className="p-2 rounded-full bg-gray-100 text-gray-300" aria-label="ลบ"><Trash2 size={16} /></button>}</div></div></article>); })}{filtered.length === 0 && <div className="col-span-full text-center py-12 text-[var(--muted)] bg-[var(--surface)] rounded-3xl border">ไม่พบลูกค้าตามเงื่อนไขที่ค้นหา</div>}</div>
          </>}

          {view === 'orders' && <>
            <h1 className="text-[24px] font-extrabold">ออเดอร์ / งานติดตั้ง</h1><p className="text-[13px] text-[var(--muted)] mb-4">กดที่การ์ดเพื่อเปิดรายละเอียด</p><ScopeBar scope={scope} onChange={setScope} shown={filtered.length} total={records.length} />
            <div className="flex flex-wrap gap-2 mb-2"><button onClick={() => { setGroupFilter('ทั้งหมด'); setStatusFilter('ทั้งหมด'); }} className={`px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap font-semibold ${groupFilter === 'ทั้งหมด' ? 'bg-[var(--primary)] text-white' : 'bg-white border'}`}>ทั้งหมด ({records.length})</button>{STATUS_GROUPS.map(g => { const n = jobs.filter(j => g.statuses.includes(j.status)).length; return <button key={g.name} onClick={() => { setGroupFilter(g.name); setStatusFilter('ทั้งหมด'); }} className={`px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap font-semibold ${groupFilter === g.name ? 'bg-[var(--primary)] text-white' : n ? 'bg-white border' : 'bg-white/60 border text-gray-400'}`}>{g.name} ({n})</button>; })}</div>{groupFilter !== 'ทั้งหมด' && <div className="flex flex-wrap gap-2 mb-3 pl-3 border-l-2 border-[var(--primary)]"><button onClick={() => setStatusFilter('ทั้งหมด')} className={`px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap font-semibold !text-[12px] ${statusFilter === 'ทั้งหมด' ? 'bg-[var(--navy)] text-white' : 'bg-white border'}`}>ทุกสถานะในกลุ่ม</button>{(STATUS_GROUPS.find(g => g.name === groupFilter)?.statuses || []).map(s => { const n = jobs.filter(j => j.status === s).length; return <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-[13px] whitespace-nowrap font-semibold !text-[12px] ${statusFilter === s ? 'bg-[var(--navy)] text-white' : n ? 'bg-white border' : 'bg-white/60 border text-gray-400'}`}>{s} ({n})</button>; })}</div>}
            <div className="flex gap-3 overflow-x-auto kanban-scroll pb-3 -mx-1 px-1">{STATUSES.filter(s => (statusFilter === 'ทั้งหมด' || s === statusFilter) && inGroup(s)).map(s => { const list = filtered.filter(r => r.value.status === s); return <div key={s} className="w-[280px] shrink-0 bg-[var(--surface2)] rounded-3xl border p-3"><div className="flex justify-between items-center mb-3 px-1"><span className="font-bold text-[14px]">{s}</span><span className="bg-white px-2 py-0.5 rounded-full text-[12px] font-bold">{list.length}</span></div><div className="space-y-2">{list.map(r => { const v = r.value; return (<div key={r.id} className="bg-[var(--surface)] rounded-2xl border p-3 shadow-sm"><div className="font-bold text-[14px] truncate">{v.customer}</div><div className="text-[12px] text-[var(--muted)] truncate">{v.address}</div>{(v.saleName || v.techName || v.installDate) && <div className="text-[11px] text-gray-600 mt-1 truncate">{[v.saleName && `เซลล์: ${v.saleName}`, v.techName && `ช่าง: ${v.techName}`, v.installDate && `ติดตั้ง ${v.installDate}`].filter(Boolean).join(' • ')}</div>}<div className="flex justify-between mt-2 text-[12px]"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-bold">{v.kw || '—'} kW • {v.panels} แผง</span><span className="font-extrabold">{fmtBaht(calcTotal(v).total)}</span></div><div className="flex gap-1 mt-2"><button onClick={() => setDetailId(r.id)} className="flex-1 bg-[var(--dark)] text-white py-1.5 rounded-full text-[12px] font-semibold">เปิดงาน</button><select disabled={!can('orders_change_status')} value={v.status} onChange={e => updateJob(r.id, { status: e.target.value as Status }, { require: 'orders_change_status' })} className="flex-1 text-[12px] border rounded-full px-2 py-1.5 bg-white disabled:bg-gray-100"><option disabled>ย้ายสถานะ</option>{STATUSES.map(x => <option key={x}>{x}</option>)}</select></div></div>); })}{list.length === 0 && <p className="text-[12px] text-center text-[var(--muted)] py-4">ยังไม่มีงานในขั้นตอนนี้</p>}</div></div>; })}</div>
          </>}

          {view === 'quotes' && <>
            <h1 className="text-[24px] font-extrabold">ใบเสนอราคา</h1><p className="text-[13px] text-[var(--muted)] mb-4">คำนวณอัตโนมัติจากตารางอุปกรณ์ + ค่าแรง + ส่วนลด + VAT 7%</p>
            <div className="relative max-w-[420px] mb-4"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input value={quoteSearch} onChange={e => setQuoteSearch(e.target.value)} placeholder="ค้นหาลูกค้าเพื่อเปิดใบเสนอราคา…" className={inputCls + ' pl-9 !rounded-full'} /></div>
            <div className="grid md:grid-cols-2 gap-3">{quoteJobs.map(r => { const v = r.value; const t = calcTotal(v); return <div key={r.id} className="bg-[var(--surface)] rounded-3xl border p-4 flex gap-3 items-center"><div className="flex-1 min-w-0"><div className="flex gap-2 items-center flex-wrap"><span className="font-bold truncate">{v.customer}</span><span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 font-bold">QT-{r.id.slice(-4).toUpperCase()}</span></div><div className="text-[12px] text-[var(--muted)]">{v.items.length} รายการ • {v.kw} kW • {v.panels} แผง</div><div className="font-extrabold text-[var(--primary)] mt-1">{fmtBaht(t.total)} <span className="text-[11px] font-normal text-gray-400">รวม VAT แล้ว</span></div></div><button onClick={() => setQuoteId(r.id)} className="shrink-0 bg-[var(--primary)] text-white px-4 py-2.5 rounded-full text-[13px] font-bold">เปิดใบเสนอราคา</button></div>; })}</div>
          </>}

          {view === 'finance' && <>
            <div className="flex flex-wrap items-start justify-between gap-2"><div><h1 className="text-[24px] font-extrabold">การเงิน</h1><p className="text-[13px] text-[var(--muted)] mb-4">มัดจำ 30% / ติดตั้ง 40% / ส่งมอบ 30% — ปรับ % ได้ตามตกลง</p></div><button type="button" onClick={async () => { try { const { exportSalesExcel } = await import('@/lib/sales-export'); await exportSalesExcel(financeRecords.map(r => r.value), SOLD_STATUSES); } catch (e) { setResult('Export ไม่สำเร็จ: ' + (e instanceof Error ? e.message : String(e))); } }} className="px-4 py-2.5 rounded-full border bg-white text-[13px] font-bold flex items-center gap-1.5"><FileText size={15} />Export Excel</button></div><ScopeBar scope={scope} onChange={setScope} shown={financeRecords.length} total={records.length} />
            <div className="grid lg:grid-cols-2 gap-3">{financeRecords.map(r => { const v = r.value; const pays = paymentAmounts(v); const paid = pays.filter(p => p.status === 'ยืนยันแล้ว').reduce((s, p) => s + p.amount, 0); const remain = pays.reduce((s, p) => s + p.amount, 0) - paid; return (<div key={r.id} className="bg-[var(--surface)] rounded-3xl border p-4"><div className="flex justify-between gap-2"><div><div className="font-bold">{v.customer}</div><div className="text-[12px] text-[var(--muted)]">ยอดรวม {fmtBaht(calcTotal(v).total)} • ชำระแล้ว {fmtBaht(paid)}</div></div><span className={`px-2 py-1 rounded-full text-[11px] font-bold h-fit ${remain === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>ค้าง {fmtBaht(remain)}</span></div><div className="mt-3 space-y-2">{pays.map((p, idx) => (<div key={idx} className="flex flex-wrap gap-2 items-center bg-gray-50 rounded-2xl p-2.5"><div className="flex-1 min-w-[150px]"><div className="text-[13px] font-semibold">{p.label}</div><div className="text-[12px] text-gray-500">{fmtBaht(p.amount)} • กำหนด {p.due || '—'}</div></div><input type="number" disabled={!can('finance_edit_installments')} value={p.pct} min={0} max={100} onChange={e => { const next = [...v.payments]; next[idx] = { ...next[idx], pct: Number(e.target.value) }; updateJob(r.id, { payments: next }, { require: 'finance_edit_installments' }); }} className="w-[64px] px-2 py-1.5 rounded-lg border text-[13px] disabled:bg-gray-100" /><span className="text-[12px]">%</span><select disabled={!can('finance_confirm')} value={p.status} onChange={e => { const next = [...v.payments]; next[idx] = { ...next[idx], status: e.target.value as any }; updateJob(r.id, { payments: next }, { require: 'finance_confirm' }); }} className="px-2 py-1.5 rounded-lg border text-[13px] bg-white disabled:bg-gray-100"><option>ยังไม่โอน</option><option>โอนแล้ว</option><option>รอตรวจสอบ</option><option>ยืนยันแล้ว</option></select><input disabled={!can('finance_edit_installments')} value={p.slip} placeholder="ลิงก์สลิป" onChange={e => { const next = [...v.payments]; next[idx] = { ...next[idx], slip: e.target.value }; updateJob(r.id, { payments: next }, { require: 'finance_edit_installments' }); }} className="flex-1 min-w-[120px] px-2 py-1.5 rounded-lg border text-[13px] bg-white disabled:bg-gray-100" /><UploadBtn folder="slips" label="แนบสลิป" disabled={!can('finance_edit_installments')} onError={m => setResult(m)} onUrl={url => { const next = [...v.payments]; next[idx] = { ...next[idx], slip: url }; void updateJob(r.id, { payments: next }, { require: 'finance_edit_installments' }).then(() => { if (slipOkEnabled) void checkSlip(r.id, idx); }); }} />{p.slip && /^https?:\/\//.test(p.slip) && <a href={p.slip} target="_blank" rel="noreferrer" className="text-[12px] text-[var(--primary)] font-semibold underline">ดูสลิป</a>}{p.slipCheck && <span title={[p.slipCheck.message, p.slipCheck.transRef && `เลขอ้างอิง ${p.slipCheck.transRef}`, p.slipCheck.sender && `จาก ${p.slipCheck.sender}`, p.slipCheck.receiver && `ถึง ${p.slipCheck.receiver}`, `ตรวจเมื่อ ${new Date(p.slipCheck.checkedAt).toLocaleString('th-TH')}`].filter(Boolean).join('\n')} className={`px-2 py-1 rounded-full text-[11px] font-bold ${p.slipCheck.status === 'ok' ? 'bg-emerald-100 text-emerald-800' : p.slipCheck.status === 'retry' || p.slipCheck.status === 'error' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-700'}`}>{p.slipCheck.status === 'ok' ? '✓ ' : '⚠ '}{SLIP_STATUS_LABEL[p.slipCheck.status]}{p.slipCheck.amount !== null && p.slipCheck.status !== 'invalid' ? ` ${fmtBaht(p.slipCheck.amount)}` : ''}</span>}{slipOkEnabled && p.slip && /^https?:\/\//.test(p.slip) && !p.receipt && p.slipCheck?.status !== 'ok' && (can('finance_edit_installments') || can('finance_confirm')) && <button type="button" onClick={() => { void checkSlip(r.id, idx); }} className="px-2.5 py-1 rounded-full border text-[11px] font-bold">{p.slipCheck ? 'ตรวจอีกครั้ง' : 'ตรวจสลิป'}</button>}<ReceiptButton job={v} index={idx} company={company} quoteRef={v.quoteDocNo || quoteNoFor(r.id)} canIssue={can('finance_confirm')} onIssue={() => issueReceipt(r.id, idx)} onMessage={setResult} /></div>))}</div></div>); })}</div>
          </>}

          {view === 'electric' && <>
            <h1 className="text-[24px] font-extrabold">งานการไฟฟ้า</h1><p className="text-[13px] text-[var(--muted)] mb-4">ติดตามการยื่นขายไฟ — เปิด/ปิดตามความต้องการของลูกค้าแต่ละงาน</p>
            <div className="grid lg:grid-cols-2 gap-3">{records.map(r => { const v = r.value; const done = v.elec.filter(s => s.done).length; return (<div key={r.id} className="bg-[var(--surface)] rounded-3xl border p-4"><div className="flex justify-between gap-2"><div><div className="font-bold">{v.customer}</div><div className="text-[12px] text-[var(--muted)]">{v.address}</div></div><label className="flex items-center gap-2 text-[12px] font-bold shrink-0"><span>{v.elecWanted ? 'ต้องการขายไฟ' : 'ไม่ขายไฟ'}</span><button disabled={!can('electric_update')} onClick={() => updateJob(r.id, { elecWanted: !v.elecWanted }, { require: 'electric_update' })} className={`w-11 h-6 rounded-full p-0.5 transition ${v.elecWanted ? 'bg-emerald-500' : 'bg-gray-300'} disabled:opacity-50`} aria-label="สลับต้องการขายไฟ"><span className={`block w-5 h-5 bg-white rounded-full shadow transition ${v.elecWanted ? 'translate-x-5' : 'translate-x-0'}`} /></button></label></div>{v.elecWanted ? <><div className="flex justify-between text-[12px] mt-3 mb-1"><span>ความคืบหน้า</span><span className="font-bold">{done}/5 ขั้น</span></div><div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3"><div className="h-full bg-emerald-500" style={{ width: (done / 5 * 100) + '%' }} /></div><div className="space-y-2">{v.elec.map((s, idx) => (<div key={idx} className="flex gap-2 items-start bg-gray-50 rounded-xl p-2.5"><button disabled={!can('electric_update')} onClick={() => { const next = [...v.elec]; next[idx] = { ...next[idx], done: !next[idx].done }; updateJob(r.id, { elec: next }, { require: 'electric_update' }); }} className="mt-0.5 shrink-0 disabled:opacity-50" aria-label={s.label}>{s.done ? <CheckCircle2 className="text-emerald-600" size={20} /> : <Circle className="text-gray-400" size={20} />}</button><div className="flex-1 min-w-0"><div className={`text-[13px] font-semibold ${s.done ? 'line-through opacity-60' : ''}`}>{idx + 1}. {s.label}</div><input disabled={!can('electric_update')} value={s.note} placeholder="หมายเหตุ" onChange={e => { const next = [...v.elec]; next[idx] = { ...next[idx], note: e.target.value }; updateJob(r.id, { elec: next }, { require: 'electric_update' }); }} className="w-full mt-1 px-2 py-1 rounded-lg border text-[12px] bg-white disabled:bg-gray-100" /></div><input type="date" disabled={!can('electric_update')} value={s.date} onChange={e => { const next = [...v.elec]; next[idx] = { ...next[idx], date: e.target.value }; updateJob(r.id, { elec: next }, { require: 'electric_update' }); }} className="px-1.5 py-1 rounded-lg border text-[12px] bg-white disabled:bg-gray-100" /></div>))}</div></> : <p className="text-[13px] text-gray-500 mt-3 bg-gray-50 rounded-xl p-3">ลูกค้างานนี้เลือกใช้ไฟเอง ไม่ได้ยื่นขายไฟ — เปิดสวิตช์ด้านบนหากลูกค้าต้องการขายไฟในภายหลัง</p>}</div>); })}</div>
          </>}

          {view === 'album' && <>
            <h1 className="text-[24px] font-extrabold">อัลบั้ม</h1><p className="text-[13px] text-[var(--muted)] mb-4">ภาพหน้างาน Before / After จากทุกงาน — กดที่ภาพเพื่อดูรายละเอียด</p>
            <div className="flex flex-wrap gap-2 items-center mb-4"><div className="flex gap-1 bg-gray-100 rounded-full p-1">{(['all', 'before', 'after'] as const).map(f => <button key={f} onClick={() => setPhotoFilter(f)} className={`px-3 py-1.5 rounded-full text-[12px] font-bold ${photoFilter === f ? 'bg-white shadow' : 'text-gray-600'}`}>{f === 'all' ? 'ทั้งหมด' : f === 'before' ? 'Before' : 'After'}</button>)}</div><select value={photoCategory} onChange={e => setPhotoCategory(e.target.value)} className="px-3 py-2 rounded-full border text-[13px] bg-white"><option>ทั้งหมด</option>{PHOTO_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
            {allPhotos.filter(({ photo }) => (photoFilter === 'all' || photo.group === photoFilter) && (photoCategory === 'ทั้งหมด' || photo.category === photoCategory)).length === 0 && <p className="text-center py-10 text-[var(--muted)] bg-[var(--surface)] rounded-3xl border">ยังไม่มีภาพในตัวกรองนี้ — เพิ่มภาพได้จากหน้างานของลูกค้าแต่ละคน</p>}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{allPhotos.filter(({ photo }) => (photoFilter === 'all' || photo.group === photoFilter) && (photoCategory === 'ทั้งหมด' || photo.category === photoCategory)).map(({ jobId, job, photo }) => (<article key={photo.id} className="border rounded-2xl overflow-hidden bg-white flex flex-col"><button onClick={() => { try { setDetailId(jobId); setLightbox(photo); } catch { /* ignore */ } }} className="relative block w-full aspect-[4/3] bg-gradient-to-br from-slate-100 to-blue-100 overflow-hidden text-left" aria-label={`ดูรายละเอียด: ${photo.caption}`}>{photo.url ? <img src={photo.url} alt={photo.caption} loading="lazy" className="absolute inset-0 w-full h-full object-cover" /> : <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-slate-500"><ImageIcon size={28} /><span className="text-[11px] font-bold px-2 text-center">{photo.category}</span></span>}<span className="absolute top-2 left-2 bg-black/60 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{photo.group === 'before' ? 'Before' : 'After'}</span></button><div className="p-2.5"><div className="font-semibold text-[13px] leading-snug">{photo.caption}</div><div className="text-[11px] text-gray-500 mt-1">{job.customer} • {photo.date || '—'} • {photo.photographer || 'ไม่ระบุผู้ถ่าย'}</div><span className="text-[11px] bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1 font-semibold">{photo.category}</span>{can('photos_delete') && (albumConfirmId === photo.id
              ? <div className="flex gap-1.5 mt-2"><button onClick={() => { void deleteAlbumPhoto(jobId, photo.id); }} className="flex-1 py-1.5 rounded-full bg-rose-600 text-white text-[12px] font-bold">ยืนยันลบ</button><button onClick={() => setAlbumConfirmId(null)} className="flex-1 py-1.5 rounded-full border text-[12px] font-bold">ยกเลิก</button></div>
              : <button onClick={() => setAlbumConfirmId(photo.id)} className="mt-2 w-full py-1.5 rounded-full border border-rose-200 text-rose-600 text-[12px] font-bold flex items-center justify-center gap-1" aria-label={`ลบภาพ ${photo.caption}`}><Trash2 size={13} />ลบภาพ</button>)}</div></article>))}</div>
          </>}

          {view === 'settings' && <>
            <h1 className="text-[24px] font-extrabold">ตั้งค่าบริษัท / อุปกรณ์</h1><p className="text-[13px] text-[var(--muted)] mb-4">ข้อมูลบริษัทจะแสดงบนหัวใบเสนอราคา {!can('settings_edit') && <span className="text-amber-700 font-semibold">• บัญชีของคุณดูได้อย่างเดียว</span>}</p>
            <form onSubmit={saveCompany} className="bg-[var(--surface)] rounded-3xl border p-4 sm:p-5 mb-4"><div className="flex flex-wrap gap-3 items-start mb-4"><LogoText size="lg" /><div className="min-w-0"><h2 className="font-extrabold text-[16px] leading-tight">{COMPANY_NAME}</h2><p className="text-[12px] text-[var(--muted)] mt-1">กรอกที่อยู่ เบอร์โทร และเลขผู้เสียภาษีให้ครบก่อนออกใบเสนอราคาให้ลูกค้า</p></div></div><div className="grid sm:grid-cols-2 gap-3"><div className="sm:col-span-2"><label className={labelCls}>ที่อยู่บริษัท</label><textarea disabled={!can('settings_edit')} value={company.address} onChange={e => setCompany({ ...company, address: e.target.value })} className={inputCls} rows={2} placeholder="เช่น เลขที่ ซอย ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์" /></div><div><label className={labelCls}>เบอร์โทรบริษัท</label><input disabled={!can('settings_edit')} value={company.phone} onChange={e => setCompany({ ...company, phone: e.target.value })} className={inputCls} placeholder="เช่น 02-xxx-xxxx" /></div><div><label className={labelCls}>เลขประจำตัวผู้เสียภาษี</label><input disabled={!can('settings_edit')} value={company.taxId} onChange={e => setCompany({ ...company, taxId: e.target.value })} className={inputCls} placeholder="เช่น 0xxxxxxxxxxxx" /></div></div><button disabled={companyBusy || !can('settings_edit')} type="submit" className="mt-4 flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-full text-[13px] font-bold disabled:opacity-50"><Save size={16} />{companyBusy ? 'กำลังบันทึก…' : 'บันทึกข้อมูลบริษัท'}</button></form>
            <div className="bg-[var(--surface)] rounded-3xl border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-[13px] min-w-[560px]"><thead><tr className="bg-gray-50 text-left"><th className="px-4 py-3">อุปกรณ์</th><th className="px-4 py-3">ราคาต่อหน่วย</th><th className="px-4 py-3">หมวด</th></tr></thead><tbody>{catalog.map((c, i) => <tr key={i} className="border-t"><td className="px-4 py-3 font-medium">{c.name}</td><td className="px-4 py-3">{fmtBaht(c.price)}</td><td className="px-4 py-3">{c.category}</td></tr>)}</tbody></table></div><div className="p-4 bg-blue-50 text-[13px] text-blue-800">VAT คงที่ 7% • ค่าแรงตั้งต้น 25,000 บาท • ส่วนลดปรับได้ในแต่ละใบเสนอราคา</div></div>
            <EquipmentSets catalog={catalog} canEdit={can('settings_edit')} />
            <div className="grid sm:grid-cols-3 gap-3 mt-4">{[{ i: Building2, t: 'บ้าน', d: 'ค่าไฟเฉลี่ย 2,000–6,000 บาท/เดือน' }, { i: Factory, t: 'โรงงาน', d: 'หลังคากว้าง ต้องการกำลังผลิตสูง' }, { i: Briefcase, t: 'ออฟฟิศ', d: 'ใช้ไฟกลางวันตรงกับเวลาผลิต' }].map((x, i) => (<div key={i} className="bg-[var(--surface)] rounded-3xl border p-4"><x.i className="text-[var(--primary)] mb-2" /><div className="font-bold">{x.t}</div><p className="text-[12px] text-[var(--muted)]">{x.d}</p></div>))}</div>
          </>}
          </motion.div>
        </main>
        </div>
      </div>

      {showUserForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowUserForm(false)}><div className="bg-white w-full max-w-[760px] max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-4"><h2 className="text-[19px] font-extrabold">{editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</h2><button onClick={() => setShowUserForm(false)} className="p-2 bg-gray-100 rounded-full"><X size={18} /></button></div>{userFormError && <div className="mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-[13px] px-3 py-2.5 rounded-xl">{userFormError}</div>}
          <form onSubmit={saveUser} className="grid sm:grid-cols-2 gap-3"><div><label className={labelCls}>ชื่อ *</label><input required value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} className={inputCls} placeholder="เช่น คุณนิด ฝ่ายขาย" /></div><div><label className={labelCls}>Username *</label><input required value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} className={inputCls} placeholder="เช่น sale1" /></div><div><label className={labelCls}>Password {editingUser ? '(เว้นว่างไว้ถ้าไม่เปลี่ยน)' : '*'}</label><input type="password" required={!editingUser} value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} className={inputCls} placeholder="อย่างน้อย 8 ตัวอักษร" /></div><div><label className={labelCls}>เบอร์โทร</label><input value={userForm.phone} onChange={e => setUserForm({ ...userForm, phone: e.target.value })} className={inputCls} placeholder="08x-xxx-xxxx" /></div><div><label className={labelCls}>อีเมล</label><input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} className={inputCls} placeholder="name@bge.co.th" /></div><div><label className={labelCls}>สถานะ</label><select value={userForm.status} onChange={e => setUserForm({ ...userForm, status: e.target.value as AppUser['status'] })} className={inputCls}><option>ใช้งาน</option><option>ปิดใช้งาน</option></select></div><div className="sm:col-span-2"><label className={labelCls}>บทบาท — เลือกแล้วสิทธิ์จะติ๊กอัตโนมัติตามบทบาท</label><div className="grid grid-cols-2 sm:grid-cols-4 gap-2">{(['Admin', 'Sale', 'Technician', 'Accountant'] as Role[]).map(r => <button type="button" key={r} onClick={() => { try { setUserForm({ ...userForm, role: r, permissions: { ...ROLE_PERMS[r] } }); } catch { /* ignore */ } }} className={`px-3 py-2.5 rounded-xl border text-[13px] font-bold ${userForm.role === r ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'bg-white'}`}>{ROLE_LABEL[r]}<span className="block text-[11px] font-medium opacity-80">{r}</span></button>)}</div></div><div className="sm:col-span-2 border rounded-2xl p-3"><div className="flex justify-between items-center mb-2"><span className="font-bold text-[14px]">สิทธิ์ละเอียด (Checkbox)</span><button type="button" onClick={() => { try { setUserForm({ ...userForm, permissions: { ...ROLE_PERMS[userForm.role] } }); } catch { /* ignore */ } }} className="text-[12px] font-bold text-[var(--primary)]">รีเซ็ตตามบทบาท</button></div><div className="space-y-3">{PERM_GROUPS.map(g => <div key={g.module}><div className="text-[12px] font-bold text-[var(--muted)] mb-1">{g.module}</div><div className="flex flex-wrap gap-2">{g.items.map(it => <label key={it.key} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[12px] font-semibold cursor-pointer ${userForm.permissions[it.key] ? 'bg-blue-50 border-blue-300 text-blue-800' : 'bg-white text-gray-500'}`}><input type="checkbox" checked={userForm.permissions[it.key]} onChange={e => setUserForm({ ...userForm, permissions: { ...userForm.permissions, [it.key]: e.target.checked } })} className="w-4 h-4 accent-[#0B7DFF]" />{it.label}</label>)}</div></div>)}</div></div><div className="sm:col-span-2 flex gap-2 pt-1"><button type="button" onClick={() => setShowUserForm(false)} className="flex-1 py-3 rounded-full border font-bold">ยกเลิก</button><button disabled={userBusy} type="submit" className="flex-1 py-3 rounded-full bg-[var(--primary)] text-white font-bold disabled:opacity-50">{userBusy ? 'กำลังบันทึก…' : 'บันทึกผู้ใช้'}</button></div></form></div></div>
      )}

      {resetTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setResetTarget(null)}><div className="bg-white w-full max-w-[420px] rounded-3xl p-5" onClick={e => e.stopPropagation()}><h2 className="font-extrabold text-[18px]">รีเซ็ตรหัสผ่าน</h2><p className="text-[13px] text-[var(--muted)] mt-1">{resetTarget.value.name} (@{resetTarget.value.username})</p>{userFormError && <div className="mt-3 bg-rose-50 border border-rose-200 text-rose-700 text-[13px] px-3 py-2.5 rounded-xl">{userFormError}</div>}<label className={labelCls + ' mt-3'}>รหัสผ่านใหม่</label><input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} className={inputCls} placeholder="อย่างน้อย 8 ตัวอักษร" /><div className="flex gap-2 mt-4"><button onClick={() => setResetTarget(null)} className="flex-1 py-2.5 rounded-full border font-bold">ยกเลิก</button><button onClick={submitResetPassword} className="flex-1 py-2.5 rounded-full bg-[var(--primary)] text-white font-bold">บันทึกรหัสใหม่</button></div></div></div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setShowAdd(false)}><div className="bg-white w-full max-w-[720px] max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5" onClick={e => e.stopPropagation()}><div className="flex justify-between items-center mb-4"><h2 className="text-[19px] font-extrabold">{editing ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่'}</h2><button onClick={() => setShowAdd(false)} className="p-2 bg-gray-100 rounded-full"><X size={18} /></button></div>
          <form onSubmit={saveJob} className="grid sm:grid-cols-2 gap-3"><div><label className={labelCls}>ชื่อลูกค้า *</label><input required value={form.customer} onChange={e => setForm({ ...form, customer: e.target.value })} className={inputCls} placeholder="เช่น คุณสมชาย ใจดี" /></div><div><label className={labelCls}>เบอร์โทร *</label><input required value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className={inputCls} placeholder="081-xxx-xxxx" /></div><div><label className={labelCls}>LINE</label><input value={form.line} onChange={e => setForm({ ...form, line: e.target.value })} className={inputCls} placeholder="@line" /></div><div><label className={labelCls}>ประเภทอาคาร</label><select value={form.building} onChange={e => setForm({ ...form, building: e.target.value })} className={inputCls}><option>บ้าน</option><option>โรงงาน</option><option>ออฟฟิศ</option></select></div><div className="sm:col-span-2"><label className={labelCls}>ที่อยู่ติดตั้ง</label><input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={inputCls} placeholder="บ้านเลขที่ ซอย ถนน จังหวัด" /></div><div className="sm:col-span-2"><label className={labelCls}>ลิงก์ Google Maps (ตำแหน่งลูกค้า)</label><input type="url" value={form.mapUrl || ''} onChange={e => setForm({ ...form, mapUrl: e.target.value })} className={inputCls} placeholder="https://maps.app.goo.gl/..." /><MapPreview url={form.mapUrl} className="mt-2" /></div><div><label className={labelCls}>ค่าไฟเฉลี่ย / เดือน (บาท)</label><input type="number" value={form.bill} onChange={e => setForm({ ...form, bill: Number(e.target.value) })} className={inputCls} /></div><div><label className={labelCls}>พื้นที่หลังคา (ตร.ม.)</label><input type="number" value={form.roofArea} onChange={e => setForm({ ...form, roofArea: Number(e.target.value) })} className={inputCls} /></div><div><label className={labelCls}>ทิศหลังคา</label><select value={form.roofDir} onChange={e => setForm({ ...form, roofDir: e.target.value })} className={inputCls}><option>ทิศใต้</option><option>ทิศตะวันออก</option><option>ทิศตะวันตก</option><option>ทิศเหนือ</option></select></div><div><label className={labelCls}>ประเภทมิเตอร์</label><select value={form.meter} onChange={e => setForm({ ...form, meter: e.target.value })} className={inputCls}><option>15/45</option><option>30/100</option><option>TOU</option></select></div><div><label className={labelCls}>ความต้องการ</label><select value={form.need} onChange={e => setForm({ ...form, need: e.target.value })} className={inputCls}><option>ใช้เอง</option><option>ขายไฟ</option><option>ใช้เอง + ขายไฟ</option></select></div><div><label className={labelCls}>สถานะ</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status })} className={inputCls}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div><div className="sm:col-span-2 grid sm:grid-cols-2 gap-3"><div><label className={labelCls}>เซลล์ผู้ดูแล</label><select value={form.saleId || ''} onChange={e => setForm({ ...form, saleId: e.target.value, saleName: staff.find(u => u.id === e.target.value)?.name || '' })} className={inputCls}><option value="">— ไม่ระบุ —</option>{staff.filter(u => u.role === 'Sale' || u.role === 'Admin').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div><div><label className={labelCls}>ทีมช่าง</label><select value={form.techId || ''} onChange={e => setForm({ ...form, techId: e.target.value, techName: staff.find(u => u.id === e.target.value)?.name || '' })} className={inputCls}><option value="">— ไม่ระบุ —</option>{staff.filter(u => u.role === 'Technician').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></div><div><label className={labelCls}>วันเริ่มติดตั้ง</label><input type="date" value={form.installDate || ''} onChange={e => setForm({ ...form, installDate: e.target.value })} className={inputCls} /></div><div><label className={labelCls}>จำนวนวันติดตั้ง</label><input type="number" min={1} max={60} value={form.installDays || 1} onChange={e => setForm({ ...form, installDays: Math.max(1, Math.min(60, Number(e.target.value) || 1)) })} className={inputCls} /></div><div><label className={labelCls}>ที่มาของลีด</label><select value={form.leadSource || (form.source === 'website' ? 'เว็บไซต์' : '')} onChange={e => setForm({ ...form, leadSource: e.target.value })} className={inputCls}><option value="">— ไม่ระบุ —</option>{LEAD_SOURCES.map(x => <option key={x}>{x}</option>)}</select></div><div><label className={labelCls}>นัดหมายครั้งต่อไป</label><input type="date" value={form.nextAppt} onChange={e => setForm({ ...form, nextAppt: e.target.value })} className={inputCls} /></div><div><label className={labelCls}>รายละเอียดความต้องการของลูกค้า / อื่นๆ</label><textarea value={form.customerNote} onChange={e => setForm({ ...form, customerNote: e.target.value })} className={inputCls + ' min-h-[108px] resize-y whitespace-pre-wrap'} rows={4} placeholder="สรุปที่คุยกับลูกค้า..." /></div></div><div className="sm:col-span-2 flex gap-2 pt-2"><button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-full border font-bold">ยกเลิก</button><button disabled={busy} type="submit" className="flex-1 py-3 rounded-full bg-[var(--primary)] text-white font-bold disabled:opacity-50">{busy ? 'กำลังบันทึก…' : 'บันทึกข้อมูล'}</button></div></form></div></div>
      )}

      {detailRec && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setDetailId(null)}><div className="bg-white w-full max-w-[860px] max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl" onClick={e => e.stopPropagation()}>
          <div className="sticky top-0 bg-[var(--surface)] p-5 pb-3 border-b flex justify-between gap-3"><div><div className="flex gap-2 items-center flex-wrap"><h2 className="text-[20px] font-extrabold">{detailRec.value.customer}</h2><span className="text-[11px] px-2 py-1 rounded-full font-bold" style={{ background: STATUS_COLOR[detailRec.value.status] }}>{detailRec.value.status}</span></div><p className="text-[13px] text-[var(--muted)]">{detailRec.value.phone} • {detailRec.value.line} • {detailRec.value.address}</p></div><button onClick={() => setDetailId(null)} className="p-2 bg-gray-100 rounded-full h-fit"><X size={18} /></button></div>
          <div className="mx-5 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2 font-bold text-[14px] text-amber-900"><NotebookPen size={18} className="text-amber-600" /> บันทึกการคุยกับลูกค้า</div>{!editingNote && <button onClick={() => { try { setNoteDraft(detailRec.value.customerNote || ''); setEditingNote(true); } catch { /* ignore */ } }} className="flex items-center gap-1 bg-white border border-amber-300 text-amber-800 px-3 py-1.5 rounded-full text-[12px] font-bold"><Pencil size={13} /> แก้ไข Note</button>}</div>
            {editingNote ? <div className="mt-3"><textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)} rows={4} placeholder="สรุปที่คุยกับลูกค้า..." className="w-full px-3 py-2.5 rounded-xl border border-amber-300 bg-white text-[14px] min-h-[108px] resize-y whitespace-pre-wrap" /><div className="flex gap-2 mt-2"><button onClick={saveCustomerNote} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-full text-[13px] font-bold">บันทึก Note</button><button onClick={() => setEditingNote(false)} className="flex-1 py-2 rounded-full border border-amber-300 bg-white font-bold text-[13px]">ยกเลิก</button></div><p className="text-[11px] text-amber-700 mt-2">Note เดิมจะถูกเก็บไว้ในประวัติอัตโนมัติเมื่อบันทึก Note ใหม่</p></div> : <p className="text-[13px] leading-relaxed text-amber-900 whitespace-pre-wrap mt-2">{detailRec.value.customerNote || 'ยังไม่มีบันทึกการคุยกับลูกค้า — กด “แก้ไข Note” เพื่อสรุปสิ่งที่คุยกับลูกค้าไว้ที่นี่'}</p>}
            {detailRec.value.noteHistory && detailRec.value.noteHistory.length > 0 && <div className="mt-3 pt-3 border-t border-amber-200"><div className="text-[12px] font-bold text-amber-800 mb-2">ประวัติ Note เก่า ({detailRec.value.noteHistory.length})</div><div className="space-y-2">{[...detailRec.value.noteHistory].reverse().map((h, i) => <div key={i} className="bg-white/80 border border-amber-100 rounded-xl px-3 py-2"><div className="text-[11px] font-semibold text-amber-700">{h.date || '—'}</div><div className="text-[13px] leading-relaxed text-gray-800 whitespace-pre-wrap">{h.text}</div></div>)}</div></div>}
          </div>
          <div className="px-5 pt-3 flex gap-2 overflow-x-auto no-scrollbar">{['ข้อมูล', 'สำรวจ', 'เสนอราคา', 'การเงิน', 'การไฟฟ้า', 'ประวัติติดต่อ', 'ภาพหน้างาน'].filter(t => t === 'ข้อมูล' || t === 'ประวัติติดต่อ' || (t === 'สำรวจ' && can('orders_view')) || (t === 'เสนอราคา' && can('quotes_view')) || (t === 'การเงิน' && can('finance_view')) || (t === 'การไฟฟ้า' && can('electric_view')) || (t === 'ภาพหน้างาน' && can('photos_view'))).map(t => <button key={t} onClick={() => setDetailTab(t)} className={`px-3 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap ${detailTab === t ? 'bg-[var(--primary)] text-white' : 'bg-gray-100'}`}>{t}</button>)}</div>
          <div className="p-5">
            {detailTab === 'ข้อมูล' && <div className="grid sm:grid-cols-2 gap-3 text-[14px]">{[['ประเภทอาคาร', detailRec.value.building], ['ค่าไฟเฉลี่ย', fmtBaht(detailRec.value.bill) + '/เดือน'], ['พื้นที่หลังคา', detailRec.value.roofArea + ' ตร.ม.'], ['ทิศหลังคา', detailRec.value.roofDir], ['ประเภทมิเตอร์', detailRec.value.meter], ['ความต้องการ', detailRec.value.need], ['วันที่สร้าง', detailRec.value.created], ['นัดครั้งต่อไป', detailRec.value.nextAppt || '—']].map(([k, v], i) => <div key={i} className="bg-gray-50 rounded-2xl p-3"><div className="text-[12px] text-gray-500">{k}</div><div className="font-semibold">{v}</div></div>)}{detailRec.value.mapUrl && <div className="sm:col-span-2"><div className="text-[12px] text-gray-500 mb-1">ตำแหน่งลูกค้า</div><MapPreview url={detailRec.value.mapUrl} /></div>}<CustomerLinkBox id={detailRec.id} job={detailRec.value} canEdit={can('customers_edit') || can('orders_edit')} seller={resolveSeller(company)} onMessage={setResult} onLink={async (revoke) => { try { const saved: any = await callApi('share.link', { id: detailRec.id, revoke }); recordsRef.current = recordsRef.current.map(r => r.id === detailRec.id ? { id: r.id, value: normalizeJob(saved.value), updatedAt: saved.updatedAt } : r); setRecords(recordsRef.current); setResult(revoke ? 'สร้างลิงก์ใหม่แล้ว ลิงก์เดิมใช้ไม่ได้' : 'สร้างลิงก์แล้ว'); } catch (e) { setResult('สร้างลิงก์ไม่สำเร็จ: ' + (e instanceof Error ? e.message : String(e))); } }} /><div className="sm:col-span-2"><label className={labelCls}>เปลี่ยนสถานะงาน</label><select disabled={!can('orders_change_status')} value={detailRec.value.status} onChange={e => updateJob(detailRec.id, { status: e.target.value as Status }, { require: 'orders_change_status' })} className={inputCls + ' disabled:bg-gray-100'}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></div><div className="sm:col-span-2"><label className={labelCls}>นัดหมายครั้งต่อไป</label><input type="date" disabled={!can('orders_edit')} value={detailRec.value.nextAppt} onChange={e => updateJob(detailRec.id, { nextAppt: e.target.value }, { require: 'orders_edit' })} className={inputCls + ' disabled:bg-gray-100'} /></div></div>}
            {detailTab === 'สำรวจ' && <div className="space-y-3"><div className="grid sm:grid-cols-3 gap-3">{([['ขนาดติดตั้ง (kW)', 'kw'], ['จำนวนแผง', 'panels'], ['ระยะสายไฟ (ม.)', 'cable']] as const).map(([label, key]) => <div key={key}><label className={labelCls}>{label}</label><input type="number" disabled={!can('orders_edit')} value={(detailRec.value as any)[key]} onChange={e => updateJob(detailRec.id, { [key]: Number(e.target.value) } as any, { require: 'orders_edit' })} className={inputCls + ' disabled:bg-gray-100'} /></div>)}</div><div className="grid sm:grid-cols-2 gap-3"><div><label className={labelCls}>Inverter</label><select disabled={!can('orders_edit')} value={detailRec.value.inverter} onChange={e => updateJob(detailRec.id, { inverter: e.target.value }, { require: 'orders_edit' })} className={inputCls + ' disabled:bg-gray-100'}><option>Inverter 5kW</option><option>Inverter 10kW</option><option>Inverter 15kW</option></select></div><div><label className={labelCls}>โครงสร้างหลังคา</label><input disabled={!can('orders_edit')} value={detailRec.value.roofStruct} onChange={e => updateJob(detailRec.id, { roofStruct: e.target.value }, { require: 'orders_edit' })} className={inputCls + ' disabled:bg-gray-100'} placeholder="เช่น กระเบื้องลอนคู่" /></div></div><div><label className={labelCls}>หมายเหตุสำรวจ</label><textarea disabled={!can('orders_edit')} value={detailRec.value.surveyNote} onChange={e => updateJob(detailRec.id, { surveyNote: e.target.value }, { require: 'orders_edit' })} className={inputCls + ' disabled:bg-gray-100'} rows={3} /></div></div>}
            {detailTab === 'เสนอราคา' && <QuoteWorkspace key={detailRec.id} job={detailRec.value} company={company} quoteNo={quoteNoFor(detailRec.id)} onChange={patch => updateJob(detailRec.id, patch)} canEdit={can('quotes_edit')} catalog={catalog} initialTab="edit" history={buildHistory(records, detailRec.id)} />}
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
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setQuoteId(null)}><div className="bg-white text-gray-900 w-full max-w-[820px] max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl" onClick={e => e.stopPropagation()}><div className="p-5 sm:p-7"><div className="flex justify-end mb-2"><button onClick={() => setQuoteId(null)} className="p-2 bg-gray-100 rounded-full"><X size={18} /></button></div><QuoteWorkspace key={quoteRec.id} job={quoteRec.value} company={company} quoteNo={quoteNoFor(quoteRec.id)} onChange={patch => updateJob(quoteRec.id, patch)} canEdit={can('quotes_edit') && !quoteRec.value.quoteApproval} catalog={catalog} initialTab="pdf" history={buildHistory(records, quoteRec.id)} />{quoteRec.value.quoteApproval && <div className="mt-2 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[13px] flex gap-2 items-center"><CheckCircle2 size={18} className="shrink-0" /><span>อนุมัติแล้วโดย <b>{quoteRec.value.quoteApproval.by}</b> เมื่อ {safe(() => new Date(quoteRec.value.quoteApproval!.at).toLocaleString('th-TH'), quoteRec.value.quoteApproval.at)} • ราคาถูกล็อก แก้ไขไม่ได้จนกว่าจะยกเลิกการอนุมัติ</span></div>}{can('quotes_approve') ? (quoteRec.value.quoteApproval
          ? <button onClick={() => { void approveQuote(quoteRec.id, false); }} className="w-full mt-2 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-bold flex justify-center gap-2"><X size={18} /> ยกเลิกการอนุมัติ (เพื่อแก้ไขราคา)</button>
          : <button onClick={() => { void approveQuote(quoteRec.id, true); }} className="w-full mt-2 py-3 rounded-full bg-emerald-600 text-white font-bold flex justify-center gap-2"><CheckCircle2 size={18} /> อนุมัติใบเสนอราคา</button>)
          : <p className="text-center text-[12px] text-gray-400 mt-2">{quoteRec.value.quoteApproval ? 'ใบเสนอราคานี้อนุมัติแล้ว' : 'ปุ่มอนุมัติต้องใช้สิทธิ์ “อนุมัติ” ใบเสนอราคา'}</p>}</div></div></div>
      )}
    </div>
    </MotionConfig>
  );
}
