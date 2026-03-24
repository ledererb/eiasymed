'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Phone, EnvelopeSimple, CalendarBlank, CurrencyCircleDollar,
  ClipboardText, Tooth, ArrowLeft, MapPin, Cake, CloudArrowUp,
} from '@phosphor-icons/react';
import { AppShell } from '@/components/AppShell';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Tabs } from '@/components/Tabs';
import { Button } from '@/components/Button';
import { StatusBadge } from '@/components/StatusBadge';
import { VisitStatusBadge } from '@/components/VisitStatusBadge/VisitStatusBadge';
import { createClient } from '@/lib/supabase-browser';
import { format, formatDistanceToNow } from 'date-fns';
import { hu } from 'date-fns/locale';
import styles from './page.module.css';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  address_country: string | null;
  address_city: string | null;
  created_at: string;
  is_active: boolean;
}

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  appointment_type: string;
  status: string;
  treatment_notes: string | null;
  doctor_name: string;
  treatment_name: string | null;
}

interface Invoice {
  id: string;
  invoice_number: string;
  issued_at: string;
  gross_amount: number;
  payment_status: string;
  currency: string;
}

interface TreatmentPlan {
  id: string;
  title: string;
  status: string;
  total_cost: number;
  created_at: string;
}

const FLAG_MAP: Record<string, string> = {
  HU: '🇭🇺', DE: '🇩🇪', AT: '🇦🇹', GB: '🇬🇧', US: '🇺🇸',
  IE: '🇮🇪', IS: '🇮🇸', CH: '🇨🇭', FR: '🇫🇷', IT: '🇮🇹',
};

function formatHUF(amount: number) {
  return new Intl.NumberFormat('hu-HU', { style: 'decimal' }).format(amount) + ' Ft';
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [eesztSyncing, setEesztSyncing] = useState(false);
  const [eesztStatus, setEesztStatus] = useState<string | null>(null);

  const fetchPatient = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('Patient fetch error:', error);
      setLoading(false);
      return;
    }
    setPatient(data as Patient);
    setLoading(false);
  }, [id]);

  const fetchAppointments = useCallback(async () => {
    const { data } = await supabase
      .from('appointments')
      .select(`
        id, start_time, end_time, appointment_type, status, treatment_notes,
        staff!appointments_doctor_id_fkey(first_name, last_name),
        treatment_types(name)
      `)
      .eq('patient_id', id)
      .order('start_time', { ascending: false })
      .limit(50);

    if (data) {
      setAppointments(data.map((a: any) => ({
        id: a.id,
        start_time: a.start_time,
        end_time: a.end_time,
        appointment_type: a.appointment_type,
        status: a.status,
        treatment_notes: a.treatment_notes,
        doctor_name: a.staff ? `Dr. ${a.staff.last_name} ${a.staff.first_name}` : '—',
        treatment_name: a.treatment_types?.name || null,
      })));
    }
  }, [id]);

  const fetchInvoices = useCallback(async () => {
    const { data } = await supabase
      .from('invoices')
      .select('id, invoice_number, issued_at, gross_amount, payment_status, currency')
      .eq('patient_id', id)
      .order('issued_at', { ascending: false })
      .limit(50);

    setInvoices((data as Invoice[]) || []);
  }, [id]);

  const fetchTreatmentPlans = useCallback(async () => {
    const { data } = await supabase
      .from('treatment_plans')
      .select('id, title, status, total_cost, created_at')
      .eq('patient_id', id)
      .order('created_at', { ascending: false });

    setTreatmentPlans((data as TreatmentPlan[]) || []);
  }, [id]);

  useEffect(() => { fetchPatient(); }, [fetchPatient]);
  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'appointments') fetchAppointments();
    if (activeTab === 'overview' || activeTab === 'invoices') fetchInvoices();
    if (activeTab === 'treatments') fetchTreatmentPlans();
  }, [activeTab, fetchAppointments, fetchInvoices, fetchTreatmentPlans]);

  if (loading) return <AppShell><div className={styles.loading}>Betöltés...</div></AppShell>;
  if (!patient) return <AppShell><div className={styles.emptyState}>Páciens nem található.</div></AppShell>;

  const initials = `${patient.last_name?.[0] || ''}${patient.first_name?.[0] || ''}`;
  const totalSpent = invoices.reduce((s, i) => s + (i.gross_amount || 0), 0);
  const nextAppt = appointments.find(a => new Date(a.start_time) > new Date());
  const lastAppt = appointments.find(a => new Date(a.start_time) <= new Date());

  return (
    <AppShell>
      <Breadcrumbs items={[
        { label: 'Nyilvántartás', href: '/paciensek' },
        { label: 'Páciensek', href: '/paciensek' },
        { label: `${patient.last_name} ${patient.first_name}` },
      ]} />

      {/* ── Patient Header ── */}
      <div className={styles.pageHeader}>
        <button
          onClick={() => router.push('/paciensek')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
        >
          <ArrowLeft size={20} color="#5f7d95" />
        </button>
        <div className={styles.avatar}>{initials}</div>
        <div className={styles.headerInfo}>
          <h1 className={styles.patientName}>
            {FLAG_MAP[patient.address_country || 'HU'] || '🏳️'} {patient.last_name} {patient.first_name}
          </h1>
          <div className={styles.patientMeta}>
            {patient.phone && <span><Phone size={13} /> {patient.phone}</span>}
            {patient.email && <span><EnvelopeSimple size={13} /> {patient.email}</span>}
            {patient.birth_date && <span><Cake size={13} /> {format(new Date(patient.birth_date), 'yyyy.MM.dd')}</span>}
            {patient.address_city && <span><MapPin size={13} /> {patient.address_city}</span>}
          </div>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" onClick={() => router.push('/naptar')}>
            <CalendarBlank size={16} /> Új időpont
          </Button>
          <Button variant="primary" onClick={() => router.push('/paciensek/ajanlatok')}>
            <ClipboardText size={16} /> Kezelési terv
          </Button>
          <Button variant="outline" onClick={async () => {
            setEesztSyncing(true);
            setEesztStatus(null);
            try {
              const session = await supabase.auth.getSession();
              const token = session.data.session?.access_token;
              const resp = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/eeszt-torzslap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ patient_id: patient.id }),
              });
              const result = await resp.json();
              setEesztStatus(result.success ? `✅ ${result.message}` : `❌ ${result.error}`);
            } catch (err) { setEesztStatus('❌ EESZT szinkronizálás hiba'); }
            setEesztSyncing(false);
            setTimeout(() => setEesztStatus(null), 4000);
          }}>
            <CloudArrowUp size={16} /> {eesztSyncing ? 'Szinkronizálás...' : 'EESZT szinkron'}
          </Button>
        </div>
      </div>

      {eesztStatus && (
        <div style={{ padding: '8px 16px', borderRadius: 8, background: eesztStatus.includes('✅') ? '#dcfce7' : '#fee2e2', fontSize: 13, fontFamily: 'var(--font-family)', marginBottom: 12 }}>
          {eesztStatus}
        </div>
      )}

      {/* ── KPI Row ── */}
      <div className={styles.kpiRow}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Következő időpont</div>
          <div className={styles.kpiValue}>
            {nextAppt ? format(new Date(nextAppt.start_time), 'MMM d.', { locale: hu }) : '—'}
          </div>
          <div className={styles.kpiSub}>
            {nextAppt ? format(new Date(nextAppt.start_time), 'H:mm') : 'Nincs foglalás'}
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Utolsó vizit</div>
          <div className={styles.kpiValue}>
            {lastAppt ? formatDistanceToNow(new Date(lastAppt.start_time), { addSuffix: true, locale: hu }) : '—'}
          </div>
          <div className={styles.kpiSub}>{lastAppt?.treatment_name || 'Nincs előzmény'}</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Össz. kezelés</div>
          <div className={styles.kpiValue}>{appointments.length}</div>
          <div className={styles.kpiSub}>{treatmentPlans.length} kezelési terv</div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiLabel}>Egyenleg</div>
          <div className={styles.kpiValue}>{formatHUF(totalSpent)}</div>
          <div className={styles.kpiSub}>{invoices.length} számla</div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs
        items={[
          { id: 'overview', label: 'Áttekintés' },
          { id: 'appointments', label: 'Vizitek' },
          { id: 'invoices', label: 'Számlák' },
          { id: 'treatments', label: 'Kezelési tervek' },
        ]}
        activeId={activeTab}
        onSelect={setActiveTab}
      />

      {/* ── Tab: Overview ── */}
      {activeTab === 'overview' && (
        <div>
          <h3 style={{ fontFamily: 'var(--font-family)', fontSize: 16, fontWeight: 600, color: '#082432', marginBottom: 12 }}>
            Legutóbbi vizitek
          </h3>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Dátum</th>
                  <th>Típus</th>
                  <th>Kezelés</th>
                  <th>Orvos</th>
                  <th>Státusz</th>
                </tr>
              </thead>
              <tbody>
                {appointments.slice(0, 5).length === 0 ? (
                  <tr><td colSpan={5} className={styles.emptyState}>Nincs vizit előzmény.</td></tr>
                ) : appointments.slice(0, 5).map(a => (
                  <tr key={a.id}>
                    <td>{format(new Date(a.start_time), 'yyyy.MM.dd HH:mm')}</td>
                    <td>{a.appointment_type}</td>
                    <td>{a.treatment_name || '—'}</td>
                    <td>{a.doctor_name}</td>
                    <td><VisitStatusBadge status={a.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: Appointments ── */}
      {activeTab === 'appointments' && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Dátum</th>
                <th>Időpont</th>
                <th>Típus</th>
                <th>Kezelés</th>
                <th>Orvos</th>
                <th>Státusz</th>
                <th>Megjegyzés</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr><td colSpan={7} className={styles.emptyState}>Nincs vizit előzmény.</td></tr>
              ) : appointments.map(a => (
                <tr key={a.id}>
                  <td>{format(new Date(a.start_time), 'yyyy.MM.dd')}</td>
                  <td>{format(new Date(a.start_time), 'HH:mm')} – {format(new Date(a.end_time), 'HH:mm')}</td>
                  <td>{a.appointment_type}</td>
                  <td>
                    {a.treatment_name ? (
                      <span className={styles.treatmentPill} style={{ background: '#186d98', color: 'white' }}>
                        {a.treatment_name}
                      </span>
                    ) : '—'}
                  </td>
                  <td>{a.doctor_name}</td>
                  <td><VisitStatusBadge status={a.status} /></td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.treatment_notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab: Invoices ── */}
      {activeTab === 'invoices' && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Számla szám</th>
                <th>Dátum</th>
                <th>Összeg</th>
                <th>Státusz</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr><td colSpan={4} className={styles.emptyState}>Nincs számla.</td></tr>
              ) : invoices.map(inv => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 600 }}>{inv.invoice_number}</td>
                  <td>{format(new Date(inv.issued_at), 'yyyy.MM.dd')}</td>
                  <td>{formatHUF(inv.gross_amount)}</td>
                  <td>
                    <span className={`${styles.statusPill} ${
                      inv.payment_status === 'paid' ? styles.statusPaid :
                      inv.payment_status === 'overdue' ? styles.statusOverdue :
                      styles.statusUnpaid
                    }`}>
                      {inv.payment_status === 'paid' ? 'Fizetve' :
                       inv.payment_status === 'overdue' ? 'Késedelmes' : 'Fizetésre vár'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Tab: Treatment Plans ── */}
      {activeTab === 'treatments' && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Megnevezés</th>
                <th>Létrehozva</th>
                <th>Összeg</th>
                <th>Státusz</th>
              </tr>
            </thead>
            <tbody>
              {treatmentPlans.length === 0 ? (
                <tr><td colSpan={4} className={styles.emptyState}>Nincs kezelési terv.</td></tr>
              ) : treatmentPlans.map(tp => (
                <tr key={tp.id}>
                  <td style={{ fontWeight: 600 }}>{tp.title}</td>
                  <td>{format(new Date(tp.created_at), 'yyyy.MM.dd')}</td>
                  <td>{formatHUF(tp.total_cost)}</td>
                  <td>
                    <StatusBadge
                      status={tp.status === 'accepted' ? 'success' : tp.status === 'rejected' ? 'rejected' : 'waiting'}
                      label={tp.status === 'accepted' ? 'Elfogadva' : tp.status === 'rejected' ? 'Elutasítva' : 'Függőben'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
