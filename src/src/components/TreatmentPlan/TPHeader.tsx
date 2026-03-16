'use client';
import React from 'react';
import { Eye, ShareNetwork, Printer } from '@phosphor-icons/react';
import styles from './TPHeader.module.css';

interface TPHeaderProps {
  id: string;
  title: string;
  showIcons?: boolean;
  onView?: () => void;
  onShare?: () => void;
  onPrint?: () => void;
}

export function TPHeader({ id, title, showIcons = true, onView, onShare, onPrint }: TPHeaderProps) {
  return (
    <div className={styles.header}>
      <span className={styles.id}>{id}</span>
      <span className={styles.title}>{title}</span>
      {showIcons && (
        <div className={styles.actions}>
          <button className={styles.iconBtn} onClick={onView} title="Megtekintés">
            <Eye size={15} weight="regular" />
          </button>
          <button className={styles.iconBtn} onClick={onShare} title="Megosztás">
            <ShareNetwork size={15} weight="regular" />
          </button>
          <button className={styles.iconBtn} onClick={onPrint} title="Nyomtatás">
            <Printer size={15} weight="regular" />
          </button>
        </div>
      )}
    </div>
  );
}
