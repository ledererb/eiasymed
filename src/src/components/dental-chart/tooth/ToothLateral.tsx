'use client';
import React from 'react';
import type { ToothType, ToothStatus, ToothCondition } from '../types';
import { getLateralPaths } from './toothPaths';

interface ToothLateralProps {
  toothType: ToothType;
  status: ToothStatus;
  conditions: ToothCondition[];
  isUpper: boolean;
  size?: number;
  mirror?: boolean;
  onClick?: () => void;
}

export function ToothLateral({
  toothType, status, conditions, isUpper, size = 52, mirror = false, onClick,
}: ToothLateralProps) {
  const paths = getLateralPaths(toothType);
  const isMissing = status === 'missing';
  const isImplant = status === 'implant';
  const hasRootCanal = conditions.includes('root_canal');
  const hasCrown = conditions.some(c => c.startsWith('crown_'));

  // Flip vertically for upper teeth (roots go up)
  const flipY = isUpper;
  const transform = [
    mirror ? 'scaleX(-1)' : '',
    flipY ? 'scaleY(-1)' : '',
  ].filter(Boolean).join(' ') || undefined;

  const vbWidth = 40;
  const vbHeight = 80;

  return (
    <svg
      viewBox={`0 0 ${vbWidth} ${vbHeight}`}
      width={size * (40 / 80)}
      height={size}
      style={{ cursor: 'pointer', transform, transformOrigin: 'center center' }}
      onClick={onClick}
    >
      {isMissing ? (
        /* Missing tooth: X marker */
        <g>
          <line x1="8" y1="10" x2="32" y2="70" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <line x1="32" y1="10" x2="8" y2="70" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        </g>
      ) : isImplant ? (
        /* Implant: screw shape */
        <g>
          <path d={paths.crown} fill="#e0e0e0" stroke="#888" strokeWidth="0.8" />
          <rect x="16" y="36" width="8" height="36" rx="2" fill="#9ca3af" stroke="#6b7280" strokeWidth="0.5" />
          {[40, 46, 52, 58, 64].map(y => (
            <line key={y} x1="15" y1={y} x2="25" y2={y} stroke="#6b7280" strokeWidth="0.5" />
          ))}
        </g>
      ) : (
        <g>
          {/* Roots */}
          {paths.roots.map((r, i) => (
            <path
              key={i}
              d={r}
              fill={hasRootCanal ? 'rgba(196,50,132,0.35)' : '#f0ead6'}
              stroke={hasRootCanal ? '#c43284' : '#bfc9cf'}
              strokeWidth="0.8"
            />
          ))}
          {/* Crown */}
          <path
            d={paths.crown}
            fill={hasCrown ? '#e0e7ff' : '#f0ead6'}
            stroke={hasCrown ? '#6366f1' : '#bfc9cf'}
            strokeWidth={hasCrown ? 1.2 : 0.8}
          />
          {/* Crown overlay border */}
          {hasCrown && (
            <path d={paths.crown} fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3 2" />
          )}
        </g>
      )}
    </svg>
  );
}
