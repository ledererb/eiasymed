'use client';
import React from 'react';
import type { ChartMode, ToothSurface } from './types';
import { QuadrantView } from './quadrant/QuadrantView';
import { DentalChartToolbar } from './DentalChartToolbar';
import { DentalChartPalette } from './DentalChartPalette';
import { ToothDetailPanel } from './detail/ToothDetailPanel';
import { useDentalChart } from './hooks/useDentalChart';
import { STATUS_COLORS, STATUS_LABELS } from './utils/toothConstants';
import type { SurfaceCondition } from './types';
import styles from './DentalChart.module.css';

export function DentalChart() {
  const {
    state,
    selectTooth,
    selectSurface,
    applySurfaceCondition,
    setPalette,
    setHoveredSurface,
  } = useDentalChart();

  const handleModeChange = (mode: ChartMode) => {
    setPalette(
      mode === 'status'
        ? { mode: 'status', condition: 'caries' }
        : { mode: 'treatment', treatment: 'composite_filling' }
    );
  };

  const handleSurfaceClick = (fdi: number, surface: ToothSurface) => {
    applySurfaceCondition(fdi, surface);
  };

  const handleSurfaceHover = (fdi: number, surface: ToothSurface | null) => {
    setHoveredSurface(surface ? { fdi, surface } : null);
  };

  const selectedToothData = state.selectedTooth ? state.teeth[state.selectedTooth] : null;

  return (
    <div>
      {/* Toolbar */}
      <DentalChartToolbar mode={state.palette.mode} onModeChange={handleModeChange} />

      {/* Palette */}
      <DentalChartPalette palette={state.palette} onSelect={setPalette} />

      {/* Chart + Detail */}
      <div className={styles.chartWrapper}>
        <div className={styles.chartMain}>
          {/* Zsigmondy cross: 4 quadrants */}
          <div className={styles.chartGrid}>
            {/* Q1: upper-right */}
            <QuadrantView
              quadrant={1}
              teeth={state.teeth}
              selectedTooth={state.selectedTooth}
              selectedSurface={state.selectedSurface}
              onToothClick={selectTooth}
              onSurfaceClick={handleSurfaceClick}
              onSurfaceHover={handleSurfaceHover}
            />
            {/* Q2: upper-left */}
            <QuadrantView
              quadrant={2}
              teeth={state.teeth}
              selectedTooth={state.selectedTooth}
              selectedSurface={state.selectedSurface}
              onToothClick={selectTooth}
              onSurfaceClick={handleSurfaceClick}
              onSurfaceHover={handleSurfaceHover}
            />
            {/* Q4: lower-right */}
            <QuadrantView
              quadrant={4}
              teeth={state.teeth}
              selectedTooth={state.selectedTooth}
              selectedSurface={state.selectedSurface}
              onToothClick={selectTooth}
              onSurfaceClick={handleSurfaceClick}
              onSurfaceHover={handleSurfaceHover}
            />
            {/* Q3: lower-left */}
            <QuadrantView
              quadrant={3}
              teeth={state.teeth}
              selectedTooth={state.selectedTooth}
              selectedSurface={state.selectedSurface}
              onToothClick={selectTooth}
              onSurfaceClick={handleSurfaceClick}
              onSurfaceHover={handleSurfaceHover}
            />
          </div>

          {/* Legend */}
          <div className={styles.legend}>
            {(Object.entries(STATUS_COLORS) as [SurfaceCondition, string][]).map(([key, color]) => (
              <div key={key} className={styles.legendItem}>
                <span className={styles.legendDot} style={{ background: color }} />
                {STATUS_LABELS[key]}
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel or placeholder */}
        {selectedToothData ? (
          <ToothDetailPanel
            tooth={selectedToothData}
            selectedSurface={state.selectedSurface}
            onSurfaceClick={selectSurface}
          />
        ) : (
          <div className={styles.noSelection}>
            <div className={styles.noSelectionIcon}>🦷</div>
            <div className={styles.noSelectionText}>
              Válasszon fogat a részletek megtekintéséhez
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DentalChart;
