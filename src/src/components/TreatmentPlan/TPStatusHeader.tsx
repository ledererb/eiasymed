'use client';
import React from 'react';
import { CaretDown } from '@phosphor-icons/react';
import styles from './TPStatusHeader.module.css';

interface TPStatusHeaderProps {
  status: string;
  date?: string;
  doctorName?: string;
}

export function TPStatusHeader({ status, date, doctorName }: TPStatusHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.left}>
        <span className={styles.badge}>
          {status} <CaretDown size={10} weight="bold" />
        </span>
      </div>
      <div className={styles.right}>
        {(date || doctorName) && (
          <div className={styles.meta}>
            <span className={styles.metaLabel}>Státusz módosítása:</span>
            {date && <span className={styles.metaValue}>{date}</span>}
            {doctorName && <span className={styles.metaValue}>{doctorName}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
