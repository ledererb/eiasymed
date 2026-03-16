/* ── SVG path definitions for 8 tooth types ── */
/* Each tooth type has occlusal surface paths (5 regions) and a lateral outline. */

import type { ToothType } from '../types';

/** Occlusal view: 5 surface SVG paths inside a viewBox of 0 0 60 60 */
export interface OcclusalPaths {
  outline: string;      // full tooth outline
  O: string;            // occlusal / incisal center
  M: string;            // mesial
  D: string;            // distal
  B: string;            // buccal
  L: string;            // lingual
}

/** Lateral view paths inside viewBox 0 0 40 80 */
export interface LateralPaths {
  crown: string;
  roots: string[];      // 1-3 root paths
}

/* ── Occlusal paths per tooth type ──
   Pentagon-ish layout: B on top, L on bottom, M on left, D on right, O in center.
   Each path is an absolute SVG path within 60×60 viewBox. */

const OCCLUSAL: Record<ToothType, OcclusalPaths> = {
  central_incisor: {
    outline: 'M15,5 Q30,0 45,5 Q55,15 52,30 Q53,45 45,55 Q30,60 15,55 Q7,45 8,30 Q5,15 15,5Z',
    B: 'M15,5 Q30,0 45,5 Q40,15 30,18 Q20,15 15,5Z',
    O: 'M20,18 Q30,15 40,18 L38,42 Q30,45 22,42Z',
    L: 'M15,55 Q30,60 45,55 Q40,45 30,42 Q20,45 15,55Z',
    M: 'M15,5 Q5,15 8,30 Q7,45 15,55 Q20,45 22,42 L20,18 Q20,15 15,5Z',
    D: 'M45,5 Q55,15 52,30 Q53,45 45,55 Q40,45 38,42 L40,18 Q40,15 45,5Z',
  },
  lateral_incisor: {
    outline: 'M17,6 Q30,1 43,6 Q52,16 50,30 Q51,44 43,54 Q30,58 17,54 Q9,44 10,30 Q7,16 17,6Z',
    B: 'M17,6 Q30,1 43,6 Q38,16 30,18 Q22,16 17,6Z',
    O: 'M22,18 Q30,15 38,18 L36,40 Q30,43 24,40Z',
    L: 'M17,54 Q30,58 43,54 Q38,44 30,42 Q22,44 17,54Z',
    M: 'M17,6 Q7,16 10,30 Q9,44 17,54 Q22,44 24,40 L22,18 Q22,16 17,6Z',
    D: 'M43,6 Q52,16 50,30 Q51,44 43,54 Q38,44 36,40 L38,18 Q38,16 43,6Z',
  },
  canine: {
    outline: 'M14,8 Q30,0 46,8 Q56,20 52,32 Q53,46 46,55 Q30,60 14,55 Q7,46 8,32 Q4,20 14,8Z',
    B: 'M14,8 Q30,0 46,8 Q40,18 30,20 Q20,18 14,8Z',
    O: 'M22,20 Q30,17 38,20 L37,42 Q30,46 23,42Z',
    L: 'M14,55 Q30,60 46,55 Q40,46 30,44 Q20,46 14,55Z',
    M: 'M14,8 Q4,20 8,32 Q7,46 14,55 Q20,46 23,42 L22,20 Q20,18 14,8Z',
    D: 'M46,8 Q56,20 52,32 Q53,46 46,55 Q40,46 37,42 L38,20 Q40,18 46,8Z',
  },
  first_premolar: {
    outline: 'M12,8 Q30,2 48,8 Q56,22 54,34 Q55,48 48,56 Q30,60 12,56 Q5,48 6,34 Q4,22 12,8Z',
    B: 'M12,8 Q30,2 48,8 Q42,18 30,20 Q18,18 12,8Z',
    O: 'M20,20 Q30,17 40,20 L39,42 Q30,46 21,42Z',
    L: 'M12,56 Q30,60 48,56 Q42,48 30,44 Q18,48 12,56Z',
    M: 'M12,8 Q4,22 6,34 Q5,48 12,56 Q18,48 21,42 L20,20 Q18,18 12,8Z',
    D: 'M48,8 Q56,22 54,34 Q55,48 48,56 Q42,48 39,42 L40,20 Q42,18 48,8Z',
  },
  second_premolar: {
    outline: 'M12,7 Q30,1 48,7 Q57,22 55,35 Q56,49 48,57 Q30,61 12,57 Q4,49 5,35 Q3,22 12,7Z',
    B: 'M12,7 Q30,1 48,7 Q42,18 30,20 Q18,18 12,7Z',
    O: 'M20,20 Q30,17 40,20 L39,42 Q30,46 21,42Z',
    L: 'M12,57 Q30,61 48,57 Q42,49 30,44 Q18,49 12,57Z',
    M: 'M12,7 Q3,22 5,35 Q4,49 12,57 Q18,49 21,42 L20,20 Q18,18 12,7Z',
    D: 'M48,7 Q57,22 55,35 Q56,49 48,57 Q42,49 39,42 L40,20 Q42,18 48,7Z',
  },
  first_molar: {
    outline: 'M8,6 Q30,0 52,6 Q60,20 58,34 Q60,50 52,58 Q30,62 8,58 Q0,50 2,34 Q0,20 8,6Z',
    B: 'M8,6 Q30,0 52,6 Q44,16 30,18 Q16,16 8,6Z',
    O: 'M18,18 Q30,15 42,18 L41,42 Q30,46 19,42Z',
    L: 'M8,58 Q30,62 52,58 Q44,50 30,46 Q16,50 8,58Z',
    M: 'M8,6 Q0,20 2,34 Q0,50 8,58 Q16,50 19,42 L18,18 Q16,16 8,6Z',
    D: 'M52,6 Q60,20 58,34 Q60,50 52,58 Q44,50 41,42 L42,18 Q44,16 52,6Z',
  },
  second_molar: {
    outline: 'M9,7 Q30,1 51,7 Q59,20 57,33 Q59,48 51,56 Q30,60 9,56 Q1,48 3,33 Q1,20 9,7Z',
    B: 'M9,7 Q30,1 51,7 Q44,16 30,18 Q16,16 9,7Z',
    O: 'M18,18 Q30,15 42,18 L41,42 Q30,45 19,42Z',
    L: 'M9,56 Q30,60 51,56 Q44,48 30,45 Q16,48 9,56Z',
    M: 'M9,7 Q1,20 3,33 Q1,48 9,56 Q16,48 19,42 L18,18 Q16,16 9,7Z',
    D: 'M51,7 Q59,20 57,33 Q59,48 51,56 Q44,48 41,42 L42,18 Q44,16 51,7Z',
  },
  third_molar: {
    outline: 'M11,8 Q30,2 49,8 Q57,20 55,32 Q57,46 49,54 Q30,58 11,54 Q3,46 5,32 Q3,20 11,8Z',
    B: 'M11,8 Q30,2 49,8 Q43,17 30,19 Q17,17 11,8Z',
    O: 'M19,19 Q30,16 41,19 L40,40 Q30,44 20,40Z',
    L: 'M11,54 Q30,58 49,54 Q43,46 30,44 Q17,46 11,54Z',
    M: 'M11,8 Q3,20 5,32 Q3,46 11,54 Q17,46 20,40 L19,19 Q17,17 11,8Z',
    D: 'M49,8 Q57,20 55,32 Q57,46 49,54 Q43,46 40,40 L41,19 Q43,17 49,8Z',
  },
};

/* ── Lateral paths (viewBox 0 0 40 80) ── */
/* Crown sits in the upper portion (y 0-35), roots extend down (y 35-80) */

const LATERAL: Record<ToothType, LateralPaths> = {
  central_incisor: {
    crown: 'M10,35 Q8,20 10,10 Q14,2 20,0 Q26,2 30,10 Q32,20 30,35Z',
    roots: ['M16,35 Q18,55 20,72 Q22,55 24,35Z'],
  },
  lateral_incisor: {
    crown: 'M11,35 Q9,20 11,10 Q15,3 20,1 Q25,3 29,10 Q31,20 29,35Z',
    roots: ['M16,35 Q17,52 19,70 Q21,52 24,35Z'],
  },
  canine: {
    crown: 'M10,35 Q8,18 12,8 Q16,1 20,0 Q24,1 28,8 Q32,18 30,35Z',
    roots: ['M15,35 Q17,52 20,76 Q23,52 25,35Z'],
  },
  first_premolar: {
    crown: 'M8,35 Q6,20 10,10 Q14,3 20,1 Q26,3 30,10 Q34,20 32,35Z',
    roots: [
      'M12,35 Q13,50 15,68 Q17,50 18,35Z',
      'M22,35 Q23,50 25,68 Q27,50 28,35Z',
    ],
  },
  second_premolar: {
    crown: 'M9,35 Q7,20 10,10 Q14,3 20,1 Q26,3 30,10 Q33,20 31,35Z',
    roots: ['M16,35 Q18,55 20,74 Q22,55 24,35Z'],
  },
  first_molar: {
    crown: 'M5,35 Q3,20 7,10 Q12,2 20,0 Q28,2 33,10 Q37,20 35,35Z',
    roots: [
      'M8,35 Q9,48 10,64 Q12,48 14,35Z',
      'M17,35 Q18,50 20,70 Q22,50 23,35Z',
      'M26,35 Q27,48 30,64 Q32,48 32,35Z',
    ],
  },
  second_molar: {
    crown: 'M6,35 Q4,20 8,10 Q13,2 20,0 Q27,2 32,10 Q36,20 34,35Z',
    roots: [
      'M9,35 Q10,48 11,62 Q13,48 15,35Z',
      'M18,35 Q19,50 20,68 Q22,50 23,35Z',
      'M26,35 Q27,48 29,62 Q31,48 31,35Z',
    ],
  },
  third_molar: {
    crown: 'M7,35 Q5,20 9,10 Q14,3 20,1 Q26,3 31,10 Q35,20 33,35Z',
    roots: [
      'M11,35 Q12,46 14,58 Q16,46 18,35Z',
      'M22,35 Q23,46 26,58 Q28,46 29,35Z',
    ],
  },
};

export function getOcclusalPaths(type: ToothType): OcclusalPaths {
  return OCCLUSAL[type];
}

export function getLateralPaths(type: ToothType): LateralPaths {
  return LATERAL[type];
}
