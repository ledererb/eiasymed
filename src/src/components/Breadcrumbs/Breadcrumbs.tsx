import React from 'react';
import { CaretRight } from '@phosphor-icons/react/dist/ssr';
import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem { label: string; href?: string; }

export interface BreadcrumbsProps { items: BreadcrumbItem[]; className?: string; }

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className }) => (
  <nav className={[styles.breadcrumbs, className].filter(Boolean).join(' ')}>
    {items.map((item, i) => (
      <React.Fragment key={i}>
        {i > 0 && <span className={styles.separator}>/</span>}
        {item.href ? (
          <a href={item.href} className={styles.link}>{item.label}</a>
        ) : (
          <span className={styles.current}>{item.label}</span>
        )}
      </React.Fragment>
    ))}
  </nav>
);

export default Breadcrumbs;
