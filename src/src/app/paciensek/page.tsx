'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlass, Plus, Phone, EnvelopeSimple, CalendarBlank } from '@phosphor-icons/react';
import { AppShell } from '@/components/AppShell';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/Button';
import { Drawer } from '@/components/Drawer';
import { InputField } from '@/components/InputField';
import { Dropdown } from '@/components/Dropdown';
import { createClient } from '@/lib/supabase-browser';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import styles from './page.module.css';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  taj_number: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  is_vip: boolean;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'inactive' | 'alert' }> = {
  active: { label: 'Aktív', variant: 'success' },
  inactive: { label: 'Inaktív', variant: 'inactive' },
  archived: { label: 'Archivált', variant: 'inactive' },
};

const PAGE_SIZE = 20;

export default function PaciensekPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPatient, setNewPatient] = useState({ last_name: '', first_name: '', birth_date: '', gender: 'male', taj_number: '', phone: '', email: '' });
  const router = useRouter();

  const supabase = createClient();

  const fetchPatients = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('patients')
      .select('id, first_name, last_name, birth_date, gender, taj_number, phone, email, status, is_vip, created_at', { count: 'exact' })
      .order('last_name')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (searchQuery.trim()) {
      query = query.or(`last_name.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching patients:', error);
      setLoading(false);
      return;
    }

    setPatients(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  }, [searchQuery, page]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchPatients();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const handleCreatePatient = async () => {
    if (!newPatient.last_name || !newPatient.first_name || !newPatient.birth_date) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('patients')
      .insert({
        last_name: newPatient.last_name,
        first_name: newPatient.first_name,
        birth_date: newPatient.birth_date,
        gender: newPatient.gender,
        taj_number: newPatient.taj_number || null,
        phone: newPatient.phone || null,
        email: newPatient.email || null,
        status: 'active',
      })
      .select('id')
      .single();

    setSaving(false);
    if (!error && data) {
      setCreateOpen(false);
      setNewPatient({ last_name: '', first_name: '', birth_date: '', gender: 'male', taj_number: '', phone: '', email: '' });
      router.push(`/paciensek/${data.id}`);
    }
  };

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: 'Nyilvántartás' }, { label: 'Páciensek' }]} />

      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Páciensek</h1>
          <p className={styles.pageSubtitle}>{totalCount} páciens a rendszerben</p>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} weight="bold" /> Új páciens
        </Button>
      </div>

      {/* Search bar */}
      <div className={styles.searchBar}>
        <MagnifyingGlass size={18} color="var(--color-neutral-400)" />
        <input
          className={styles.searchInput}
          placeholder="Keresés név, telefonszám vagy email alapján..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Név</th>
              <th>Születési dátum</th>
              <th>TAJ szám</th>
              <th>Elérhetőség</th>
              <th>Státusz</th>
              <th>Regisztrált</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className={styles.loadingCell}>Betöltés...</td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyCell}>
                  {searchQuery ? 'Nincs találat a keresésre.' : 'Még nincsenek páciensek.'}
                </td>
              </tr>
            ) : (
              patients.map((patient) => {
                const status = STATUS_MAP[patient.status] || STATUS_MAP.active;
                return (
                  <tr key={patient.id} className={styles.tableRow} onClick={() => router.push(`/paciensek/${patient.id}`)}>
                    <td>
                      <div className={styles.patientName}>
                        <span className={styles.nameText}>
                          {patient.last_name} {patient.first_name}
                        </span>
                        {patient.is_vip && <span className={styles.vipBadge}>VIP</span>}
                      </div>
                    </td>
                    <td>
                      <div className={styles.cellWithIcon}>
                        <CalendarBlank size={14} color="var(--color-neutral-400)" />
                        {format(new Date(patient.birth_date), 'yyyy. MM. dd.', { locale: hu })}
                      </div>
                    </td>
                    <td className={styles.tajCell}>
                      {patient.taj_number
                        ? `${patient.taj_number.slice(0, 3)} ${patient.taj_number.slice(3, 6)} ${patient.taj_number.slice(6)}`
                        : '—'
                      }
                    </td>
                    <td>
                      <div className={styles.contactCell}>
                        {patient.phone && (
                          <span className={styles.contactItem}>
                            <Phone size={13} color="var(--color-primary-500)" />
                            {patient.phone}
                          </span>
                        )}
                        {patient.email && (
                          <span className={styles.contactItem}>
                            <EnvelopeSimple size={13} color="var(--color-primary-500)" />
                            {patient.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={status.variant} label={status.label} />
                    </td>
                    <td className={styles.dateCell}>
                      {format(new Date(patient.created_at), 'yyyy. MM. dd.', { locale: hu })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.paginationBtn}
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            ← Előző
          </button>
          <span className={styles.paginationInfo}>
            {page + 1} / {totalPages} oldal
          </span>
          <button
            className={styles.paginationBtn}
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            Következő →
          </button>
        </div>
      )}

      {/* Create patient drawer */}
      <Drawer open={createOpen} onClose={() => setCreateOpen(false)} title="Új páciens" width="wide">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <InputField label="Vezetéknév *" value={newPatient.last_name} onChange={e => setNewPatient(p => ({ ...p, last_name: e.target.value }))} required />
            <InputField label="Keresztnév *" value={newPatient.first_name} onChange={e => setNewPatient(p => ({ ...p, first_name: e.target.value }))} required />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <InputField label="Születési dátum *" type="date" value={newPatient.birth_date} onChange={e => setNewPatient(p => ({ ...p, birth_date: e.target.value }))} required />
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-neutral-700)', display: 'block', marginBottom: 6 }}>Nem</label>
              <Dropdown items={[{ id: 'male', label: 'Férfi' }, { id: 'female', label: 'Nő' }, { id: 'other', label: 'Egyéb' }]} value={newPatient.gender} onChange={v => setNewPatient(p => ({ ...p, gender: v as string }))} />
            </div>
          </div>
          <InputField label="TAJ szám" value={newPatient.taj_number} onChange={e => setNewPatient(p => ({ ...p, taj_number: e.target.value }))} placeholder="123456789" />
          <div style={{ display: 'flex', gap: 12 }}>
            <InputField label="Telefonszám" value={newPatient.phone} onChange={e => setNewPatient(p => ({ ...p, phone: e.target.value }))} />
            <InputField label="Email" type="email" value={newPatient.email} onChange={e => setNewPatient(p => ({ ...p, email: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 8, borderTop: '1px solid var(--color-neutral-100)' }}>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Mégse</Button>
            <Button variant="primary" onClick={handleCreatePatient} disabled={saving || !newPatient.last_name || !newPatient.first_name || !newPatient.birth_date}>
              {saving ? 'Mentés...' : 'Páciens létrehozása'}
            </Button>
          </div>
        </div>
      </Drawer>
    </AppShell>
  );
}
