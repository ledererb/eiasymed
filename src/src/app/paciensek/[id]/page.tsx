'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  User, Phone, EnvelopeSimple, CalendarBlank, MapPin, Tooth,
  FileText, Clock, PencilSimple, ArrowLeft, Star, FloppyDisk, X,
  Plus, CaretRight,
} from '@phosphor-icons/react';
import { AppShell } from '@/components/AppShell';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Tabs } from '@/components/Tabs';
import { Button } from '@/components/Button';
import { InputField } from '@/components/InputField';
import { Dropdown } from '@/components/Dropdown';
import { StatusBadge } from '@/components/StatusBadge';
import { createClient } from '@/lib/supabase-browser';
import { format, differenceInYears } from 'date-fns';
import { hu } from 'date-fns/locale';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';

interface PatientDetail {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  taj_number: string | null;
  tax_id: string | null;
  phone: string | null;
  phone_secondary: string | null;
  email: string | null;
  address_city: string | null;
  address_zip: string | null;
  address_street: string | null;
  status: string;
  is_vip: boolean;
  blood_type: string | null;
  allergies: string | null;
  notes: string | null;
  created_at: string;
}

interface Treatment {
  id: string;
  treatment_date: string;
  type_name: string;
  tooth_number: string | null;
  status: string;
  total_cost: number;
  notes: string | null;
  doctor_name: string;
}

interface Appointment {
  id: string;
  start_time: string;
  end_time: string;
  appointment_type: string;
  status: string;
  doctor_name: string;
}

const GENDER_OPTIONS = [
  { id: 'male', label: 'Férfi' },
  { id: 'female', label: 'Nő' },
  { id: 'other', label: 'Egyéb' },
];

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;
  const supabase = createClient();

  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('adatok');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<PatientDetail>>({});

  // Fetch patient data
  useEffect(() => {
    async function fetchPatient() {
      setLoading(true);

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error || !data) {
        console.error('Patient not found:', error);
        setLoading(false);
        return;
      }

      setPatient(data);
      setEditData(data);
      setLoading(false);
    }

    fetchPatient();
  }, [patientId]);

  // Fetch treatments
  useEffect(() => {
    async function fetchTreatments() {
      const { data } = await supabase
        .from('treatments')
        .select(`
          id, treatment_date, tooth_number, status, total_cost, notes,
          treatment_type:treatment_types!treatments_treatment_type_id_fkey(name),
          doctor:staff!treatments_doctor_id_fkey(first_name, last_name)
        `)
        .eq('patient_id', patientId)
        .order('treatment_date', { ascending: false })
        .limit(50);

      if (data) {
        setTreatments(data.map((t: Record<string, unknown>) => {
          const tt = t.treatment_type as Record<string, string> | null;
          const doc = t.doctor as Record<string, string> | null;
          return {
            id: t.id as string,
            treatment_date: t.treatment_date as string,
            type_name: tt?.name || '',
            tooth_number: t.tooth_number as string | null,
            status: t.status as string,
            total_cost: t.total_cost as number,
            notes: t.notes as string | null,
            doctor_name: doc ? `Dr. ${doc.last_name} ${doc.first_name}` : '',
          };
        }));
      }
    }

    if (activeTab === 'kezelesek') fetchTreatments();
  }, [patientId, activeTab]);

  // Fetch appointments
  useEffect(() => {
    async function fetchAppointments() {
      const { data } = await supabase
        .from('appointments')
        .select(`
          id, start_time, end_time, appointment_type, status,
          doctor:staff!appointments_doctor_id_fkey(first_name, last_name)
        `)
        .eq('patient_id', patientId)
        .order('start_time', { ascending: false })
        .limit(20);

      if (data) {
        setAppointments(data.map((a: Record<string, unknown>) => {
          const doc = a.doctor as Record<string, string> | null;
          return {
            id: a.id as string,
            start_time: a.start_time as string,
            end_time: a.end_time as string,
            appointment_type: a.appointment_type as string,
            status: a.status as string,
            doctor_name: doc ? `Dr. ${doc.last_name} ${doc.first_name}` : '',
          };
        }));
      }
    }

    if (activeTab === 'idopontok') fetchAppointments();
  }, [patientId, activeTab]);

  // Save patient edits
  const handleSave = useCallback(async () => {
    if (!patient) return;
    setSaving(true);

    const { error } = await supabase
      .from('patients')
      .update({
        first_name: editData.first_name,
        last_name: editData.last_name,
        birth_date: editData.birth_date,
        gender: editData.gender,
        taj_number: editData.taj_number,
        tax_id: editData.tax_id,
        phone: editData.phone,
        phone_secondary: editData.phone_secondary,
        email: editData.email,
        address_city: editData.address_city,
        address_zip: editData.address_zip,
        address_street: editData.address_street,
        blood_type: editData.blood_type,
        allergies: editData.allergies,
        notes: editData.notes,
      })
      .eq('id', patient.id);

    if (!error) {
      setPatient({ ...patient, ...editData } as PatientDetail);
      setEditing(false);
    }
    setSaving(false);
  }, [patient, editData, supabase]);

  if (loading) {
    return (
      <AppShell>
        <div className={styles.loading}>Betöltés...</div>
      </AppShell>
    );
  }

  if (!patient) {
    return (
      <AppShell>
        <div className={styles.notFound}>
          <p>Páciens nem található.</p>
          <Button variant="outline" onClick={() => router.push('/paciensek')}>
            <ArrowLeft size={16} /> Vissza a listához
          </Button>
        </div>
      </AppShell>
    );
  }

  const age = differenceInYears(new Date(), new Date(patient.birth_date));

  return (
    <AppShell>
      <Breadcrumbs items={[
        { label: 'Nyilvántartás' },
        { label: 'Páciensek', href: '/paciensek' },
        { label: `${patient.last_name} ${patient.first_name}` },
      ]} />

      {/* Patient header */}
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.avatar}>
            <User size={32} color="white" weight="bold" />
          </div>
          <div>
            <h1 className={styles.name}>
              {patient.last_name} {patient.first_name}
              {patient.is_vip && <span className={styles.vipBadge}>VIP</span>}
            </h1>
            <div className={styles.metaRow}>
              <span>{age} éves ({patient.gender === 'male' ? 'férfi' : patient.gender === 'female' ? 'nő' : 'egyéb'})</span>
              {patient.taj_number && <span>TAJ: {patient.taj_number.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}</span>}
              {patient.phone && <span><Phone size={13} /> {patient.phone}</span>}
              {patient.email && <span><EnvelopeSimple size={13} /> {patient.email}</span>}
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          <StatusBadge status={patient.status === 'active' ? 'success' : 'inactive'} label={patient.status === 'active' ? 'Aktív' : 'Inaktív'} />
          {!editing ? (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <PencilSimple size={16} /> Szerkesztés
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => { setEditing(false); setEditData(patient); }}>
                <X size={16} /> Mégse
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                <FloppyDisk size={16} /> {saving ? 'Mentés...' : 'Mentés'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        items={[
          { id: 'adatok', label: 'Adatok' },
          { id: 'kezelesek', label: 'Kezelések' },
          { id: 'idopontok', label: 'Időpontok' },
          { id: 'fogstatus', label: 'Fogstátusz' },
          { id: 'dokumentumok', label: 'Dokumentumok' },
        ]}
        activeId={activeTab}
        onSelect={setActiveTab}
      />

      {/* Tab content */}
      {activeTab === 'adatok' && (
        <div className={styles.dataGrid}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}><User size={16} /> Személyes adatok</h3>
            <div className={styles.fieldGrid}>
              <InputField
                label="Vezetéknév"
                value={editData.last_name || ''}
                onChange={(e) => setEditData(d => ({ ...d, last_name: e.target.value }))}
                disabled={!editing}
              />
              <InputField
                label="Keresztnév"
                value={editData.first_name || ''}
                onChange={(e) => setEditData(d => ({ ...d, first_name: e.target.value }))}
                disabled={!editing}
              />
              <InputField
                label="Születési dátum"
                type="date"
                value={editData.birth_date || ''}
                onChange={(e) => setEditData(d => ({ ...d, birth_date: e.target.value }))}
                disabled={!editing}
              />
              {editing ? (
                <div>
                  <label className={styles.fieldLabel}>Nem</label>
                  <Dropdown
                    items={GENDER_OPTIONS}
                    value={editData.gender || ''}
                    onChange={(v) => setEditData(d => ({ ...d, gender: v as string }))}
                  />
                </div>
              ) : (
                <InputField
                  label="Nem"
                  value={editData.gender === 'male' ? 'Férfi' : editData.gender === 'female' ? 'Nő' : 'Egyéb'}
                  disabled
                />
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}><FileText size={16} /> Azonosítók</h3>
            <div className={styles.fieldGrid}>
              <InputField
                label="TAJ szám"
                value={editData.taj_number || ''}
                onChange={(e) => setEditData(d => ({ ...d, taj_number: e.target.value }))}
                disabled={!editing}
                placeholder="123456789"
              />
              <InputField
                label="Adószám"
                value={editData.tax_id || ''}
                onChange={(e) => setEditData(d => ({ ...d, tax_id: e.target.value }))}
                disabled={!editing}
              />
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}><Phone size={16} /> Elérhetőség</h3>
            <div className={styles.fieldGrid}>
              <InputField
                label="Telefonszám"
                value={editData.phone || ''}
                onChange={(e) => setEditData(d => ({ ...d, phone: e.target.value }))}
                disabled={!editing}
              />
              <InputField
                label="Másodlagos telefon"
                value={editData.phone_secondary || ''}
                onChange={(e) => setEditData(d => ({ ...d, phone_secondary: e.target.value }))}
                disabled={!editing}
              />
              <InputField
                label="Email"
                type="email"
                value={editData.email || ''}
                onChange={(e) => setEditData(d => ({ ...d, email: e.target.value }))}
                disabled={!editing}
              />
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}><MapPin size={16} /> Cím</h3>
            <div className={styles.fieldGrid}>
              <InputField
                label="Irányítószám"
                value={editData.address_zip || ''}
                onChange={(e) => setEditData(d => ({ ...d, address_zip: e.target.value }))}
                disabled={!editing}
              />
              <InputField
                label="Város"
                value={editData.address_city || ''}
                onChange={(e) => setEditData(d => ({ ...d, address_city: e.target.value }))}
                disabled={!editing}
              />
              <InputField
                label="Utca, házszám"
                value={editData.address_street || ''}
                onChange={(e) => setEditData(d => ({ ...d, address_street: e.target.value }))}
                disabled={!editing}
              />
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}><Tooth size={16} /> Egészségügyi adatok</h3>
            <div className={styles.fieldGrid}>
              <InputField
                label="Vércsoport"
                value={editData.blood_type || ''}
                onChange={(e) => setEditData(d => ({ ...d, blood_type: e.target.value }))}
                disabled={!editing}
              />
              <InputField
                label="Allergiák"
                value={editData.allergies || ''}
                onChange={(e) => setEditData(d => ({ ...d, allergies: e.target.value }))}
                disabled={!editing}
              />
            </div>
            <div className={styles.notesField}>
              <label className={styles.fieldLabel}>Megjegyzések</label>
              <textarea
                className={styles.textarea}
                value={editData.notes || ''}
                onChange={(e) => setEditData(d => ({ ...d, notes: e.target.value }))}
                disabled={!editing}
                rows={3}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'kezelesek' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Dátum</th>
                <th>Kezelés típus</th>
                <th>Fog</th>
                <th>Orvos</th>
                <th>Státusz</th>
                <th>Összeg</th>
              </tr>
            </thead>
            <tbody>
              {treatments.length === 0 ? (
                <tr><td colSpan={6} className={styles.emptyCell}>Még nincsenek kezelések.</td></tr>
              ) : treatments.map(t => (
                <tr key={t.id} className={styles.tableRow}>
                  <td>{format(new Date(t.treatment_date), 'yyyy. MM. dd.', { locale: hu })}</td>
                  <td className={styles.treatmentType}>{t.type_name}</td>
                  <td>{t.tooth_number || '—'}</td>
                  <td>{t.doctor_name}</td>
                  <td><StatusBadge status={t.status === 'completed' ? 'completed' : 'waiting'} label={t.status === 'completed' ? 'Kész' : 'Folyamatban'} /></td>
                  <td className={styles.amountCell}>{new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(t.total_cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'idopontok' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Dátum</th>
                <th>Időpont</th>
                <th>Típus</th>
                <th>Orvos</th>
                <th>Státusz</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 ? (
                <tr><td colSpan={5} className={styles.emptyCell}>Még nincsenek időpontok.</td></tr>
              ) : appointments.map(a => (
                <tr key={a.id} className={styles.tableRow}>
                  <td>{format(new Date(a.start_time), 'yyyy. MM. dd.', { locale: hu })}</td>
                  <td>
                    {format(new Date(a.start_time), 'HH:mm')} – {format(new Date(a.end_time), 'HH:mm')}
                  </td>
                  <td>{a.appointment_type}</td>
                  <td>{a.doctor_name}</td>
                  <td><StatusBadge status={a.status === 'completed' ? 'completed' : a.status === 'cancelled' ? 'rejected' : 'waiting'} label={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'fogstatus' && (
        <div className={styles.placeholderTab}>
          <Tooth size={48} color="var(--color-neutral-300)" />
          <p>Az interaktív fogstátusz hamarosan elérhető lesz.</p>
          <p className={styles.placeholderHint}>A /dental-chart oldalon már megtekinthető a Zsigmondy-kereszt vizualizáció.</p>
        </div>
      )}

      {activeTab === 'dokumentumok' && (
        <div className={styles.placeholderTab}>
          <FileText size={48} color="var(--color-neutral-300)" />
          <p>Dokumentum kezelés hamarosan elérhető.</p>
          <Button variant="outline">
            <Plus size={16} /> Dokumentum feltöltése
          </Button>
        </div>
      )}
    </AppShell>
  );
}
