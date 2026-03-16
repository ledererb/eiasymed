'use client';
import { useReducer, useCallback } from 'react';
import type { ToothSurface, SurfaceCondition, ToothData, ToothCondition, ToothStatus, ChartMode, PaletteSelection } from '../types';
import { QUADRANT_TEETH } from '../utils/toothConstants';

// ── State ──

interface ChartState {
  teeth: Record<number, ToothData>;
  selectedTooth: number | null;
  selectedSurface: ToothSurface | null;
  palette: PaletteSelection;
  hoveredSurface: { fdi: number; surface: ToothSurface } | null;
}

// ── Actions ──

type ChartAction =
  | { type: 'SET_SURFACE_CONDITION'; fdi: number; surface: ToothSurface; condition: SurfaceCondition }
  | { type: 'SET_TOOTH_STATUS'; fdi: number; status: ToothStatus }
  | { type: 'TOGGLE_TOOTH_CONDITION'; fdi: number; condition: ToothCondition }
  | { type: 'SELECT_TOOTH'; fdi: number | null }
  | { type: 'SELECT_SURFACE'; surface: ToothSurface | null }
  | { type: 'SET_PALETTE'; palette: PaletteSelection }
  | { type: 'SET_HOVERED_SURFACE'; data: { fdi: number; surface: ToothSurface } | null };

function chartReducer(state: ChartState, action: ChartAction): ChartState {
  switch (action.type) {
    case 'SET_SURFACE_CONDITION': {
      const tooth = state.teeth[action.fdi];
      if (!tooth) return state;
      return {
        ...state,
        teeth: {
          ...state.teeth,
          [action.fdi]: {
            ...tooth,
            surfaces: {
              ...tooth.surfaces,
              [action.surface]: { ...tooth.surfaces[action.surface], condition: action.condition },
            },
          },
        },
      };
    }
    case 'SET_TOOTH_STATUS': {
      const tooth = state.teeth[action.fdi];
      if (!tooth) return state;
      return {
        ...state,
        teeth: { ...state.teeth, [action.fdi]: { ...tooth, status: action.status } },
      };
    }
    case 'TOGGLE_TOOTH_CONDITION': {
      const tooth = state.teeth[action.fdi];
      if (!tooth) return state;
      const has = tooth.conditions.includes(action.condition);
      return {
        ...state,
        teeth: {
          ...state.teeth,
          [action.fdi]: {
            ...tooth,
            conditions: has
              ? tooth.conditions.filter(c => c !== action.condition)
              : [...tooth.conditions, action.condition],
          },
        },
      };
    }
    case 'SELECT_TOOTH':
      return { ...state, selectedTooth: action.fdi, selectedSurface: null };
    case 'SELECT_SURFACE':
      return { ...state, selectedSurface: action.surface };
    case 'SET_PALETTE':
      return { ...state, palette: action.palette };
    case 'SET_HOVERED_SURFACE':
      return { ...state, hoveredSurface: action.data };
    default:
      return state;
  }
}

// ── Initializer ──

function createBlankSurface(): Record<ToothSurface, { condition: SurfaceCondition }> {
  return {
    M: { condition: 'intact' },
    O: { condition: 'intact' },
    D: { condition: 'intact' },
    B: { condition: 'intact' },
    L: { condition: 'intact' },
  };
}

function createInitialTeeth(): Record<number, ToothData> {
  const teeth: Record<number, ToothData> = {};
  for (const quad of [1, 2, 3, 4] as const) {
    for (const fdi of QUADRANT_TEETH[quad]) {
      teeth[fdi] = {
        fdi,
        status: 'present',
        conditions: [],
        surfaces: createBlankSurface(),
        treatments: [],
      };
    }
  }

  // Pre-populate demo data for showcase
  // Tooth 16: composite filling on O and D
  teeth[16].surfaces.O.condition = 'filling_composite';
  teeth[16].surfaces.D.condition = 'filling_composite';
  // Tooth 36: amalgam filling on O
  teeth[36].surfaces.O.condition = 'filling_amalgam';
  // Tooth 26: caries on M
  teeth[26].surfaces.M.condition = 'caries';
  // Tooth 46: filling defect on O and B
  teeth[46].surfaces.O.condition = 'filling_defect';
  teeth[46].surfaces.B.condition = 'filling_defect';
  // Tooth 11: fracture on incisal
  teeth[11].surfaces.O.condition = 'fracture';
  // Tooth 24: inlay on O
  teeth[24].surfaces.O.condition = 'inlay';
  // Tooth 37: caries on M and O
  teeth[37].surfaces.M.condition = 'caries';
  teeth[37].surfaces.O.condition = 'caries';
  // Tooth 18: missing
  teeth[18].status = 'missing';
  // Tooth 28: missing
  teeth[28].status = 'missing';
  // Tooth 38: unerupted
  teeth[38].status = 'unerupted';
  // Tooth 15: crown
  teeth[15].conditions = ['crown_ceramic'];
  // Tooth 47: root canal
  teeth[47].conditions = ['root_canal'];
  // Tooth 45: implant
  teeth[45].status = 'implant';
  // Tooth 14: temp filling
  teeth[14].surfaces.O.condition = 'filling_temp';

  return teeth;
}

function createInitialState(): ChartState {
  return {
    teeth: createInitialTeeth(),
    selectedTooth: null,
    selectedSurface: null,
    palette: { mode: 'status', condition: 'caries' },
    hoveredSurface: null,
  };
}

// ── Hook ──

export function useDentalChart() {
  const [state, dispatch] = useReducer(chartReducer, null, createInitialState);

  const selectTooth = useCallback((fdi: number | null) => {
    dispatch({ type: 'SELECT_TOOTH', fdi });
  }, []);

  const selectSurface = useCallback((surface: ToothSurface | null) => {
    dispatch({ type: 'SELECT_SURFACE', surface });
  }, []);

  const applySurfaceCondition = useCallback((fdi: number, surface: ToothSurface) => {
    if (state.palette.mode === 'status' && state.palette.condition) {
      dispatch({ type: 'SET_SURFACE_CONDITION', fdi, surface, condition: state.palette.condition });
    }
    dispatch({ type: 'SELECT_TOOTH', fdi });
    dispatch({ type: 'SELECT_SURFACE', surface });
  }, [state.palette]);

  const setToothStatus = useCallback((fdi: number, status: ToothStatus) => {
    dispatch({ type: 'SET_TOOTH_STATUS', fdi, status });
  }, []);

  const toggleToothCondition = useCallback((fdi: number, condition: ToothCondition) => {
    dispatch({ type: 'TOGGLE_TOOTH_CONDITION', fdi, condition });
  }, []);

  const setPalette = useCallback((palette: PaletteSelection) => {
    dispatch({ type: 'SET_PALETTE', palette });
  }, []);

  const setHoveredSurface = useCallback((data: { fdi: number; surface: ToothSurface } | null) => {
    dispatch({ type: 'SET_HOVERED_SURFACE', data });
  }, []);

  return {
    state,
    selectTooth,
    selectSurface,
    applySurfaceCondition,
    setToothStatus,
    toggleToothCondition,
    setPalette,
    setHoveredSurface,
  };
}
