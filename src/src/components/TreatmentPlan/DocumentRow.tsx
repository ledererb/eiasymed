'use client';
import React from 'react';
import { Printer, EnvelopeSimple, DeviceTablet, WarningCircle, CheckCircle } from '@phosphor-icons/react';
import { Checkbox } from '@/components/Checkbox';
import styles from './DocumentRow.module.css';

interface DocumentRowProps {
  name: string;
  status?: 'alert' | 'signed' | 'none';
  checked?: boolean;
  onCheck?: (checked: boolean) => void;
  onPrint?: () => void;
  onEmail?: () => void;
  onTablet?: () => void;
}

export function DocumentRow({
  name, status = 'none', checked = false, onCheck, onPrint, onEmail, onTablet,
}: DocumentRowProps) {
  return (
    <div className={styles.row}>
      <div className={styles.checkCell}>
        <Checkbox checked={checked} onChange={onCheck || (() => {})} variant="light" />
      </div>
      <span className={styles.name}>{name}</span>
      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={onPrint} title="Nyomtatás">
          <Printer size={18} />
        </button>
        <button className={styles.actionBtn} onClick={onEmail} title="E-mail">
          <EnvelopeSimple size={20} />
        </button>
        <button className={styles.actionBtn} onClick={onTablet} title="Tablet">
          <DeviceTablet size={18} />
        </button>
      </div>
      <div className={styles.statusCell}>
        {status === 'alert' && <WarningCircle size={18} className={styles.alertIcon} />}
        {status === 'signed' && <CheckCircle size={18} weight="fill" className={styles.signedIcon} />}
      </div>
    </div>
  );
}
