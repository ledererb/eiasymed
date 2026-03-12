import React from 'react';
import { Check } from '@phosphor-icons/react/dist/ssr';
import styles from './Checkbox.module.css';

export type CheckboxVariant = 'light' | 'dark' | 'alert';

export interface CheckboxProps {
  checked?: boolean;
  variant?: CheckboxVariant;
  label?: string;
  onChange?: (checked: boolean) => void;
  className?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked = false,
  variant = 'light',
  label,
  onChange,
  className,
}) => {
  const boxClasses = [
    styles.checkbox,
    variant !== 'light' ? styles[variant] : '',
    checked ? styles.checked : '',
  ].filter(Boolean).join(' ');

  const handleClick = () => onChange?.(!checked);

  if (label) {
    return (
      <label className={[styles.wrapper, className].filter(Boolean).join(' ')} onClick={handleClick}>
        <span className={boxClasses}>
          {checked && <Check size={8} weight="bold" />}
        </span>
        {label}
      </label>
    );
  }

  return (
    <span className={[boxClasses, className].filter(Boolean).join(' ')} onClick={handleClick} role="checkbox" aria-checked={checked} tabIndex={0}>
      {checked && <Check size={8} weight="bold" />}
    </span>
  );
};

export default Checkbox;
