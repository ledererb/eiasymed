'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlass, Users, CalendarBlank, CurrencyCircleDollar, Star, X,
} from '@phosphor-icons/react';
import { createClient } from '@/lib/supabase-browser';
import styles from './SmartSearch.module.css';

interface SearchResult {
  id: string;
  type: 'patient' | 'appointment' | 'invoice' | 'lead';
  title: string;
  subtitle: string;
  href: string;
}

interface SmartSearchProps {
  open: boolean;
  onClose: () => void;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [focusIdx, setFocusIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setFocusIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      const q = query.trim();
      const allResults: SearchResult[] = [];

      // Search patients
      const { data: patients } = await supabase
        .from('patients')
        .select('id, first_name, last_name, email, phone')
        .or(`last_name.ilike.%${q}%,first_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(5);

      if (patients) {
        patients.forEach(p => allResults.push({
          id: p.id,
          type: 'patient',
          title: `${p.last_name} ${p.first_name}`,
          subtitle: p.email || p.phone || '—',
          href: `/paciensek/${p.id}`,
        }));
      }

      // Search invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, invoice_number, gross_amount, patient:patients!invoices_patient_id_fkey(last_name, first_name)')
        .ilike('invoice_number', `%${q}%`)
        .limit(5);

      if (invoices) {
        invoices.forEach((inv: any) => allResults.push({
          id: inv.id,
          type: 'invoice',
          title: inv.invoice_number,
          subtitle: inv.patient ? `${inv.patient.last_name} ${inv.patient.first_name}` : '—',
          href: '/penzugy',
        }));
      }

      // Search leads
      const { data: leads } = await supabase
        .from('leads')
        .select('id, first_name, last_name, email, pipeline_stage')
        .or(`last_name.ilike.%${q}%,first_name.ilike.%${q}%,email.ilike.%${q}%`)
        .limit(5);

      if (leads) {
        leads.forEach(l => allResults.push({
          id: l.id,
          type: 'lead',
          title: `${l.last_name} ${l.first_name}`,
          subtitle: `Pipeline: ${l.pipeline_stage}`,
          href: '/crm',
        }));
      }

      setResults(allResults);
      setFocusIdx(0);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(i + 1, results.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(i - 1, 0)); }
    if (e.key === 'Enter' && results[focusIdx]) {
      router.push(results[focusIdx].href);
      onClose();
    }
  }, [results, focusIdx, onClose, router]);

  const handleSelect = (result: SearchResult) => {
    router.push(result.href);
    onClose();
  };

  if (!open) return null;

  // Group results by type
  const grouped = {
    patient: results.filter(r => r.type === 'patient'),
    invoice: results.filter(r => r.type === 'invoice'),
    lead: results.filter(r => r.type === 'lead'),
  };

  const iconClass: Record<string, string> = {
    patient: styles.resultIconPatient,
    appointment: styles.resultIconAppt,
    invoice: styles.resultIconInvoice,
    lead: styles.resultIconLead,
  };

  const iconMap: Record<string, React.ReactNode> = {
    patient: <Users size={16} />,
    appointment: <CalendarBlank size={16} />,
    invoice: <CurrencyCircleDollar size={16} />,
    lead: <Star size={16} />,
  };

  const groupLabels: Record<string, string> = {
    patient: 'Páciensek',
    invoice: 'Számlák',
    lead: 'Érdeklődők',
  };

  let globalIdx = 0;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        {/* Search input */}
        <div className={styles.searchRow}>
          <span className={styles.searchIcon}><MagnifyingGlass size={20} /></span>
          <input
            ref={inputRef}
            className={styles.searchInput}
            placeholder="Keresés páciensek, számlák, leadek között..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className={styles.shortcut}>ESC</span>
        </div>

        {/* Results */}
        <div className={styles.results}>
          {loading && <div className={styles.emptyState}>Keresés...</div>}

          {!loading && query.length >= 2 && results.length === 0 && (
            <div className={styles.emptyState}>Nincs találat „{query}" kifejezésre.</div>
          )}

          {!loading && query.length < 2 && (
            <div className={styles.emptyState}>Kezdjen el gépelni a kereséshez...</div>
          )}

          {!loading && results.length > 0 && (
            <>
              {Object.entries(grouped).map(([type, items]) => {
                if (items.length === 0) return null;
                return (
                  <div key={type}>
                    <div className={styles.groupLabel}>{groupLabels[type]}</div>
                    {items.map((item) => {
                      const idx = globalIdx++;
                      return (
                        <button
                          key={item.id}
                          className={`${styles.resultItem} ${focusIdx === idx ? styles.focused : ''}`}
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setFocusIdx(idx)}
                        >
                          <div className={`${styles.resultIcon} ${iconClass[item.type]}`}>
                            {iconMap[item.type]}
                          </div>
                          <div className={styles.resultInfo}>
                            <div className={styles.resultTitle}>{item.title}</div>
                            <div className={styles.resultSub}>{item.subtitle}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span><span className={styles.footerKey}>↑↓</span> navigáció</span>
          <span><span className={styles.footerKey}>⏎</span> megnyitás</span>
          <span><span className={styles.footerKey}>ESC</span> bezárás</span>
        </div>
      </div>
    </div>
  );
};

export default SmartSearch;
