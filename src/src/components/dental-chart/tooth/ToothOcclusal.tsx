'use client';
import React from 'react';
import type { ToothSurface, SurfaceCondition, ToothType } from '../types';
import { getOcclusalPaths } from './toothPaths';
import { STATUS_COLORS } from '../utils/toothConstants';

interface ToothOcclusalProps {
  toothType: ToothType;
  surfaces: Record<ToothSurface, SurfaceCondition>;
  selectedSurface?: ToothSurface | null;
  onSurfaceClick?: (surface: ToothSurface) => void;
  onSurfaceHover?: (surface: ToothSurface | null) => void;
  size?: number;
  mirror?: boolean;
}

const SURFACES: ToothSurface[] = ['B', 'O', 'L', 'M', 'D'];

export function ToothOcclusal({
  toothType, surfaces, selectedSurface, onSurfaceClick, onSurfaceHover, size = 52, mirror = false,
}: ToothOcclusalProps) {
  const paths = getOcclusalPaths(toothType);

  return (
    <svg
      viewBox="0 0 60 60"
      width={size}
      height={size}
      style={{ cursor: 'pointer', transform: mirror ? 'scaleX(-1)' : undefined }}
    >
      {/* Outline */}
      <path d={paths.outline} fill="none" stroke="#bfc9cf" strokeWidth="1" />

      {/* Surfaces */}
      {SURFACES.map(s => {
        const condition = surfaces[s];
        const color = STATUS_COLORS[condition];
        const isSelected = selectedSurface === s;
        return (
          <path
            key={s}
            d={paths[s]}
            fill={color}
            stroke={isSelected ? '#082432' : '#bfc9cf'}
            strokeWidth={isSelected ? 1.5 : 0.5}
            onClick={(e) => { e.stopPropagation(); onSurfaceClick?.(s); }}
            onMouseEnter={() => onSurfaceHover?.(s)}
            onMouseLeave={() => onSurfaceHover?.(null)}
            style={{ cursor: 'pointer', transition: 'fill 0.15s ease' }}
          />
        );
      })}

      {/* Fissure lines for molars/premolars */}
      {['first_molar', 'second_molar', 'third_molar', 'first_premolar', 'second_premolar'].includes(toothType) && (
        <>
          <line x1="22" y1="24" x2="38" y2="24" stroke="#00000015" strokeWidth="0.5" />
          <line x1="22" y1="36" x2="38" y2="36" stroke="#00000015" strokeWidth="0.5" />
          <line x1="30" y1="20" x2="30" y2="40" stroke="#00000015" strokeWidth="0.5" />
        </>
      )}
    </svg>
  );
}
