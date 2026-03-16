'use client';
import React from 'react';
import type { ToothData, ToothSurface } from '../types';
import { getToothType, getQuadrant, TOOTH_TYPE_LABELS, QUADRANT_LABELS, STATUS_LABELS, SURFACE_LABELS } from '../utils/toothConstants';
import { ToothOcclusal } from '../tooth/ToothOcclusal';
import type { SurfaceCondition } from '../types';
import styles from '../DentalChart.module.css';

interface ToothDetailPanelProps {
  tooth: ToothData;
  selectedSurface: ToothSurface | null;
  onSurfaceClick: (surface: ToothSurface) => void;
}

export function ToothDetailPanel({ tooth, selectedSurface, onSurfaceClick }: ToothDetailPanelProps) {
  const toothType = getToothType(tooth.fdi);
  const quad = getQuadrant(tooth.fdi);

  const surfaceConditions = Object.fromEntries(
    (['M', 'O', 'D', 'B', 'L'] as ToothSurface[]).map(s => [s, tooth.surfaces[s].condition])
  ) as Record<ToothSurface, SurfaceCondition>;

  return (
    <div className={styles.detailPanel}>
      <div className={styles.detailHeader}>
        <div className={styles.detailFdi}>{tooth.fdi}</div>
        <div>
          <div className={styles.detailType}>{TOOTH_TYPE_LABELS[toothType]}</div>
          <div className={styles.detailQuad}>{QUADRANT_LABELS[quad]}</div>
        </div>
        <div className={styles.detailStatus}>
          {tooth.status === 'present' ? 'Jelen' :
           tooth.status === 'missing' ? 'Hiányzik' :
           tooth.status === 'implant' ? 'Implantátum' :
           tooth.status === 'retained_root' ? 'Maradvány gyökér' :
           tooth.status === 'unerupted' ? 'Impaktált' : tooth.status}
        </div>
      </div>

      <div className={styles.detailOcclusal}>
        <ToothOcclusal
          toothType={toothType}
          surfaces={surfaceConditions}
          selectedSurface={selectedSurface}
          onSurfaceClick={onSurfaceClick}
          size={120}
        />
      </div>

      <div className={styles.detailSurfaces}>
        <div className={styles.detailSurfacesTitle}>Felszínek</div>
        {(['M', 'O', 'D', 'B', 'L'] as ToothSurface[]).map(s => (
          <div
            key={s}
            className={`${styles.detailSurfaceRow} ${selectedSurface === s ? styles.detailSurfaceRowActive : ''}`}
            onClick={() => onSurfaceClick(s)}
          >
            <span className={styles.detailSurfaceKey}>{s}</span>
            <span className={styles.detailSurfaceName}>{SURFACE_LABELS[s]}</span>
            <span className={styles.detailSurfaceBadge} style={{ background: `${
              tooth.surfaces[s].condition === 'intact' ? 'var(--color-neutral-200)' :
              tooth.surfaces[s].condition === 'caries' ? '#ef4444' :
              tooth.surfaces[s].condition === 'filling_composite' ? '#5ba3f5' :
              tooth.surfaces[s].condition === 'filling_amalgam' ? '#4a5568' :
              tooth.surfaces[s].condition === 'filling_temp' ? '#fbbf24' :
              tooth.surfaces[s].condition === 'filling_defect' ? '#f97316' :
              tooth.surfaces[s].condition === 'inlay' ? '#8b5cf6' :
              tooth.surfaces[s].condition === 'fracture' ? '#dc2626' :
              tooth.surfaces[s].condition === 'abrasion' ? '#a3a3a3' : '#fb923c'
            }` }}>
              {STATUS_LABELS[tooth.surfaces[s].condition]}
            </span>
          </div>
        ))}
      </div>

      {tooth.conditions.length > 0 && (
        <div className={styles.detailConditions}>
          <div className={styles.detailSurfacesTitle}>Fog állapotok</div>
          {tooth.conditions.map(c => (
            <div key={c} className={styles.detailConditionChip}>
              {c.replace(/_/g, ' ')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
