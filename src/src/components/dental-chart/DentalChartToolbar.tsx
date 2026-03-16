'use client';
import React from 'react';
import type { ChartMode } from './types';
import styles from './DentalChart.module.css';

interface DentalChartToolbarProps {
  mode: ChartMode;
  onModeChange: (mode: ChartMode) => void;
}

export function DentalChartToolbar({ mode, onModeChange }: DentalChartToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarLabel}>Mód:</div>
      <button
        className={`${styles.toolbarBtn} ${mode === 'status' ? styles.toolbarBtnActive : ''}`}
        onClick={() => onModeChange('status')}
      >
        Státuszrögzítés
      </button>
      <button
        className={`${styles.toolbarBtn} ${mode === 'treatment' ? styles.toolbarBtnActive : ''}`}
        onClick={() => onModeChange('treatment')}
      >
        Kezelési terv
      </button>
    </div>
  );
}
