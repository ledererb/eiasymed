/* ── Dental Chart Types (FDI standard) ── */

// Tooth surfaces
export type ToothSurface = 'M' | 'O' | 'D' | 'B' | 'L';

// Tooth presence status
export type ToothStatus = 'present' | 'missing' | 'implant' | 'deciduous' | 'retained_root' | 'unerupted';

// Per-surface conditions
export type SurfaceCondition =
  | 'intact'
  | 'caries'
  | 'filling_composite'
  | 'filling_amalgam'
  | 'filling_temp'
  | 'filling_defect'
  | 'inlay'
  | 'onlay'
  | 'sealant'
  | 'fracture'
  | 'abrasion'
  | 'erosion'
  | 'secondary_caries';

// Whole-tooth conditions
export type ToothCondition =
  | 'crown_metal'
  | 'crown_ceramic'
  | 'crown_pfm'
  | 'crown_zirconia'
  | 'root_canal'
  | 'post_core'
  | 'bridge_abutment'
  | 'bridge_pontic'
  | 'veneer'
  | 'stift'
  | 'denture_clasp'
  | 'orthodontic_bracket'
  | 'periodontal_pocket'
  | 'mobility_1'
  | 'mobility_2'
  | 'mobility_3'
  | 'periapical_lesion'
  | 'recession';

// Treatment types
export type TreatmentType =
  | 'composite_filling'
  | 'amalgam_filling'
  | 'inlay_onlay'
  | 'crown_ceramic'
  | 'crown_metal'
  | 'crown_pfm'
  | 'crown_zirconia'
  | 'root_canal'
  | 'extraction'
  | 'implant'
  | 'bridge'
  | 'veneer'
  | 'sealant'
  | 'scaling'
  | 'periodontal_treatment'
  | 'orthodontic'
  | 'stift_placement'
  | 'denture_partial'
  | 'denture_full'
  | 'fissure_seal';

export type TreatmentStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

// Surface data
export interface SurfaceData {
  condition: SurfaceCondition;
  treatment?: {
    type: TreatmentType;
    status: TreatmentStatus;
    note?: string;
  };
}

// Single tooth
export interface ToothData {
  fdi: number;
  status: ToothStatus;
  conditions: ToothCondition[];
  surfaces: Record<ToothSurface, SurfaceData>;
  treatments: {
    type: TreatmentType;
    status: TreatmentStatus;
    note?: string;
    linkedTeeth?: number[];
  }[];
  notes?: string;
}

// Full chart
export interface DentalChart {
  patientId: string;
  createdAt: string;
  updatedAt: string;
  teeth: Record<number, ToothData>;
}

// Tooth type classification
export type ToothType = 'central_incisor' | 'lateral_incisor' | 'canine' | 'first_premolar' | 'second_premolar' | 'first_molar' | 'second_molar' | 'third_molar';

// Chart mode
export type ChartMode = 'status' | 'treatment';

// Quadrant (1=upper-right, 2=upper-left, 3=lower-left, 4=lower-right)
export type Quadrant = 1 | 2 | 3 | 4;

// Active palette selection
export interface PaletteSelection {
  mode: ChartMode;
  condition?: SurfaceCondition;
  treatment?: TreatmentType;
  toothCondition?: ToothCondition;
}
