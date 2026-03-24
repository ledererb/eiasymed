---
name: eaisy-build-workflow
description: Step-by-step workflow for building new module pages in the eaisy dental ERP, including layout composition, component usage, Supabase integration, and safeguards against terminal failures and timeouts.
---

# eaisy Build Workflow

## Overview

This skill defines the standard process for building a new module page in the eaisy dental ERP. Every page follows the same structural pattern and uses components from the `eaisy-components` library (see that skill for full API reference).

---

## 1. Pre-Build Checklist

Before writing any code:

1. **Read the module spec** from `/eiasymed/gameplan/<module>.md`
2. **Check Figma** for the exact screen designs (if available)
3. **List which eaisy-components** are needed (refer to `eaisy-components` SKILL.md)
4. **Identify new components** that need to be built for this module
5. **Check database tables** — are they created? If not, create migration first via Supabase MCP

---

## 2. File Creation Pattern

### Route Page

Every module page lives in `src/src/app/<module>/page.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { TopNav } from '@/components/TopNav';
import { SideNav } from '@/components/SideNav';
import { Breadcrumbs } from '@/components/Breadcrumbs';
// ... other eaisy-components
import styles from './page.module.css';

const NAV_ITEMS = [
  { id: 'nyilvantartas', label: 'Nyilvántartás' },
  { id: 'naptar', label: 'Naptár' },
  { id: 'dokumentumok', label: 'Dokumentumok' },
  { id: 'crm', label: 'CRM' },
  { id: 'penzugy', label: 'Pénzügy' },
  { id: 'riportok', label: 'Riportok' },
];

export default function ModulePage() {
  const [activeNav, setActiveNav] = useState('module-id');

  return (
    <div className={styles.page}>
      <TopNav items={NAV_ITEMS} activeId={activeNav} onSelect={setActiveNav} />
      <div className={styles.adminBase}>
        <SideNav items={sideItems} activeId={activeSide} onSelect={setActiveSide} />
        <main className={styles.mainContent}>
          <Breadcrumbs items={[...]} />
          {/* Module content */}
        </main>
      </div>
    </div>
  );
}
```

### CSS Module

Every page has `src/src/app/<module>/page.module.css`:

```css
.page {
  min-height: 100vh;
  background: var(--color-neutral-50);
}

.adminBase {
  display: flex;
  height: calc(100vh - 56px);
}

.mainContent {
  flex: 1;
  padding: var(--space-20);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-20);
}
```

---

## 3. Common Layout Patterns

### Two-Panel Layout (Table + Side Panels)
```tsx
<div className={styles.twoPanel}>
  <div className={styles.leftPanel}>
    <Table>...</Table>
  </div>
  <div className={styles.rightPanel}>
    <ContentTabbedPanel />
    <StatusTabbedPanel />
  </div>
</div>
```

```css
.twoPanel {
  display: grid;
  grid-template-columns: 1fr 520px;
  gap: var(--space-20);
  flex: 1;
}
```

### Full-Width Content
```tsx
<main className={styles.mainContent}>
  <Breadcrumbs items={[...]} />
  <Table>...</Table>
</main>
```

### Calendar/Grid Layout
See the `/naptar` page for the calendar-specific grid pattern.

---

## 4. Data Fetching Pattern

### Client-Side with Supabase

```tsx
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

export default function ModulePage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        const { data, error } = await supabase
          .from('table_name')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setData(data ?? []);
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Betöltés...</div>;
  // render content
}
```

---

## 5. Safeguards Against Failures

### 5.1 Terminal Command Safeguards

**Dev Server:**
```
- Start: `npm run dev` with WaitMsBeforeAsync=2000, then check status
- If server dies: check terminal output for error, fix, restart
- Always verify server is running before browser verification
```

**Build:**
```
- Run: `npm run build` with WaitMsBeforeAsync=10000
- Poll status every 10s with command_status
- If build fails: read error output (last 2000 chars), fix specific file
- Maximum 3 retry attempts before escalating to user
```

**Install:**
```
- Run: `npm install <pkg>` with WaitMsBeforeAsync=8000
- If times out: check if package.json was updated, retry
- Always use exact versions when possible
```

### 5.2 File Write Safeguards

```
- For files > 300 lines: write in sections, verify each section
- Before overwriting: always read current file first
- After writing: read back first 10 lines to verify
- For edits: prefer replace_file_content over full overwrite
- For multiple non-contiguous edits: use multi_replace_file_content
```

### 5.3 Build Error Recovery Flow

```
1. Read the error message from terminal output
2. Identify the failing file and line number
3. Check if it's an import error → verify component exists in barrel export
4. Check if it's a CSS Module error → verify class name in .module.css file
5. Check if it's a TypeScript error → consult eaisy-components SKILL.md for correct types
6. Fix the specific error
7. Verify the fix by checking build output
8. If same error persists after 3 attempts → notify user with error details
```

### 5.4 Browser Verification Protocol

```
1. Ensure dev server is running (check terminal)
2. Navigate to the page URL
3. Wait 3 seconds for full render
4. Take screenshot of initial state
5. Test interactive elements (clicks, hovers, drawer opens)
6. Take screenshot of each state
7. If page shows error: check browser console via DOM inspection
8. If page blank: check terminal for compilation errors
```

---

## 6. Component Selection Guide

| UI Need | eaisy Component |
|---------|----------------|
| Top navigation bar | `TopNav` |
| Left sidebar nav | `SideNav` |
| Page breadcrumbs | `Breadcrumbs` |
| Data tables | `Table`, `TableRow`, `TableCell`, `TableHeaderCell` |
| Table toolbar (filter/search) | `TableToolbar`, `ToolbarButton` |
| Form inputs | `InputField` |
| Dropdowns/selects | `Dropdown` |
| Checkboxes | `Checkbox` |
| Action buttons | `Button` (primary/outline/texticon) |
| Icon-only buttons | `IconButton` |
| Status indicators | `StatusBadge` |
| Tags/labels | `Badge` |
| User avatars | `Avatar` |
| Content tabs | `TabbedPanel`, `Tabs` |
| Side panels | `ContentTabbedPanel`, `StatusTabbedPanel` |
| Slide-out drawers | `Drawer`, `PatientMasterDrawer`, etc. |
| Comments/notes | `Comment`, `CommentBundle` |
| Calendar entries | `CalendarEntry` |
| Calendar date picker | `CalendarPopup` |
| Treatment plan rows | `TreatmentPlanRow` |
| Confirmation dialogs | `NotificationModal` |
| Voice recording | `VoiceRecordingBar` |
| All icons | `@phosphor-icons/react` |

---

## 7. Naming Conventions

- **Route folders**: lowercase kebab-case (`/naptar`, `/kezeles`, `/dental-chart`)
- **Components**: PascalCase folder and file (`Button/Button.tsx`)
- **CSS Modules**: `ComponentName.module.css` or `page.module.css`
- **CSS classes**: camelCase (`styles.mainContent`, `styles.twoPanel`)
- **Design tokens**: always use `var(--token-name)`, never hard-code
- **UI text**: Hungarian by default
