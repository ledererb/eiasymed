import React from 'react';
import { X } from '@phosphor-icons/react/dist/ssr';
import styles from './Badge.module.css';

export type BadgeVariant = 'primary' | 'outline';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  dismissible = false,
  onDismiss,
  className,
}) => {
  const iconSize = size === 'sm' ? 8 : size === 'md' ? 10 : 12;
  return (
    <span className={[styles.badge, styles[variant], styles[size], className].filter(Boolean).join(' ')}>
      {icon && <span>{icon}</span>}
      {children}
      {dismissible && (
        <span className={styles.dismiss} onClick={onDismiss} role="button" tabIndex={0}>
          <X size={iconSize} weight="bold" />
        </span>
      )}
    </span>
  );
};

export default Badge;
