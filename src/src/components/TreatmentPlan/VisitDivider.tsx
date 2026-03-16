'use client';
import React from 'react';
import { CaretUp, CaretDown } from '@phosphor-icons/react';
import styles from './VisitDivider.module.css';

interface VisitDividerProps {
  visitNumber: number;
  actionLabel?: string;
  status?: 'upcoming' | 'active' | 'completed';
  date?: string;
  doctorName?: string;
  onAction?: () => void;
  onToggle?: () => void;
  isOpen?: boolean;
}

export function VisitDivider({
  visitNumber, actionLabel, status = 'upcoming', date, doctorName, onAction, onToggle, isOpen,
}: VisitDividerProps) {
  return (
    <div className={`${styles.divider} ${styles[status]}`}>
      <div className={styles.left}>
        <span className={styles.label}>
          {visitNumber}. VIZIT
        </span>
        {status === 'active' && (
          <span className={styles.activeBadge}>elvégzett</span>
        )}
      </div>
      <div className={styles.right}>
        {date && <span className={styles.meta}>{date}</span>}
        {doctorName && <span className={styles.meta}>{doctorName}</span>}
        {actionLabel && (
          <button className={styles.actionBtn} onClick={onAction}>
            {actionLabel}
          </button>
        )}
        {onToggle !== undefined && (
          <button className={styles.toggleBtn} onClick={onToggle}>
            {isOpen ? <CaretUp size={14} /> : <CaretDown size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}
