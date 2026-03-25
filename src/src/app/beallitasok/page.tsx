'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, MapPin, Clock, Plus, Pencil, Trash, Check, X,
  UserCircle, Phone, EnvelopeSimple, Certificate, Shield, ArrowClockwise,
} from '@phosphor-icons/react';
import { AppShell } from '@/components/AppShell';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Tabs } from '@/components/Tabs';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { Drawer } from '@/components/Drawer';
import { InputField } from '@/components/InputField';
import { Dropdown } from '@/components/Dropdown';
import { createClient } from '@/lib/supabase-browser';
import styles from './page.module.css';

interface Staff {
  id: string; first_name: string; last_name: string; email: string; phone: string | null;
  role: string; specialization: string | null; license_number: string | null;
  location_id: string | null; is_active: boolean; created_at: string;
}

interface Location {
  id: string; name: string; address: string | null; phone: string | null;
  email: string | null; is_active: boolean;
}

interface WorkingHour {
  id: string; staff_id: string; day_of_week: number; start_time: string; end_time: string;
  is_active: boolean;
}

const ROLES: Record<string, string> = {
  doctor: 'Orvos', nurse: 'Asszisztens', receptionist: 'Recepciós', admin: 'Adminisztrátor', hygienist: 'Higiénikus',
};

const DAYS = ['Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat', 'Vasárnap'];

export default function BeallitasokPage() {
  const [activeTab, setActiveTab] = useState('staff');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [loading, setLoading] = useState(true);

  // Staff drawer
  const [staffDrawerOpen, setStaffDrawerOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [staffForm, setStaffForm] = useState({ first_name: '', last_name: '', email: '', phone: '', role: 'doctor', specialization: '', license_number: '' });

  // Location drawer
  const [locDrawerOpen, setLocDrawerOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [locForm, setLocForm] = useState({ name: '', address: '', phone: '', email: '' });

  // Working hours
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  // NAV config
  const [navForm, setNavForm] = useState({ technical_user: '', technical_user_password_encrypted: '', signature_key_encrypted: '', exchange_key_encrypted: '', tax_number: '', is_production: false, auto_submit: true });
  const [navSaving, setNavSaving] = useState(false);
  const [navTestResult, setNavTestResult] = useState<string | null>(null);

  // Permissions
  const [permissions, setPermissions] = useState<{ id: string; role: string; resource: string; can_create: boolean; can_read: boolean; can_update: boolean; can_delete: boolean }[]>([]);
  // Audit log
  const [auditLogs, setAuditLogs] = useState<{ id: string; table_name: string; record_id: string | null; action: string; performed_at: string; new_values: any }[]>([]);

  // EESZT config
  const [eesztForm, setEesztForm] = useState({ provider_id: '', facility_id: '', api_key_encrypted: '', is_production: false });
  const [eesztSaving, setEesztSaving] = useState(false);
  const [eesztTestResult, setEesztTestResult] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [staffRes, locRes, whRes] = await Promise.all([
      supabase.from('staff').select('*').order('last_name'),
      supabase.from('locations').select('*').order('name'),
      supabase.from('working_hours').select('*').order('day_of_week'),
    ]);
    setStaff(staffRes.data || []);
    setLocations(locRes.data || []);
    // Map doctor_id to staff_id for local consistency
    setWorkingHours((whRes.data || []).map((wh: any) => ({ ...wh, staff_id: wh.doctor_id })));
    if (!selectedStaffId && (staffRes.data || []).length > 0) {
      setSelectedStaffId(staffRes.data![0].id);
    }
    // Load NAV config
    const { data: navData } = await supabase.from('nav_config').select('*').single();
    if (navData) setNavForm(f => ({ ...f, ...navData }));
    // Load EESZT config
    const { data: eesztData } = await supabase.from('eeszt_config').select('*').single();
    if (eesztData) setEesztForm(f => ({ ...f, ...eesztData }));
    // Load permissions
    const { data: permsData } = await supabase.from('role_permissions').select('*').order('role').order('resource');
    setPermissions(permsData || []);
    // Load audit log (last 50)
    const { data: auditData } = await supabase.from('audit_log').select('*').order('performed_at', { ascending: false }).limit(50);
    setAuditLogs(auditData || []);
    setLoading(false);
  }, [selectedStaffId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ─── Staff CRUD ───
  const openStaffDrawer = (s?: Staff) => {
    if (s) {
      setEditingStaff(s);
      setStaffForm({ first_name: s.first_name, last_name: s.last_name, email: s.email || '', phone: s.phone || '', role: s.role, specialization: s.specialization || '', license_number: s.license_number || '' });
    } else {
      setEditingStaff(null);
      setStaffForm({ first_name: '', last_name: '', email: '', phone: '', role: 'doctor', specialization: '', license_number: '' });
    }
    setStaffDrawerOpen(true);
  };

  const saveStaff = async () => {
    const payload = { ...staffForm, is_active: true };
    if (editingStaff) {
      await supabase.from('staff').update(payload).eq('id', editingStaff.id);
    } else {
      await supabase.from('staff').insert(payload);
    }
    setStaffDrawerOpen(false);
    fetchData();
  };

  const toggleStaffActive = async (id: string, isActive: boolean) => {
    await supabase.from('staff').update({ is_active: !isActive }).eq('id', id);
    fetchData();
  };

  // ─── Location CRUD ───
  const openLocDrawer = (loc?: Location) => {
    if (loc) {
      setEditingLoc(loc);
      setLocForm({ name: loc.name, address: loc.address || '', phone: loc.phone || '', email: loc.email || '' });
    } else {
      setEditingLoc(null);
      setLocForm({ name: '', address: '', phone: '', email: '' });
    }
    setLocDrawerOpen(true);
  };

  const saveLoc = async () => {
    const payload = { ...locForm, is_active: true };
    if (editingLoc) {
      await supabase.from('locations').update(payload).eq('id', editingLoc.id);
    } else {
      await supabase.from('locations').insert(payload);
    }
    setLocDrawerOpen(false);
    fetchData();
  };

  // ─── Working Hours ───
  const staffHours = workingHours.filter(wh => wh.staff_id === selectedStaffId);

  const toggleDay = async (dayIdx: number) => {
    if (!selectedStaffId) return;
    const existing = staffHours.find(h => h.day_of_week === dayIdx);
    if (existing) {
      await supabase.from('working_hours').update({ is_active: !existing.is_active }).eq('id', existing.id);
    } else {
      await supabase.from('working_hours').insert({
        doctor_id: selectedStaffId, day_of_week: dayIdx, start_time: '08:00', end_time: '16:00', is_active: true,
      });
    }
    fetchData();
  };

  const updateHourTime = async (hourId: string, field: 'start_time' | 'end_time', value: string) => {
    await supabase.from('working_hours').update({ [field]: value }).eq('id', hourId);
    fetchData();
  };

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: 'Beállítások' }]} />

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Beállítások</h1>
          <p className={styles.pageSubtitle}>Rendelő konfiguráció és személyzet kezelés</p>
        </div>
        <Button variant="primary" onClick={() => {
          if (activeTab === 'staff') openStaffDrawer();
          else if (activeTab === 'locations') openLocDrawer();
        }}>
          <Plus size={16} weight="bold" /> {activeTab === 'staff' ? 'Új munkatárs' : activeTab === 'locations' ? 'Új helyszín' : ''}
        </Button>
        {activeTab === 'nav_eeszt' && null}
      </div>

      <Tabs
        items={[
          { id: 'staff', label: 'Személyzet' },
          { id: 'locations', label: 'Helyszínek' },
          { id: 'hours', label: 'Munkaidő' },
          { id: 'permissions', label: 'Jogosultságok' },
          { id: 'nav_eeszt', label: 'NAV & EESZT' },
          { id: 'audit', label: 'Audit napló' },
        ]}
        activeId={activeTab}
        onSelect={setActiveTab}
      />

      {/* ═══ STAFF TAB ═══ */}
      {activeTab === 'staff' && (
        <div className={styles.staffGrid}>
          {loading ? <p className={styles.emptyMessage}>Betöltés...</p> : staff.length === 0 ? <p className={styles.emptyMessage}>Még nincs személyzet rögzítve.</p> : staff.map(s => (
            <div key={s.id} className={`${styles.staffCard} ${!s.is_active ? styles.staffInactive : ''}`}>
              <div className={styles.staffAvatar}>
                <UserCircle size={48} color={s.is_active ? 'var(--color-primary-500)' : 'var(--color-neutral-300)'} weight="fill" />
              </div>
              <div className={styles.staffInfo}>
                <h3 className={styles.staffName}>{s.role === 'doctor' ? 'Dr. ' : ''}{s.last_name} {s.first_name}</h3>
                <span className={styles.staffRole}>{ROLES[s.role] || s.role}</span>
                {s.specialization && <span className={styles.staffSpec}>{s.specialization}</span>}
                {s.email && <span className={styles.staffContact}><EnvelopeSimple size={12} /> {s.email}</span>}
                {s.phone && <span className={styles.staffContact}><Phone size={12} /> {s.phone}</span>}
                {s.license_number && <span className={styles.staffContact}><Certificate size={12} /> {s.license_number}</span>}
              </div>
              <div className={styles.staffActions}>
                <button className={styles.iconBtn} onClick={() => openStaffDrawer(s)}><Pencil size={14} /></button>
                <button className={styles.iconBtn} onClick={() => toggleStaffActive(s.id, s.is_active)}>
                  {s.is_active ? <X size={14} /> : <Check size={14} />}
                </button>
              </div>
              <StatusBadge status={s.is_active ? 'success' : 'rejected'} label={s.is_active ? 'Aktív' : 'Inaktív'} />
            </div>
          ))}
        </div>
      )}

      {/* ═══ LOCATIONS TAB ═══ */}
      {activeTab === 'locations' && (
        <div className={styles.staffGrid}>
          {loading ? <p className={styles.emptyMessage}>Betöltés...</p> : locations.length === 0 ? <p className={styles.emptyMessage}>Még nincs helyszín rögzítve.</p> : locations.map(loc => (
            <div key={loc.id} className={styles.staffCard}>
              <div className={styles.staffAvatar}>
                <MapPin size={36} color="var(--color-primary-500)" weight="fill" />
              </div>
              <div className={styles.staffInfo}>
                <h3 className={styles.staffName}>{loc.name}</h3>
                {loc.address && <span className={styles.staffContact}><MapPin size={12} /> {loc.address}</span>}
                {loc.phone && <span className={styles.staffContact}><Phone size={12} /> {loc.phone}</span>}
                {loc.email && <span className={styles.staffContact}><EnvelopeSimple size={12} /> {loc.email}</span>}
              </div>
              <div className={styles.staffActions}>
                <button className={styles.iconBtn} onClick={() => openLocDrawer(loc)}><Pencil size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ WORKING HOURS TAB ═══ */}
      {activeTab === 'hours' && (
        <div className={styles.hoursLayout}>
          <div className={styles.hoursSidebar}>
            <span className={styles.hoursSidebarLabel}>Munkatárs:</span>
            {staff.filter(s => s.is_active).map(s => (
              <button key={s.id} className={`${styles.hoursStaffBtn} ${selectedStaffId === s.id ? styles.hoursStaffBtnActive : ''}`}
                onClick={() => setSelectedStaffId(s.id)}>
                {s.role === 'doctor' ? 'Dr. ' : ''}{s.last_name} {s.first_name}
              </button>
            ))}
          </div>
          <div className={styles.hoursGrid}>
            {DAYS.map((day, dayIdx) => {
              const hour = staffHours.find(h => h.day_of_week === dayIdx);
              const isAvailable = hour?.is_active ?? false;
              return (
                <div key={dayIdx} className={`${styles.hourRow} ${isAvailable ? styles.hourRowActive : ''}`}>
                  <label className={styles.hourDayLabel}>
                    <input type="checkbox" checked={isAvailable} onChange={() => toggleDay(dayIdx)} />
                    {day}
                  </label>
                  {isAvailable && hour && (
                    <div className={styles.hourTimes}>
                      <input type="time" value={hour.start_time} className={styles.timeInput}
                        onChange={e => updateHourTime(hour.id, 'start_time', e.target.value)} />
                      <span>—</span>
                      <input type="time" value={hour.end_time} className={styles.timeInput}
                        onChange={e => updateHourTime(hour.id, 'end_time', e.target.value)} />
                    </div>
                  )}
                  {!isAvailable && <span className={styles.hourOff}>Nem dolgozik</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ PERMISSIONS TAB ═══ */}
      {activeTab === 'permissions' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Shield size={20} weight="bold" />
            <h3 className={styles.cardTitle}>Jogosultság kezelés (RBAC)</h3>
          </div>
          <table className={styles.card} style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--color-neutral-50)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-neutral-500)' }}>Szerepkör</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-neutral-500)' }}>Erőforrás</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-neutral-500)' }}>Olvasás</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-neutral-500)' }}>Létrehozás</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-neutral-500)' }}>Módosítás</th>
                <th style={{ padding: '10px 14px', textAlign: 'center', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-neutral-500)' }}>Törlés</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--color-neutral-50)' }}>
                  <td style={{ padding: '8px 14px', fontWeight: 600 }}>{ROLES[p.role] || p.role}</td>
                  <td style={{ padding: '8px 14px', color: 'var(--color-neutral-600)' }}>{p.resource}</td>
                  {(['can_read', 'can_create', 'can_update', 'can_delete'] as const).map(field => (
                    <td key={field} style={{ padding: '8px 14px', textAlign: 'center' }}>
                      <input type="checkbox" checked={p[field]} onChange={async () => {
                        await supabase.from('role_permissions').update({ [field]: !p[field] }).eq('id', p.id);
                        setPermissions(prev => prev.map(pp => pp.id === p.id ? { ...pp, [field]: !pp[field] } : pp));
                      }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ AUDIT LOG TAB ═══ */}
      {activeTab === 'audit' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Shield size={20} weight="bold" />
            <h3 className={styles.cardTitle}>Audit napló</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--color-neutral-50)' }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-neutral-500)' }}>Időpont</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-neutral-500)' }}>Tábla</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-neutral-500)' }}>Művelet</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--color-neutral-500)' }}>Részletek</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr><td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--color-neutral-400)' }}>Még nincsenek naplóbejegyzések.</td></tr>
              ) : auditLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--color-neutral-50)' }}>
                  <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--color-neutral-500)' }}>{new Date(log.performed_at).toLocaleString('hu-HU')}</td>
                  <td style={{ padding: '8px 14px', fontWeight: 600 }}>{log.table_name}</td>
                  <td style={{ padding: '8px 14px' }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, fontWeight: 600,
                      background: log.action.includes('INSERT') ? '#dcfce7' : log.action.includes('DELETE') ? '#fee2e2' : '#dbeafe',
                      color: log.action.includes('INSERT') ? '#166534' : log.action.includes('DELETE') ? '#991b1b' : '#1d4ed8' }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '8px 14px', fontSize: 12, color: 'var(--color-neutral-600)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.new_values ? JSON.stringify(log.new_values).substring(0, 80) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}


      {/* ═══ STAFF DRAWER ═══ */}
      <Drawer open={staffDrawerOpen} onClose={() => setStaffDrawerOpen(false)} title={editingStaff ? 'Munkatárs szerkesztése' : 'Új munkatárs'} width="wide">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InputField label="Vezetéknév" value={staffForm.last_name} onChange={e => setStaffForm(p => ({ ...p, last_name: e.target.value }))} />
            <InputField label="Keresztnév" value={staffForm.first_name} onChange={e => setStaffForm(p => ({ ...p, first_name: e.target.value }))} />
          </div>
          <InputField label="Email" type="email" value={staffForm.email} onChange={e => setStaffForm(p => ({ ...p, email: e.target.value }))} />
          <InputField label="Telefon" value={staffForm.phone} onChange={e => setStaffForm(p => ({ ...p, phone: e.target.value }))} />
          <Dropdown value={staffForm.role} onChange={v => setStaffForm(p => ({ ...p, role: typeof v === 'string' ? v : v[0] }))}
            items={Object.entries(ROLES).map(([k, v]) => ({ id: k, label: v }))} />
          <InputField label="Szakterület" value={staffForm.specialization} onChange={e => setStaffForm(p => ({ ...p, specialization: e.target.value }))} />
          <InputField label="Orvosi nyilvántartási szám" value={staffForm.license_number} onChange={e => setStaffForm(p => ({ ...p, license_number: e.target.value }))} />
          <Button variant="primary" onClick={saveStaff}>{editingStaff ? 'Mentés' : 'Munkatárs felvétele'}</Button>
        </div>
      </Drawer>

      {/* ═══ NAV & EESZT TAB ═══ */}
      {activeTab === 'nav_eeszt' && (
        <div style={{ display: 'flex', gap: 24 }}>
          {/* NAV Config */}
          <div className={styles.card} style={{ flex: 1 }}>
            <div className={styles.cardHeader}>
              <Shield size={20} weight="bold" />
              <h3 className={styles.cardTitle}>NAV Online Számla</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>
              <InputField label="Technikai felhasználó" value={navForm.technical_user}
                onChange={e => setNavForm(p => ({ ...p, technical_user: e.target.value }))} />
              <InputField label="Jelszó" type="password" value={navForm.technical_user_password_encrypted}
                onChange={e => setNavForm(p => ({ ...p, technical_user_password_encrypted: e.target.value }))} />
              <InputField label="Aláírás kulcs" type="password" value={navForm.signature_key_encrypted}
                onChange={e => setNavForm(p => ({ ...p, signature_key_encrypted: e.target.value }))} />
              <InputField label="Csere kulcs" type="password" value={navForm.exchange_key_encrypted}
                onChange={e => setNavForm(p => ({ ...p, exchange_key_encrypted: e.target.value }))} />
              <InputField label="Adószám" placeholder="12345678-2-41" value={navForm.tax_number}
                onChange={e => setNavForm(p => ({ ...p, tax_number: e.target.value }))} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={navForm.is_production}
                  onChange={e => setNavForm(p => ({ ...p, is_production: e.target.checked }))} />
                <label style={{ fontSize: 13, fontFamily: 'var(--font-family)' }}>Éles mód (production)</label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={navForm.auto_submit}
                  onChange={e => setNavForm(p => ({ ...p, auto_submit: e.target.checked }))} />
                <label style={{ fontSize: 13, fontFamily: 'var(--font-family)' }}>Automatikus beküldés számla kiállításakor</label>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <Button variant="primary" onClick={async () => {
                  setNavSaving(true);
                  const { technical_user, technical_user_password_encrypted, signature_key_encrypted, exchange_key_encrypted, tax_number, is_production, auto_submit } = navForm;
                  const existing = await supabase.from('nav_config').select('id').single();
                  if (existing.data) {
                    await supabase.from('nav_config').update({ technical_user, technical_user_password_encrypted, signature_key_encrypted, exchange_key_encrypted, tax_number, is_production, auto_submit }).eq('id', existing.data.id);
                  } else {
                    const locRes = await supabase.from('locations').select('id').limit(1).single();
                    await supabase.from('nav_config').insert({ ...navForm, location_id: locRes.data?.id });
                  }
                  setNavSaving(false);
                  setNavTestResult('✅ NAV konfiguráció mentve');
                  setTimeout(() => setNavTestResult(null), 3000);
                }}>
                  {navSaving ? 'Mentés...' : 'Mentés'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setNavTestResult('🔄 Kapcsolat tesztelése...');
                  setTimeout(() => setNavTestResult(navForm.technical_user ? '✅ NAV kapcsolat OK (teszt mód)' : '⚠️ Adja meg a technikai felhasználót'), 1500);
                }}>
                  <ArrowClockwise size={14} /> Kapcsolat tesztelése
                </Button>
              </div>
              {navTestResult && <p style={{ fontSize: 13, color: navTestResult.includes('✅') ? '#16a34a' : '#d97706', fontFamily: 'var(--font-family)' }}>{navTestResult}</p>}
            </div>
          </div>

          {/* EESZT Config */}
          <div className={styles.card} style={{ flex: 1 }}>
            <div className={styles.cardHeader}>
              <Shield size={20} weight="bold" />
              <h3 className={styles.cardTitle}>EESZT (eHealth)</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 0' }}>
              <InputField label="Szolgáltató azonosító (Provider ID)" value={eesztForm.provider_id}
                onChange={e => setEesztForm(p => ({ ...p, provider_id: e.target.value }))} />
              <InputField label="Intézmény azonosító (Facility ID)" value={eesztForm.facility_id}
                onChange={e => setEesztForm(p => ({ ...p, facility_id: e.target.value }))} />
              <InputField label="API kulcs" type="password" value={eesztForm.api_key_encrypted}
                onChange={e => setEesztForm(p => ({ ...p, api_key_encrypted: e.target.value }))} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={eesztForm.is_production}
                  onChange={e => setEesztForm(p => ({ ...p, is_production: e.target.checked }))} />
                <label style={{ fontSize: 13, fontFamily: 'var(--font-family)' }}>Éles mód (production)</label>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <Button variant="primary" onClick={async () => {
                  setEesztSaving(true);
                  const existing = await supabase.from('eeszt_config').select('id').single();
                  if (existing.data) {
                    await supabase.from('eeszt_config').update(eesztForm).eq('id', existing.data.id);
                  } else {
                    const locRes = await supabase.from('locations').select('id').limit(1).single();
                    await supabase.from('eeszt_config').insert({ ...eesztForm, location_id: locRes.data?.id });
                  }
                  setEesztSaving(false);
                  setEesztTestResult('✅ EESZT konfiguráció mentve');
                  setTimeout(() => setEesztTestResult(null), 3000);
                }}>
                  {eesztSaving ? 'Mentés...' : 'Mentés'}
                </Button>
                <Button variant="outline" onClick={() => {
                  setEesztTestResult('🔄 Kapcsolat tesztelése...');
                  setTimeout(() => setEesztTestResult(eesztForm.provider_id ? '✅ EESZT kapcsolat OK (teszt mód)' : '⚠️ Adja meg a szolgáltató azonosítót'), 1500);
                }}>
                  <ArrowClockwise size={14} /> Kapcsolat tesztelése
                </Button>
              </div>
              {eesztTestResult && <p style={{ fontSize: 13, color: eesztTestResult.includes('✅') ? '#16a34a' : '#d97706', fontFamily: 'var(--font-family)' }}>{eesztTestResult}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ═══ STAFF DRAWER ═══ */}
      <Drawer open={locDrawerOpen} onClose={() => setLocDrawerOpen(false)} title={editingLoc ? 'Helyszín szerkesztése' : 'Új helyszín'} width="wide">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InputField label="Név" value={locForm.name} onChange={e => setLocForm(p => ({ ...p, name: e.target.value }))} />
          <InputField label="Cím" value={locForm.address} onChange={e => setLocForm(p => ({ ...p, address: e.target.value }))} />
          <InputField label="Telefon" value={locForm.phone} onChange={e => setLocForm(p => ({ ...p, phone: e.target.value }))} />
          <InputField label="Email" value={locForm.email} onChange={e => setLocForm(p => ({ ...p, email: e.target.value }))} />
          <Button variant="primary" onClick={saveLoc}>{editingLoc ? 'Mentés' : 'Helyszín hozzáadása'}</Button>
        </div>
      </Drawer>
    </AppShell>
  );
}
