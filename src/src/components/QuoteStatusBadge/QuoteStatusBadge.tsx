import React from 'react';
import styles from './QuoteStatusBadge.module.css';

export type QuoteStatus =
  | 'consultation'
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'issued'
  | 'expired'
  | 'cancelled';

const STATUS_CONFIG: Record<QuoteStatus, { label: string; className: string }> = {
  consultation: { label: 'konzultáció',  className: styles.consultation },
  pending:      { label: 'várakozik',     className: styles.pending },
  accepted:     { label: 'elfogadott',    className: styles.accepted },
  rejected:     { label: 'elutasított',   className: styles.rejected },
  issued:       { label: 'kiadva',        className: styles.issued },
  expired:      { label: 'lejárt',        className: styles.expired },
  cancelled:    { label: 'lemondott',     className: styles.cancelled },
};

interface QuoteStatusBadgeProps {
  status: string;
  label?: string;
}

export function QuoteStatusBadge({ status, label }: QuoteStatusBadgeProps) {
  const config = STATUS_CONFIG[status as QuoteStatus] || STATUS_CONFIG.consultation;
  return <span className={config.className}>{label || config.label}</span>;
}
