'use client';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';
import styles from './NotificationModal.module.css';

export interface NotificationModalProps {
  open: boolean;
  onClose: () => void;
  variant?: 'success' | 'warning';
  title: string;
  description?: string;
  items?: string[];
  primaryLabel?: string;
  secondaryLabel?: string;
  onPrimary?: () => void;
  onSecondary?: () => void;
}

export function NotificationModal({
  open, onClose, variant = 'success', title, description, items,
  primaryLabel = 'OK', secondaryLabel, onPrimary, onSecondary,
}: NotificationModalProps) {
  if (!open) return null;
  const Icon = variant === 'success' ? CheckCircle : WarningCircle;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={`${styles.icon} ${variant === 'success' ? styles.iconSuccess : styles.iconWarning}`}>
          <Icon size={28} weight="bold" />
        </div>
        <div className={styles.title}>{title}</div>
        {description && <div className={styles.description}>{description}</div>}
        {items && items.length > 0 && (
          <div className={styles.list}>
            {items.map((it, i) => (
              <div key={i} className={styles.listItem}>• {it}</div>
            ))}
          </div>
        )}
        <div className={styles.actions}>
          {secondaryLabel && (
            <button className={styles.btnSecondary} onClick={onSecondary ?? onClose}>{secondaryLabel}</button>
          )}
          <button className={styles.btnPrimary} onClick={onPrimary ?? onClose}>{primaryLabel}</button>
        </div>
      </div>
    </div>
  );
}
