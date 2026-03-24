'use client';

import React, { useState, useEffect } from 'react';
import {
  Airplane, Globe, UserCircle, CalendarBlank, ChatCircle,
  FileText, Plus, MagnifyingGlass, ArrowRight, TrendUp,
} from '@phosphor-icons/react';
import { AppShell } from '@/components/AppShell';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/Button';
import { Tabs } from '@/components/Tabs';
import { Drawer } from '@/components/Drawer';
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
  uk_comparison_price: number | null;
  savings_percentage: number | null;
  typical_visits: number;
  is_featured: boolean;
  is_active: boolean;
}

const CONSULTATION_STATUS: Record<string, { label: string; variant: 'new' | 'consultation' | 'offer' | 'success' | 'rejected' | 'waiting' }> = {
  new: { label: 'Új', variant: 'new' },
  in_review: { label: 'Elbírálás alatt', variant: 'consultation' },
  quote_sent: { label: 'Árajánlat elküldve', variant: 'offer' },
  accepted: { label: 'Elfogadva', variant: 'success' },
  rejected: { label: 'Elutasítva', variant: 'rejected' },
  pending: { label: 'Függőben', variant: 'waiting' },
};

const COUNTRY_FLAGS: Record<string, string> = {
  GB: '🇬🇧', DE: '🇩🇪', AT: '🇦🇹', CH: '🇨🇭', IE: '🇮🇪', US: '🇺🇸', FR: '🇫🇷', NL: '🇳🇱',
};

export default function DentalTourismPage() {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [packages, setPackages] = useState<TravelPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('consultations');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const [consultRes, packagesRes] = await Promise.all([
        supabase.from('online_consultations').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('treatment_packages').select('*').order('display_order'),
      ]);

      setConsultations(consultRes.data || []);
      setPackages(packagesRes.data || []);
      setLoading(false);
    }
    fetchData();
  }, []);

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

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: 'Dental Tourism' }]} />

      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dental Tourism</h1>
          <p className={styles.pageSubtitle}>Nemzetközi páciens menedzsment</p>
        </div>
        <Button variant="primary" onClick={() => {}}>
          <Plus size={16} weight="bold" /> Új konzultáció
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
          <TrendUp size={24} color="#22c55e" />
          <div>
            <span className={styles.statValue}>{consultations.filter(c => c.status === 'accepted').length}</span>
            <span className={styles.statLabel}>Elfogadott</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <Airplane size={24} color="#f59e0b" />
          <div>
            <span className={styles.statValue}>{consultations.filter(c => c.status === 'new').length}</span>
            <span className={styles.statLabel}>Új érdeklődő</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
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

      {activeTab === 'consultations' && (
        <>
          <div className={styles.searchBar}>
            <MagnifyingGlass size={18} color="var(--color-neutral-400)" />
            <input
              className={styles.searchInput}
              placeholder="Keresés név vagy email alapján..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Referencia</th>
                  <th>Páciens</th>
                  <th>Ország</th>
                  <th>Probléma</th>
                  <th>Státusz</th>
                  <th>Beérkezett</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className={styles.emptyCell}>Betöltés...</td></tr>
                ) : filteredConsultations.length === 0 ? (
                  <tr><td colSpan={6} className={styles.emptyCell}>Még nincsenek konzultációs kérelmek.</td></tr>
                ) : (
                  filteredConsultations.map(c => {
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
                        <td>
                          <span className={styles.countryCell}>
                            {COUNTRY_FLAGS[c.country_code] || '🌍'} {c.country_code}
                          </span>
                        </td>
                        <td className={styles.concernCell}>{c.primary_concern?.substring(0, 60)}{(c.primary_concern?.length || 0) > 60 ? '...' : ''}</td>
                        <td><StatusBadge status={badge.variant} label={badge.label} /></td>
                        <td className={styles.dateCell}>{format(new Date(c.created_at), 'yyyy. MM. dd.', { locale: hu })}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {activeTab === 'packages' && (
        <div className={styles.packagesGrid}>
          {packages.length === 0 ? (
            <p className={styles.emptyMessage}>Még nincsenek kezelési csomagok.</p>
          ) : (
            packages.map(pkg => (
              <div key={pkg.id} className={`${styles.packageCard} ${pkg.is_featured ? styles.packageFeatured : ''}`}>
                {pkg.is_featured && <span className={styles.featuredBadge}>Kiemelt</span>}
                <h3 className={styles.packageName}>{pkg.name_en}</h3>
                {pkg.name_hu && <p className={styles.packageNameHu}>{pkg.name_hu}</p>}
                <div className={styles.packagePrice}>
                  <span className={styles.priceValue}>€{pkg.price_eur.toLocaleString()}</span>
                  {pkg.uk_comparison_price && (
                    <span className={styles.ukPrice}>UK: £{pkg.uk_comparison_price.toLocaleString()}</span>
                  )}
                </div>
                {pkg.savings_percentage && (
                  <span className={styles.savingsBadge}>Megtakarítás: {pkg.savings_percentage}%</span>
                )}
                <div className={styles.packageMeta}>
                  <span><CalendarBlank size={14} /> {pkg.typical_visits} vizit</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Consultation detail drawer */}
      <Drawer
        open={!!selectedConsultation}
        onClose={() => setSelectedConsultation(null)}
        title="Konzultáció részletek"
        width="wide"
      >
        {selectedConsultation && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <UserCircle size={36} color="var(--color-primary-500)" weight="fill" />
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-primary-900)' }}>
                  {selectedConsultation.last_name} {selectedConsultation.first_name}
                </h3>
                <span style={{ fontSize: 13, color: 'var(--color-neutral-500)' }}>
                  {COUNTRY_FLAGS[selectedConsultation.country_code] || '🌍'} {selectedConsultation.country_code} · {selectedConsultation.email}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, background: 'var(--color-neutral-50)', borderRadius: 8, padding: 12 }}>
                <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-neutral-500)', fontWeight: 600 }}>Referencia</span>
                <p style={{ margin: '4px 0 0', fontWeight: 700 }}>{selectedConsultation.request_reference}</p>
              </div>
              <div style={{ flex: 1, background: 'var(--color-neutral-50)', borderRadius: 8, padding: 12 }}>
                <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-neutral-500)', fontWeight: 600 }}>Beérkezett</span>
                <p style={{ margin: '4px 0 0', fontWeight: 700 }}>
                  {formatDistanceToNow(new Date(selectedConsultation.created_at), { addSuffix: true, locale: hu })}
                </p>
              </div>
            </div>

            <div>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-neutral-500)', fontWeight: 600 }}>Probléma leírás</span>
              <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.5, color: 'var(--color-primary-900)' }}>
                {selectedConsultation.primary_concern || 'Nincs megadva.'}
              </p>
            </div>

            <div>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-neutral-500)', fontWeight: 600, marginBottom: 8, display: 'block' }}>Státusz módosítása</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {Object.entries(CONSULTATION_STATUS).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => handleConsultationStatusUpdate(selectedConsultation.id, key)}
                    style={{
                      padding: '6px 14px', borderRadius: 16, border: '1px solid',
                      borderColor: selectedConsultation.status === key ? 'var(--color-primary-500)' : 'var(--color-neutral-200)',
                      background: selectedConsultation.status === key ? 'var(--color-primary-500)' : 'none',
                      color: selectedConsultation.status === key ? 'white' : 'var(--color-primary-900)',
                      fontWeight: selectedConsultation.status === key ? 600 : 400,
                      fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-family)',
                    }}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--color-neutral-500)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Belső megjegyzés</span>
              <textarea
                style={{
                  width: '100%', padding: '10px 14px', border: '1px solid var(--color-neutral-200)',
                  borderRadius: 8, fontSize: 14, fontFamily: 'var(--font-family)', resize: 'vertical', outline: 'none',
                }}
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                placeholder="Belső megjegyzés..."
                rows={3}
              />
            </div>
          </div>
        )}
      </Drawer>
    </AppShell>
  );
}
