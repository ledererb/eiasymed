'use client';
import React from 'react';
import styles from './SideNav.module.css';

export interface SideNavItem { id: string; icon: React.ReactNode; label: string; }

export interface SideNavProps {
  items: SideNavItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

export const SideNav: React.FC<SideNavProps> = ({ items, activeId, onSelect, className }) => (
  <nav className={[styles.sideNav, className].filter(Boolean).join(' ')}>
    {items.map(item => (
      <button
        key={item.id}
        className={[styles.item, activeId === item.id ? styles.active : ''].filter(Boolean).join(' ')}
        onClick={() => onSelect?.(item.id)}
        title={item.label}
      >
        <span className={styles.icon}>{item.icon}</span>
      </button>
    ))}
  </nav>
);

export default SideNav;
