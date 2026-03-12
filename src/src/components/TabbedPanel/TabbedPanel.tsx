'use client';
import React from 'react';
import { Plus } from '@phosphor-icons/react';
import styles from './TabbedPanel.module.css';

export interface PanelTab { id: string; label: string; hasPlus?: boolean; }

export interface TabbedPanelProps {
  tabs: PanelTab[];
  activeId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

export const TabbedPanel: React.FC<TabbedPanelProps> = ({ tabs, activeId, onSelect, className }) => (
  <div className={[styles.panel, className].filter(Boolean).join(' ')}>
    {tabs.map(tab => (
      <button
        key={tab.id}
        className={[styles.tab, activeId === tab.id ? styles.active : ''].filter(Boolean).join(' ')}
        onClick={() => onSelect?.(tab.id)}
      >
        {tab.hasPlus && <Plus size={12} weight="bold" className={styles.plusIcon} />}
        {tab.label}
      </button>
    ))}
  </div>
);

export default TabbedPanel;
