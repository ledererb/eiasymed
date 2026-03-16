'use client';
import React from 'react';
import { Trash } from '@phosphor-icons/react';
import styles from './SaveTPRow.module.css';

interface SaveTPRowProps {
  label?: string;
  onSave?: () => void;
  onDelete?: () => void;
}

export function SaveTPRow({ label = 'Kezelési terv mentése', onSave, onDelete }: SaveTPRowProps) {
  return (
    <div className={styles.row}>
      <button className={styles.deleteBtn} onClick={onDelete} title="Törlés">
        <Trash size={20} />
      </button>
      <button className={styles.saveBtn} onClick={onSave}>{label}</button>
    </div>
  );
}
