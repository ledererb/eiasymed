import React from 'react';
import { CaretRight, Plus } from '@phosphor-icons/react/dist/ssr';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'outline' | 'texticon' | 'addCta' | 'plusCta' | 'bulkAction';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  children,
  className,
  disabled,
  ...props
}) => {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    disabled ? styles.disabled : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  // addCta & plusCta have built-in icons
  if (variant === 'addCta') {
    const iconSize = size === 'sm' ? 12 : size === 'md' ? 18 : 24;
    return (
      <button className={classes} disabled={disabled} {...props}>
        <Plus size={iconSize} weight="bold" />
      </button>
    );
  }

  if (variant === 'plusCta') {
    return (
      <button className={classes} disabled={disabled} {...props}>
        +
      </button>
    );
  }

  if (variant === 'texticon') {
    return (
      <button className={classes} disabled={disabled} {...props}>
        {iconPosition === 'left' && icon && <span className={styles.icon}>{icon}</span>}
        {children}
        {iconPosition === 'right' && (
          <span className={styles.icon}>
            {icon || <CaretRight size={size === 'sm' ? 10 : size === 'md' ? 12 : 14} weight="bold" />}
          </span>
        )}
      </button>
    );
  }

  return (
    <button className={classes} disabled={disabled} {...props}>
      {iconPosition === 'left' && icon && <span className={styles.icon}>{icon}</span>}
      {children}
      {iconPosition === 'right' && icon && <span className={styles.icon}>{icon}</span>}
    </button>
  );
};

export default Button;
