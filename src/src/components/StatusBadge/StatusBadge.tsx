import React from 'react';
import { CaretDown } from '@phosphor-icons/react/dist/ssr';
import styles from './StatusBadge.module.css';

export type StatusType =
  | 'alert' | 'success' | 'new' | 'offer' | 'consultation'
  | 'completed' | 'waiting' | 'rejected' | 'inactive';

export interface StatusBadgeProps {
  status: StatusType;
  label: string;
  showDropdown?: boolean;
  dotOnly?: boolean;
  className?: string;
  onClick?: () => void;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  showDropdown = false,
  dotOnly = false,
  className,
  onClick,
}) => {
  if (dotOnly) {
    const dotClass = {
      alert: styles.dotAlert, success: styles.dotSuccess, new: styles.dotNew,
      offer: styles.dotOffer, consultation: styles.dotConsultation,
      completed: styles.dotCompleted, waiting: styles.dotWaiting,
      rejected: styles.dotRejected, inactive: styles.dotInactive,
    }[status];

    return (
      <span className={[styles.statusBadge, styles.dotOnly, className].filter(Boolean).join(' ')}>
        <span className={[styles.dot, dotClass].join(' ')} />
        {label}
      </span>
    );
  }

  return (
    <span
      className={[
        styles.statusBadge,
        styles[status],
        showDropdown ? styles.hasDropdown : '',
        className,
      ].filter(Boolean).join(' ')}
      onClick={onClick}
      role={showDropdown ? 'button' : undefined}
    >
      {label}
      {showDropdown && (
        <span className={styles.chevron}>
          <CaretDown size={12} weight="bold" />
        </span>
      )}
    </span>
  );
};

export default StatusBadge;
