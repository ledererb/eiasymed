'use client';
import { useState } from 'react';
import { Plus, PencilSimple } from '@phosphor-icons/react';
import styles from './StatusTabbedPanel.module.css';

type Tab = 'altalanos' | 'parodontologiai';

const UPPER_TEETH = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
const LOWER_TEETH = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

function DentalChart() {
  return (
    <div className={styles.chartContainer}>
      <div className={styles.statusHeader}>
        <div>
          <span className={styles.statusLabel}>Legutóbbi általános fogászati státusz</span><br />
          <span className={styles.statusDate}>2026. 01. 16. (Hé) 14:56</span>
        </div>
        <button className={styles.editBtn}><PencilSimple size={16} /></button>
      </div>
      {/* Upper jaw */}
      <div className={styles.toothRow}>
        <span className={styles.side}>R</span>
        <div className={styles.toothGrid}>
          {UPPER_TEETH.map(t => (
            <div key={t} className={styles.toothPlaceholder}>🦷</div>
          ))}
        </div>
        <span className={styles.side}>L</span>
      </div>
      <div className={styles.toothRow}>
        <span className={styles.side} />
        <div className={styles.toothNum}>
          {UPPER_TEETH.map(t => (
            <span key={t} className={styles.toothNumItem}>{t}</span>
          ))}
        </div>
        <span className={styles.side} />
      </div>
      {/* Lower jaw */}
      <div className={styles.toothRow}>
        <span className={styles.side} />
        <div className={styles.toothNum}>
          {LOWER_TEETH.map(t => (
            <span key={t} className={styles.toothNumItem}>{t}</span>
          ))}
        </div>
        <span className={styles.side} />
      </div>
      <div className={styles.toothRow}>
        <span className={styles.side} />
        <div className={styles.toothGrid}>
          {LOWER_TEETH.map(t => (
            <div key={t} className={styles.toothPlaceholder}>🦷</div>
          ))}
        </div>
        <span className={styles.side} />
      </div>
    </div>
  );
}

export function StatusTabbedPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('altalanos');
  const tabs: { key: Tab; label: string }[] = [
    { key: 'altalanos', label: 'Általános' },
    { key: 'parodontologiai', label: 'Parodontológiai' },
  ];
  return (
    <div className={styles.panel}>
      <div className={styles.tabRow}>
        {tabs.map(t => (
          <button
            key={t.key}
            className={`${styles.tab} ${activeTab === t.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            <Plus size={14} /> {t.label}
          </button>
        ))}
      </div>
      <div className={styles.tabContent}>
        {activeTab === 'altalanos' ? <DentalChart /> : <div className={styles.emptyState}>Parodontológiai státusz</div>}
      </div>
    </div>
  );
}
