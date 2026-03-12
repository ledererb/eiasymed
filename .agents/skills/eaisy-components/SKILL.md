---
name: eaisy-components
description: Complete reference for the eaisy dental ERP component library — props, design tokens, component composition patterns, and usage examples.
---

# eaisy Component Library Reference

## Tech Stack
- **Framework**: Next.js 16 (App Router), TypeScript
- **Styling**: CSS Modules (`.module.css` per component), design tokens in `src/styles/tokens.css`
- **Icons**: [Phosphor Icons](https://phosphoricons.com/) (`@phosphor-icons/react`)
- **Font**: Inter (loaded via `next/font/google`)

## Import Pattern
```tsx
// All components are barrel-exported from src/components/index.ts
import { Button, Badge, StatusBadge, Avatar, ... } from '@/components';
// Or import individually:
import { Button } from '@/components/Button';
```

## File Structure
```
src/
├── components/
│   ├── index.ts                         # Barrel exports
│   ├── Avatar/        Avatar.tsx, .module.css, index.ts
│   ├── Badge/         Badge.tsx, .module.css, index.ts
│   ├── Breadcrumbs/   Breadcrumbs.tsx, .module.css, index.ts
│   ├── Button/        Button.tsx, .module.css, index.ts
│   ├── CalendarEntry/ CalendarEntry.tsx, .module.css, index.ts
│   ├── CalendarPopup/ CalendarPopup.tsx, .module.css, index.ts
│   ├── Checkbox/      Checkbox.tsx, .module.css, index.ts
│   ├── Comment/       Comment.tsx, .module.css, index.ts
│   ├── ContentTabbedPanel/ ContentTabbedPanel.tsx, .module.css, index.ts
│   ├── Drawer/        Drawer.tsx, Drawer.module.css, PatientMasterDrawer.tsx,
│   │                  TreatmentDetailDrawer.tsx, TreatmentPlanMasterDrawer.tsx, index.ts
│   ├── Dropdown/      Dropdown.tsx, .module.css, index.ts
│   ├── IconButton/    IconButton.tsx, .module.css, index.ts
│   ├── InputField/    InputField.tsx, .module.css, index.ts
│   ├── NotificationModal/ NotificationModal.tsx, .module.css, index.ts
│   ├── SideNav/       SideNav.tsx, .module.css, index.ts
│   ├── StatusBadge/   StatusBadge.tsx, .module.css, index.ts
│   ├── StatusTabbedPanel/ StatusTabbedPanel.tsx, .module.css, index.ts
│   ├── TabbedPanel/   TabbedPanel.tsx, .module.css, index.ts
│   ├── Table/         Table.tsx, .module.css, index.ts
│   ├── Tabs/          Tabs.tsx, .module.css, index.ts
│   ├── TopNav/        TopNav.tsx, .module.css, index.ts
│   ├── TreatmentPlanRow/ TreatmentPlanRow.tsx, .module.css, index.ts
│   └── VoiceRecordingBar/ VoiceRecordingBar.tsx, .module.css, index.ts
├── styles/
│   ├── tokens.css     # All design tokens (colors, typography, spacing, etc.)
│   └── globals.css    # Global styles, body defaults
└── app/
    ├── layout.tsx     # Root layout with Inter font
    ├── page.tsx       # Component showcase page
    └── page.module.css
```

---

## Design Tokens (from `src/styles/tokens.css`)

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--color-white` | `#FFFFFF` | Card backgrounds, text on dark |
| `--color-neutral-50` | `#F5F5F5` | Page background, row backgrounds |
| `--color-neutral-100` | `#EDEDED` | Divider lines, light borders |
| `--color-neutral-200` | `#D9D9D9` | Input borders, disabled bg |
| `--color-neutral-400` | `#CFCFCF` | Inactive elements |
| `--color-neutral-500` | `#BFC9CF` | Frame/card borders |
| `--color-neutral-600` | `#5F7D95` | Placeholder text, secondary text |
| `--color-primary-50` | `#DFFFFD` | Badge bg (turquoise tint) |
| `--color-primary-100` | `#90FFF8` | Teal highlight |
| `--color-primary-200` | `#1CEEE0` | Active tab underline |
| `--color-primary-400` | `#62AACE` | Mid-tone links/icons |
| `--color-primary-500` | `#186D98` | Links, accents, badge text |
| `--color-primary-900` | `#082432` | Dark nav bg, headings, body text |
| `--color-brand-50` | `#FFF1F9` | Light pink bg |
| `--color-brand-400` | `#ED51A8` | Accent pink |
| `--color-brand-500` | `#C43284` | Brand accent (patient names, CTAs) |
| `--color-brand-600` | `#A2005B` | Dark brand text |

### Status Colors (9)
| Token | Value | Label |
|-------|-------|-------|
| `--color-status-alert` | `#FF0000` | Függőben / Pending |
| `--color-status-success` | `#32B100` | Folyamatban / In progress |
| `--color-status-new` | `#60C5FF` | Új érdeklődő / New lead |
| `--color-status-offer` | `#FF9D00` | Ajánlata van / Offer |
| `--color-status-consultation` | `#FFCE49` | Konzultáció |
| `--color-status-completed` | `#1C6100` | Befejezett / Completed |
| `--color-status-waiting` | `#E696FF` | Várakozik / Waiting |
| `--color-status-rejected` | `#9D9D9D` | Elutasítva / Rejected |
| `--color-status-inactive` | `#000000` | Inaktív / Inactive |

### Calendar Colors (11)
`--color-cal-yellow`, `--color-cal-orange`, `--color-cal-red`, `--color-cal-lilac`, `--color-cal-green`, `--color-cal-lime-green`, `--color-cal-mint`, `--color-cal-dark-mint`, `--color-cal-turquoise`, `--color-cal-blue`, `--color-cal-gray-green`

### Gradients
| Token | Usage |
|-------|-------|
| `--gradient-light-blue` | Light page accents |
| `--gradient-dark-blue` | Dark headers |
| `--gradient-dark-pink` | Brand/mic button |
| `--gradient-light-mixed` | Visit info cards, voice recording badge |
| `--gradient-dark-mixed` | Dark accent areas |
| `--gradient-base-1` / `base-2` / `base-3` | Page-level backgrounds |

### Typography
- **Font**: `--font-family: 'Inter', -apple-system, ...`
- **Sizes**: `--font-size-8` through `--font-size-24` (8, 10, 12, 14, 16, 20, 24)
- **Weights**: `--font-weight-light` (300), `regular` (400), `medium` (500), `semibold` (600), `bold` (700)

### Spacing
`--space-2` through `--space-40` (2, 4, 5, 8, 10, 12, 15, 16, 20, 24, 32, 40)

### Shadows
| Token | Usage |
|-------|-------|
| `--shadow-50` | Subtle card shadows |
| `--shadow-100` | Medium elevation |
| `--shadow-200` | Drawer panel shadow |
| `--shadow-300` | Floating elements |
| `--shadow-brand-glow` | Brand-accented glow effect |

### Radii
`--radius-button: 10px`, `--radius-input: 8px`, `--radius-badge: 50px`, `--radius-card: 10px`

---

## Component API Reference

### Button
```tsx
import { Button } from '@/components/Button';

<Button variant="primary" size="md" onClick={fn}>Label</Button>
<Button variant="outline" size="lg">Outline</Button>
<Button variant="texticon" size="sm" icon={<ArrowRight />}>More</Button>
<Button variant="addCta" size="md" />    {/* Round + icon */}
<Button variant="plusCta" size="md" />   {/* Round text + */}
<Button variant="bulkAction">Bulk</Button>
```
| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `variant` | `'primary' \| 'outline' \| 'texticon' \| 'addCta' \| 'plusCta' \| 'bulkAction'` | `'primary'` | |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | |
| `icon` | `ReactNode` | — | Used with texticon; addCta/plusCta have built-in icons |
| `iconPosition` | `'left' \| 'right'` | `'right'` | |
| `disabled` | `boolean` | `false` | |
| `...rest` | `ButtonHTMLAttributes` | — | `onClick`, `type`, etc. |

---

### Badge
```tsx
import { Badge } from '@/components/Badge';

<Badge variant="primary" size="md">Label</Badge>
<Badge variant="outline" size="lg" dismissible onDismiss={fn}>Dismissible</Badge>
<Badge icon={<Star size={10} />} variant="primary" size="md">With Icon</Badge>
```
| Prop | Type | Default |
|------|------|---------|
| `variant` | `'primary' \| 'outline'` | `'primary'` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `icon` | `ReactNode` | — |
| `dismissible` | `boolean` | `false` |
| `onDismiss` | `() => void` | — |

---

### StatusBadge
```tsx
import { StatusBadge } from '@/components/StatusBadge';

<StatusBadge status="success" label="Folyamatban" />
<StatusBadge status="new" label="Új érdeklődő" dotOnly />
<StatusBadge status="success" label="ELFOGADVA" showDropdown />
```
| Prop | Type | Default |
|------|------|---------|
| `status` | `'alert' \| 'success' \| 'new' \| 'offer' \| 'consultation' \| 'completed' \| 'waiting' \| 'rejected' \| 'inactive'` | — (required) |
| `label` | `string` | — (required) |
| `showDropdown` | `boolean` | `false` |
| `dotOnly` | `boolean` | `false` |
| `onClick` | `() => void` | — |

---

### Avatar
```tsx
import { Avatar } from '@/components/Avatar';

<Avatar name="Dr. Kovács Béla" size="lg" />   {/* Shows "KB" */}
<Avatar src="/photo.jpg" name="Anna" size="md" />
```
| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `name` | `string` | `''` | Auto-generates initials from name |
| `src` | `string` | — | If provided, renders `<img>` |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | sm=24px, md=32px, lg=40px |

---

### IconButton
```tsx
import { IconButton } from '@/components/IconButton';

<IconButton icon={<Phone size={18} />} size="md" />
<IconButton icon={<Envelope size={18} />} size="md" variant="filled" />
```
| Prop | Type | Default |
|------|------|---------|
| `icon` | `ReactNode` | — (required) |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` |
| `variant` | `'default' \| 'filled'` | `'default'` |
| `...rest` | `ButtonHTMLAttributes` | — |

---

### Checkbox
```tsx
import { Checkbox } from '@/components/Checkbox';

<Checkbox label="Accept terms" checked={val} onChange={setVal} />
<Checkbox variant="dark" checked />
<Checkbox variant="alert" checked />
```
| Prop | Type | Default |
|------|------|---------|
| `checked` | `boolean` | `false` |
| `variant` | `'light' \| 'dark' \| 'alert'` | `'light'` |
| `label` | `string` | — |
| `onChange` | `(checked: boolean) => void` | — |

---

### InputField
```tsx
import { InputField } from '@/components/InputField';

<InputField label="Email" placeholder="email@example.com" type="email" hint="Hint" />
<InputField label="Phone" inputPrefix={<>🇭🇺 +36</>} />
<InputField label="Sum" inputSuffix="Ft" />
<InputField label="Error" error="Kötelező mező" />
```
| Prop | Type | Default | Notes |
|------|------|---------|-------|
| `label` | `string` | — | Above-input label |
| `hint` | `string` | — | Below-input hint (hidden on error) |
| `error` | `string` | — | Red error text below input |
| `inputPrefix` | `ReactNode` | — | Left-side adornment |
| `inputSuffix` | `ReactNode` | — | Right-side adornment |
| `...rest` | `InputHTMLAttributes` | — | `placeholder`, `type`, `value`, `onChange`, etc. |

---

### Dropdown
```tsx
import { Dropdown } from '@/components/Dropdown';

<Dropdown
  items={[{ id: '1', label: 'Option A' }, { id: '2', label: 'Option B' }]}
  value={selectedId}
  placeholder="Select..."
  onChange={setSelectedId}
/>
<Dropdown items={items} value={[]} multiple onChange={fn} />
<Dropdown items={items} dark placeholder="Dark theme" onChange={fn} />
```
| Prop | Type | Default |
|------|------|---------|
| `items` | `DropdownItem[]` | — (required) |
| `value` | `string \| string[]` | — |
| `placeholder` | `string` | `'Select...'` |
| `dark` | `boolean` | `false` |
| `multiple` | `boolean` | `false` |
| `onChange` | `(value: string \| string[]) => void` | — |

`DropdownItem`: `{ id: string; label: string; icon?: ReactNode; divider?: boolean }`

---

### Comment & CommentBundle
```tsx
import { Comment, CommentBundle } from '@/components/Comment';

<Comment state="unfilled" placeholder="Megjegyzés..." authorAvatar={<Avatar name="KB" size="sm" />} />
<Comment state="filled" text="Writing a comment..." authorAvatar={avatar} />
<Comment state="posted" authorName="Dr. Kovács" timestamp="2024.01.26 14:34" text="Comment text" authorAvatar={avatar} />

<CommentBundle moreLabel="Több megjegyzés >" onMore={fn}>
  <Comment ... />
  <Comment ... />
</CommentBundle>
```
| Prop | Type | Default |
|------|------|---------|
| `state` | `'unfilled' \| 'filled' \| 'posted'` | `'unfilled'` |
| `authorName` | `string` | — |
| `authorAvatar` | `ReactNode` | — |
| `timestamp` | `string` | — |
| `text` | `string` | — |
| `placeholder` | `string` | `'Megjegyzés'` |
| `onSend` | `() => void` | — |

---

### TopNav
```tsx
import { TopNav } from '@/components/TopNav';

<TopNav
  items={[{ id: 'nyilvantartas', label: 'Nyilvántartás' }, ...]}
  activeId={activeNav}
  onSelect={setActiveNav}
/>
<TopNav items={items} activeId="nyilvantartas" patientName="Kiss Anna" onClosePatient={fn} />
```
| Prop | Type | Default |
|------|------|---------|
| `items` | `TopNavItem[]` | — (required) |
| `activeId` | `string` | — |
| `patientName` | `string` | — (shows patient context bar) |
| `onSelect` | `(id: string) => void` | — |
| `onClosePatient` | `() => void` | — |

---

### SideNav
```tsx
import { SideNav } from '@/components/SideNav';

<SideNav
  items={[
    { id: 'patients', icon: <Users size={20} />, label: 'Páciensek' },
    { id: 'offers', icon: <ClipboardText size={20} />, label: 'Ajánlat' },
    ...
  ]}
  activeId={activeSide}
  onSelect={setActiveSide}
/>
```
| Prop | Type | Default |
|------|------|---------|
| `items` | `SideNavItem[]` | — (required) |
| `activeId` | `string` | — |
| `onSelect` | `(id: string) => void` | — |

`SideNavItem`: `{ id: string; icon: ReactNode; label: string }`

---

### Tabs
```tsx
import { Tabs } from '@/components/Tabs';

<Tabs
  items={[{ id: 'tab1', label: 'Tab 1' }, { id: 'tab2', label: 'Tab 2' }]}
  activeId={activeTab}
  variant="light"
  onSelect={setActiveTab}
/>
<Tabs items={tabs} activeId="tab2" variant="dark" />
```
| Prop | Type | Default |
|------|------|---------|
| `items` | `TabItem[]` | — (required) |
| `activeId` | `string` | — |
| `variant` | `'light' \| 'dark'` | `'light'` |
| `onSelect` | `(id: string) => void` | — |

---

### TabbedPanel
```tsx
import { TabbedPanel } from '@/components/TabbedPanel';

<TabbedPanel
  tabs={[
    { id: 'rontgen', label: 'Röntgen' },
    { id: 'kt', label: 'Kezelési terv', hasPlus: true },
  ]}
  activeId="rontgen"
  onSelect={setActivePanel}
/>
```
| Prop | Type | Default |
|------|------|---------|
| `tabs` | `PanelTab[]` | — (required) |
| `activeId` | `string` | — |
| `onSelect` | `(id: string) => void` | — |

`PanelTab`: `{ id: string; label: string; hasPlus?: boolean }`

---

### Breadcrumbs
```tsx
import { Breadcrumbs } from '@/components/Breadcrumbs';

<Breadcrumbs items={[
  { label: 'Nyilvántartás', href: '/registry' },
  { label: 'Páciensek', href: '/registry/patients' },
  { label: 'Kiss Anna' },  // no href = current page
]} />
```
| Prop | Type | Default |
|------|------|---------|
| `items` | `BreadcrumbItem[]` | — (required) |

`BreadcrumbItem`: `{ label: string; href?: string }`

---

### CalendarEntry
```tsx
import { CalendarEntry } from '@/components/CalendarEntry';

<CalendarEntry
  color="blue"
  state="default"
  timeRange="09:00 – 10:30"
  patientName="Kiss Anna"
  doctorName="Dr. Kovács B."
  category="Konzultáció"
  onClick={fn}
/>
```
| Prop | Type | Default |
|------|------|---------|
| `color` | `'yellow' \| 'orange' \| 'red' \| 'lilac' \| 'green' \| 'limeGreen' \| 'mint' \| 'darkMint' \| 'turquoise' \| 'blue' \| 'grayGreen' \| 'magenta' \| 'gray'` | `'gray'` |
| `state` | `'default' \| 'pressed' \| 'unconfirmed'` | `'default'` |
| `timeRange` | `string` | — (required) |
| `patientName` | `string` | — (required) |
| `doctorName` | `string` | — (required) |
| `category` | `string` | — |
| `onClick` | `() => void` | — |

---

### Table, TableRow, TableCell, TableHeaderCell, TableToolbar, ToolbarButton
```tsx
import { Table, TableRow, TableHeaderCell, TableCell, TableToolbar, ToolbarButton } from '@/components/Table';

<TableToolbar>
  <ToolbarButton icon={<Funnel size={14} />}>Filter</ToolbarButton>
  <ToolbarButton icon={<MagnifyingGlass size={14} />}>Search</ToolbarButton>
</TableToolbar>
<Table>
  <thead>
    <TableRow>
      <TableHeaderCell width={40}><Checkbox /></TableHeaderCell>
      <TableHeaderCell width={170} align="left">Páciens</TableHeaderCell>
    </TableRow>
  </thead>
  <tbody>
    <TableRow selected>
      <TableCell width={40}><Checkbox checked /></TableCell>
      <TableCell width={170}>Kiss Anna</TableCell>
    </TableRow>
  </tbody>
</Table>
```
| Component | Key Props |
|-----------|-----------|
| `Table` | `children` |
| `TableRow` | `selected?: boolean`, `onClick?` |
| `TableHeaderCell` | `width?: number`, `align?: 'left' \| 'center' \| 'right'` |
| `TableCell` | `width?: number`, `align?: 'left' \| 'center' \| 'right'` |
| `TableToolbar` | `children` |
| `ToolbarButton` | `icon?: ReactNode`, `children`, extends `ButtonHTMLAttributes` |

---

### TreatmentPlanRow
```tsx
import { TreatmentPlanRow } from '@/components/TreatmentPlanRow';

<TreatmentPlanRow type="header" label="#130124567899" secondaryLabel="All-on-4 felső" />
<TreatmentPlanRow type="divider-open" label="1. VIZIT" statusBadge={<StatusBadge status="success" label="Aktív" />} />
<TreatmentPlanRow type="row-edit" label="Kezelés" secondaryLabel="Teljes szájhigiénia" amount="1 750 000 Ft"
  actions={<><IconButton icon={<Pencil size={14} />} size="sm" /><IconButton icon={<X size={14} />} size="sm" /></>} />
<TreatmentPlanRow type="row-done" label="Kezelés" amount="1 750 000 Ft" actions={<IconButton icon={<Check size={14} />} size="sm" />} />
<TreatmentPlanRow type="divider-visit-sum" label="1. vizit összesen" amount="1 000 000 Ft" />
<TreatmentPlanRow type="add-treatment" label="+ Új kezelés hozzáadása" />
```
| Prop | Type | Default |
|------|------|---------|
| `type` | `TreatmentRowType` | — (required) |
| `label` | `string` | — |
| `secondaryLabel` | `string` | — |
| `amount` | `string` | — |
| `statusBadge` | `ReactNode` | — |
| `actions` | `ReactNode` | — |

Types: `'header' | 'row-edit' | 'row-done' | 'divider-open' | 'divider-closed' | 'divider-start-visit' | 'divider-start-consultation' | 'divider-close-visit' | 'divider-visit-sum' | 'divider-save' | 'divider-saved' | 'duration' | 'add-treatment' | 'document-alert' | 'document-signed'`

---

### Drawer (shell)
```tsx
import { Drawer } from '@/components/Drawer';

<Drawer open={isOpen} onClose={() => setOpen(false)} title="Drawer Title" width="narrow">
  {/* content */}
</Drawer>
```
| Prop | Type | Default |
|------|------|---------|
| `open` | `boolean` | — (required) |
| `onClose` | `() => void` | — (required) |
| `title` | `string` | — (required) |
| `width` | `'narrow' \| 'wide'` | `'narrow'` (560px / 788px) |
| `children` | `ReactNode` | — |
| `footer` | `ReactNode` | — |

### Pre-built Drawers
```tsx
import { PatientMasterDrawer, TreatmentDetailDrawer, TreatmentPlanMasterDrawer } from '@/components/Drawer';

<PatientMasterDrawer open={isOpen} onClose={fn} />
<TreatmentDetailDrawer open={isOpen} onClose={fn} />
<TreatmentPlanMasterDrawer open={isOpen} onClose={fn} />
```
Each accepts `open: boolean` and `onClose: () => void`. Internally compose the Drawer shell with pre-built content (patient card, visit card, treatment rows, timeline, etc.).

---

### NotificationModal
```tsx
import { NotificationModal } from '@/components/NotificationModal';

<NotificationModal
  open={isOpen}
  onClose={() => setOpen(false)}
  variant="success"
  title="Ambulánslap létrehozva"
  description="Az ambulánslap sikeresen létrejött."
  primaryLabel="Rendben"
/>
<NotificationModal
  open={isOpen}
  onClose={fn}
  variant="warning"
  title="Hiányzó műveletek"
  items={['Aláírt fájlok feltöltése', 'Ambulánslap kitöltése']}
  primaryLabel="Folytatás"
  secondaryLabel="Mégse"
/>
```
| Prop | Type | Default |
|------|------|---------|
| `open` | `boolean` | — (required) |
| `onClose` | `() => void` | — (required) |
| `variant` | `'success' \| 'warning'` | `'success'` |
| `title` | `string` | — (required) |
| `description` | `string` | — |
| `items` | `string[]` | — (bullet list) |
| `primaryLabel` | `string` | `'OK'` |
| `secondaryLabel` | `string` | — (shows secondary button) |
| `onPrimary` | `() => void` | — |
| `onSecondary` | `() => void` | — |

---

### CalendarPopup
```tsx
import { CalendarPopup } from '@/components/CalendarPopup';

<CalendarPopup />  {/* Dark-theme monthly calendar, defaults to today */}
```
Self-contained component. Dark theme (primary-900 bg), month navigation, today highlighted with primary-500 circle. Hungarian locale.

---

### ContentTabbedPanel
```tsx
import { ContentTabbedPanel } from '@/components/ContentTabbedPanel';

<ContentTabbedPanel />
```
Self-contained 4-tab panel: Röntgen (X-ray viewer), Anamnézis (AI summary), Ajánlatok (offer table), Megjegyzések (comment thread).

---

### StatusTabbedPanel
```tsx
import { StatusTabbedPanel } from '@/components/StatusTabbedPanel';

<StatusTabbedPanel />
```
Self-contained dental chart panel with 32-tooth grid (upper/lower jaw).

---

### VoiceRecordingBar
```tsx
import { VoiceRecordingBar } from '@/components/VoiceRecordingBar';

<VoiceRecordingBar />
```
Self-contained voice recording bar: brand gradient mic circle, waveform visualization, "Hangfelvétel folyamatban" status, live timer, PauseCircle + StopCircle controls. Pill-shaped with pink border and light gradient.

---

## Screen Composition Patterns

### Standard Screen Layout
```tsx
<TopNav items={navItems} activeId={activeNav} onSelect={setActiveNav} />
<div style={{ display: 'flex', height: 'calc(100vh - topNavHeight)' }}>
  <SideNav items={sideItems} activeId={activeSide} onSelect={setActiveSide} />
  <main style={{ flex: 1, padding: 'var(--space-20)', overflow: 'auto' }}>
    <Breadcrumbs items={breadcrumbs} />
    {/* Page content */}
  </main>
</div>
```

### Patient Detail Layout (typical)
```tsx
<div style={{ display: 'grid', gridTemplateColumns: '1fr 520px', gap: 20 }}>
  {/* Left: main content (table, treatment plan, etc.) */}
  <div>
    <Table>...</Table>
  </div>
  {/* Right: side panels */}
  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
    <ContentTabbedPanel />
    <StatusTabbedPanel />
  </div>
</div>
```

### Opening a Drawer
```tsx
const [drawerOpen, setDrawerOpen] = useState(false);

<Button onClick={() => setDrawerOpen(true)}>Open</Button>
<PatientMasterDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
```

### Showing a Notification
```tsx
const [modal, setModal] = useState(false);

<NotificationModal
  open={modal}
  onClose={() => setModal(false)}
  variant="success"
  title="Sikeres mentés"
  primaryLabel="OK"
/>
```

---

## Styling Conventions

1. **CSS Modules** — every component uses `ComponentName.module.css`. Import as `styles`:
   ```tsx
   import styles from './MyComponent.module.css';
   <div className={styles.wrapper}>...</div>
   ```

2. **Design tokens** — always use CSS variables from `tokens.css`, never hard-code colors/spacing:
   ```css
   .card { background: var(--color-white); border: 1px solid var(--color-neutral-500); border-radius: var(--radius-card); padding: var(--space-20); }
   ```

3. **Class composition** — use `composes:` in CSS Modules for variant inheritance:
   ```css
   .treatmentCard { border: 1px solid var(--color-brand-500); border-radius: 10px; }
   .treatmentCardAlt { border-color: var(--color-primary-500); composes: treatmentCard; }
   ```

4. **Hungarian labels** — UI text is in Hungarian. Status labels, nav items, and section headers use Hungarian terminology.

5. **Phosphor Icons** — use `@phosphor-icons/react` for all icons. Common imports:
   ```tsx
   import { Phone, Envelope, MagnifyingGlass, Calendar, Users, Tooth, CurrencyDollar, Files, ChartBar, Gear, Funnel, SortAscending, Columns, CaretRight, Check, Pencil, X, Microphone, Plus, PauseCircle, StopCircle } from '@phosphor-icons/react';
   ```

6. **'use client'** — add at top of any file using `useState`, `useEffect`, `useRef`, or event handlers.
