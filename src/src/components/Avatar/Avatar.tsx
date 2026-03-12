import React from 'react';
import styles from './Avatar.module.css';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export const Avatar: React.FC<AvatarProps> = ({ src, name = '', size = 'md', className }) => (
  <span className={[styles.avatar, styles[size], className].filter(Boolean).join(' ')}>
    {src ? <img src={src} alt={name} className={styles.image} /> : getInitials(name)}
  </span>
);

export default Avatar;
