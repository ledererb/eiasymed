import type { SurfaceCondition, TreatmentStatus, ToothType, Quadrant } from '../types';

/* ── Status → color mapping ── */
export const STATUS_COLORS: Record<SurfaceCondition, string> = {
  intact:            '#f0ead6',
  caries:            '#ef4444',
  filling_composite: '#5ba3f5',
  filling_amalgam:   '#4a5568',
  filling_temp:      '#fbbf24',
  filling_defect:    '#f97316',
  inlay:             '#8b5cf6',
  fracture:          '#dc2626',
  abrasion:          '#a3a3a3',
  erosion:           '#fb923c',
};

/* ── Status labels (Hungarian) ── */
export const STATUS_LABELS: Record<SurfaceCondition, string> = {
  intact:            'Ép',
  caries:            'Szuvas',
  filling_composite: 'Kompozit tömés',
  filling_amalgam:   'Amalgám tömés',
  filling_temp:      'Ideiglenes tömés',
  filling_defect:    'Hibás tömés',
  inlay:             'Inlay/Onlay',
  fracture:          'Törés',
  abrasion:          'Kopás',
  erosion:           'Erózió',
};

/* ── Treatment status → stroke/fill ── */
export const TREATMENT_STATUS_COLORS: Record<TreatmentStatus, { stroke: string; fill: string }> = {
  planned:     { stroke: '#22c55e', fill: 'rgba(34,197,94,0.2)' },
  in_progress: { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.2)' },
  completed:   { stroke: '#3b82f6', fill: 'rgba(59,130,246,0.2)' },
  cancelled:   { stroke: '#9ca3af', fill: 'rgba(156,163,175,0.2)' },
};

/* ── FDI → tooth type ── */
export function getToothType(fdi: number): ToothType {
  const pos = fdi % 10;
  switch (pos) {
    case 1: return 'central_incisor';
    case 2: return 'lateral_incisor';
    case 3: return 'canine';
    case 4: return 'first_premolar';
    case 5: return 'second_premolar';
    case 6: return 'first_molar';
    case 7: return 'second_molar';
    case 8: return 'third_molar';
    default: return 'first_molar';
  }
}

/* ── FDI → quadrant ── */
export function getQuadrant(fdi: number): Quadrant {
  return Math.floor(fdi / 10) as Quadrant;
}

/* ── Is molar/premolar (has occlusal surface) vs incisor/canine (has incisal edge) ── */
export function isPosterior(fdi: number): boolean {
  const pos = fdi % 10;
  return pos >= 4;
}

/* ── Tooth type display names (Hungarian) ── */
export const TOOTH_TYPE_LABELS: Record<ToothType, string> = {
  central_incisor: 'Középső metszőfog',
  lateral_incisor: 'Oldalsó metszőfog',
  canine:          'Szemfog',
  first_premolar:  'Első kisőrlő',
  second_premolar: 'Második kisőrlő',
  first_molar:     'Első nagyőrlő',
  second_molar:    'Második nagyőrlő',
  third_molar:     'Bölcsességfog',
};

/* ── Quadrant labels ── */
export const QUADRANT_LABELS: Record<Quadrant, string> = {
  1: 'Felső jobb',
  2: 'Felső bal',
  3: 'Alsó bal',
  4: 'Alsó jobb',
};

/* ── Root counts per tooth type per arch ── */
export function getRootCount(fdi: number): number {
  const pos = fdi % 10;
  const quad = getQuadrant(fdi);
  const isUpper = quad <= 2;

  switch (pos) {
    case 1: case 2: case 3: case 5: return 1;
    case 4: return isUpper ? 2 : 1;
    case 6: case 7: return isUpper ? 3 : 2;
    case 8: return isUpper ? 3 : 2;
    default: return 1;
  }
}

/* ── All FDI codes in display order per quadrant ── */
export const QUADRANT_TEETH: Record<Quadrant, number[]> = {
  1: [18, 17, 16, 15, 14, 13, 12, 11],  // upper right, displayed right→center
  2: [21, 22, 23, 24, 25, 26, 27, 28],  // upper left, displayed center→left
  3: [31, 32, 33, 34, 35, 36, 37, 38],  // lower left, displayed center→left
  4: [48, 47, 46, 45, 44, 43, 42, 41],  // lower right, displayed right→center
};

/* ── Surface labels ── */
export const SURFACE_LABELS: Record<string, string> = {
  M: 'Mesiális',
  O: 'Occlusális',
  D: 'Distális',
  B: 'Buccális',
  L: 'Linguális',
};
