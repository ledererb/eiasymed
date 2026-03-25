'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MagnifyingGlass, FunnelSimple, SortAscending, Columns,
  DotsThree, ShareNetwork, Printer, CaretRight, CheckCircle,
  Envelope, EnvelopeSimple, Trash, X
} from '@phosphor-icons/react';
import { AppShell } from '@/components/AppShell';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Drawer } from '@/components/Drawer';
import { QuoteStatusBadge } from '@/components/QuoteStatusBadge/QuoteStatusBadge';
import { createClient } from '@/lib/supabase-browser';
import { format } from 'date-fns';
import { hu } from 'date-fns/locale';
import styles from './page.module.css';

/* ────── Types ────── */
interface TreatmentPlanRow {
  id: string;
  patient_id: string;
  quote_number: string;
  title: string;
  description: string | null;
  status: string;
  total_amount: number;
  currency: string;
  created_at: string;
  // joined
  patient_first_name: string;
  patient_last_name: string;
  patient_country: string;
  patient_dob: string | null;
  doctor_first_name: string;
  doctor_last_name: string;
}

interface PlanItem {
  id: string;
  visit_number: number;
  name: string;
  area: string | null;
  unit_price: number;
  quantity: number;
  total_price: number;
  is_completed: boolean;
  sort_order: number;
}

/* ────── Country flag emoji map ────── */
const FLAG_MAP: Record<string, string> = {
  HU: '🇭🇺', DE: '🇩🇪', AT: '🇦🇹', GB: '🇬🇧', US: '🇺🇸',
  IE: '🇮🇪', IS: '🇮🇸', CH: '🇨🇭', FR: '🇫🇷', IT: '🇮🇹',
  NO: '🇳🇴', SE: '🇸🇪', DK: '🇩🇰',
};

/* ────── Format helpers ────── */
function formatAmount(amount: number, currency: string): string {
  if (currency === 'EUR') {
    return new Intl.NumberFormat('hu-HU', { style: 'decimal' }).format(amount) + ' EUR';
  }
  return new Intl.NumberFormat('hu-HU', { style: 'decimal' }).format(amount) + ' HUF';
}

function formatItemPrice(amount: number): string {
  return new Intl.NumberFormat('hu-HU', { style: 'decimal' }).format(amount) + ' Ft';
}

export default function AjanlatokPage() {
  const [plans, setPlans] = useState<TreatmentPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<PlanItem[]>([]);
  const [checkedRows, setCheckedRows] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const supabase = createClient();

  /* ── Fetch treatment plans ── */
  const fetchPlans = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('treatment_plans')
      .select(`
        id, patient_id, quote_number, title, description, status, total_amount, currency, created_at,
        patients!inner ( first_name, last_name, address_country, birth_date ),
        staff!treatment_plans_doctor_id_fkey ( first_name, last_name )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching treatment plans:', error);
      setLoading(false);
      return;
    }

    const rows: TreatmentPlanRow[] = (data || []).map((p: any) => ({
      id: p.id,
      patient_id: p.patient_id,
      quote_number: p.quote_number,
      title: p.title,
      description: p.description,
      status: p.status,
      total_amount: Number(p.total_amount),
      currency: p.currency,
      created_at: p.created_at,
      patient_first_name: p.patients?.first_name || '',
      patient_last_name: p.patients?.last_name || '',
      patient_country: p.patients?.address_country || 'HU',
      patient_dob: p.patients?.birth_date || null,
      doctor_first_name: p.staff?.first_name || '',
      doctor_last_name: p.staff?.last_name || '',
    }));

    setPlans(rows);
    setLoading(false);
  }, []);

  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  /* ── Fetch plan items when a row is selected ── */
  useEffect(() => {
    if (!selectedId) {
      setSelectedItems([]);
      return;
    }
    async function fetchItems() {
      const { data } = await supabase
        .from('treatment_plan_items')
        .select('id, visit_number, name, area, unit_price, quantity, total_price, is_completed, sort_order')
        .eq('plan_id', selectedId)
        .order('visit_number')
        .order('sort_order');
      setSelectedItems(data || []);
    }
    fetchItems();
  }, [selectedId]);

  /* ── Filter ── */
  const filtered = useMemo(() => {
    let result = plans;
    if (statusFilter) {
      result = result.filter(p => p.status === statusFilter);
    }
    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter(p =>
      `${p.patient_last_name} ${p.patient_first_name}`.toLowerCase().includes(q) ||
      p.quote_number.toLowerCase().includes(q) ||
      p.title.toLowerCase().includes(q)
    );
  }, [plans, searchQuery, statusFilter]);

  /* ── Selected plan for drawer ── */
  const selected = useMemo(() => {
    if (!selectedId) return null;
    return plans.find(p => p.id === selectedId) || null;
  }, [selectedId, plans]);

  /* ── Group items by visit ── */
  const visitGroups = useMemo(() => {
    const groups = new Map<number, PlanItem[]>();
    selectedItems.forEach(item => {
      const existing = groups.get(item.visit_number) || [];
      existing.push(item);
      groups.set(item.visit_number, existing);
    });
    return groups;
  }, [selectedItems]);

  /* ── Checkbox toggle ── */
  const toggleCheck = (id: string) => {
    setCheckedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: 'Nyilvántartás' }, { label: 'Ajánlatok' }]} />

      {/* ── Toolbar ── */}
      <div className={styles.toolbar}>
        {/* Filter chips — functional status filter */}
        <div className={styles.filterChips}>
          {[
            { id: null, label: 'Mind' },
            { id: 'draft', label: 'Piszkozat' },
            { id: 'sent', label: 'Elküldve' },
            { id: 'accepted', label: 'Elfogadva' },
            { id: 'rejected', label: 'Elutasítva' },
          ].map(chip => (
            <button
              key={chip.id || 'all'}
              onClick={() => setStatusFilter(chip.id)}
              style={{
                padding: '5px 14px', borderRadius: 16, fontSize: 12, fontWeight: 600,
                border: '1px solid', cursor: 'pointer', fontFamily: 'var(--font-family)',
                borderColor: statusFilter === chip.id ? 'var(--color-primary-500)' : 'var(--color-neutral-200)',
                background: statusFilter === chip.id ? 'var(--color-primary-500)' : 'var(--color-neutral-50)',
                color: statusFilter === chip.id ? 'white' : 'var(--color-primary-900)',
                transition: 'all 0.15s',
              }}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className={styles.toolbarRight}>
          {/* Bulk actions */}
          <div className={styles.bulkActions}>
            <Printer size={18} className={styles.bulkIcon} />
            <EnvelopeSimple size={18} className={styles.bulkIcon} />
            <Envelope size={18} className={styles.bulkIcon} />
          </div>

          {/* Search */}
          <div className={styles.searchExpanded}>
            <MagnifyingGlass size={16} color="#5f7d95" />
            <input
              placeholder="Keresés..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <button className={`${styles.toolbarBtn} ${styles.active}`} title="Szűrés">
            <FunnelSimple size={20} />
          </button>
          <button className={styles.toolbarBtn} title="Rendezés">
            <SortAscending size={20} />
          </button>
          <button className={styles.toolbarBtn} title="Oszlopok">
            <Columns size={20} />
          </button>
          <span className={styles.toolbarLabel}>Statisztikák</span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className={styles.tableWrap}>
        <div className={styles.tableHeader}>
          <div className={`${styles.th} ${styles.colCheck}`}>
            <input type="checkbox" className={styles.checkbox} />
          </div>
          <div className={`${styles.th} ${styles.colN}`}>N</div>
          <div className={`${styles.thLeft} ${styles.colPatient}`}>Páciens</div>
          <div className={`${styles.thLeft} ${styles.colQuoteNo}`}>Ajánlat száma</div>
          <div className={`${styles.th} ${styles.colStatus}`}>Ajánlat státusza</div>
          <div className={`${styles.thLeft} ${styles.colSubject}`}>Tárgy</div>
          <div className={`${styles.thLeft} ${styles.colCreator}`}>Létrehozta</div>
          <div className={`${styles.th} ${styles.colValue}`}>Tervérték</div>
          <div className={`${styles.th} ${styles.colActions}`}>...</div>
        </div>

        <div className={styles.tableBody}>
          {loading ? (
            <div className={styles.loadingState}>Betöltés...</div>
          ) : filtered.length === 0 ? (
            <div className={styles.emptyState}>
              {searchQuery ? 'Nincs találat.' : 'Nincsenek ajánlatok.'}
            </div>
          ) : (
            filtered.map((p) => {
              const isSelected = selectedId === p.id;
              const isChecked = checkedRows.has(p.id);

              return (
                <div
                  key={p.id}
                  className={`${styles.tableRow} ${isSelected ? styles.selected : ''}`}
                  onClick={() => setSelectedId(isSelected ? null : p.id)}
                >
                  {/* Checkbox */}
                  <div className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={isChecked}
                      onChange={(e) => { e.stopPropagation(); toggleCheck(p.id); }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>

                  {/* N — flag */}
                  <div className={styles.flagCell}>
                    <span className={styles.flagIcon}>
                      {FLAG_MAP[p.patient_country] || '🏳️'}
                    </span>
                  </div>

                  {/* Páciens */}
                  <div className={styles.patientCell}>
                    <span className={styles.patientName}>
                      {p.patient_last_name} {p.patient_first_name}
                    </span>
                    <span className={styles.patientId}>
                      ID: {p.patient_id.slice(-9).replace(/-/g, '')}
                    </span>
                  </div>

                  {/* Ajánlat száma */}
                  <div className={styles.quoteNoCell}>
                    {p.quote_number}
                  </div>

                  {/* Ajánlat státusza */}
                  <div className={`${styles.cellCenter} ${styles.colStatus}`}>
                    <QuoteStatusBadge status={p.status} />
                  </div>

                  {/* Tárgy */}
                  <div className={styles.subjectCell}>
                    <span className={styles.subjectText}>{p.title}</span>
                  </div>

                  {/* Létrehozta */}
                  <div className={styles.creatorCell}>
                    Dr. {p.doctor_last_name} {p.doctor_first_name}
                  </div>

                  {/* Tervérték */}
                  <div className={styles.valueCell}>
                    {formatAmount(p.total_amount, p.currency)}
                  </div>

                  {/* Actions */}
                  <div className={styles.actionsCell}>
                    <button
                      className={styles.actionsBtn}
                      onClick={(e) => e.stopPropagation()}
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

      {/* ── Treatment Plan Preview Drawer ── */}
      <Drawer
        open={!!selected}
        onClose={() => setSelectedId(null)}
        title="Kezelési terv előnézet"
        width="wide"
      >
        {selected && (
          <div className={styles.drawerContent}>
            {/* Patient header */}
            <div className={styles.drawerPatientHeader}>
              <span className={styles.drawerPatientName}>
                {selected.patient_last_name} {selected.patient_first_name}
              </span>
              <span className={styles.drawerPatientMeta}>
                ID: {selected.patient_id.slice(-9).replace(/-/g, '')}
                {selected.patient_dob && `; ${selected.patient_dob}`}
              </span>
              <a href="/kezeles" className={styles.drawerLink}>
                Ugrás a kezelésre <CaretRight size={14} weight="bold" />
              </a>
            </div>

            {/* Quote header bar */}
            <div className={styles.quoteHeaderBar}>
              <span className={styles.quoteNumber}>{selected.quote_number}</span>
              <span className={styles.quoteTitle}>{selected.title}</span>
              <div className={styles.quoteActions}>
                <button className={styles.quoteActionBtn}><ShareNetwork size={18} /></button>
                <button className={styles.quoteActionBtn}><Printer size={18} /></button>
              </div>
            </div>

            {/* Status row */}
            <div className={styles.statusRow}>
              <QuoteStatusBadge status={selected.status} />
              <span className={styles.statusMeta}>
                Létrehozva:<br />
                {format(new Date(selected.created_at), 'yyyy. MM. dd. HH:mm', { locale: hu })},
                Dr. {selected.doctor_last_name} {selected.doctor_first_name}
              </span>
            </div>

            <div className={styles.divider} />

            {/* Visit sections */}
            {visitGroups.size > 0 ? (
              Array.from(visitGroups.entries()).map(([visitNum, items]) => {
                const visitTotal = items.reduce((s, i) => s + Number(i.total_price), 0);
                return (
                  <div key={visitNum} className={styles.visitSection}>
                    <span className={styles.visitTitle}>{visitNum}. vizit</span>
                    {items.map(item => (
                      <div key={item.id} className={styles.visitItem}>
                        <span className={styles.visitItemName}>{item.name}</span>
                        <span className={styles.visitItemArea}>{item.area || ''}</span>
                        <span className={styles.visitItemPrice}>
                          {formatItemPrice(item.unit_price)} × {item.quantity}
                        </span>
                        <span className={styles.visitItemTotal}>
                          {formatItemPrice(item.total_price)}
                        </span>
                        <span className={styles.visitItemCheck}>
                          {item.is_completed ? <CheckCircle size={20} weight="fill" /> : <CheckCircle size={20} />}
                        </span>
                      </div>
                    ))}
                    <div className={styles.visitFooter}>
                      <span>Vizit időtartam: 0 nap</span>
                      <span>Gyógyulási idő: 3 hónap</span>
                    </div>
                    <div className={styles.visitTotal}>
                      <span className={styles.visitTotalLabel}>{visitNum}. vizit összesen</span>
                      <span className={styles.visitTotalAmount}>{formatItemPrice(visitTotal)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={styles.emptyState}>
                Nincs kezelési terv tétel ehhez az ajánlathoz.
              </div>
            )}
          </div>
        )}
      </Drawer>
    </AppShell>
  );
}
