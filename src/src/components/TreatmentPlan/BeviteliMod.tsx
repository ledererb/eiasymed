'use client';
import React from 'react';
import { Microphone, PencilSimple } from '@phosphor-icons/react';
import styles from './BeviteliMod.module.css';

interface BeviteliModProps {
  onVoice?: () => void;
  onManual?: () => void;
}

export function BeviteliMod({ onVoice, onManual }: BeviteliModProps) {
  return (
    <div className={styles.wrapper}>
      <button className={styles.btn} onClick={onVoice}>
        <span className={styles.iconCircle}>
          <Microphone size={14} weight="bold" />
        </span>
        <span className={styles.label}>Hangfelvétel indítása</span>
      </button>
      <button className={styles.btn} onClick={onManual}>
        <span className={styles.iconCircle}>
          <PencilSimple size={14} weight="bold" />
        </span>
        <span className={styles.label}>Manuális bevitel</span>
      </button>
    </div>
  );
}
