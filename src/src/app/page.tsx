'use client';

import React, { useState } from 'react';
import {
  Phone, Envelope, MagnifyingGlass, Calendar, Users, Tooth, CurrencyDollar,
  Files, ChartBar, Gear, Funnel, SortAscending, Columns, CaretRight, Check, Pencil, X,
  Microphone, ClipboardText, Star, ArrowRight
} from '@phosphor-icons/react';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { StatusBadge } from '@/components/StatusBadge';
import { Checkbox } from '@/components/Checkbox';
import { InputField } from '@/components/InputField';
import { Dropdown } from '@/components/Dropdown';
import { Comment, CommentBundle } from '@/components/Comment';
import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/IconButton';
import { TopNav } from '@/components/TopNav';
import { SideNav } from '@/components/SideNav';
import { Tabs } from '@/components/Tabs';
import { TabbedPanel } from '@/components/TabbedPanel';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CalendarEntry } from '@/components/CalendarEntry';
import { Table, TableRow, TableHeaderCell, TableCell, TableToolbar, ToolbarButton } from '@/components/Table';
import { TreatmentPlanRow } from '@/components/TreatmentPlanRow';
import { PatientMasterDrawer } from '@/components/Drawer';
import { TreatmentDetailDrawer } from '@/components/Drawer';
import { TreatmentPlanMasterDrawer } from '@/components/Drawer';
import { ContentTabbedPanel } from '@/components/ContentTabbedPanel';
import { StatusTabbedPanel } from '@/components/StatusTabbedPanel';
import { NotificationModal } from '@/components/NotificationModal';
import { CalendarPopup } from '@/components/CalendarPopup';
import { VoiceRecordingBar } from '@/components/VoiceRecordingBar';
import styles from './page.module.css';

export default function ShowcasePage() {
  const [activeNav, setActiveNav] = useState('nyilvantartas');
  const [activeSide, setActiveSide] = useState('patients');
  const [activeTab, setActiveTab] = useState('tab1');
  const [activePanel, setActivePanel] = useState('rontgen');
  const [checkStates, setCheckStates] = useState({ a: false, b: true, c: false });
  const [dropdown1, setDropdown1] = useState<string>('');

  // Panel state
  const [patientDrawer, setPatientDrawer] = useState(false);
  const [treatmentDrawer, setTreatmentDrawer] = useState(false);
  const [tpDrawer, setTpDrawer] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [warningModal, setWarningModal] = useState(false);

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>eaisy Component Library</h1>
        <p className={styles.subtitle}>Dental ERP Design System — All Components</p>
      </header>

      {/* ── BUTTONS ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Buttons</h2>

        <div className={styles.group}>
          <h3 className={styles.groupTitle}>Primary</h3>
          <div className={styles.row}>
            <Button variant="primary" size="lg">Large</Button>
            <Button variant="primary" size="md">Medium</Button>
            <Button variant="primary" size="sm">Small</Button>
            <Button variant="primary" size="md" disabled>Disabled</Button>
          </div>
        </div>

        <div className={styles.group}>
          <h3 className={styles.groupTitle}>Outline</h3>
          <div className={styles.row}>
            <Button variant="outline" size="lg">Large</Button>
            <Button variant="outline" size="md">Medium</Button>
            <Button variant="outline" size="sm">Small</Button>
          </div>
        </div>

        <div className={styles.group}>
          <h3 className={styles.groupTitle}>Text + Icon</h3>
          <div className={styles.row}>
            <Button variant="texticon" size="md">Details</Button>
            <Button variant="texticon" size="sm" icon={<ArrowRight size={12} />}>More</Button>
          </div>
        </div>

        <div className={styles.group}>
          <h3 className={styles.groupTitle}>CTA & Bulk</h3>
          <div className={styles.row}>
            <Button variant="addCta" size="lg" />
            <Button variant="addCta" size="md" />
            <Button variant="addCta" size="sm" />
            <Button variant="plusCta" size="md" />
            <Button variant="bulkAction">Bulk Action</Button>
          </div>
        </div>
      </section>

      {/* ── BADGES ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Badges</h2>
        <div className={styles.row}>
          <Badge variant="primary" size="lg">Primary LG</Badge>
          <Badge variant="primary" size="md">Primary MD</Badge>
          <Badge variant="primary" size="sm">Primary SM</Badge>
          <Badge variant="outline" size="lg">Outline LG</Badge>
          <Badge variant="outline" size="md">Outline MD</Badge>
          <Badge variant="primary" size="md" dismissible icon={<Star size={10} />}>With Icon</Badge>
        </div>
      </section>

      {/* ── STATUS BADGES ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Status Badges</h2>
        <div className={styles.row}>
          <StatusBadge status="new" label="Új érdeklődő" />
          <StatusBadge status="consultation" label="Konzultáció" />
          <StatusBadge status="offer" label="Ajánlata van" />
          <StatusBadge status="success" label="Folyamatban" />
          <StatusBadge status="completed" label="Befejezett" />
          <StatusBadge status="waiting" label="Várakozik" />
          <StatusBadge status="alert" label="Függőben" />
          <StatusBadge status="rejected" label="Elutasítva" />
          <StatusBadge status="inactive" label="Inaktív" />
        </div>
        <div className={styles.row} style={{ marginTop: 12 }}>
          <StatusBadge status="success" label="ELFOGADVA" showDropdown />
          <StatusBadge status="new" label="New lead" dotOnly />
          <StatusBadge status="offer" label="Offer" dotOnly />
        </div>
      </section>

      {/* ── CHECKBOXES ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Checkboxes</h2>
        <div className={styles.row}>
          <Checkbox label="Default" checked={checkStates.a} onChange={v => setCheckStates(s => ({ ...s, a: v }))} />
          <Checkbox label="Checked" checked={checkStates.b} onChange={v => setCheckStates(s => ({ ...s, b: v }))} />
          <Checkbox label="Dark" variant="dark" checked={checkStates.c} onChange={v => setCheckStates(s => ({ ...s, c: v }))} />
          <Checkbox label="Alert" variant="alert" checked />
        </div>
      </section>

      {/* ── INPUT FIELDS ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Input Fields</h2>
        <div className={styles.row}>
          <InputField label="Email" placeholder="email@example.com" type="email" hint="Hint text" />
          <InputField label="Phone" placeholder="+36 30 000 0000" inputPrefix={<>🇭🇺 +36</>} />
          <InputField label="Sum" placeholder="0" inputSuffix="Ft" />
          <InputField label="Error State" placeholder="Hibás adat" error="Kötelező mező" />
        </div>
      </section>

      {/* ── DROPDOWN ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Dropdown</h2>
        <div className={styles.row}>
          <Dropdown
            items={[
              { id: '1', label: 'Option A' },
              { id: '2', label: 'Option B' },
              { id: '3', label: 'Option C' },
            ]}
            value={dropdown1}
            placeholder="Select..."
            onChange={v => setDropdown1(v as string)}
          />
          <Dropdown
            items={[
              { id: '1', label: 'Item 1' },
              { id: '2', label: 'Item 2' },
              { id: '3', label: 'Item 3' },
            ]}
            value={[]}
            placeholder="Multi select..."
            multiple
            onChange={() => {}}
          />
          <Dropdown
            items={[
              { id: '1', label: 'Dark A' },
              { id: '2', label: 'Dark B' },
            ]}
            dark
            placeholder="Dark theme"
            onChange={() => {}}
          />
        </div>
      </section>

      {/* ── AVATARS ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Avatars</h2>
        <div className={styles.row}>
          <Avatar name="Dr. Kovács Béla" size="lg" />
          <Avatar name="Kiss Anna" size="md" />
          <Avatar name="John" size="sm" />
        </div>
      </section>

      {/* ── ICON BUTTONS ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Icon Buttons</h2>
        <div className={styles.row}>
          <IconButton icon={<Phone size={18} />} size="md" />
          <IconButton icon={<Envelope size={18} />} size="md" />
          <IconButton icon={<MagnifyingGlass size={18} />} size="md" />
          <IconButton icon={<Phone size={18} />} size="md" variant="filled" />
          <IconButton icon={<Envelope size={18} />} size="md" variant="filled" />
          <IconButton icon={<Microphone size={18} />} size="md" />
        </div>
      </section>

      {/* ── COMMENTS ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Comments</h2>
        <div className={styles.col} style={{ maxWidth: 480 }}>
          <Comment state="unfilled" placeholder="Megjegyzés..." authorAvatar={<Avatar name="KB" size="sm" />} />
          <Comment state="filled" text="Éppen írok egy megjegyzést..." authorAvatar={<Avatar name="KB" size="sm" />} />
          <Comment state="posted" authorName="Dr. Kovács Béla" timestamp="2024.01.26 14:34" text="A páciens röntgenje rendben, folytathatjuk a kezelést." authorAvatar={<Avatar name="KB" size="sm" />} />
        </div>
      </section>

      {/* ── NAVIGATION ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Navigation</h2>
        <TopNav
          items={[
            { id: 'nyilvantartas', label: 'Nyilvántartás' },
            { id: 'naptar', label: 'Naptár' },
            { id: 'dokumentumok', label: 'Dokumentumok' },
            { id: 'crm', label: 'CRM' },
            { id: 'penzugy', label: 'Pénzügy' },
            { id: 'riportok', label: 'Riportok' },
          ]}
          activeId={activeNav}
          onSelect={setActiveNav}
        />
        <div style={{ marginTop: 8 }}>
          <TopNav
            items={[
              { id: 'nyilvantartas', label: 'Nyilvántartás' },
              { id: 'naptar', label: 'Naptár' },
            ]}
            activeId="nyilvantartas"
            patientName="Kiss Anna"
            onClosePatient={() => {}}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Side Navigation</h2>
        <div style={{ height: 300 }}>
          <SideNav
            items={[
              { id: 'patients', icon: <Users size={20} />, label: 'Páciensek' },
              { id: 'offers', icon: <ClipboardText size={20} />, label: 'Ajánlat' },
              { id: 'master', icon: <Gear size={20} />, label: 'Törzsadatok' },
              { id: 'docs', icon: <Files size={20} />, label: 'Dokumentumok' },
              { id: 'treatment', icon: <Tooth size={20} />, label: 'Kezelés' },
              { id: 'finance', icon: <CurrencyDollar size={20} />, label: 'Pénzügyek' },
            ]}
            activeId={activeSide}
            onSelect={setActiveSide}
          />
        </div>
      </section>

      {/* ── TABS ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tabs</h2>
        <div className={styles.row}>
          <Tabs
            items={[{ id: 'tab1', label: 'Tab 1' }, { id: 'tab2', label: 'Tab 2' }, { id: 'tab3', label: 'Tab 3' }]}
            activeId={activeTab}
            variant="light"
            onSelect={setActiveTab}
          />
          <Tabs
            items={[{ id: 'tab1', label: 'Tab 1' }, { id: 'tab2', label: 'Tab 2' }, { id: 'tab3', label: 'Tab 3' }]}
            activeId="tab2"
            variant="dark"
          />
        </div>
      </section>

      {/* ── TABBED PANEL ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Tabbed Panel</h2>
        <TabbedPanel
          tabs={[
            { id: 'rontgen', label: 'Röntgen' },
            { id: 'anamnezis', label: 'Anamnézis' },
            { id: 'fogjegyzet', label: 'Fogjegyzet' },
            { id: 'megjegyzesek', label: 'Megjegyzések' },
          ]}
          activeId={activePanel}
          onSelect={setActivePanel}
        />
        <div style={{ marginTop: 8 }}>
          <TabbedPanel
            tabs={[
              { id: 'kt', label: 'Kezelési terv', hasPlus: true },
              { id: 'idopont', label: 'Időpont', hasPlus: true },
            ]}
            activeId="kt"
          />
        </div>
      </section>

      {/* ── BREADCRUMBS ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Breadcrumbs</h2>
        <Breadcrumbs items={[
          { label: 'Nyilvántartás', href: '#' },
          { label: 'Páciensek', href: '#' },
          { label: 'Kiss Anna' },
        ]} />
      </section>

      {/* ── CALENDAR ENTRIES ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Calendar Entries</h2>
        <div className={styles.row} style={{ flexWrap: 'wrap' }}>
          {(['yellow', 'orange', 'red', 'lilac', 'green', 'limeGreen', 'mint', 'darkMint', 'turquoise', 'blue', 'grayGreen', 'magenta', 'gray'] as const).map(color => (
            <CalendarEntry
              key={color}
              color={color}
              timeRange="09:00 – 10:30"
              patientName="Kiss Anna"
              doctorName="Dr. Kovács B."
              category="Konzultáció"
            />
          ))}
        </div>
        <div className={styles.row} style={{ marginTop: 12 }}>
          <CalendarEntry color="blue" state="pressed" timeRange="10:00 – 11:00" patientName="Nagy Péter" doctorName="Dr. Tóth K." />
          <CalendarEntry color="mint" state="unconfirmed" timeRange="11:00 – 12:00" patientName="Horváth M." doctorName="Dr. Kiss A." />
        </div>
      </section>

      {/* ── TABLE ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Table</h2>
        <TableToolbar>
          <ToolbarButton icon={<Funnel size={14} />}>Filter</ToolbarButton>
          <ToolbarButton icon={<Columns size={14} />}>Columns</ToolbarButton>
          <ToolbarButton icon={<MagnifyingGlass size={14} />}>Search</ToolbarButton>
          <ToolbarButton icon={<SortAscending size={14} />}>Sort</ToolbarButton>
        </TableToolbar>
        <Table>
          <thead>
            <TableRow>
              <TableHeaderCell width={40}><Checkbox /></TableHeaderCell>
              <TableHeaderCell width={170} align="left">Páciens</TableHeaderCell>
              <TableHeaderCell width={140}>Időpont</TableHeaderCell>
              <TableHeaderCell width={170}>Kezelés</TableHeaderCell>
              <TableHeaderCell width={80}>Művelet</TableHeaderCell>
            </TableRow>
          </thead>
          <tbody>
            <TableRow>
              <TableCell width={40}><Checkbox /></TableCell>
              <TableCell width={170}>Kiss Anna <br /><small style={{ color: 'var(--color-neutral-600)', fontSize: 12 }}>#130124567890</small></TableCell>
              <TableCell width={140} align="center">09:00 – 10:30<br /><small style={{ color: 'var(--color-neutral-600)', fontSize: 12 }}>2024.01.26</small></TableCell>
              <TableCell width={170}><StatusBadge status="success" label="Folyamatban" /> Implantátum</TableCell>
              <TableCell width={80} align="center">
                <IconButton icon={<Phone size={14} />} size="sm" />
                <IconButton icon={<Envelope size={14} />} size="sm" />
              </TableCell>
            </TableRow>
            <TableRow selected>
              <TableCell width={40}><Checkbox checked /></TableCell>
              <TableCell width={170}>Nagy Péter <br /><small style={{ color: 'var(--color-neutral-600)', fontSize: 12 }}>#130124567891</small></TableCell>
              <TableCell width={140} align="center">10:30 – 11:00<br /><small style={{ color: 'var(--color-neutral-600)', fontSize: 12 }}>2024.01.26</small></TableCell>
              <TableCell width={170}><StatusBadge status="new" label="Új" /> Konzultáció</TableCell>
              <TableCell width={80} align="center">
                <IconButton icon={<Phone size={14} />} size="sm" />
                <IconButton icon={<Envelope size={14} />} size="sm" />
              </TableCell>
            </TableRow>
          </tbody>
        </Table>
      </section>

      {/* ── TREATMENT PLAN ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Treatment Plan Rows</h2>
        <div style={{ maxWidth: 700 }}>
          <TreatmentPlanRow type="header" label="#130124567899" secondaryLabel="All-on-4 felső, full kontúr cirkón híd" />
          <TreatmentPlanRow type="divider-open" label="1. VIZIT" statusBadge={<StatusBadge status="success" label="Aktív" />} />
          <TreatmentPlanRow type="row-edit" label="Kezelés" secondaryLabel="Teljes szájhigiénia" amount="1 750 000 Ft" actions={<><IconButton icon={<Pencil size={14} />} size="sm" /><IconButton icon={<X size={14} />} size="sm" /></>} />
          <TreatmentPlanRow type="row-done" label="Kezelés" secondaryLabel="Teljes szájhigiénia" amount="1 750 000 Ft" actions={<IconButton icon={<Check size={14} />} size="sm" />} />
          <TreatmentPlanRow type="divider-start-visit" label="1. VIZIT" secondaryLabel="Vizit elindítása" />
          <TreatmentPlanRow type="divider-start-consultation" label="KONZULTÁCIÓ" secondaryLabel="Konzultáció indítása" />
          <TreatmentPlanRow type="divider-visit-sum" label="1. vizit összesen" amount="1 000 000 Ft" />
          <TreatmentPlanRow type="divider-save" label="" amount="Kezelési terv mentése" />
          <TreatmentPlanRow type="divider-saved" label="" amount="Mentve" />
          <TreatmentPlanRow type="duration" label="Vizit időtartam: 2 nap" secondaryLabel="Gyógyulás idő: 3 hónap" />
          <TreatmentPlanRow type="add-treatment" label="+ Új kezelés hozzáadása" />
          <TreatmentPlanRow type="document-alert" label="Beleegyező / Röntgen" actions={<><IconButton icon={<Check size={14} />} size="sm" /></>} />
          <TreatmentPlanRow type="document-signed" label="Beleegyező / Röntgen" actions={<><IconButton icon={<Check size={14} />} size="sm" /></>} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          ── PANELS (Phase 2) ──
       ═══════════════════════════════════════════ */}

      {/* ── DRAWERS ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Drawers (Panels)</h2>
        <div className={styles.row}>
          <Button variant="primary" size="md" onClick={() => setPatientDrawer(true)}>Patient Master Drawer</Button>
          <Button variant="primary" size="md" onClick={() => setTreatmentDrawer(true)}>Treatment Detail Drawer</Button>
          <Button variant="primary" size="md" onClick={() => setTpDrawer(true)}>Treatment Plan Drawer</Button>
        </div>
        <PatientMasterDrawer open={patientDrawer} onClose={() => setPatientDrawer(false)} />
        <TreatmentDetailDrawer open={treatmentDrawer} onClose={() => setTreatmentDrawer(false)} />
        <TreatmentPlanMasterDrawer open={tpDrawer} onClose={() => setTpDrawer(false)} />
      </section>

      {/* ── CONTENT TABBED PANEL ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Content Tabbed Panel</h2>
        <ContentTabbedPanel />
      </section>

      {/* ── STATUS TABBED PANEL (DENTAL CHART) ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Status Tabbed Panel (Dental Chart)</h2>
        <StatusTabbedPanel />
      </section>

      {/* ── NOTIFICATION MODALS ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Notification Modals</h2>
        <div className={styles.row}>
          <Button variant="primary" size="md" onClick={() => setSuccessModal(true)}>Success Modal</Button>
          <Button variant="outline" size="md" onClick={() => setWarningModal(true)}>Warning Modal</Button>
        </div>
        <NotificationModal
          open={successModal}
          onClose={() => setSuccessModal(false)}
          variant="success"
          title="Ambulánslap létrehozva"
          description="Az ambulánslap sikeresen létrejött és csatolva lett a vizithez."
          primaryLabel="Rendben"
        />
        <NotificationModal
          open={warningModal}
          onClose={() => setWarningModal(false)}
          variant="warning"
          title="Hiányzó műveletek"
          description="A következő műveletek szükségesek a vizit lezárásához:"
          items={['Aláírt fájlok feltöltése', 'Ambulánslap kitöltése']}
          primaryLabel="Folytatás"
          secondaryLabel="Mégse"
        />
      </section>

      {/* ── CALENDAR POPUP ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Calendar Popup</h2>
        <CalendarPopup />
      </section>

      {/* ── VOICE RECORDING BAR ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Voice Recording Bar</h2>
        <VoiceRecordingBar />
      </section>

      {/* ── DESIGN TOKENS ── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Design Tokens — Colors</h2>
        <div className={styles.group}>
          <h3 className={styles.groupTitle}>Neutral</h3>
          <div className={styles.swatchRow}>
            {[
              ['50', '#F5F5F5'], ['100', '#EDEDED'], ['200', '#D9D9D9'],
              ['400', '#CFCFCF'], ['500', '#BFC9CF'], ['600', '#5F7D95'],
            ].map(([n, c]) => (
              <div key={n} className={styles.swatch}>
                <div className={styles.swatchColor} style={{ background: c }} />
                <span className={styles.swatchLabel}>{n}</span>
                <span className={styles.swatchHex}>{c}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.group}>
          <h3 className={styles.groupTitle}>Primary</h3>
          <div className={styles.swatchRow}>
            {[
              ['50', '#DFFFFD'], ['100', '#90FFF8'], ['200', '#1CEEE0'],
              ['400', '#62AACE'], ['500', '#186D98'], ['900', '#082432'],
            ].map(([n, c]) => (
              <div key={n} className={styles.swatch}>
                <div className={styles.swatchColor} style={{ background: c }} />
                <span className={styles.swatchLabel}>{n}</span>
                <span className={styles.swatchHex}>{c}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.group}>
          <h3 className={styles.groupTitle}>Brand</h3>
          <div className={styles.swatchRow}>
            {[
              ['50', '#FFF1F9'], ['400', '#ED51A8'], ['500', '#C43284'], ['600', '#A2005B'],
            ].map(([n, c]) => (
              <div key={n} className={styles.swatch}>
                <div className={styles.swatchColor} style={{ background: c }} />
                <span className={styles.swatchLabel}>{n}</span>
                <span className={styles.swatchHex}>{c}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.group}>
          <h3 className={styles.groupTitle}>Status</h3>
          <div className={styles.swatchRow}>
            {[
              ['Alert', '#FF0000'], ['Success', '#32B100'], ['New', '#60C5FF'], ['Offer', '#FF9D00'],
              ['Consult', '#FFCE49'], ['Done', '#1C6100'], ['Wait', '#E696FF'], ['Reject', '#9D9D9D'], ['Inactive', '#000000'],
            ].map(([n, c]) => (
              <div key={n} className={styles.swatch}>
                <div className={styles.swatchColor} style={{ background: c }} />
                <span className={styles.swatchLabel}>{n}</span>
                <span className={styles.swatchHex}>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

