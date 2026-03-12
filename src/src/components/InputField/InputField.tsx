import React from 'react';
import styles from './InputField.module.css';

export interface InputFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  hint?: string;
  error?: string;
  inputPrefix?: React.ReactNode;
  inputSuffix?: React.ReactNode;
  wrapperClassName?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  hint,
  error,
  inputPrefix,
  inputSuffix,
  wrapperClassName,
  className,
  ...props
}) => {
  const hasError = !!error;
  const wrapperClasses = [styles.wrapper, hasError ? styles.error : '', wrapperClassName].filter(Boolean).join(' ');

  if (inputPrefix || inputSuffix) {
    return (
      <div className={wrapperClasses}>
        {label && <label className={styles.label}>{label}</label>}
        <div className={styles.inputRow}>
          {inputPrefix && <span className={styles.prefix}>{inputPrefix}</span>}
          <input className={[styles.input, className].filter(Boolean).join(' ')} {...props} />
          {inputSuffix && <span className={styles.suffix}>{inputSuffix}</span>}
        </div>
        {hasError && <span className={styles.errorHint}>{error}</span>}
        {!hasError && hint && <span className={styles.hint}>{hint}</span>}
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      {label && <label className={styles.label}>{label}</label>}
      <input className={[styles.input, className].filter(Boolean).join(' ')} {...props} />
      {hasError && <span className={styles.errorHint}>{error}</span>}
      {!hasError && hint && <span className={styles.hint}>{hint}</span>}
    </div>
  );
};

export default InputField;
