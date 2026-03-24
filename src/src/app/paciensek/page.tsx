'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlass, FunnelSimple, SortAscending, Columns,
  DotsThree, CaretDoubleLeft, CaretDoubleRight,
  CurrencyCircleDollar, Clock, CalendarBlank,
  Plus, User, Tag, ShieldCheck
} from '@phosphor-icons/react';
import { AppShell } from '@/components/AppShell';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Drawer } from '@/components/Drawer';
import { Button } from '@/components/Button';
import { VisitStatusBadge } from '@/components/VisitStatusBadge/VisitStatusBadge';
import { createClient } from '@/lib/supabase-browser';
import { format, differenceInMinutes, isToday, isBefore, addMinutes } from 'date-fns';
import { hu } from 'date-fns/locale';
import styles from './page.module.css';

/* ────── Types ────── */
interface AppointmentRow {
  id: string;
  patient_id: string;
  start_time: string;
  end_time: string;
  appointment_type: string;
  status: string;
  treatment_notes: string | null;
  // joined
  patient_first_name: string;
  patient_last_name: string;
  patient_country: string;
  doctor_first_name: string;
  doctor_last_name: string;
  chair_name: string | null;
  treatment_name: string | null;
  treatment_category: string | null;
  invoice_total: number | null;
}

/* ────── Treatment pill color map ────── */
const TREATMENT_COLORS: Record<string, { bg: string; text: string }> = {
  diagnostic:    { bg: '#186d98', text: 'white' },
  preventive:    { bg: '#e696ff', text: '#082432' },
  restorative:   { bg: '#082432', text: 'white' },
  endodontic:    { bg: '#a2005b', text: 'white' },
  surgical:      { bg: '#dc2626', text: 'white' },
  prosthodontic: { bg: '#082432', text: 'white' },
  implant:       { bg: '#082432', text: 'white' },
  cosmetic:      { bg: '#e696ff', text: '#082432' },
};

/* ────── Country flag emoji map ────── */
const FLAG_MAP: Record<string, string> = {
  HU: '🇭🇺', DE: '🇩🇪', AT: '🇦🇹', GB: '🇬🇧', US: '🇺🇸',
  IE: '🇮🇪', IS: '🇮🇸', CH: '🇨🇭', FR: '🇫🇷', IT: '🇮🇹',
};

/* ────── Format currency ────── */
function formatHUF(amount: number | null): string {
  if (amount == null || amount === 0) return '0 HUF';
  return new Intl.NumberFormat('hu-HU', { style: 'decimal' }).format(amount) + ' HUF';
}

/* ────── Relative time helper ────── */
function getRelativeTime(startTime: string): string | undefined {
  const now = new Date();
  const start = new Date(startTime);
  const diffMin = differenceInMinutes(start, now);
  if (diffMin > 0 && diffMin <= 60) {
    return `${diffMin} perc múlva`;
  }
  return undefined;
}

export default function PaciensekPage() {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statsOpen, setStatsOpen] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newPatientOpen, setNewPatientOpen] = useState(false);
  const [newPatientType, setNewPatientType] = useState<'lead' | 'patient'>('lead');
  const [newPatientForm, setNewPatientForm] = useState({
    lastName: '', firstName: '', phone: '', email: '',
    birthYear: '', birthMonth: '', birthDay: '',
    language: 'magyar', currency: 'HUF',
    treatmentTag: '', campaignTag: '', partnerTag: '', discountTag: '',
    smsNotify: false, emailNotify: false,
  });
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  /* ── Fetch appointments with all joins ── */
  const fetchAppointments = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id, patient_id, start_time, end_time, appointment_type, status, treatment_notes,
        patients!inner ( first_name, last_name, address_country ),
        staff!appointments_doctor_id_fkey ( first_name, last_name ),
        chairs ( name ),
        treatment_types ( name, category )
      `)
      .order('start_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      setLoading(false);
      return;
    }

    // Also fetch invoice totals per appointment
    const { data: invoiceData } = await supabase
      .from('invoices')
      .select('appointment_id, gross_amount')
      .not('appointment_id', 'is', null);

    const invoiceMap = new Map<string, number>();
    (invoiceData || []).forEach((inv: any) => {
      if (inv.appointment_id) {
        invoiceMap.set(inv.appointment_id, (invoiceMap.get(inv.appointment_id) || 0) + Number(inv.gross_amount || 0));
      }
    });

    const rows: AppointmentRow[] = (data || []).map((a: any) => ({
      id: a.id,
      patient_id: a.patient_id,
      start_time: a.start_time,
      end_time: a.end_time,
      appointment_type: a.appointment_type,
      status: a.status,
      treatment_notes: a.treatment_notes,
      patient_first_name: a.patients?.first_name || '',
      patient_last_name: a.patients?.last_name || '',
      patient_country: a.patients?.address_country || 'HU',
      doctor_first_name: a.staff?.first_name || '',
      doctor_last_name: a.staff?.last_name || '',
      chair_name: a.chairs?.name || null,
      treatment_name: a.treatment_types?.name || null,
      treatment_category: a.treatment_types?.category || null,
      invoice_total: invoiceMap.get(a.id) || null,
    }));

    setAppointments(rows);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAppointments(); }, [fetchAppointments]);

  /* ── Filter by search ── */
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return appointments;
    const q = searchQuery.toLowerCase();
    return appointments.filter(a =>
      `${a.patient_last_name} ${a.patient_first_name}`.toLowerCase().includes(q) ||
      `${a.doctor_last_name} ${a.doctor_first_name}`.toLowerCase().includes(q) ||
      (a.treatment_name || '').toLowerCase().includes(q)
    );
  }, [appointments, searchQuery]);

  /* ── Stats (today only) ── */
  const stats = useMemo(() => {
    const today = appointments.filter(a => isToday(new Date(a.start_time)));
    const completed = today.filter(a => a.status === 'completed').length;
    const noShows = today.filter(a => a.status === 'no_show').length;
    // Simple avg wait: ~15 min placeholder (would need check-in timestamps for real)
    const avgWait = today.length > 0 ? 15 : 0;
    return {
      total: today.length,
      completed,
      noShows,
      avgWait,
    };
  }, [appointments]);

  /* ── Selected appointment for drawer ── */
  const selected = useMemo(() => {
    if (!selectedId) return null;
    return appointments.find(a => a.id === selectedId) || null;
  }, [selectedId, appointments]);

  /* ── Update appointment status ── */
  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: newStatus })
      .eq('id', id);
    if (!error) {
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status: newStatus } : a)
      );
    }
  };

  const now = new Date();

  /* ── Save new patient ── */
  const handleSaveNewPatient = async (goToCalendar: boolean) => {
    if (!newPatientForm.lastName || !newPatientForm.firstName) return;
    setSaving(true);
    const dob = newPatientForm.birthYear && newPatientForm.birthMonth && newPatientForm.birthDay
      ? `${newPatientForm.birthYear}-${newPatientForm.birthMonth.padStart(2, '0')}-${newPatientForm.birthDay.padStart(2, '0')}`
      : null;
    const { error } = await supabase.from('patients').insert({
      first_name: newPatientForm.firstName,
      last_name: newPatientForm.lastName,
      phone: newPatientForm.phone || null,
      email: newPatientForm.email || null,
      birth_date: dob,
      address_country: 'HU',
      status: newPatientType === 'lead' ? 'lead' : 'active',
    });
    setSaving(false);
    if (!error) {
      setNewPatientOpen(false);
      setNewPatientForm({ lastName: '', firstName: '', phone: '', email: '', birthYear: '', birthMonth: '', birthDay: '', language: 'magyar', currency: 'HUF', treatmentTag: '', campaignTag: '', partnerTag: '', discountTag: '', smsNotify: false, emailNotify: false });
      if (goToCalendar) router.push('/naptar');
      else fetchAppointments();
    }
  };

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: 'Nyilvántartás' }, { label: 'Páciensek' }]} />

      {/* ── FAB + button ── */}
      <button className={styles.fab} onClick={() => setNewPatientOpen(true)} title="Új páciens felvétele">
        <Plus size={28} weight="bold" />
      </button>

      {/* ── Info Panel (stat cards) ── */}
      <div className={styles.infoPanel}>
        {statsOpen && (
          <>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Időpontok száma ma:</span>
              <span className={styles.statValue}>{stats.total}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Befejezett vizitek száma ma:</span>
              <span className={styles.statValue}>{stats.completed}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>No-show száma ma:</span>
              <span className={styles.statValue}>{stats.noShows}</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Átlagos várakozási idő ma:</span>
              <span className={styles.statValueSmall}>{stats.avgWait} perc</span>
            </div>
          </>
        )}
        <div className={styles.dateCard}>
          <span className={styles.dateLabel}>
            {format(now, "MMMM d. (EEE), yyyy", { locale: hu })}
          </span>
          <span className={styles.dateValue}>
            {format(now, 'HH:mm')}
          </span>
        </div>
        <button
          className={styles.collapseBtn}
          onClick={() => setStatsOpen(s => !s)}
          title={statsOpen ? 'Összezárás' : 'Kinyitás'}
        >
          {statsOpen ? <CaretDoubleLeft size={20} /> : <CaretDoubleRight size={20} />}
        </button>
      </div>

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        {searchOpen ? (
          <div className={styles.searchExpanded}>
            <MagnifyingGlass size={18} color="#186d98" />
            <input
              autoFocus
              placeholder="Keresés páciens, orvos vagy kezelés alapján..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
            />
          </div>
        ) : (
          <button className={styles.toolbarBtn} onClick={() => setSearchOpen(true)} title="Keresés">
            <MagnifyingGlass size={20} />
          </button>
        )}
        <button className={styles.toolbarBtn} title="Szűrés">
          <FunnelSimple size={20} />
        </button>
        <button className={styles.toolbarBtn} title="Rendezés">
          <SortAscending size={20} />
        </button>
        <button className={styles.toolbarBtn} title="Oszlopok">
          <Columns size={20} />
        </button>
        <span
          className={styles.toolbarLabel}
          onClick={() => setStatsOpen(s => !s)}
        >
          Statisztikák
        </span>
      </div>

      {/* ── Table ── */}
      <div className={styles.tableWrap}>
        {/* Header */}
        <div className={styles.tableHeader}>
          <div className={`${styles.th} ${styles.colN}`}>N</div>
          <div className={`${styles.thLeft} ${styles.colPatient}`}>Páciens</div>
          <div className={`${styles.th} ${styles.colStatus}`}>Vizit státusz</div>
          <div className={`${styles.thLeft} ${styles.colTime}`}>Időpont</div>
          <div className={`${styles.thLeft} ${styles.colDuration}`}>Időtartam / rendelő</div>
          <div className={`${styles.thLeft} ${styles.colDoctor}`}>Kezelést végzi</div>
          <div className={`${styles.th} ${styles.colLabels}`}>Címkék</div>
          <div className={`${styles.th} ${styles.colFee}`}>Vizit díja</div>
          <div className={`${styles.th} ${styles.colActions}`}>...</div>
        </div>

        {/* Body */}
        <div className={styles.tableBody}>
          {loading ? (
            <div className={styles.loadingState}>Betöltés...</div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              {searchQuery ? 'Nincs találat a keresésre.' : 'Nincsenek időpontok.'}
            </div>
          ) : (
            filtered.map((a) => {
              const startDate = new Date(a.start_time);
              const endDate = new Date(a.end_time);
              const durationMin = differenceInMinutes(endDate, startDate);
              const relativeTime = a.status === 'scheduled' ? getRelativeTime(a.start_time) : undefined;
              const treatmentColor = a.treatment_category
                ? TREATMENT_COLORS[a.treatment_category] || { bg: '#186d98', text: 'white' }
                : { bg: '#186d98', text: 'white' };
              const isSelected = selectedId === a.id;
              const chairNum = a.chair_name?.replace(/[^\d]/g, '') || '?';

              return (
                <div
                  key={a.id}
                  className={`${styles.tableRow} ${isSelected ? styles.selected : ''}`}
                  onClick={() => setSelectedId(isSelected ? null : a.id)}
                >
                  {/* N — flag */}
                  <div className={styles.flagCell}>
                    <span className={styles.flagIcon}>
                      {FLAG_MAP[a.patient_country] || '🏳️'}
                    </span>
                  </div>

                  {/* Páciens */}
                  <div className={styles.patientCell}>
                    <span className={styles.patientName}>
                      {a.patient_last_name} {a.patient_first_name}
                    </span>
                    <span className={styles.patientId}>
                      ID: {a.patient_id.slice(-9).replace(/-/g, '')}
                    </span>
                  </div>

                  {/* Vizit státusz */}
                  <div className={`${styles.cellCenter} ${styles.colStatus}`}>
                    <VisitStatusBadge status={a.status} relativeTime={relativeTime} />
                  </div>

                  {/* Időpont */}
                  <div className={styles.timeCell}>
                    <span className={styles.timeValue}>
                      {format(startDate, 'H:mm')}
                    </span>
                    <span className={styles.timeDate}>
                      {format(startDate, "MMMM d., yyyy", { locale: hu })}
                    </span>
                  </div>

                  {/* Időtartam / rendelő */}
                  <div className={styles.durationCell}>
                    <span className={styles.durationText}>{durationMin} perc</span>
                    <span className={styles.durationText}>{chairNum}-{chairNum === '1' ? 'es' : chairNum === '2' ? 'es' : chairNum === '3' ? 'as' : 'es'} rendelő</span>
                  </div>

                  {/* Kezelést végzi */}
                  <div className={styles.doctorCell}>
                    {a.treatment_name && (
                      <span
                        className={styles.treatmentPill}
                        style={{ background: treatmentColor.bg, color: treatmentColor.text }}
                      >
                        {a.treatment_name}
                      </span>
                    )}
                    <span className={styles.doctorName}>
                      Dr. {a.doctor_last_name} {a.doctor_first_name}
                    </span>
                  </div>

                  {/* Címkék */}
                  <div className={styles.labelsCell}>
                    <span className={styles.labelText}>
                      {a.appointment_type === 'consultation' ? 'Új páciens' : '—'}
                    </span>
                  </div>

                  {/* Vizit díja */}
                  <div className={styles.feeCell}>
                    {formatHUF(a.invoice_total)}
                  </div>

                  {/* Actions */}
                  <div className={styles.actionsCell}>
                    <button
                      className={styles.actionsBtn}
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      <DotsThree size={20} weight="bold" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Quickview Drawer ── */}
      <Drawer
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title="Vizit részletei"
        width="wide"
      >
        {selected && (
          <div className={styles.drawerContent}>
            {/* Patient header */}
            <div className={styles.drawerPatientHeader}>
              <span className={styles.drawerPatientName}>
                {selected.patient_last_name} {selected.patient_first_name}
              </span>
              <span className={styles.drawerPatientId}>
                ID: {selected.patient_id.slice(-9).replace(/-/g, '')}
              </span>
            </div>

            {/* Visit status */}
            <div className={styles.drawerSection}>
              <span className={styles.drawerSectionTitle}>Vizit státusz</span>
              <div className={styles.statusActions}>
                {(['arrived', 'in_progress', 'completed', 'no_show'] as const).map(s => (
                  <button
                    key={s}
                    className={`${styles.statusActionBtn} ${selected.status === s ? styles.activeStatus : ''}`}
                    onClick={() => updateStatus(selected.id, s)}
                  >
                    <VisitStatusBadge status={s} />
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.divider} />

            {/* Time details */}
            <div className={styles.drawerSection}>
              <span className={styles.drawerSectionTitle}>Időpont</span>
              <div className={styles.drawerRow}>
                <span className={styles.drawerLabel}>Kezdés</span>
                <span className={styles.drawerValue}>
                  {format(new Date(selected.start_time), 'HH:mm — yyyy. MMM. d.', { locale: hu })}
                </span>
              </div>
              <div className={styles.drawerRow}>
                <span className={styles.drawerLabel}>Időtartam</span>
                <span className={styles.drawerValue}>
                  {differenceInMinutes(new Date(selected.end_time), new Date(selected.start_time))} perc
                </span>
              </div>
              <div className={styles.drawerRow}>
                <span className={styles.drawerLabel}>Rendelő</span>
                <span className={styles.drawerValue}>{selected.chair_name || '—'}</span>
              </div>
            </div>

            <div className={styles.divider} />

            {/* Treatment */}
            <div className={styles.drawerSection}>
              <span className={styles.drawerSectionTitle}>Kezelés</span>
              <div className={styles.drawerRow}>
                <span className={styles.drawerLabel}>Típus</span>
                <span className={styles.drawerValue}>{selected.treatment_name || '—'}</span>
              </div>
              <div className={styles.drawerRow}>
                <span className={styles.drawerLabel}>Orvos</span>
                <span className={styles.drawerValue}>
                  Dr. {selected.doctor_last_name} {selected.doctor_first_name}
                </span>
              </div>
              {selected.treatment_notes && (
                <div className={styles.drawerRow}>
                  <span className={styles.drawerLabel}>Megjegyzés</span>
                  <span className={styles.drawerValue}>{selected.treatment_notes}</span>
                </div>
              )}
            </div>

            <div className={styles.divider} />

            {/* Fee */}
            <div className={styles.drawerSection}>
              <span className={styles.drawerSectionTitle}>Díj</span>
              <div className={styles.drawerRow}>
                <span className={styles.drawerLabel}>Vizit díja</span>
                <span className={styles.drawerValue}>
                  {formatHUF(selected.invoice_total)}
                </span>
              </div>
            </div>

            {/* Payment CTA */}
            <button
              className={styles.paymentCta}
              onClick={() => router.push('/penzugy')}
            >
              <CurrencyCircleDollar size={18} weight="bold" />
              Ugrás a fizetéshez
            </button>
          </div>
        )}
      </Drawer>

      {/* ── New Patient Drawer ── */}
      <Drawer
        open={newPatientOpen}
        onClose={() => setNewPatientOpen(false)}
        title="Új páciens felvétele"
        width="wide"
      >
        <div className={styles.newPatientForm}>
          {/* Status selector */}
          <div className={styles.formStatusRow}>
            <button
              className={`${styles.formStatusBtn} ${newPatientType === 'lead' ? styles.activeFormStatus : ''}`}
              onClick={() => setNewPatientType('lead')}
            >
              ÚJ ÉRDEKLŐDŐ
            </button>
            <span className={styles.formStatusLabel}>Új páciens</span>
          </div>

          {/* Páciens Adatok */}
          <div className={styles.formSection}>
            <span className={styles.formSectionTitle}>
              <User size={16} /> PÁCIENS ADATOK
            </span>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <span className={styles.formFieldLabel}>Vezetéknév</span>
                <input
                  className={styles.formInput}
                  placeholder="Példa"
                  value={newPatientForm.lastName}
                  onChange={e => setNewPatientForm(f => ({ ...f, lastName: e.target.value }))}
                />
              </div>
              <div className={styles.formField}>
                <span className={styles.formFieldLabel}>Keresztnév</span>
                <input
                  className={styles.formInput}
                  placeholder="István"
                  value={newPatientForm.firstName}
                  onChange={e => setNewPatientForm(f => ({ ...f, firstName: e.target.value }))}
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <span className={styles.formFieldLabel}>Telefon</span>
                <input
                  className={styles.formInput}
                  placeholder="(+36) 30 123 4567"
                  value={newPatientForm.phone}
                  onChange={e => setNewPatientForm(f => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div className={styles.formField}>
                <span className={styles.formFieldLabel}>E-mail</span>
                <input
                  className={styles.formInput}
                  type="email"
                  placeholder="pelda@pelda.com"
                  value={newPatientForm.email}
                  onChange={e => setNewPatientForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
            </div>
            <div className={styles.formRow}>
              <span className={styles.formFieldLabel} style={{ width: '100%' }}>Születési dátum</span>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <select className={styles.formSelect} value={newPatientForm.birthYear} onChange={e => setNewPatientForm(f => ({ ...f, birthYear: e.target.value }))}>
                  <option value="">év</option>
                  {Array.from({ length: 80 }, (_, i) => 2026 - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formField}>
                <select className={styles.formSelect} value={newPatientForm.birthMonth} onChange={e => setNewPatientForm(f => ({ ...f, birthMonth: e.target.value }))}>
                  <option value="">hónap</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formField}>
                <select className={styles.formSelect} value={newPatientForm.birthDay} onChange={e => setNewPatientForm(f => ({ ...f, birthDay: e.target.value }))}>
                  <option value="">nap</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <select className={styles.formSelect} value={newPatientForm.language} onChange={e => setNewPatientForm(f => ({ ...f, language: e.target.value }))}>
                  <option value="magyar">magyar</option>
                  <option value="english">english</option>
                  <option value="deutsch">deutsch</option>
                </select>
              </div>
              <div className={styles.formField}>
                <select className={styles.formSelect} value={newPatientForm.currency} onChange={e => setNewPatientForm(f => ({ ...f, currency: e.target.value }))}>
                  <option value="HUF">HUF</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
          </div>

          {/* Címkék, jelölők */}
          <div className={styles.formSection}>
            <span className={styles.formSectionTitle}>
              <Tag size={16} /> CÍMKÉK, JELÖLŐK
            </span>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <select className={styles.formSelect} value={newPatientForm.treatmentTag} onChange={e => setNewPatientForm(f => ({ ...f, treatmentTag: e.target.value }))}>
                  <option value="">Igényelt kezelés</option>
                  <option value="implant">Implantátum</option>
                  <option value="cosmetic">Esztétika</option>
                  <option value="preventive">Prevenció</option>
                </select>
              </div>
              <div className={styles.formField}>
                <select className={styles.formSelect} value={newPatientForm.campaignTag} onChange={e => setNewPatientForm(f => ({ ...f, campaignTag: e.target.value }))}>
                  <option value="">Kampány</option>
                  <option value="facebook">Facebook</option>
                  <option value="google">Google Ads</option>
                  <option value="referral">Ajánlás</option>
                </select>
              </div>
            </div>
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <select className={styles.formSelect} value={newPatientForm.partnerTag} onChange={e => setNewPatientForm(f => ({ ...f, partnerTag: e.target.value }))}>
                  <option value="">Partner</option>
                </select>
              </div>
              <div className={styles.formField}>
                <select className={styles.formSelect} value={newPatientForm.discountTag} onChange={e => setNewPatientForm(f => ({ ...f, discountTag: e.target.value }))}>
                  <option value="">Egyéb kedvezmény</option>
                </select>
              </div>
            </div>
          </div>

          {/* Adatkezelés */}
          <div className={styles.formSection}>
            <span className={styles.formSectionTitle}>
              <ShieldCheck size={16} /> ADATKEZELÉS
            </span>
            <div className={styles.formCheckboxRow}>
              <label className={styles.formCheckbox}>
                <input type="checkbox" checked={newPatientForm.smsNotify} onChange={e => setNewPatientForm(f => ({ ...f, smsNotify: e.target.checked }))} />
                SMS értesítés
              </label>
              <label className={styles.formCheckbox}>
                <input type="checkbox" checked={newPatientForm.emailNotify} onChange={e => setNewPatientForm(f => ({ ...f, emailNotify: e.target.checked }))} />
                E-mail értesítés
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.formActions}>
            <button className={styles.btnSave} onClick={() => handleSaveNewPatient(false)} disabled={saving}>
              {saving ? 'Mentés...' : 'Mentés'}
            </button>
            <button className={styles.btnSaveCalendar} onClick={() => handleSaveNewPatient(true)} disabled={saving}>
              Mentés és ugrás naptárra
            </button>
          </div>
        </div>
      </Drawer>
    </AppShell>
  );
}
