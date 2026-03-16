'use client';
import React from 'react';
import type { ToothData, ToothSurface } from '../types';
import { getToothType, getQuadrant } from '../utils/toothConstants';
import { ToothOcclusal } from './ToothOcclusal';
import { ToothLateral } from './ToothLateral';
import styles from '../DentalChart.module.css';

interface ToothUnitProps {
  tooth: ToothData;
  isSelected: boolean;
  selectedSurface?: ToothSurface | null;
  onToothClick: (fdi: number) => void;
  onSurfaceClick: (fdi: number, surface: ToothSurface) => void;
  onSurfaceHover?: (fdi: number, surface: ToothSurface | null) => void;
}

export function ToothUnit({
  tooth, isSelected, selectedSurface, onToothClick, onSurfaceClick, onSurfaceHover,
}: ToothUnitProps) {
  const toothType = getToothType(tooth.fdi);
  const quad = getQuadrant(tooth.fdi);
  const isUpper = quad <= 2;
  // Mirror right-side quadrants (1 and 4) for correct L/R display
  const mirror = quad === 1 || quad === 4;

  const surfaceConditions = Object.fromEntries(
    (['M', 'O', 'D', 'B', 'L'] as ToothSurface[]).map(s => [s, tooth.surfaces[s].condition])
  ) as Record<ToothSurface, import('../types').SurfaceCondition>;

  return (
    <div
      className={`${styles.toothUnit} ${isSelected ? styles.toothUnitSelected : ''}`}
      onClick={() => onToothClick(tooth.fdi)}
    >
      {/* Lateral view */}
      {isUpper ? (
        <>
          <ToothLateral
            toothType={toothType}
            status={tooth.status}
            conditions={tooth.conditions}
            isUpper={isUpper}
            mirror={mirror}
            size={44}
          />
          <ToothOcclusal
            toothType={toothType}
            surfaces={surfaceConditions}
            selectedSurface={isSelected ? selectedSurface : null}
            onSurfaceClick={(s) => onSurfaceClick(tooth.fdi, s)}
            onSurfaceHover={onSurfaceHover ? (s) => onSurfaceHover(tooth.fdi, s) : undefined}
            size={44}
            mirror={mirror}
          />
        </>
      ) : (
        <>
          <ToothOcclusal
            toothType={toothType}
            surfaces={surfaceConditions}
            selectedSurface={isSelected ? selectedSurface : null}
            onSurfaceClick={(s) => onSurfaceClick(tooth.fdi, s)}
            onSurfaceHover={onSurfaceHover ? (s) => onSurfaceHover(tooth.fdi, s) : undefined}
            size={44}
            mirror={mirror}
          />
          <ToothLateral
            toothType={toothType}
            status={tooth.status}
            conditions={tooth.conditions}
            isUpper={isUpper}
            mirror={mirror}
            size={44}
          />
        </>
      )}
      <span className={styles.fdiLabel}>{tooth.fdi}</span>
    </div>
  );
}
