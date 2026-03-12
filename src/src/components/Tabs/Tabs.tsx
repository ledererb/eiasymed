'use client';
import React from 'react';
import styles from './Tabs.module.css';

export interface TabItem { id: string; label: string; }

export interface TabsProps {
  items: TabItem[];
  activeId?: string;
  variant?: 'light' | 'dark';
  onSelect?: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ items, activeId, variant = 'light', onSelect, className }) => (
  <div className={[styles.tabs, styles[variant], className].filter(Boolean).join(' ')}>
    {items.map(item => (
      <button
        key={item.id}
        className={[styles.tab, activeId === item.id ? styles.active : ''].filter(Boolean).join(' ')}
        onClick={() => onSelect?.(item.id)}
      >
        {item.label}
      </button>
    ))}
  </div>
);

export default Tabs;
