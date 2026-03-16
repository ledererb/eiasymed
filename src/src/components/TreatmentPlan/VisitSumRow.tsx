'use client';
import React from 'react';
import styles from './VisitSumRow.module.css';

interface VisitSumRowProps {
  label: string;
  amount: string;
  variant?: 'visit' | 'total';
}

export function VisitSumRow({ label, amount, variant = 'visit' }: VisitSumRowProps) {
  return (
    <div className={`${styles.row} ${variant === 'total' ? styles.total : styles.visit}`}>
      <span className={`${styles.label} ${variant === 'total' ? styles.labelTotal : ''}`}>{label}</span>
      <span className={`${styles.badge} ${variant === 'total' ? styles.badgeTotal : ''}`}>{amount}</span>
    </div>
  );
}
