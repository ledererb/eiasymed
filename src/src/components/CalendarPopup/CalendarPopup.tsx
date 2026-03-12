'use client';
import { useState } from 'react';
import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import styles from './CalendarPopup.module.css';

const DAYS = ['H', 'K', 'SZ', 'CS', 'P', 'Szo', 'V'];
const MONTH_NAMES = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday=0
}

export interface CalendarPopupProps {
  initialDate?: Date;
  onSelect?: (date: Date) => void;
}

export function CalendarPopup({ initialDate, onSelect }: CalendarPopupProps) {
  const now = initialDate || new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const today = new Date();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfWeek(year, month);
  const prevMonthDays = getDaysInMonth(year, month - 1);
  const cells: { day: number; muted: boolean; isToday: boolean }[] = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, muted: true, isToday: false });
  }
  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, muted: false, isToday: d === today.getDate() && month === today.getMonth() && year === today.getFullYear() });
  }
  // Next month leading days
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, muted: true, isToday: false });
  }

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  return (
    <div className={styles.calendar}>
      <div className={styles.monthNav}>
        <button className={styles.monthNavBtn} onClick={prev}><CaretLeft size={16} /></button>
        <span className={styles.monthName}>{MONTH_NAMES[month]}</span>
        <button className={styles.monthNavBtn} onClick={next}><CaretRight size={16} /></button>
      </div>
      <div className={styles.dayHeaders}>
        {DAYS.map(d => <span key={d} className={styles.dayHeader}>{d}</span>)}
      </div>
      <div className={styles.grid}>
        {cells.map((c, i) => (
          <button
            key={i}
            className={`${styles.cell} ${c.muted ? styles.muted : ''} ${c.isToday ? styles.today : ''}`}
            onClick={() => !c.muted && onSelect?.(new Date(year, month, c.day))}
          >
            {c.day}
          </button>
        ))}
      </div>
    </div>
  );
}
