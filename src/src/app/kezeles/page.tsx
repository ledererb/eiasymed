'use client';

import React, { useState, useEffect } from 'react';
import {
  Pencil, X,
} from '@phosphor-icons/react';
import { AppShell } from '@/components/AppShell';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { AdminHeader } from '@/components/AdminHeader';
import { ContentTabbedPanel } from '@/components/ContentTabbedPanel';
import { StatusTabbedPanel } from '@/components/StatusTabbedPanel';
import { TreatmentPlanRow } from '@/components/TreatmentPlanRow';
import { TreatmentDetailDrawer } from '@/components/Drawer';
import { VoiceRecordingBar } from '@/components/VoiceRecordingBar';
import {
  TPHeader, VisitDivider, VisitSumRow, DocumentRow,
  AddTreatmentRow, DurationRow, TPStatusHeader, BeviteliMod, SaveTPRow,
} from '@/components/TreatmentPlan';
import { Tabs } from '@/components/Tabs';
import { createClient } from '@/lib/supabase-browser';
import styles from './page.module.css';

interface TreatmentType {
  id: string;
  name: string;
  base_price: number;
  category: string;
  estimated_duration_minutes: number;
}

type WorkflowStep =
  | 'consultation_default'
  | 'consultation_voxis'
  | 'tp_writing'
  | 'tp_saved'
  | 'visit_1'
  | 'visit_2'
  | 'visit_2_drawer';

const STEP_LABELS: Record<WorkflowStep, string> = {
  consultation_default: 'Konzultáció (alap)',
  consultation_voxis: 'Konzultáció + Voxis',
  tp_writing: 'KT írás',
  tp_saved: 'KT mentve',
  visit_1: '1. vizit',
  visit_2: '2. vizit',
  visit_2_drawer: '2. vizit + Drawer',
};

const STATUS_MAP: Record<WorkflowStep, string> = {
  consultation_default: 'megérkezett',
  consultation_voxis: 'konzultáció folyamatban',
  tp_writing: 'konzultáció folyamatban',
  tp_saved: 'konzultáció folyamatban',
  visit_1: 'vizit folyamatban',
  visit_2: 'vizit folyamatban',
  visit_2_drawer: 'vizit folyamatban',
};

const formatPrice = (n: number) =>
  new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(n);

export default function KezelesPage() {
  const [step, setStep] = useState<WorkflowStep>('consultation_default');
  const [rightTab, setRightTab] = useState('kezeles');
  const drawerOpen = step === 'visit_2_drawer';

  // Supabase data
  const [treatmentTypes, setTreatmentTypes] = useState<TreatmentType[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchTreatmentTypes() {
      const { data } = await supabase
        .from('treatment_types')
        .select('id, name, base_price, category, estimated_duration_minutes')
        .eq('is_active', true)
        .order('category')
        .order('name');
      setTreatmentTypes(data || []);
    }
    fetchTreatmentTypes();
  }, []);

  // Build treatment lists from DB data
  const diagnosticItems = treatmentTypes.filter(t => t.category === 'diagnostic');
  const restorativeItems = treatmentTypes.filter(t => ['restorative', 'endodontic'].includes(t.category));
  const surgicalItems = treatmentTypes.filter(t => ['surgical', 'implant', 'prosthetic'].includes(t.category));
  const preventiveItems = treatmentTypes.filter(t => t.category === 'preventive');

  const consultItems = diagnosticItems.slice(0, 3).map(t => ({
    name: t.name, area: 'Teljes szájüreg', price: formatPrice(t.base_price), qty: '× 1', total: formatPrice(t.base_price),
  }));

  const visit1Items = surgicalItems.length > 0
    ? surgicalItems.slice(0, 6).map((t, i) => ({
        name: t.name, area: i < 2 ? 'Teljes szájüreg' : '12, 15, 22, 25',
        price: formatPrice(t.base_price), qty: i >= 2 ? '× 4' : '× 1',
        total: formatPrice(t.base_price * (i >= 2 ? 4 : 1)),
      }))
    : restorativeItems.slice(0, 4).map(t => ({
        name: t.name, area: 'Teljes szájüreg', price: formatPrice(t.base_price), qty: '× 1', total: formatPrice(t.base_price),
      }));

  const visit2Items = [...restorativeItems, ...preventiveItems].slice(0, 5).map((t, i) => ({
    name: t.name, area: i === 0 ? 'Teljes szájüreg' : '12, 15, 22, 25',
    price: formatPrice(t.base_price), qty: i >= 1 && i <= 3 ? '× 4' : '× 1',
    total: formatPrice(t.base_price * (i >= 1 && i <= 3 ? 4 : 1)),
  }));

  const consultTotal = consultItems.reduce((s, i) => {
    const num = parseInt(i.total.replace(/[^\d]/g, ''));
    return s + (isNaN(num) ? 0 : num);
  }, 0);
  
  const visit1Total = visit1Items.reduce((s, i) => {
    const num = parseInt(i.total.replace(/[^\d]/g, ''));
    return s + (isNaN(num) ? 0 : num);
  }, 0);

  const visit2Total = visit2Items.reduce((s, i) => {
    const num = parseInt(i.total.replace(/[^\d]/g, ''));
    return s + (isNaN(num) ? 0 : num);
  }, 0);

  const showTPWriting = step === 'tp_writing' || step === 'tp_saved' || step === 'visit_1' || step === 'visit_2' || step === 'visit_2_drawer';
  const showVoxis = step === 'consultation_voxis';
  const showTPStatus = step === 'tp_saved' || step === 'visit_1' || step === 'visit_2' || step === 'visit_2_drawer';
  const showVisit1Completed = step === 'visit_2' || step === 'visit_2_drawer';
  const showVisit2 = step === 'visit_1' || step === 'visit_2' || step === 'visit_2_drawer';

  const editActions = (
    <span style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
      <Pencil size={17} style={{ cursor: 'pointer', opacity: 0.6 }} />
      <X size={18} style={{ cursor: 'pointer', opacity: 0.6 }} />
    </span>
  );

  const doneCheck = <span style={{ color: 'var(--color-success-500)', fontSize: 18 }}>✓</span>;

  return (
    <AppShell>
      {/* Step selector bar (demo) */}
      <div className={styles.stepBar}>
        <span className={styles.stepBarLabel}>Lépés:</span>
        {(Object.entries(STEP_LABELS) as [WorkflowStep, string][]).map(([key, label]) => (
          <button
            key={key}
            className={`${styles.stepBtn} ${step === key ? styles.stepBtnActive : ''}`}
            onClick={() => setStep(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <Breadcrumbs
        items={[
          { label: 'Bíró János Attila' },
          { label: 'KEZELÉSI TERV' },
        ]}
      />

      <AdminHeader
        patientName="Bíró János Attila"
        status={STATUS_MAP[step]}
      />

      <div className={styles.columns}>
        {/* LEFT PANEL */}
        <div className={styles.leftPanel}>
          <ContentTabbedPanel />
          <StatusTabbedPanel />
        </div>

        {/* RIGHT PANEL */}
        <div className={styles.rightPanel}>
          <Tabs
            items={[
              { id: 'kezeles', label: 'Kezelési terv' },
              { id: 'idopont', label: 'Időpont' },
            ]}
            activeId={rightTab}
            onSelect={setRightTab}
            variant="light"
          />

          <div className={styles.rightContent}>
            {/* TP Status Header */}
            {showTPStatus && (
              <TPStatusHeader
                status="ELFOGADVA"
                date="2026. 01. 26. 14:34"
                doctorName="Dr. Harmathy Béla"
              />
            )}

            {/* TP Header bar */}
            <TPHeader
              id="#1301234567899"
              title={showTPWriting ? 'All-on-4 felső, full kontúr cirkon híd' : 'Konzultáció'}
              showIcons
            />

            {/* ── CONSULTATION SECTION ── */}
            <VisitDivider
              visitNumber={1}
              status={showVisit1Completed ? 'completed' : step === 'visit_1' ? 'active' : 'upcoming'}
              actionLabel={step === 'consultation_default' ? 'Konzultáció indítása' : undefined}
              date={showVisit1Completed ? '2026. 02. 11. (Hé) 13:00' : undefined}
              doctorName={showVisit1Completed ? 'Dr. Harmathy Béla' : undefined}
            />

            {/* Document rows */}
            <DocumentRow
              name="Beleegyező / Röntgen"
              status={showTPWriting ? 'signed' : 'alert'}
            />

            {/* Consultation treatment rows — from Supabase */}
            {consultItems.map((item, i) => (
              <TreatmentPlanRow
                key={`consult-${i}`}
                type={showVisit1Completed ? 'row-done' : 'row-edit'}
                label={item.name}
                secondaryLabel={`${item.area}   ${item.price}   ${item.qty}`}
                amount={item.total}
                actions={showVisit1Completed ? doneCheck : editActions}
              />
            ))}

            <AddTreatmentRow />
            <VisitSumRow label="KONZULTÁCIÓ ÖSSZESEN" amount={formatPrice(consultTotal)} />

            {!showTPWriting && (
              <VisitDivider visitNumber={1} actionLabel="Konzultáció lezárása" />
            )}

            {/* ── TREATMENT PLAN SECTION ── */}
            {showTPWriting && (
              <>
                {(step === 'tp_saved' || step === 'visit_1' || step === 'visit_2') && (
                  <TPHeader id="#1301234567899" title="All-on-4 felső, full kontúr cirkon híd" showIcons />
                )}

                <VisitDivider
                  visitNumber={1}
                  status={showVisit1Completed ? 'active' : 'upcoming'}
                />

                {/* Visit 1 items — from Supabase */}
                {visit1Items.map((item, i) => (
                  <TreatmentPlanRow
                    key={`v1-${i}`}
                    type={showVisit1Completed ? 'row-done' : 'row-edit'}
                    label={item.name}
                    secondaryLabel={`${item.area}   ${item.price}   ${item.qty}`}
                    amount={item.total}
                    actions={showVisit1Completed ? doneCheck : editActions}
                  />
                ))}

                <AddTreatmentRow label="+ Új kezelés hozzáadása" />
                <DurationRow />
                <VisitSumRow
                  label="1. vizit összesen"
                  amount={showVisit1Completed ? `Fizetve: ${formatPrice(visit1Total)}` : formatPrice(visit1Total)}
                  variant={showVisit1Completed ? 'total' : 'visit'}
                />

                {/* Visit 2 */}
                {showVisit2 && (
                  <>
                    <VisitDivider
                      visitNumber={2}
                      actionLabel={step === 'visit_2' ? 'Vizit indítása' : undefined}
                    />

                    {/* Visit 2 items — from Supabase */}
                    {visit2Items.map((item, i) => (
                      <TreatmentPlanRow
                        key={`v2-${i}`}
                        type="row-edit"
                        label={item.name}
                        secondaryLabel={`${item.area}   ${item.price}   ${item.qty}`}
                        amount={item.total}
                        actions={editActions}
                      />
                    ))}

                    <AddTreatmentRow label="+ Új kezelés hozzáadása" />
                    {showVisit1Completed && <DocumentRow name="Protetika átadási nyilatkozat" status="alert" />}
                    <DurationRow />
                    <VisitSumRow label="2. vizit összesen" amount={formatPrice(visit2Total)} />
                  </>
                )}

                <VisitSumRow label="KEZELÉS ÖSSZESEN" amount={formatPrice(visit1Total + visit2Total)} variant="total" />

                {step === 'tp_writing' && <SaveTPRow />}
                {step === 'visit_2' && <VisitDivider visitNumber={2} actionLabel="Vizit lezárása" />}
              </>
            )}

            {/* Voxis section */}
            {showVoxis && (
              <>
                <TPHeader id="#1301234567899" title="Konzultáció" showIcons={false} />
                <BeviteliMod />
                <VoiceRecordingBar />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Drawer — only visible in the '2. vizit + Drawer' state */}
      <TreatmentDetailDrawer open={drawerOpen} onClose={() => setStep('visit_2')} />
    </AppShell>
  );
}
