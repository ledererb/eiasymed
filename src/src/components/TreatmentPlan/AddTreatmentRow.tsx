'use client';
import React, { useState, useEffect, useRef } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase-browser';
import styles from './AddTreatmentRow.module.css';

interface TreatmentOption {
  id: string;
  name: string;
  category: string;
  base_price: number;
  estimated_duration_minutes: number;
}

interface AddTreatmentRowProps {
  label?: string;
  onClick?: () => void;
  onSelect?: (item: TreatmentOption) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  diagnostic: 'Diagnosztika',
  preventive: 'Prevenció',
  restorative: 'Konzerváló',
  endodontic: 'Endodontia',
  surgical: 'Sebészet',
  implant: 'Implantáció',
  prosthetic: 'Protetika',
  cosmetic: 'Esztétika',
};

const formatPrice = (n: number) =>
  new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(n);

export function AddTreatmentRow({ label = '+ Új tétel hozzáadása', onClick, onSelect }: AddTreatmentRowProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<TreatmentOption[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    const supabase = createClient();
    supabase
      .from('treatment_types')
      .select('id, name, category, base_price, estimated_duration_minutes')
      .eq('is_active', true)
      .order('category')
      .order('name')
      .then(({ data }) => {
        setItems((data as TreatmentOption[]) || []);
        setLoading(false);
      });
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    (CATEGORY_LABELS[i.category] || '').toLowerCase().includes(search.toLowerCase())
  );

  // Group by category
  const grouped = filtered.reduce<Record<string, TreatmentOption[]>>((acc, item) => {
    const cat = item.category || 'other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const handleSelect = (item: TreatmentOption) => {
    onSelect?.(item);
    setOpen(false);
    setSearch('');
  };

  if (!open) {
    return (
      <div className={styles.row}>
        <button className={styles.link} onClick={() => { setOpen(true); onClick?.(); }}>
          {label}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.row} ref={ref}>
      <div className={styles.catalogue}>
        <div className={styles.searchBox}>
          <MagnifyingGlass size={14} />
          <input
            ref={inputRef}
            className={styles.searchInput}
            placeholder="Keresés kezelés típus..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className={styles.closeBtn} onClick={() => { setOpen(false); setSearch(''); }}>✕</button>
        </div>
        <div className={styles.catalogueList}>
          {loading && <div className={styles.catalogueLoading}>Betöltés...</div>}
          {!loading && filtered.length === 0 && (
            <div className={styles.catalogueEmpty}>Nincs találat</div>
          )}
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <div className={styles.catalogueCategory}>
                {CATEGORY_LABELS[cat] || cat}
              </div>
              {catItems.map(item => (
                <button
                  key={item.id}
                  className={styles.catalogueItem}
                  onClick={() => handleSelect(item)}
                >
                  <span className={styles.catalogueName}>{item.name}</span>
                  <span className={styles.catalogueMeta}>
                    {formatPrice(item.base_price)} · {item.estimated_duration_minutes} perc
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
