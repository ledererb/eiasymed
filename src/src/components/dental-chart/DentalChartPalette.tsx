'use client';
import React from 'react';
import type { SurfaceCondition, PaletteSelection } from './types';
import { STATUS_COLORS, STATUS_LABELS } from './utils/toothConstants';
import styles from './DentalChart.module.css';

interface DentalChartPaletteProps {
  palette: PaletteSelection;
  onSelect: (palette: PaletteSelection) => void;
}

const STATUS_CONDITIONS: SurfaceCondition[] = [
  'intact', 'caries', 'filling_composite', 'filling_amalgam',
  'filling_temp', 'filling_defect', 'inlay', 'fracture', 'abrasion', 'erosion',
];

export function DentalChartPalette({ palette, onSelect }: DentalChartPaletteProps) {
  if (palette.mode === 'treatment') {
    return (
      <div className={styles.palette}>
        <span className={styles.paletteLabel}>Kezelés típus:</span>
        <div className={styles.paletteChips}>
          {[
            { key: 'composite_filling', label: 'Kompozit tömés', color: '#22c55e' },
            { key: 'crown_ceramic', label: 'Kerámia korona', color: '#6366f1' },
            { key: 'root_canal', label: 'Gyökérkezelés', color: '#c43284' },
            { key: 'extraction', label: 'Extrakció', color: '#dc2626' },
            { key: 'implant', label: 'Implantátum', color: '#64748b' },
          ].map(t => (
            <button
              key={t.key}
              className={`${styles.chip} ${palette.treatment === t.key ? styles.chipActive : ''}`}
              style={{ '--chip-color': t.color } as React.CSSProperties}
              onClick={() => onSelect({ mode: 'treatment', treatment: t.key as PaletteSelection['treatment'] })}
            >
              <span className={styles.chipDot} style={{ background: t.color }} />
              {t.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.palette}>
      <span className={styles.paletteLabel}>Felszín állapot:</span>
      <div className={styles.paletteChips}>
        {STATUS_CONDITIONS.map(c => (
          <button
            key={c}
            className={`${styles.chip} ${palette.condition === c ? styles.chipActive : ''}`}
            style={{ '--chip-color': STATUS_COLORS[c] } as React.CSSProperties}
            onClick={() => onSelect({ mode: 'status', condition: c })}
          >
            <span className={styles.chipDot} style={{ background: STATUS_COLORS[c] }} />
            {STATUS_LABELS[c]}
          </button>
        ))}
      </div>
    </div>
  );
}
