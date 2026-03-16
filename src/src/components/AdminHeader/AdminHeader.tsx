'use client';
import React from 'react';
import { Plus } from '@phosphor-icons/react';
import { StatusBadge } from '@/components/StatusBadge';
import styles from './AdminHeader.module.css';

interface AdminHeaderProps {
  patientName: string;
  status: string;
  statusColor?: 'pink' | 'green' | 'blue' | 'orange';
  onAddClick?: () => void;
}

export function AdminHeader({ patientName, status, statusColor = 'pink', onAddClick }: AdminHeaderProps) {
  return (
    <div className={styles.header}>
      <h1 className={styles.name}>{patientName}</h1>
      <StatusBadge status="arrived" label={status} />
      <div className={styles.spacer} />
      <button className={styles.addBtn} onClick={onAddClick}>
        <Plus size={22} weight="bold" />
      </button>
    </div>
  );
}

