/**
 * FDI ↔ Zsigmondy Notation Conversion Utility
 * 
 * FDI (Fédération Dentaire Internationale):
 *   Quadrant 1 (upper-right): 11-18
 *   Quadrant 2 (upper-left):  21-28
 *   Quadrant 3 (lower-left):  31-38
 *   Quadrant 4 (lower-right): 41-48
 * 
 * Zsigmondy (Hungarian cross notation):
 *   Upper-right: 1┘2┘3┘4┘5┘6┘7┘8┘
 *   Upper-left:  └1└2└3└4└5└6└7└8
 *   Lower-left:  ┌1┌2┌3┌4┌5┌6┌7┌8
 *   Lower-right: 1┐2┐3┐4┐5┐6┐7┐8┐
 */

export type NotationSystem = 'fdi' | 'zsigmondy';

/**
 * Convert FDI number to Zsigmondy display string
 * e.g. 11 → "1┘", 21 → "└1", 31 → "┌1", 41 → "1┐"
 */
export function fdiToZsigmondy(fdi: number): string {
  const quadrant = Math.floor(fdi / 10);
  const tooth = fdi % 10;
  
  switch (quadrant) {
    case 1: return `${tooth}┘`; // upper-right
    case 2: return `└${tooth}`; // upper-left
    case 3: return `┌${tooth}`; // lower-left
    case 4: return `${tooth}┐`; // lower-right
    default: return String(fdi);
  }
}

/**
 * Convert FDI to a compact Zsigmondy reference (without box-drawing)
 * For use in labels: "FJ 3" (felső jobb 3)
 */
export function fdiToZsigmondyLabel(fdi: number): string {
  const quadrant = Math.floor(fdi / 10);
  const tooth = fdi % 10;
  
  const quadrantLabels: Record<number, string> = {
    1: 'FJ', // felső jobb
    2: 'FB', // felső bal
    3: 'AB', // alsó bal
    4: 'AJ', // alsó jobb
  };
  
  return `${quadrantLabels[quadrant] || '?'} ${tooth}`;
}

/**
 * Format tooth number based on selected notation system
 */
export function formatToothNumber(fdi: number, system: NotationSystem): string {
  if (system === 'zsigmondy') return fdiToZsigmondy(fdi);
  return String(fdi);
}

/**
 * Get the universal tooth name in Hungarian
 */
export function getToothNameHu(fdi: number): string {
  const tooth = fdi % 10;
  const quadrant = Math.floor(fdi / 10);
  
  const names: Record<number, string> = {
    1: 'Metszőfog',
    2: 'Oldalsó metszőfog',
    3: 'Szemfog',
    4: 'Első kisőrlő',
    5: 'Második kisőrlő',
    6: 'Első nagyőrlő',
    7: 'Második nagyőrlő',
    8: 'Bölcsességfog',
  };

  const positions: Record<number, string> = {
    1: 'Felső jobb',
    2: 'Felső bal',
    3: 'Alsó bal',
    4: 'Alsó jobb',
  };

  return `${positions[quadrant] || ''} ${names[tooth] || ''}`.trim();
}

/**
 * Get all FDI numbers for the full adult dentition
 */
export function getAllFDINumbers(): number[] {
  const teeth: number[] = [];
  for (const q of [1, 2, 3, 4]) {
    for (let t = 1; t <= 8; t++) {
      teeth.push(q * 10 + t);
    }
  }
  return teeth;
}

/**
 * Hungarian finding labels for the dental chart palette
 */
export const FINDING_LABELS_HU: Record<string, string> = {
  // Surface conditions
  intact: 'Ép',
  caries: 'Szuvasodás',
  secondary_caries: 'Szekunder szuvasodás',
  filling_composite: 'Kompozit tömés',
  filling_amalgam: 'Amalgám tömés',
  filling_temp: 'Ideiglenes tömés',
  filling_defect: 'Tömés hiba',
  inlay: 'Inlay',
  onlay: 'Onlay',
  sealant: 'Fissura zárás',
  fracture: 'Törés',
  abrasion: 'Abráció',
  erosion: 'Erózió',
  // Tooth conditions
  crown_metal: 'Fém korona',
  crown_ceramic: 'Kerámia korona',
  crown_pfm: 'Fém-kerámia korona',
  crown_zirconia: 'Cirkónium korona',
  root_canal: 'Gyökérkezelés',
  post_core: 'Csapos felépítmény',
  bridge_abutment: 'Híd pillér',
  bridge_pontic: 'Híd köztes tag',
  veneer: 'Héj (veneer)',
  stift: 'Stift',
  denture_clasp: 'Protézis kapocs',
  orthodontic_bracket: 'Fogszabályozó bracket',
  periodontal_pocket: 'Parodontális tasak',
  mobility_1: 'I. fokú mozgathatóság',
  mobility_2: 'II. fokú mozgathatóság',
  mobility_3: 'III. fokú mozgathatóság',
  periapical_lesion: 'Periapikális elváltozás',
  recession: 'Ínyrecesszió',
  // Tooth status
  present: 'Jelen van',
  missing: 'Hiányzik',
  implant: 'Implantátum',
  deciduous: 'Tejfog',
  retained_root: 'Reziduális gyökér',
  unerupted: 'Nem áttört',
};
