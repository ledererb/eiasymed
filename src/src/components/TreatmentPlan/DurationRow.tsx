'use client';
import React from 'react';
import styles from './DurationRow.module.css';

interface DurationRowProps {
  visitDuration?: string;
  healingTime?: string;
}

export function DurationRow({ visitDuration = '0 nap', healingTime = '3 hónap' }: DurationRowProps) {
  return (
    <div className={styles.row}>
      <span className={styles.text}>Vizit időtartam: {visitDuration}</span>
      <span className={styles.text}>Gyógyulási idő: {healingTime}</span>
    </div>
  );
}
