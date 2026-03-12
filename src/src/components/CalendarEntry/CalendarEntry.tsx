import React from 'react';
import styles from './CalendarEntry.module.css';

export type CalendarColor = 'yellow' | 'orange' | 'red' | 'lilac' | 'green' | 'limeGreen' | 'mint' | 'darkMint' | 'turquoise' | 'blue' | 'grayGreen' | 'magenta' | 'gray';
export type CalendarState = 'default' | 'pressed' | 'unconfirmed';

export interface CalendarEntryProps {
  color?: CalendarColor;
  state?: CalendarState;
  timeRange: string;
  patientName: string;
  doctorName: string;
  category?: string;
  className?: string;
  onClick?: () => void;
}

export const CalendarEntry: React.FC<CalendarEntryProps> = ({
  color = 'gray',
  state = 'default',
  timeRange,
  patientName,
  doctorName,
  category,
  className,
  onClick,
}) => (
  <div
    className={[styles.entry, styles[color], styles[state], className].filter(Boolean).join(' ')}
    onClick={onClick}
  >
    <span className={styles.time}>{timeRange}</span>
    <span className={styles.patient}>{patientName}</span>
    <span className={styles.doctor}>{doctorName}</span>
    {category && <span className={styles.category}>{category}</span>}
  </div>
);

export default CalendarEntry;
