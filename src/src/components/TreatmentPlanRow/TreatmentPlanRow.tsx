import React from 'react';
import styles from './TreatmentPlanRow.module.css';

export type TreatmentRowType =
  | 'header' | 'row-edit' | 'row-done'
  | 'divider-open' | 'divider-closed'
  | 'divider-start-visit' | 'divider-start-consultation'
  | 'divider-close-visit' | 'divider-visit-sum'
  | 'divider-save' | 'divider-saved'
  | 'duration' | 'add-treatment'
  | 'document-alert' | 'document-signed';

export interface TreatmentPlanRowProps {
  type: TreatmentRowType;
  label?: string;
  secondaryLabel?: string;
  amount?: string;
  statusBadge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const TreatmentPlanRow: React.FC<TreatmentPlanRowProps> = ({
  type,
  label,
  secondaryLabel,
  amount,
  statusBadge,
  actions,
  className,
  onClick,
}) => (
  <div
    className={[styles.row, styles[type.replace(/-/g, '_')], className].filter(Boolean).join(' ')}
    onClick={onClick}
  >
    {statusBadge && <span className={styles.badge}>{statusBadge}</span>}
    <span className={styles.label}>{label}</span>
    {secondaryLabel && <span className={styles.secondary}>{secondaryLabel}</span>}
    {amount && <span className={styles.amount}>{amount}</span>}
    {actions && <span className={styles.actions}>{actions}</span>}
  </div>
);

export default TreatmentPlanRow;
