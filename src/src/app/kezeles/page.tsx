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

  // Editable treatment plan items
  const [planItems, setPlanItems] = useState<{ id: string; name: string; area: string; price: number; qty: number; editing: boolean }[]>([]);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

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

  // Initialize plan items from DB data on first render
  useEffect(() => {
    if (treatmentTypes.length > 0 && planItems.length === 0) {
      const initial = diagnosticItems.slice(0, 3).map((t, i) => ({
        id: `consult-${i}`, name: t.name, area: 'Teljes szájüreg',
        price: t.base_price, qty: 1, editing: false,
      }));
      setPlanItems(initial);
    }
  }, [treatmentTypes]);

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

  const removePlanItem = (itemId: string) => {
    setPlanItems(prev => prev.filter(p => p.id !== itemId));
  };

  const toggleEditItem = (itemId: string) => {
    setPlanItems(prev => prev.map(p => p.id === itemId ? { ...p, editing: !p.editing } : p));
  };

  const updatePlanItem = (itemId: string, field: string, value: any) => {
    setPlanItems(prev => prev.map(p => p.id === itemId ? { ...p, [field]: value } : p));
  };

  const addToPlan = (treatment: TreatmentType) => {
    setPlanItems(prev => [...prev, {
      id: `item-${Date.now()}`, name: treatment.name, area: 'Teljes szájüreg',
      price: treatment.base_price, qty: 1, editing: false,
    }]);
  };

  const saveTreatmentPlan = async () => {
    const { data: plan } = await supabase.from('treatment_plans').insert({
      title: 'All-on-4 felső, full kontúr cirkon híd',
      status: 'accepted',
      total_cost: planItems.reduce((s, i) => s + i.price * i.qty, 0),
    }).select('id').single();
    if (plan) {
      const items = planItems.map(i => ({
        treatment_plan_id: plan.id,
        treatment_name: i.name,
        tooth_area: i.area,
        unit_price: i.price,
        quantity: i.qty,
      }));
      await supabase.from('treatments').insert(items);
    }
    setSavedMessage('✅ Kezelési terv mentve!');
    setTimeout(() => setSavedMessage(null), 3000);
  };

  const editActions = (itemId: string) => (
    <span style={{ display: 'flex', gap: 13, alignItems: 'center' }}>
      <Pencil size={17} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={(e) => { e.stopPropagation(); toggleEditItem(itemId); }} />
      <X size={18} style={{ cursor: 'pointer', opacity: 0.6 }} onClick={(e) => { e.stopPropagation(); removePlanItem(itemId); }} />
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

            {planItems.map((item) => (
              <React.Fragment key={item.id}>
                <TreatmentPlanRow
                  type={showVisit1Completed ? 'row-done' : 'row-edit'}
                  label={item.name}
                  secondaryLabel={`${item.area}   ${formatPrice(item.price)}   × ${item.qty}`}
                  amount={formatPrice(item.price * item.qty)}
                  actions={showVisit1Completed ? doneCheck : editActions(item.id)}
                />
                {item.editing && (
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%', padding: '6px 16px', background: 'var(--color-neutral-50)', borderRadius: 8, marginTop: -4 }}>
                    <input value={item.name} onChange={e => updatePlanItem(item.id, 'name', e.target.value)}
                      style={{ flex: 2, padding: '4px 8px', border: '1px solid var(--color-neutral-200)', borderRadius: 6, fontSize: 13, fontFamily: 'var(--font-family)' }} />
                    <input value={item.area} onChange={e => updatePlanItem(item.id, 'area', e.target.value)}
                      style={{ flex: 1, padding: '4px 8px', border: '1px solid var(--color-neutral-200)', borderRadius: 6, fontSize: 13, fontFamily: 'var(--font-family)' }} />
                    <input type="number" value={item.price} onChange={e => updatePlanItem(item.id, 'price', parseInt(e.target.value) || 0)}
                      style={{ width: 80, padding: '4px 8px', border: '1px solid var(--color-neutral-200)', borderRadius: 6, fontSize: 13, fontFamily: 'var(--font-family)' }} />
                    <span style={{ fontSize: 13, color: 'var(--color-neutral-500)' }}>×</span>
                    <input type="number" value={item.qty} onChange={e => updatePlanItem(item.id, 'qty', parseInt(e.target.value) || 1)}
                      style={{ width: 50, padding: '4px 8px', border: '1px solid var(--color-neutral-200)', borderRadius: 6, fontSize: 13, fontFamily: 'var(--font-family)' }} />
                    <button onClick={() => toggleEditItem(item.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--color-primary-200)', background: 'var(--color-primary-50)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-family)', color: 'var(--color-primary-500)', fontWeight: 600 }}>Kész</button>
                  </div>
                )}
              </React.Fragment>
            ))}

            <AddTreatmentRow onSelect={(t: any) => addToPlan(t)} />
            <VisitSumRow label="KONZULTÁCIÓ ÖSSZESEN" amount={formatPrice(planItems.reduce((s, i) => s + i.price * i.qty, 0))} />
            {savedMessage && <div style={{ padding: '8px 16px', background: '#dcfce7', color: '#166534', borderRadius: 8, fontSize: 13, fontWeight: 600, marginTop: 4 }}>{savedMessage}</div>}

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

                {visit1Items.map((item, i) => (
                  <TreatmentPlanRow
                    key={`v1-${i}`}
                    type={showVisit1Completed ? 'row-done' : 'row-edit'}
                    label={item.name}
                    secondaryLabel={`${item.area}   ${item.price}   ${item.qty}`}
                    amount={item.total}
                    actions={showVisit1Completed ? doneCheck : editActions(`v1-${i}`)}
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

                    {visit2Items.map((item, i) => (
                      <TreatmentPlanRow
                        key={`v2-${i}`}
                        type="row-edit"
                        label={item.name}
                        secondaryLabel={`${item.area}   ${item.price}   ${item.qty}`}
                        amount={item.total}
                        actions={editActions(`v2-${i}`)}
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
