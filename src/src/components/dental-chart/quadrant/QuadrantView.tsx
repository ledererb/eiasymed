'use client';
import React from 'react';
import type { ToothData, ToothSurface } from '../types';
import { QUADRANT_TEETH, type Quadrant } from '../utils/toothConstants';
import { ToothUnit } from '../tooth/ToothUnit';
import styles from '../DentalChart.module.css';

interface QuadrantViewProps {
  quadrant: Quadrant;
  teeth: Record<number, ToothData>;
  selectedTooth: number | null;
  selectedSurface: ToothSurface | null;
  onToothClick: (fdi: number) => void;
  onSurfaceClick: (fdi: number, surface: ToothSurface) => void;
  onSurfaceHover?: (fdi: number, surface: ToothSurface | null) => void;
}

export function QuadrantView({
  quadrant, teeth, selectedTooth, selectedSurface, onToothClick, onSurfaceClick, onSurfaceHover,
}: QuadrantViewProps) {
  const fdiList = QUADRANT_TEETH[quadrant];

  return (
    <div className={styles.quadrant}>
      {fdiList.map(fdi => {
        const tooth = teeth[fdi];
        if (!tooth) return null;
        return (
          <ToothUnit
            key={fdi}
            tooth={tooth}
            isSelected={selectedTooth === fdi}
            selectedSurface={selectedTooth === fdi ? selectedSurface : null}
            onToothClick={onToothClick}
            onSurfaceClick={onSurfaceClick}
            onSurfaceHover={onSurfaceHover}
          />
        );
      })}
    </div>
  );
}
