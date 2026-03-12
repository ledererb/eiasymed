'use client';
import React, { useState, useRef, useEffect } from 'react';
import { CaretDown, Check } from '@phosphor-icons/react';
import styles from './Dropdown.module.css';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  divider?: boolean;
}

export interface DropdownProps {
  items: DropdownItem[];
  value?: string | string[];
  placeholder?: string;
  dark?: boolean;
  multiple?: boolean;
  onChange?: (value: string | string[]) => void;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  items,
  value,
  placeholder = 'Select...',
  dark = false,
  multiple = false,
  onChange,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedIds = Array.isArray(value) ? value : value ? [value] : [];
  const selectedLabels = items.filter(i => selectedIds.includes(i.id)).map(i => i.label);
  const displayText = selectedLabels.length ? selectedLabels.join(', ') : placeholder;

  const handleSelect = (id: string) => {
    if (multiple) {
      const next = selectedIds.includes(id) ? selectedIds.filter(v => v !== id) : [...selectedIds, id];
      onChange?.(next);
    } else {
      onChange?.(id);
      setOpen(false);
    }
  };

  return (
    <div className={[styles.dropdown, open ? styles.open : '', className].filter(Boolean).join(' ')} ref={ref}>
      <div
        className={[styles.trigger, dark ? styles.triggerDark : ''].filter(Boolean).join(' ')}
        onClick={() => setOpen(!open)}
      >
        <span>{displayText}</span>
        <span className={styles.chevron}><CaretDown size={12} /></span>
      </div>
      {open && (
        <div className={[styles.menu, dark ? styles.menuDark : ''].filter(Boolean).join(' ')}>
          {items.map(item => {
            if (item.divider) return <div key={item.id} className={styles.divider} />;
            const isActive = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={[
                  styles.item,
                  dark ? styles.itemDark : '',
                  isActive ? styles.itemActive : '',
                ].filter(Boolean).join(' ')}
                onClick={() => handleSelect(item.id)}
              >
                {multiple && (
                  <span className={styles.itemIcon}>
                    {isActive ? <Check size={12} weight="bold" /> : <span style={{ width: 12 }} />}
                  </span>
                )}
                {item.icon && <span className={styles.itemIcon}>{item.icon}</span>}
                {item.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
