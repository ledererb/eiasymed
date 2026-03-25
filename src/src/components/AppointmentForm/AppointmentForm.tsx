'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlass, CalendarBlank, Clock } from '@phosphor-icons/react';
import { InputField } from '@/components/InputField';
import { Dropdown } from '@/components/Dropdown';
import { Button } from '@/components/Button';
import { createClient } from '@/lib/supabase-browser';
import { format } from 'date-fns';
import styles from './AppointmentForm.module.css';

export interface AppointmentFormData {
  patient_id: string;
  doctor_id: string;
  assistant_id: string;
  chair_id: string;
  date: string;
  start_time: string;
  end_time: string;
  appointment_type: string;
  treatment_notes: string;
}

interface AppointmentFormProps {
  /** Pre-fill data for editing */
  initialData?: Partial<AppointmentFormData> & { id?: string };
  /** Pre-set date from clicking an empty slot */
  defaultDate?: string;
  defaultTime?: string;
  onSave: (data: AppointmentFormData, id?: string) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

const APPOINTMENT_TYPES = [
  { id: 'consultation', label: 'Konzultáció' },
  { id: 'treatment', label: 'Kezelés' },
  { id: 'followup', label: 'Kontroll' },
  { id: 'hygiene', label: 'Higiénia' },
  { id: 'surgery', label: 'Sebészet' },
  { id: 'implant', label: 'Implantáció' },
  { id: 'prosthetics', label: 'Protetika' },
  { id: 'emergency', label: 'Sürgős' },
];

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  initialData,
  defaultDate,
  defaultTime,
  onSave,
  onCancel,
  saving = false,
}) => {
  const supabase = createClient();

  // Form state
  const [patientSearch, setPatientSearch] = useState('');
  const [patientId, setPatientId] = useState(initialData?.patient_id || '');
  const [doctorId, setDoctorId] = useState(initialData?.doctor_id || '');
  const [assistantId, setAssistantId] = useState(initialData?.assistant_id || '');
  const [chairId, setChairId] = useState(initialData?.chair_id || '');
  const [date, setDate] = useState(initialData?.date || defaultDate || format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState(initialData?.start_time || defaultTime || '09:00');
  const [endTime, setEndTime] = useState(initialData?.end_time || '10:00');
  const [appointmentType, setAppointmentType] = useState(initialData?.appointment_type || 'consultation');
  const [notes, setNotes] = useState(initialData?.treatment_notes || '');
  const [bookingError, setBookingError] = useState('');

  // Lookup data
  const [patients, setPatients] = useState<{ id: string; label: string }[]>([]);
  const [doctors, setDoctors] = useState<{ id: string; label: string }[]>([]);
  const [assistants, setAssistants] = useState<{ id: string; label: string }[]>([]);
  const [chairs, setChairs] = useState<{ id: string; label: string }[]>([]);

  // Fetch doctors and chairs
  useEffect(() => {
    async function fetchLookups() {
      const [doctorsRes, assistantsRes, chairsRes] = await Promise.all([
        supabase.from('staff').select('id, first_name, last_name').eq('role', 'doctor').eq('is_active', true).order('last_name'),
        supabase.from('staff').select('id, first_name, last_name').in('role', ['assistant', 'hygienist']).eq('is_active', true).order('last_name'),
        supabase.from('chairs').select('id, name').order('display_order'),
      ]);

      if (doctorsRes.data) {
        setDoctors(doctorsRes.data.map(d => ({ id: d.id, label: `Dr. ${d.last_name} ${d.first_name}` })));
      }
      if (assistantsRes.data) {
        setAssistants(assistantsRes.data.map(a => ({ id: a.id, label: `${a.last_name} ${a.first_name}` })));
      }
      if (chairsRes.data) {
        setChairs(chairsRes.data.map(c => ({ id: c.id, label: c.name })));
      }
    }
    fetchLookups();
  }, []);;

  // Search patients with debounce
  useEffect(() => {
    if (!patientSearch.trim() || patientSearch.length < 2) {
      setPatients([]);
      return;
    }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('patients')
        .select('id, first_name, last_name')
        .or(`last_name.ilike.%${patientSearch}%,first_name.ilike.%${patientSearch}%`)
        .limit(10);

      if (data) {
        setPatients(data.map(p => ({ id: p.id, label: `${p.last_name} ${p.first_name}` })));
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [patientSearch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');

    // Double-booking check
    const startISO = `${date}T${startTime}:00`;
    const endISO = `${date}T${endTime}:00`;
    let query = supabase
      .from('appointments')
      .select('id')
      .eq('doctor_id', doctorId)
      .lt('start_time', endISO)
      .gt('end_time', startISO)
      .not('status', 'eq', 'cancelled');

    // Exclude current appointment when editing
    if (initialData?.id) {
      query = query.not('id', 'eq', initialData.id);
    }

    const { data: conflicts } = await query;
    if (conflicts && conflicts.length > 0) {
      setBookingError('Ütközés! Az orvosnak már van időpontja ebben az időszakban.');
      return;
    }

    await onSave({
      patient_id: patientId,
      doctor_id: doctorId,
      assistant_id: assistantId,
      chair_id: chairId,
      date,
      start_time: startTime,
      end_time: endTime,
      appointment_type: appointmentType,
      treatment_notes: notes,
    }, initialData?.id);
  };

  const isEditing = !!initialData?.id;
  const selectedPatientLabel = patients.find(p => p.id === patientId)?.label || '';

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* Patient selector */}
      <div className={styles.field}>
        <label className={styles.label}>Páciens *</label>
        <div className={styles.patientSearch}>
          <MagnifyingGlass size={16} color="var(--color-neutral-400)" />
          <input
            className={styles.patientInput}
            placeholder="Keresés név alapján..."
            value={patientSearch || selectedPatientLabel}
            onChange={(e) => {
              setPatientSearch(e.target.value);
              if (!e.target.value) setPatientId('');
            }}
          />
        </div>
        {patients.length > 0 && patientSearch && (
          <div className={styles.patientDropdown}>
            {patients.map(p => (
              <button
                key={p.id}
                type="button"
                className={`${styles.patientOption} ${patientId === p.id ? styles.patientOptionActive : ''}`}
                onClick={() => {
                  setPatientId(p.id);
                  setPatientSearch('');
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Doctor + Assistant + Chair row */}
      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label}>Orvos *</label>
          <Dropdown
            items={doctors}
            value={doctorId}
            placeholder="Válasszon orvost..."
            onChange={(v) => setDoctorId(v as string)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Asszisztens</label>
          <Dropdown
            items={[{ id: '', label: 'Nincs kiválasztva' }, ...assistants]}
            value={assistantId}
            placeholder="Válasszon asszisztenst..."
            onChange={(v) => setAssistantId(v as string)}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Szék</label>
          <Dropdown
            items={chairs}
            value={chairId}
            placeholder="Válasszon széket..."
            onChange={(v) => setChairId(v as string)}
          />
        </div>
      </div>

      {/* Date + Time row */}
      <div className={styles.row}>
        <InputField
          label="Dátum *"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          inputPrefix={<CalendarBlank size={16} />}
          required
        />
        <InputField
          label="Kezdés *"
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          inputPrefix={<Clock size={16} />}
          required
        />
        <InputField
          label="Befejezés *"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          inputPrefix={<Clock size={16} />}
          required
        />
      </div>

      {/* Appointment type */}
      <div className={styles.field}>
        <label className={styles.label}>Típus</label>
        <Dropdown
          items={APPOINTMENT_TYPES}
          value={appointmentType}
          placeholder="Válasszon típust..."
          onChange={(v) => setAppointmentType(v as string)}
        />
      </div>

      {/* Notes */}
      <div className={styles.field}>
        <label className={styles.label}>Megjegyzés</label>
        <textarea
          className={styles.textarea}
          placeholder="Megjegyzés az időponthoz..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Booking error */}
      {bookingError && (
        <div style={{ color: '#E53E3E', fontSize: 13, padding: '8px 12px', background: '#FED7D7', borderRadius: 8, margin: '0 0 12px' }}>
          ⚠️ {bookingError}
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <Button variant="outline" type="button" onClick={onCancel}>Mégse</Button>
        <Button
          variant="primary"
          type="submit"
          disabled={saving || !patientId || !doctorId || !date || !startTime || !endTime}
        >
          {saving ? 'Mentés...' : isEditing ? 'Mentés' : 'Időpont létrehozása'}
        </Button>
      </div>
    </form>
  );
};

export default AppointmentForm;
