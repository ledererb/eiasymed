'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Airplane, Globe, UserCircle, CalendarBlank, ChatCircle,
  FileText, Plus, MagnifyingGlass, ArrowRight, TrendUp,
  Pencil, Trash, Check, X, Bed, Car,
} from '@phosphor-icons/react';
import { AppShell } from '@/components/AppShell';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/Button';
import { Tabs } from '@/components/Tabs';
import { Drawer } from '@/components/Drawer';
import { InputField } from '@/components/InputField';
import { Dropdown } from '@/components/Dropdown';
import { createClient } from '@/lib/supabase-browser';
import { format, formatDistanceToNow } from 'date-fns';
import { hu } from 'date-fns/locale';
import styles from './page.module.css';

interface Consultation {
  id: string;
  request_reference: string;
  first_name: string;
  last_name: string;
  email: string;
  country_code: string;
  primary_concern: string;
  status: string;
  created_at: string;
}

interface TravelPackage {
  id: string;
  code: string;
  name_en: string;
  name_hu: string;
  price_eur: number;
  price_gbp: number | null;
  uk_comparison_price: number | null;
  savings_percentage: number | null;
  typical_visits: number;
  typical_days: number;
  description_en: string | null;
  is_featured: boolean;
  is_active: boolean;
}

interface Trip {
  id: string;
  patient_id: string;
  trip_reference: string;
  arrival_date: string;
  departure_date: string;
  arrival_flight_number: string | null;
  arrival_airport: string;
  hotel_booking_reference: string | null;
  status: string;
  number_of_companions: number;
  special_requirements: string | null;
  created_at: string;
  patient?: { first_name: string; last_name: string } | null;
}

interface Aftercare {
  id: string;
  patient_id: string;
  treatment_summary: string;
  next_checkup_date: string | null;
  status: string;
  instructions: string | null;
  created_at: string;
  patient?: { first_name: string; last_name: string } | null;
}

const CONSULTATION_STATUS: Record<string, { label: string; variant: 'new' | 'consultation' | 'offer' | 'success' | 'rejected' | 'waiting' }> = {
  new: { label: 'Új', variant: 'new' },
  in_review: { label: 'Elbírálás alatt', variant: 'consultation' },
  quote_sent: { label: 'Árajánlat elküldve', variant: 'offer' },
  accepted: { label: 'Elfogadva', variant: 'success' },
  rejected: { label: 'Elutasítva', variant: 'rejected' },
  pending: { label: 'Függőben', variant: 'waiting' },
};

const TRIP_STATUS: Record<string, { label: string; variant: 'new' | 'consultation' | 'success' | 'rejected' }> = {
  planned: { label: 'Tervezett', variant: 'new' },
  confirmed: { label: 'Megerősítve', variant: 'consultation' },
  in_progress: { label: 'Folyamatban', variant: 'consultation' },
  completed: { label: 'Befejezve', variant: 'success' },
  cancelled: { label: 'Lemondva', variant: 'rejected' },
};

const COUNTRY_FLAGS: Record<string, string> = {
  GB: '🇬🇧', DE: '🇩🇪', AT: '🇦🇹', CH: '🇨🇭', IE: '🇮🇪', US: '🇺🇸', FR: '🇫🇷', NL: '🇳🇱',
};

export default function DentalTourismPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [aftercareList, setAftercareList] = useState<Aftercare[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('consultations');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // Package create/edit
  const [packageDrawerOpen, setPackageDrawerOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<TravelPackage | null>(null);
  const [pkgForm, setPkgForm] = useState({ name_en: '', name_hu: '', code: '', price_eur: '', price_gbp: '', uk_comparison_price: '', typical_visits: '2', typical_days: '5', description_en: '', is_featured: false });

  // Trip create/edit
  const [tripDrawerOpen, setTripDrawerOpen] = useState(false);
  const [tripForm, setTripForm] = useState({ patient_id: '', arrival_date: '', departure_date: '', arrival_flight_number: '', arrival_airport: 'BUD', hotel_booking_reference: '', number_of_companions: '0', special_requirements: '' });

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [consultRes, packagesRes, tripsRes, aftercareRes] = await Promise.all([
      supabase.from('online_consultations').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('treatment_packages').select('*').order('display_order'),
      supabase.from('patient_travel_details').select('*, patient:patients!patient_travel_details_patient_id_fkey(first_name, last_name)').order('arrival_date', { ascending: false }).limit(50),
      supabase.from('patient_aftercare').select('*, patient:patients!patient_aftercare_patient_id_fkey(first_name, last_name)').order('created_at', { ascending: false }).limit(50),
    ]);
    setConsultations(consultRes.data || []);
    setPackages(packagesRes.data || []);
    setTrips((tripsRes.data as any[]) || []);
    setAftercareList((aftercareRes.data as any[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredConsultations = consultations.filter(c =>
    !searchQuery.trim() ||
    `${c.last_name} ${c.first_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConsultationStatusUpdate = async (id: string, newStatus: string) => {
    await supabase.from('online_consultations').update({ status: newStatus }).eq('id', id);
    setConsultations(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
    setSelectedConsultation(prev => prev ? { ...prev, status: newStatus } : null);
  };

  // ─── Package CRUD ───
  const openPackageDrawer = (pkg?: TravelPackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      setPkgForm({
        name_en: pkg.name_en, name_hu: pkg.name_hu || '', code: pkg.code,
        price_eur: pkg.price_eur.toString(), price_gbp: pkg.price_gbp?.toString() || '',
        uk_comparison_price: pkg.uk_comparison_price?.toString() || '',
        typical_visits: pkg.typical_visits.toString(), typical_days: (pkg.typical_days || 5).toString(),
        description_en: pkg.description_en || '', is_featured: pkg.is_featured,
      });
    } else {
      setEditingPackage(null);
      setPkgForm({ name_en: '', name_hu: '', code: '', price_eur: '', price_gbp: '', uk_comparison_price: '', typical_visits: '2', typical_days: '5', description_en: '', is_featured: false });
    }
    setPackageDrawerOpen(true);
  };

  const savePackage = async () => {
    const payload = {
      name_en: pkgForm.name_en, name_hu: pkgForm.name_hu || null, code: pkgForm.code,
      price_eur: parseFloat(pkgForm.price_eur) || 0,
      price_gbp: pkgForm.price_gbp ? parseFloat(pkgForm.price_gbp) : null,
      uk_comparison_price: pkgForm.uk_comparison_price ? parseFloat(pkgForm.uk_comparison_price) : null,
      typical_visits: parseInt(pkgForm.typical_visits) || 2,
      typical_days: parseInt(pkgForm.typical_days) || 5,
      description_en: pkgForm.description_en || null,
      is_featured: pkgForm.is_featured,
      savings_percentage: pkgForm.uk_comparison_price && pkgForm.price_eur
        ? Math.round(((parseFloat(pkgForm.uk_comparison_price) - parseFloat(pkgForm.price_eur)) / parseFloat(pkgForm.uk_comparison_price)) * 100)
        : null,
    };
    if (editingPackage) {
      await supabase.from('treatment_packages').update(payload).eq('id', editingPackage.id);
    } else {
      await supabase.from('treatment_packages').insert(payload);
    }
    setPackageDrawerOpen(false);
    fetchData();
  };

  const deletePackage = async (id: string) => {
    await supabase.from('treatment_packages').delete().eq('id', id);
    fetchData();
  };

  // ─── Trip CRUD ───
  const saveTrip = async () => {
    const ref = `DT-${new Date().getFullYear()}-${String(trips.length + 1).padStart(5, '0')}`;
    await supabase.from('patient_travel_details').insert({
      patient_id: tripForm.patient_id || null,
      trip_reference: ref,
      arrival_date: tripForm.arrival_date,
      departure_date: tripForm.departure_date,
      arrival_flight_number: tripForm.arrival_flight_number || null,
      arrival_airport: tripForm.arrival_airport || 'BUD',
      hotel_booking_reference: tripForm.hotel_booking_reference || null,
      number_of_companions: parseInt(tripForm.number_of_companions) || 0,
      special_requirements: tripForm.special_requirements || null,
    });
    setTripDrawerOpen(false);
    setTripForm({ patient_id: '', arrival_date: '', departure_date: '', arrival_flight_number: '', arrival_airport: 'BUD', hotel_booking_reference: '', number_of_companions: '0', special_requirements: '' });
    fetchData();
  };

  // ─── Quote builder (from consultation) ───
  const createQuote = async (consultation: Consultation, packageId: string) => {
    const pkg = packages.find(p => p.id === packageId);
    if (!pkg) return;
    const quoteRef = `Q-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
    const { data: quote } = await supabase.from('international_quotes').insert({
      consultation_id: consultation.id,
      quote_reference: quoteRef,
      currency: 'EUR',
      treatment_total: pkg.price_eur,
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'draft',
    }).select().single();
    if (quote) {
      await supabase.from('international_quote_items').insert({
        quote_id: quote.id,
        description: pkg.name_en,
        quantity: 1,
        unit_price: pkg.price_eur,
        total_price: pkg.price_eur,
      });
      await handleConsultationStatusUpdate(consultation.id, 'quote_sent');
    }
  };

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: 'Dental Tourism' }]} />

      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dental Tourism</h1>
          <p className={styles.pageSubtitle}>Nemzetközi páciens menedzsment</p>
        </div>
        <Button variant="primary" onClick={() => {
          if (activeTab === 'packages') openPackageDrawer();
          else if (activeTab === 'trips') { setTripDrawerOpen(true); }
        }}>
          <Plus size={16} weight="bold" /> {activeTab === 'packages' ? 'Új csomag' : activeTab === 'trips' ? 'Új utazás' : 'Új konzultáció'}
        </Button>
      </div>

      {/* Summary stats */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <Globe size={24} color="var(--color-primary-500)" />
          <div>
            <span className={styles.statValue}>{consultations.length}</span>
            <span className={styles.statLabel}>Online konzultáció</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <FileText size={24} color="#8b5cf6" />
          <div>
            <span className={styles.statValue}>{packages.length}</span>
            <span className={styles.statLabel}>Kezelési csomag</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Airplane size={24} color="#f59e0b" />
          <div>
            <span className={styles.statValue}>{trips.length}</span>
            <span className={styles.statLabel}>Utazások</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <TrendUp size={24} color="#22c55e" />
          <div>
            <span className={styles.statValue}>{consultations.filter(c => c.status === 'accepted').length}</span>
            <span className={styles.statLabel}>Elfogadott</span>
          </div>
        </div>
      </div>

      <Tabs
        items={[
          { id: 'consultations', label: 'Konzultációk' },
          { id: 'packages', label: 'Csomagok' },
          { id: 'trips', label: 'Utazások' },
          { id: 'aftercare', label: 'Utógondozás' },
        ]}
        activeId={activeTab}
        onSelect={setActiveTab}
      />

      {/* ═══ CONSULTATIONS TAB ═══ */}
      {activeTab === 'consultations' && (
        <>
          <div className={styles.searchBar}>
            <MagnifyingGlass size={18} color="var(--color-neutral-400)" />
            <input className={styles.searchInput} placeholder="Keresés név vagy email alapján..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead><tr><th>Referencia</th><th>Páciens</th><th>Ország</th><th>Probléma</th><th>Státusz</th><th>Beérkezett</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className={styles.emptyCell}>Betöltés...</td></tr>
                ) : filteredConsultations.length === 0 ? (
                  <tr><td colSpan={6} className={styles.emptyCell}>Még nincsenek konzultációs kérelmek.</td></tr>
                ) : filteredConsultations.map(c => {
                  const badge = CONSULTATION_STATUS[c.status] || CONSULTATION_STATUS.new;
                  return (
                    <tr key={c.id} className={styles.tableRow} onClick={() => { setSelectedConsultation(c); setReviewNotes(''); }}>
                      <td className={styles.refCell}>{c.request_reference}</td>
                      <td>
                        <div className={styles.patientCell}>
                          <UserCircle size={24} color="var(--color-neutral-300)" weight="fill" />
                          <div>
                            <div className={styles.nameText}>{c.last_name} {c.first_name}</div>
                            <div className={styles.emailText}>{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={styles.countryCell}>{COUNTRY_FLAGS[c.country_code] || '🌍'} {c.country_code}</span></td>
                      <td className={styles.concernCell}>{c.primary_concern?.substring(0, 60)}{(c.primary_concern?.length || 0) > 60 ? '...' : ''}</td>
                      <td><StatusBadge status={badge.variant} label={badge.label} /></td>
                      <td className={styles.dateCell}>{format(new Date(c.created_at), 'yyyy. MM. dd.', { locale: hu })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ═══ PACKAGES TAB ═══ */}
      {activeTab === 'packages' && (
        <div className={styles.packagesGrid}>
          {packages.length === 0 ? (
            <p className={styles.emptyMessage}>Még nincsenek kezelési csomagok.</p>
          ) : packages.map(pkg => (
            <div key={pkg.id} className={`${styles.packageCard} ${pkg.is_featured ? styles.packageFeatured : ''}`}>
              {pkg.is_featured && <span className={styles.featuredBadge}>Kiemelt</span>}
              <div className={styles.pkgActions}>
                <button className={styles.iconBtn} onClick={() => openPackageDrawer(pkg)}><Pencil size={14} /></button>
                <button className={styles.iconBtn} onClick={() => deletePackage(pkg.id)}><Trash size={14} /></button>
              </div>
              <h3 className={styles.packageName}>{pkg.name_en}</h3>
              {pkg.name_hu && <p className={styles.packageNameHu}>{pkg.name_hu}</p>}
              <div className={styles.packagePrice}>
                <span className={styles.priceValue}>€{pkg.price_eur?.toLocaleString()}</span>
                {pkg.uk_comparison_price && <span className={styles.ukPrice}>UK: £{pkg.uk_comparison_price.toLocaleString()}</span>}
              </div>
              {pkg.savings_percentage && <span className={styles.savingsBadge}>Megtakarítás: {pkg.savings_percentage}%</span>}
              <div className={styles.packageMeta}>
                <span><CalendarBlank size={14} /> {pkg.typical_visits} vizit</span>
                <span><Airplane size={14} /> {pkg.typical_days || 5} nap</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ═══ TRIPS TAB ═══ */}
      {activeTab === 'trips' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead><tr><th>Referencia</th><th>Páciens</th><th>Érkezés</th><th>Távozás</th><th>Járat</th><th>Hotel</th><th>Státusz</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className={styles.emptyCell}>Betöltés...</td></tr>
              ) : trips.length === 0 ? (
                <tr><td colSpan={7} className={styles.emptyCell}>Még nincsenek utazások rögzítve.</td></tr>
              ) : trips.map(trip => {
                const pat = trip.patient as any;
                const st = TRIP_STATUS[trip.status] || TRIP_STATUS.planned;
                return (
                  <tr key={trip.id} className={styles.tableRow}>
                    <td className={styles.refCell}>{trip.trip_reference}</td>
                    <td>{pat ? `${pat.last_name} ${pat.first_name}` : '—'}</td>
                    <td>{format(new Date(trip.arrival_date), 'yyyy. MM. dd.')}</td>
                    <td>{format(new Date(trip.departure_date), 'yyyy. MM. dd.')}</td>
                    <td>{trip.arrival_flight_number || '—'}</td>
                    <td>{trip.hotel_booking_reference || '—'}</td>
                    <td><StatusBadge status={st.variant} label={st.label} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ AFTERCARE TAB ═══ */}
      {activeTab === 'aftercare' && (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead><tr><th>Páciens</th><th>Kezelés összefoglaló</th><th>Következő kontroll</th><th>Státusz</th><th>Utasítások</th></tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className={styles.emptyCell}>Betöltés...</td></tr>
              ) : aftercareList.length === 0 ? (
                <tr><td colSpan={5} className={styles.emptyCell}>Még nincs utógondozási adat.</td></tr>
              ) : aftercareList.map(ac => {
                const pat = ac.patient as any;
                return (
                  <tr key={ac.id} className={styles.tableRow}>
                    <td>{pat ? `${pat.last_name} ${pat.first_name}` : '—'}</td>
                    <td>{ac.treatment_summary?.substring(0, 80)}</td>
                    <td>{ac.next_checkup_date ? format(new Date(ac.next_checkup_date), 'yyyy. MM. dd.') : '—'}</td>
                    <td><StatusBadge status={ac.status === 'completed' ? 'success' : 'consultation'} label={ac.status === 'completed' ? 'Kész' : 'Folyamatban'} /></td>
                    <td className={styles.concernCell}>{ac.instructions?.substring(0, 60) || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ CONSULTATION DETAIL DRAWER ═══ */}
      <Drawer open={!!selectedConsultation} onClose={() => setSelectedConsultation(null)} title="Konzultáció részletek" width="wide">
        {selectedConsultation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <UserCircle size={36} color="var(--color-primary-500)" weight="fill" />
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-primary-900)' }}>{selectedConsultation.last_name} {selectedConsultation.first_name}</h3>
                <span style={{ fontSize: 13, color: 'var(--color-neutral-500)' }}>{COUNTRY_FLAGS[selectedConsultation.country_code] || '🌍'} {selectedConsultation.country_code} · {selectedConsultation.email}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: 'var(--color-neutral-50)', borderRadius: 8, padding: 12 }}>
                <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-neutral-500)', fontWeight: 600 }}>Referencia</span>
                <p style={{ margin: '4px 0 0', fontWeight: 700 }}>{selectedConsultation.request_reference}</p>
              </div>
              <div style={{ flex: 1, background: 'var(--color-neutral-50)', borderRadius: 8, padding: 12 }}>
                <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-neutral-500)', fontWeight: 600 }}>Beérkezett</span>
                <p style={{ margin: '4px 0 0', fontWeight: 700 }}>{formatDistanceToNow(new Date(selectedConsultation.created_at), { addSuffix: true, locale: hu })}</p>
              </div>
            </div>

            <div>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-neutral-500)', fontWeight: 600 }}>Probléma leírás</span>
              <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--color-primary-900)' }}>{selectedConsultation.primary_concern || 'Nincs megadva.'}</p>
            </div>

            <div>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-neutral-500)', fontWeight: 600, marginBottom: 8, display: 'block' }}>Státusz módosítása</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(CONSULTATION_STATUS).map(([key, val]) => (
                  <button key={key} onClick={() => handleConsultationStatusUpdate(selectedConsultation.id, key)}
                    style={{ padding: '6px 14px', borderRadius: 16, border: '1px solid', borderColor: selectedConsultation.status === key ? 'var(--color-primary-500)' : 'var(--color-neutral-200)', background: selectedConsultation.status === key ? 'var(--color-primary-500)' : 'none', color: selectedConsultation.status === key ? 'white' : 'var(--color-primary-900)', fontWeight: selectedConsultation.status === key ? 600 : 400, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-family)' }}>
                    {val.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Quote builder */}
            {packages.length > 0 && (
              <div>
                <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-neutral-500)', fontWeight: 600, display: 'block', marginBottom: 8 }}>Árajánlat készítése csomagból</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {packages.map(pkg => (
                    <button key={pkg.id} onClick={() => createQuote(selectedConsultation, pkg.id)}
                      style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--color-neutral-200)', background: 'var(--color-neutral-50)', cursor: 'pointer', fontFamily: 'var(--font-family)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={14} color="var(--color-primary-500)" />
                      {pkg.name_en} — €{pkg.price_eur.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-neutral-500)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Belső megjegyzés</span>
              <textarea style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-neutral-200)', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-family)', resize: 'vertical', outline: 'none' }}
                value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
                onBlur={async () => {
                  if (selectedConsultation && reviewNotes.trim()) {
                    await supabase.from('online_consultations').update({ review_notes: reviewNotes }).eq('id', selectedConsultation.id);
                  }
                }}
                placeholder="Belső megjegyzés..." rows={3} />
            </div>
          </div>
        )}
      </Drawer>

      {/* ═══ PACKAGE DRAWER ═══ */}
      <Drawer open={packageDrawerOpen} onClose={() => setPackageDrawerOpen(false)} title={editingPackage ? 'Csomag szerkesztése' : 'Új csomag'} width="wide">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InputField label="Név (EN)" value={pkgForm.name_en} onChange={e => setPkgForm(p => ({ ...p, name_en: e.target.value }))} />
          <InputField label="Név (HU)" value={pkgForm.name_hu} onChange={e => setPkgForm(p => ({ ...p, name_hu: e.target.value }))} />
          <InputField label="Kód" value={pkgForm.code} onChange={e => setPkgForm(p => ({ ...p, code: e.target.value }))} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <InputField label="Ár (EUR)" type="number" value={pkgForm.price_eur} onChange={e => setPkgForm(p => ({ ...p, price_eur: e.target.value }))} />
            <InputField label="Ár (GBP)" type="number" value={pkgForm.price_gbp} onChange={e => setPkgForm(p => ({ ...p, price_gbp: e.target.value }))} />
            <InputField label="UK összehasonlító ár" type="number" value={pkgForm.uk_comparison_price} onChange={e => setPkgForm(p => ({ ...p, uk_comparison_price: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InputField label="Vizitek száma" type="number" value={pkgForm.typical_visits} onChange={e => setPkgForm(p => ({ ...p, typical_visits: e.target.value }))} />
            <InputField label="Napok száma" type="number" value={pkgForm.typical_days} onChange={e => setPkgForm(p => ({ ...p, typical_days: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary-900)', display: 'block', marginBottom: 4 }}>Leírás (EN)</label>
            <textarea style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-neutral-200)', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-family)', resize: 'vertical', outline: 'none' }}
              value={pkgForm.description_en} onChange={e => setPkgForm(p => ({ ...p, description_en: e.target.value }))} rows={3} />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={pkgForm.is_featured} onChange={e => setPkgForm(p => ({ ...p, is_featured: e.target.checked }))} />
            Kiemelt csomag
          </label>
          <Button variant="primary" onClick={savePackage}>{editingPackage ? 'Mentés' : 'Csomag létrehozása'}</Button>
        </div>
      </Drawer>

      {/* ═══ TRIP DRAWER ═══ */}
      <Drawer open={tripDrawerOpen} onClose={() => setTripDrawerOpen(false)} title="Új utazás rögzítése" width="wide">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InputField label="Érkezés dátuma" type="date" value={tripForm.arrival_date} onChange={e => setTripForm(p => ({ ...p, arrival_date: e.target.value }))} />
          <InputField label="Távozás dátuma" type="date" value={tripForm.departure_date} onChange={e => setTripForm(p => ({ ...p, departure_date: e.target.value }))} />
          <InputField label="Járatszám (érkezés)" value={tripForm.arrival_flight_number} onChange={e => setTripForm(p => ({ ...p, arrival_flight_number: e.target.value }))} />
          <InputField label="Repülőtér" value={tripForm.arrival_airport} onChange={e => setTripForm(p => ({ ...p, arrival_airport: e.target.value }))} />
          <InputField label="Hotel foglalási szám" value={tripForm.hotel_booking_reference} onChange={e => setTripForm(p => ({ ...p, hotel_booking_reference: e.target.value }))} />
          <InputField label="Kísérők száma" type="number" value={tripForm.number_of_companions} onChange={e => setTripForm(p => ({ ...p, number_of_companions: e.target.value }))} />
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary-900)', display: 'block', marginBottom: 4 }}>Különleges kérések</label>
            <textarea style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--color-neutral-200)', borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-family)', resize: 'vertical', outline: 'none' }}
              value={tripForm.special_requirements} onChange={e => setTripForm(p => ({ ...p, special_requirements: e.target.value }))} rows={3} />
          </div>
          <Button variant="primary" onClick={saveTrip}>Utazás rögzítése</Button>
        </div>
      </Drawer>
    </AppShell>
  );
}
