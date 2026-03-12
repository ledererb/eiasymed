'use client';
import React from 'react';
import styles from './TopNav.module.css';

export interface TopNavItem { id: string; label: string; }

export interface TopNavProps {
  items: TopNavItem[];
  activeId?: string;
  patientName?: string;
  onSelect?: (id: string) => void;
  onClosePatient?: () => void;
  className?: string;
}

export const TopNav: React.FC<TopNavProps> = ({ items, activeId, patientName, onSelect, onClosePatient, className }) => (
  <nav className={[styles.topNav, className].filter(Boolean).join(' ')}>
    <div className={styles.items}>
      {items.map(item => (
        <button
          key={item.id}
          className={[styles.item, activeId === item.id ? styles.active : ''].filter(Boolean).join(' ')}
          onClick={() => onSelect?.(item.id)}
        >
          {item.label}
        </button>
      ))}
    </div>
    {patientName && (
      <div className={styles.patient}>
        <span className={styles.patientName}>{patientName}</span>
        <button className={styles.close} onClick={onClosePatient}>&times;</button>
      </div>
    )}
  </nav>
);

export default TopNav;
