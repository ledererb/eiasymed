---
description: Component API compatibility patterns for eaisy-components (Dropdown, InputField, etc.)
---

# eaisy Component API Gotchas

## Dropdown Component

### Props
```ts
interface DropdownProps {
  items: DropdownItem[];      // NOT options
  value?: string | string[];
  placeholder?: string;
  dark?: boolean;
  multiple?: boolean;
  onChange?: (value: string | string[]) => void;  // NOT event handler
  className?: string;
}

interface DropdownItem {
  id: string;    // NOT value
  label: string;
}
```

### Usage
**❌ WRONG (shadcn/HTML pattern):**
```tsx
<Dropdown label="Role" options={[...]} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} />
```

**✅ CORRECT:**
```tsx
<Dropdown
  items={[{ id: 'doctor', label: 'Orvos' }]}
  value={form.role}
  onChange={v => setForm(p => ({ ...p, role: typeof v === 'string' ? v : v[0] }))}
/>
```

### Key Differences from HTML `<select>`:
1. `items` not `options`
2. Item shape is `{ id, label }` not `{ value, label }`
3. `onChange` receives the value directly, NOT an event object
4. No `label` prop on the component itself
5. For single-select, value is `string`; check with `typeof v === 'string'`

## InputField Component

### Props
```ts
interface InputFieldProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
}
```

InputField uses standard React event handlers, so `e.target.value` works as expected.

## StatusBadge Component

### Allowed Variants
```
'new' | 'consultation' | 'offer' | 'success' | 'rejected' | 'waiting'
```

Map your domain statuses to these variants:
```ts
const STATUS_MAP: Record<string, { label: string; variant: string }> = {
  active: { label: 'Aktív', variant: 'success' },
  inactive: { label: 'Inaktív', variant: 'rejected' },
  pending: { label: 'Függő', variant: 'waiting' },
};
```

## Supabase Foreign Key Joins

When joining tables, use the exact FK constraint name:
```ts
supabase.from('appointments')
  .select('*, patient:patients!appointments_patient_id_fkey(first_name, last_name)')
```

If a table has its own column names that differ from your interface (e.g., `doctor_id` vs `staff_id`), map in the fetch:
```ts
setWorkingHours((data || []).map((wh: any) => ({ ...wh, staff_id: wh.doctor_id })));
```
