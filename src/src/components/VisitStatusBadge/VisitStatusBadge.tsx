import React from 'react';
import styles from './VisitStatusBadge.module.css';

export type VisitStatus =
  | 'scheduled'
  | 'confirmed'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'no_show'
  | 'cancelled';

const STATUS_CONFIG: Record<VisitStatus, { label: string; className: string }> = {
  scheduled:   { label: 'tervezett',    className: styles.scheduled },
  confirmed:   { label: 'megerősített', className: styles.confirmed },
  arrived:     { label: 'megérkezett',  className: styles.arrived },
  in_progress: { label: 'elkezdve',     className: styles.inProgress },
  completed:   { label: 'lezárt',       className: styles.completed },
  no_show:     { label: 'no-show?',     className: styles.noShow },
  cancelled:   { label: 'lemondott',    className: styles.cancelled },
};

interface VisitStatusBadgeProps {
  status: string;
  /** Override the display label */
  label?: string;
  /** For upcoming appointments, show relative time e.g. "10 perc múlva" */
  relativeTime?: string;
}

export function VisitStatusBadge({ status, label, relativeTime }: VisitStatusBadgeProps) {
  // If the appointment is scheduled and has a relativeTime, show that instead
  if (status === 'scheduled' && relativeTime) {
    return <span className={styles.scheduled}>{relativeTime}</span>;
  }

  const config = STATUS_CONFIG[status as VisitStatus] || STATUS_CONFIG.scheduled;
  return <span className={config.className}>{label || config.label}</span>;
}
