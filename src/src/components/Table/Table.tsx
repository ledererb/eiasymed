import React from 'react';
import styles from './Table.module.css';

/* ── Header ── */
export interface TableHeaderCellProps { children: React.ReactNode; width?: number; align?: 'left' | 'center' | 'right'; className?: string; }
export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({ children, width, align = 'center', className }) => (
  <th className={[styles.headerCell, styles[`align${align.charAt(0).toUpperCase()}${align.slice(1)}`], className].filter(Boolean).join(' ')} style={width ? { width } : undefined}>
    {children}
  </th>
);

/* ── Row Cell ── */
export interface TableCellProps { children: React.ReactNode; width?: number; align?: 'left' | 'center' | 'right'; className?: string; }
export const TableCell: React.FC<TableCellProps> = ({ children, width, align = 'left', className }) => (
  <td className={[styles.cell, styles[`align${align.charAt(0).toUpperCase()}${align.slice(1)}`], className].filter(Boolean).join(' ')} style={width ? { width } : undefined}>
    {children}
  </td>
);

/* ── Row ── */
export interface TableRowProps { children: React.ReactNode; selected?: boolean; className?: string; onClick?: () => void; }
export const TableRow: React.FC<TableRowProps> = ({ children, selected, className, onClick }) => (
  <tr className={[styles.row, selected ? styles.selected : '', className].filter(Boolean).join(' ')} onClick={onClick}>
    {children}
  </tr>
);

/* ── Table ── */
export interface TableProps { children: React.ReactNode; className?: string; }
export const Table: React.FC<TableProps> = ({ children, className }) => (
  <table className={[styles.table, className].filter(Boolean).join(' ')}>
    {children}
  </table>
);

/* ── Toolbar ── */
export interface TableToolbarProps { children: React.ReactNode; className?: string; }
export const TableToolbar: React.FC<TableToolbarProps> = ({ children, className }) => (
  <div className={[styles.toolbar, className].filter(Boolean).join(' ')}>
    {children}
  </div>
);

/* ── Toolbar Button ── */
export interface ToolbarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { icon?: React.ReactNode; children: React.ReactNode; }
export const ToolbarButton: React.FC<ToolbarButtonProps> = ({ icon, children, className, ...props }) => (
  <button className={[styles.toolbarBtn, className].filter(Boolean).join(' ')} {...props}>
    {icon && <span className={styles.toolbarIcon}>{icon}</span>}
    {children}
  </button>
);
