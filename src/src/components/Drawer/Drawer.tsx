'use client';
import { ReactNode, useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import styles from './Drawer.module.css';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: 'narrow' | 'wide';
  children: ReactNode;
  footer?: ReactNode;
}

export function Drawer({ open, onClose, title, width = 'narrow', children, footer }: DrawerProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.drawer} ${width === 'wide' ? styles.wide : styles.narrow}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Bezárás">
            <X size={18} />
          </button>
        </div>
        <div className={styles.content}>{children}</div>
        {footer}
      </div>
    </div>
  );
}
