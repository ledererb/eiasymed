import React from 'react';
import styles from './IconButton.module.css';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled';
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, size = 'md', variant = 'default', className, ...props }) => (
  <button className={[styles.iconButton, styles[size], styles[variant], className].filter(Boolean).join(' ')} {...props}>
    {icon}
  </button>
);

export default IconButton;
