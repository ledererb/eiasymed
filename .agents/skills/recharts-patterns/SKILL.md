---
description: Recharts integration patterns for Next.js with TypeScript and CSS Modules
---

# Recharts Integration Skill

## Key Patterns

### 1. Install
```bash
npm install recharts
```

### 2. Import Structure
```tsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend,
} from 'recharts';
```

### 3. ResponsiveContainer Is Required
Always wrap charts in `<ResponsiveContainer width="100%" height={220}>`. Without this, Recharts renders nothing.

### 4. TypeScript Gotcha: Pie `label` Prop
The `label` prop on `<Pie>` expects `PieLabelRenderProps`. Do NOT destructure with typed args:

**❌ BAD:**
```tsx
label={({ name, percent }: { name: string; percent?: number }) => ...}
```

**✅ GOOD:**
```tsx
label={(props: any) => `${props.name || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
```

### 5. Gradient Fills
Define gradients inside `<defs>` within the chart component, then reference by id:
```tsx
<Bar dataKey="revenue" fill="url(#myGrad)" />
<defs>
  <linearGradient id="myGrad" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stopColor="#186D98" />
    <stop offset="100%" stopColor="#2da5d4" />
  </linearGradient>
</defs>
```

### 6. Custom Tooltip
Pass a component to `<Tooltip content={<CustomTooltip />} />`. The component receives `active`, `payload`, `label` props.

### 7. CSS Module Classes
Charts render SVG, so most styling is via props:
- `stroke`, `fill` on components
- `tick={{ fontSize: 11, fill: 'color' }}` on axes
- `strokeDasharray="3 3"` on `CartesianGrid`

Container CSS should only set height and spacing:
```css
.chartContainer { min-height: 220px; }
```

### 8. Data Shape
Recharts expects arrays of flat objects:
```ts
const data = [{ month: 'Jan', revenue: 5000 }, { month: 'Feb', revenue: 8000 }];
```
