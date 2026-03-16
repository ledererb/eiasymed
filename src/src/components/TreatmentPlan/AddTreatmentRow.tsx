'use client';
import React from 'react';
import styles from './AddTreatmentRow.module.css';

interface AddTreatmentRowProps {
  label?: string;
  onClick?: () => void;
}

export function AddTreatmentRow({ label = '+ Új tétel hozzáadása', onClick }: AddTreatmentRowProps) {
  return (
    <div className={styles.row}>
      <button className={styles.link} onClick={onClick}>{label}</button>
    </div>
  );
}
